"""API dependencies for authentication and authorization."""
from fastapi import Depends, HTTPException, Header, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.student import Student
import structlog

logger = structlog.get_logger()


async def get_current_counselor(
    counselor_id: Optional[str] = Query(None, description="Counselor/Admin student_id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Student:
    """
    Verify user is a counselor/admin.
    
    For now, uses counselor_id query parameter.
    Future: Implement JWT token validation from authorization header.
    """
    if not counselor_id:
        # Try to extract from authorization header if present
        # For now, require counselor_id parameter
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Counselor ID required. Provide counselor_id query parameter."
        )
    
    # Find student and verify they are an admin/counselor
    student = db.query(Student).filter(Student.student_id == counselor_id).first()
    
    if not student:
        logger.warning("counselor_not_found", counselor_id=counselor_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselor not found"
        )
    
    if not student.is_admin:
        logger.warning("unauthorized_counselor_access", 
                      student_id=counselor_id, 
                      is_admin=student.is_admin)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    logger.debug("counselor_authenticated", counselor_id=counselor_id)
    return student


