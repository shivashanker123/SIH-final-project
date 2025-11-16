"""Risk profile schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRISIS = "CRISIS"


class SuicidalIdeationFactor(BaseModel):
    """Suicidal ideation risk factor."""
    present: bool
    confidence: float = Field(ge=0.0, le=1.0)


class DepressionSeverityFactor(BaseModel):
    """Depression severity risk factor."""
    estimated_phq9: Optional[int] = None
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


class BehaviorChangeFactor(BaseModel):
    """Behavior change risk factor."""
    concern: str  # "LOW", "MEDIUM", "HIGH"
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


class RiskFactors(BaseModel):
    """Detailed risk factors."""
    suicidal_ideation: Optional[SuicidalIdeationFactor] = None
    depression_severity: Optional[DepressionSeverityFactor] = None
    behavior_change: Optional[BehaviorChangeFactor] = None
    anxiety_severity: Optional[Dict[str, Any]] = None
    engagement_change: Optional[Dict[str, Any]] = None
    language_shifts: Optional[Dict[str, Any]] = None


class RiskProfile(BaseModel):
    """Multi-dimensional risk profile."""
    student_id: str
    overall_risk: RiskLevel
    confidence: float = Field(ge=0.0, le=1.0)
    risk_factors: RiskFactors
    recommended_action: str
    calculated_at: datetime
    temporal_patterns: Optional[List[str]] = None  # Pattern types detected


class AlertRecommendation(BaseModel):
    """Alert routing recommendation."""
    should_alert: bool
    alert_type: str  # "IMMEDIATE", "URGENT", "ROUTINE", "NONE"
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    priority_score: Optional[float] = None  # For queue prioritization




