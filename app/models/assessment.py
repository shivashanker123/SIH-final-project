"""Assessment models."""
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Assessment(Base, TimestampMixin):
    """Assessment record."""
    __tablename__ = "assessments"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    assessment_type = Column(String, nullable=False)  # "PHQ9", "GAD7", "PHQ2", "GAD2", "C_SSRS"
    score = Column(Integer, nullable=False)
    responses = Column(JSON, nullable=False)  # Actual question responses
    administered_at = Column(DateTime, nullable=False)
    trigger_reason = Column(String)  # Why this assessment was triggered
    
    # Relationships
    student = relationship("Student", back_populates="assessments")


class RiskProfile(Base, TimestampMixin):
    """Multi-dimensional risk profile."""
    __tablename__ = "risk_profiles"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    overall_risk = Column(String, nullable=False)  # "LOW", "MEDIUM", "HIGH", "CRISIS"
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_factors = Column(JSON, nullable=False)  # Detailed risk breakdown
    recommended_action = Column(String, nullable=False)
    calculated_at = Column(DateTime, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="risk_profiles")




