"""Learning and feedback schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class CounselorFeedbackInput(BaseModel):
    """Input schema for counselor feedback."""
    student_id: str
    alert_id: Optional[int] = None
    risk_profile_id: Optional[int] = None
    was_appropriate: bool
    actual_severity: str  # "None", "Mild", "Moderate", "Severe", "Crisis"
    urgency: str  # "routine", "soon", "urgent", "crisis"
    ai_accuracy: str  # "missed_context", "appropriate", "over_flagged"
    what_ai_missed: Optional[str] = None
    what_ai_over_interpreted: Optional[str] = None
    actual_clinical_scores: Optional[Dict[str, Any]] = None
    counselor_id: str


class PerformanceMetrics(BaseModel):
    """Performance metrics schema."""
    date: datetime
    false_positive_rate: float
    false_negative_rate: float
    precision: float
    recall: float
    f1_score: float
    alert_volume: int
    metadata: Optional[Dict[str, Any]] = None




