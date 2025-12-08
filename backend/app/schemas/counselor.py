"""Counselor dashboard schemas."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AlertQueueItem(BaseModel):
    """Alert item for queue display."""
    id: int
    student_id: str
    student_name: str
    alert_type: str  # "IMMEDIATE", "URGENT", "ROUTINE"
    overall_risk: Optional[str] = None  # "LOW", "MEDIUM", "HIGH", "CRISIS"
    confidence: Optional[float] = None
    created_at: datetime
    time_elapsed_hours: float
    message: str
    routing_status: str


class AlertQueueResponse(BaseModel):
    """Response for alert queue endpoint."""
    total_alerts: int
    alerts: List[AlertQueueItem]


class TriggeringMessage(BaseModel):
    """Triggering message details."""
    text: Optional[str] = None
    timestamp: Optional[datetime] = None
    concern_indicators: List[str] = []
    safety_flags: List[str] = []
    emoji_analysis: Optional[Dict[str, Any]] = None


class RiskAssessment(BaseModel):
    """Risk assessment details."""
    overall_risk: Optional[str] = None
    confidence: Optional[float] = None
    risk_factors: Dict[str, Any] = {}
    recommended_action: Optional[str] = None


class StudentBaseline(BaseModel):
    """Student baseline profile."""
    typical_sentiment: Optional[float] = None
    communication_style: Optional[str] = None
    emoji_usage_rate: Optional[float] = None
    baseline_established: bool


class TemporalContext(BaseModel):
    """Temporal pattern context."""
    patterns_detected: List[str] = []
    velocity: Optional[float] = None
    acceleration: Optional[float] = None
    trend: Optional[str] = None  # "improving", "worsening", "stable"


class RecentAssessment(BaseModel):
    """Recent assessment summary."""
    type: str
    score: int
    date: datetime
    severity: Optional[str] = None


class AlertFullContextResponse(BaseModel):
    """Complete alert context for counselor review."""
    alert: Dict[str, Any]
    triggering_message: TriggeringMessage
    risk_assessment: RiskAssessment
    student_baseline: StudentBaseline
    temporal_context: TemporalContext
    recent_assessments: List[RecentAssessment] = []


class CounselorFeedbackRequest(BaseModel):
    """Feedback submission request."""
    was_appropriate: bool
    actual_severity: str  # "None", "Mild", "Moderate", "Severe", "Crisis"
    ai_accuracy: int  # 1-5 rating
    notes: Optional[str] = None


class CounselorFeedbackResponse(BaseModel):
    """Feedback submission response."""
    success: bool
    feedback_id: int


class InterventionOutcomeRequest(BaseModel):
    """Intervention outcome recording request."""
    counseling_appointment_scheduled: bool
    counseling_appointment_attended: Optional[bool] = None
    appointment_scheduled_at: Optional[datetime] = None
    appointment_attended_at: Optional[datetime] = None


class InterventionOutcomeResponse(BaseModel):
    """Intervention outcome recording response."""
    success: bool
    outcome_id: Optional[int] = None


class TimelineEvent(BaseModel):
    """Single timeline event."""
    timestamp: datetime
    type: str  # "message", "assessment", "pattern", "alert"
    data: Dict[str, Any]


class RiskTrajectoryPoint(BaseModel):
    """Risk trajectory data point for charting."""
    date: str  # ISO date string
    risk_score: int  # 1-4 scale


class StudentTimelineResponse(BaseModel):
    """Student timeline response."""
    student_id: str
    baseline_profile: Optional[Dict[str, Any]] = None
    timeline: List[TimelineEvent] = []
    risk_trajectory_chart_data: List[RiskTrajectoryPoint] = []


class AlertStatistics(BaseModel):
    """Alert statistics."""
    total_alerts: int
    by_severity: Dict[str, int] = {}
    avg_response_time_hours: Optional[float] = None


class PerformanceMetrics(BaseModel):
    """Performance metrics."""
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    false_positive_rate: Optional[float] = None


class OutcomeMetrics(BaseModel):
    """Outcome metrics."""
    total_interventions: int
    students_engaged: int
    engagement_rate: float
    students_improved: int
    improvement_rate: float
    baseline_comparison: Dict[str, Any] = {}


class CounselorSatisfaction(BaseModel):
    """Counselor satisfaction metrics."""
    avg_ai_accuracy_rating: Optional[float] = None
    alerts_marked_appropriate: int


class DashboardMetricsResponse(BaseModel):
    """Dashboard metrics response."""
    period_days: int
    alert_statistics: AlertStatistics
    performance_metrics: PerformanceMetrics
    outcome_metrics: OutcomeMetrics
    counselor_satisfaction: CounselorSatisfaction


