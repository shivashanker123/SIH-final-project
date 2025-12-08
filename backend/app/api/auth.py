"""Authentication API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.database import get_db
from app.models.student import Student
import bcrypt
import secrets
import structlog
import random
import string

logger = structlog.get_logger()
router = APIRouter(prefix="/api/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    confirm_password: str
    major: Optional[str] = None


class AuthResponse(BaseModel):
    student_id: str
    email: str
    name: str
    token: str


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def generate_token() -> str:
    """Generate a simple token (in production, use JWT)."""
    return secrets.token_urlsafe(32)


def generate_anonymized_name(name: str) -> str:
    """Generate an anonymized name for community display."""
    # Take first letter of first name and last name, add random numbers
    parts = name.strip().split()
    if len(parts) >= 2:
        first_initial = parts[0][0].upper()
        last_initial = parts[-1][0].upper()
        random_suffix = ''.join(random.choices(string.digits, k=4))
        return f"{first_initial}{last_initial}{random_suffix}"
    elif len(parts) == 1:
        # Single name - use first two letters
        name_part = parts[0][:2].upper()
        random_suffix = ''.join(random.choices(string.digits, k=4))
        return f"{name_part}{random_suffix}"
    else:
        # Fallback
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"User{random_suffix}"


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new student account."""
    logger.info("signup_attempt", email=request.email, name=request.name)
    
    # Validate passwords match
    if request.password != request.confirm_password:
        logger.warning("signup_failed", reason="passwords_dont_match", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Check if email already exists
    existing = db.query(Student).filter(Student.email == request.email).first()
    if existing:
        logger.warning("signup_failed", reason="email_exists", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate student_id from email (or use a better method)
    student_id = f"student_{request.email.split('@')[0]}"
    
    # Check if student_id already exists (handle collisions)
    counter = 1
    original_id = student_id
    while db.query(Student).filter(Student.student_id == student_id).first():
        student_id = f"{original_id}_{counter}"
        counter += 1
    
    # Create new student
    try:
        password_hash = hash_password(request.password)
        logger.info("password_hashed", email=request.email, hash_length=len(password_hash))
        
        # Generate anonymized name
        anonymized_name = generate_anonymized_name(request.name)
        
        student = Student(
            student_id=student_id,
            email=request.email,
            password_hash=password_hash,
            name=request.name,
            anonymized_name=anonymized_name,
            major=request.major,
            bio="",  # Start with blank bio
            baseline_profile={},
            session_count=0
        )
        
        logger.info("student_object_created", student_id=student_id, email=request.email)
        
        db.add(student)
        logger.info("student_added_to_session", student_id=student_id)
        
        db.commit()
        logger.info("database_committed", student_id=student_id)
        
        db.refresh(student)
        logger.info("student_refreshed", student_id=student_id, student_email=student.email)
        
        # Verify the student was actually saved
        verify_student = db.query(Student).filter(Student.email == request.email).first()
        if verify_student:
            logger.info("student_verified_in_db", student_id=verify_student.student_id, email=verify_student.email)
        else:
            logger.error("student_not_found_after_commit", email=request.email, student_id=student_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Account was not saved to database"
            )
        
        logger.info("student_registered", student_id=student_id, email=request.email, has_password_hash=bool(password_hash))
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error("signup_error", error=str(e), error_type=type(e).__name__, email=request.email, exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )
    
    # Generate token
    token = generate_token()
    
    return AuthResponse(
        student_id=student.student_id,
        email=student.email,
        name=student.name or "",
        token=token
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    logger.info("login_attempt", email=request.email)
    
    # Find student by email
    student = db.query(Student).filter(Student.email == request.email).first()
    
    if not student:
        logger.warning("login_failed", reason="student_not_found", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    try:
        password_valid = verify_password(request.password, student.password_hash)
        if not password_valid:
            logger.warning("login_failed", reason="invalid_password", email=request.email, student_id=student.student_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    except Exception as e:
        logger.error("password_verification_error", error=str(e), email=request.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error occurred"
        )
    
    # Generate token
    token = generate_token()
    
    # Ensure admin users have anonymized names for community access
    if student.is_admin and (not student.anonymized_name or 'admin' in student.anonymized_name.lower()):
        student.anonymized_name = generate_anonymized_name(student.name or student.email)
        db.commit()
        logger.info("admin_anonymized_name_generated", student_id=student.student_id, anonymized_name=student.anonymized_name)
    
    logger.info("student_logged_in", student_id=student.student_id, email=request.email)
    
    return AuthResponse(
        student_id=student.student_id,
        email=student.email,
        name=student.name or "",
        token=token
    )


@router.get("/check-email/{email}")
async def check_email(email: str, db: Session = Depends(get_db)):
    """Check if an email exists in the database (for debugging)."""
    student = db.query(Student).filter(Student.email == email).first()
    if student:
        # Test password verification with a dummy password to check if hash is valid
        try:
            test_result = verify_password("test", student.password_hash)
        except Exception as e:
            test_result = f"Error: {str(e)}"
        
        return {
            "exists": True,
            "student_id": student.student_id,
            "email": student.email,
            "name": student.name,
            "has_password_hash": bool(student.password_hash),
            "password_hash_length": len(student.password_hash) if student.password_hash else 0,
            "password_hash_preview": student.password_hash[:20] + "..." if student.password_hash else None,
            "hash_verification_test": "Hash format is valid" if isinstance(test_result, bool) else test_result
        }
    return {"exists": False}
