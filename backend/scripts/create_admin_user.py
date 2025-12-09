"""Script to create admin user with credentials admin@gmail.com / admin"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.student import Student
from app.api.auth import hash_password
import structlog

logger = structlog.get_logger()


def create_admin_user():
    """Create admin user if it doesn't exist."""
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(Student).filter(Student.email == "admin@gmail.com").first()
        
        if admin:
            logger.info("admin_user_exists", email="admin@gmail.com", student_id=admin.student_id)
            print(f"✓ Admin user already exists: {admin.email} (ID: {admin.student_id})")
            return
        
        # Create admin user
        password_hash = hash_password("admin")
        
        admin = Student(
            student_id="admin_001",
            email="admin@gmail.com",
            password_hash=password_hash,
            name="Administrator",
            anonymized_name="Administrator(admin)",
            is_admin=True,
            baseline_profile={},
            session_count=0
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        logger.info("admin_user_created", email="admin@gmail.com", student_id=admin.student_id)
        print(f"✓ Admin user created successfully!")
        print(f"  Email: admin@gmail.com")
        print(f"  Password: admin")
        print(f"  Student ID: {admin.student_id}")
        
    except Exception as e:
        logger.error("create_admin_error", error=str(e), exc_info=True)
        db.rollback()
        print(f"✗ Error creating admin user: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()



