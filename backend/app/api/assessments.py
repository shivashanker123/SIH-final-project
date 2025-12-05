"""Assessment API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.schemas.assessment import (
    AssessmentRequest, AssessmentResult, PHQ2Request, GAD2Request, CSSRSRequest
)
from app.services.assessment.hybrid_assessment import HybridAssessmentService
from app.services.assessment.cssrs import CSSRSService
from app.db.database import get_db
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.get("/checkpoint-plan/{student_id}")
async def get_checkpoint_plan(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Get checkpoint assessment plan for student."""
    service = HybridAssessmentService(db)
    
    if not service.should_trigger_checkpoint_assessment(student_id):
        return {"should_trigger": False}
    
    plan = service.get_checkpoint_assessment_plan(student_id)
    return {"should_trigger": True, "plan": plan}


@router.post("/phq2", response_model=AssessmentResult)
async def submit_phq2(
    student_id: str,
    responses: dict,
    db: Session = Depends(get_db)
):
    """Submit PHQ-2 responses."""
    # Calculate score (sum of responses, threshold is 3)
    score = sum(responses.values())
    
    # If score >= 3, recommend full PHQ-9
    if score >= 3:
        return {
            "student_id": student_id,
            "assessment_type": "PHQ2",
            "score": score,
            "responses": responses,
            "administered_at": datetime.utcnow(),
            "interpretation": "Positive screen - recommend full PHQ-9",
            "recommended_action": "administer_phq9"
        }
    
    return {
        "student_id": student_id,
        "assessment_type": "PHQ2",
        "score": score,
        "responses": responses,
        "administered_at": datetime.utcnow(),
        "interpretation": "Negative screen",
        "recommended_action": "continue_monitoring"
    }


@router.post("/cssrs/trigger-check")
async def check_cssrs_trigger(
    student_id: str,
    context: dict,
    db: Session = Depends(get_db)
):
    """Check if C-SSRS should be triggered."""
    service = CSSRSService(db)
    should_trigger = service.should_trigger_cssrs(student_id, context)
    
    if should_trigger:
        questions = service.get_cssrs_questions()
        return {
            "should_trigger": True,
            "message": "I want to ask you some specific questions to understand how to best support you. These are important safety questions.",
            "questions": questions.questions
        }
    
    return {"should_trigger": False}


@router.post("/cssrs/submit", response_model=dict)
async def submit_cssrs(
    student_id: str,
    responses: dict,
    trigger_reason: str,
    db: Session = Depends(get_db)
):
    """Submit C-SSRS responses."""
    service = CSSRSService(db)
    
    # Score responses
    score_result = service.score_cssrs(responses)
    
    # Determine clinical action
    action = service.determine_clinical_action(score_result["score"])
    
    # Create assessment record
    assessment = service.create_assessment_record(
        student_id, responses, score_result, trigger_reason
    )
    
    return {
        "assessment_id": assessment.id,
        "score": score_result["score"],
        "severity_level": score_result["severity_level"],
        "clinical_action": action
    }

