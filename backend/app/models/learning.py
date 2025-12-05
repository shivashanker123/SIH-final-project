"""Continuous learning models."""
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class CounselorFeedback(Base, TimestampMixin):
    """Feedback from counselors on flagged cases."""
    __tablename__ = "counselor_feedback"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    risk_profile_id = Column(Integer, ForeignKey("risk_profiles.id"))
    
    # Feedback fields
    was_appropriate = Column(Boolean, nullable=False)
    actual_severity = Column(String, nullable=False)  # "None", "Mild", "Moderate", "Severe", "Crisis"
    urgency = Column(String, nullable=False)  # "routine", "soon", "urgent", "crisis"
    ai_accuracy = Column(String, nullable=False)  # "missed_context", "appropriate", "over_flagged"
    
    # Detailed feedback
    what_ai_missed = Column(String)
    what_ai_over_interpreted = Column(String)
    actual_clinical_scores = Column(JSON)  # PHQ-9, GAD-7 if available
    
    counselor_id = Column(String, nullable=False)
    feedback_date = Column(DateTime, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="feedback")


class ModelPerformance(Base, TimestampMixin):
    """Model performance metrics."""
    __tablename__ = "model_performance"
    
    metric_date = Column(DateTime, nullable=False)
    metric_type = Column(String, nullable=False)  # "daily_fp_rate", "daily_fn_rate", etc.
    value = Column(Float, nullable=False)
    extra_metadata = Column(JSON, default=dict)


class ThresholdCalibration(Base, TimestampMixin):
    """Threshold calibration history."""
    __tablename__ = "threshold_calibrations"
    
    threshold_type = Column(String, nullable=False)  # "PHQ9", "GAD7", "confidence", etc.
    old_value = Column(Float, nullable=False)
    new_value = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    calibrated_at = Column(DateTime, nullable=False)
    performance_improvement = Column(Float)  # F1 score change




