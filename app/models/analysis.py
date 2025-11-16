"""Analysis and pattern models."""
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class MessageAnalysis(Base, TimestampMixin):
    """Analysis of individual message."""
    __tablename__ = "message_analyses"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    message_id = Column(String, nullable=False)
    message_text = Column(String, nullable=False)
    
    # Analysis results
    emoji_analysis = Column(JSON)  # Emoji interpretation results
    sentiment_score = Column(Float)
    concern_indicators = Column(JSON, default=list)  # List of flagged concerns
    safety_flags = Column(JSON, default=list)  # Immediate safety concerns
    
    # Processing metadata
    checkpoint_results = Column(JSON)  # Results from each checkpoint
    processing_time_ms = Column(Integer)


class TemporalPattern(Base, TimestampMixin):
    """Temporal pattern detection results."""
    __tablename__ = "temporal_patterns"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    pattern_type = Column(String, nullable=False)  # "rapid_deterioration", "pre_decision_calm", etc.
    detected_at = Column(DateTime, nullable=False)
    pattern_data = Column(JSON, nullable=False)  # Velocity, acceleration, history
    risk_multiplier = Column(Float, default=1.0)
    alert_generated = Column(Boolean, default=False)


class Alert(Base, TimestampMixin):
    """Alert record."""
    __tablename__ = "alerts"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    alert_type = Column(String, nullable=False)  # "IMMEDIATE", "URGENT", "ROUTINE"
    risk_profile_id = Column(Integer, ForeignKey("risk_profiles.id"))
    message = Column(String, nullable=False)
    routing_status = Column(String, default="PENDING")  # "PENDING", "REVIEWED", "RESOLVED"
    counselor_id = Column(String)
    reviewed_at = Column(DateTime)




