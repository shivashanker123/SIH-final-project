"""Assessment schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AssessmentType(str, Enum):
    PHQ9 = "PHQ9"
    GAD7 = "GAD7"
    PHQ2 = "PHQ2"
    GAD2 = "GAD2"
    C_SSRS = "C_SSRS"


class AssessmentRequest(BaseModel):
    """Request to administer assessment."""
    student_id: str
    assessment_type: AssessmentType
    trigger_reason: Optional[str] = None


class AssessmentResponse(BaseModel):
    """Assessment response from student."""
    student_id: str
    assessment_type: AssessmentType
    responses: Dict[str, int]  # Question ID -> Response value
    completed_at: datetime


class AssessmentResult(BaseModel):
    """Assessment result."""
    student_id: str
    assessment_type: AssessmentType
    score: int
    responses: Dict[str, int]
    administered_at: datetime
    trigger_reason: Optional[str] = None
    interpretation: str
    recommended_action: str


class PHQ2Request(BaseModel):
    """PHQ-2 questions."""
    questions: List[Dict[str, Any]] = Field(
        default=[
            {"id": "phq2_1", "text": "Over the past 2 weeks, how often have you been bothered by little interest or pleasure in doing things?", "options": [0, 1, 2, 3]},
            {"id": "phq2_2", "text": "Over the past 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?", "options": [0, 1, 2, 3]}
        ]
    )


class GAD2Request(BaseModel):
    """GAD-2 questions."""
    questions: List[Dict[str, Any]] = Field(
        default=[
            {"id": "gad2_1", "text": "Over the past 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?", "options": [0, 1, 2, 3]},
            {"id": "gad2_2", "text": "Over the past 2 weeks, how often have you been bothered by not being able to stop or control worrying?", "options": [0, 1, 2, 3]}
        ]
    )


class CSSRSRequest(BaseModel):
    """C-SSRS questions."""
    questions: List[Dict[str, Any]] = Field(
        default=[
            {"id": "cssrs_1", "text": "In the past month, have you wished you were dead or wished you could go to sleep and not wake up?", "type": "yes_no"},
            {"id": "cssrs_2", "text": "In the past month, have you actually had any thoughts of killing yourself?", "type": "yes_no"},
            {"id": "cssrs_3", "text": "Have you ever thought about how you might kill yourself (e.g., taking pills, shooting yourself) or worked out a plan of how to kill yourself?", "type": "yes_no"},
            {"id": "cssrs_4", "text": "Have you ever told anyone that you want to kill yourself, or that you might do it?", "type": "yes_no"},
            {"id": "cssrs_5", "text": "Have you ever started to do anything, or actually done anything, to end your life?", "type": "yes_no"}
        ]
    )




