"""Student and session models."""
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Student(Base, TimestampMixin):
    """Student profile."""
    __tablename__ = "students"
    
    student_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String)
    anonymized_name = Column(String)  # Anonymized display name for community
    major = Column(String)  # College major
    bio = Column(String)  # User bio for profile
    baseline_profile = Column(JSON, default=dict)  # Communication style, typical patterns
    session_count = Column(Integer, default=0)
    last_checkpoint_date = Column(String)  # ISO date string
    
    # Relationships
    sessions = relationship("Session", back_populates="student")
    assessments = relationship("Assessment", back_populates="student")
    risk_profiles = relationship("RiskProfile", back_populates="student")
    feedback = relationship("CounselorFeedback", back_populates="student")


class Session(Base, TimestampMixin):
    """Individual conversation session."""
    __tablename__ = "sessions"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    session_number = Column(Integer, nullable=False)
    messages = Column(JSON, default=list)  # List of message objects
    session_metadata = Column(JSON, default=dict)  # Engagement patterns, time-of-day, etc.
    
    # Relationships
    student = relationship("Student", back_populates="sessions")




