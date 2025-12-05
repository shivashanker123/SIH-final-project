"""Message processing API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.message import Message, MessageAnalysis
from app.services.analysis.sequential_processor import SequentialProcessor
from app.services.assessment.hybrid_assessment import HybridAssessmentService
from app.db.database import get_db
from app.core.llm_client import get_llm_client
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post("/process", response_model=MessageAnalysis)
async def process_message(
    message: Message,
    db: Session = Depends(get_db),
    llm_client = Depends(get_llm_client)
):
    """Process incoming student message through sequential checkpoints."""
    try:
        processor = SequentialProcessor(db, llm_client)
        analysis = await processor.process_message(message)
        
        # Create alert if crisis protocol triggered or high risk detected
        if analysis.crisis_protocol_triggered or (analysis.risk_profile and analysis.risk_profile.get("overall_risk") in ["HIGH", "CRISIS"]):
            from app.models.analysis import Alert
            
            alert_type = "IMMEDIATE" if analysis.crisis_protocol_triggered else "URGENT"
            alert_message = "Crisis protocol triggered - immediate intervention required" if analysis.crisis_protocol_triggered else f"High risk detected: {analysis.risk_profile.get('overall_risk', 'HIGH')} risk level"
            
            # Check if alert already exists for this message (avoid duplicates)
            existing_alert = db.query(Alert).filter(
                Alert.student_id == message.student_id,
                Alert.message == alert_message,
                Alert.routing_status == "PENDING"
            ).first()
            
            if not existing_alert:
                alert = Alert(
                    student_id=message.student_id,
                    alert_type=alert_type,
                    message=alert_message,
                    routing_status="PENDING"
                )
                db.add(alert)
                db.commit()
                logger.info("alert_created",
                           student_id=message.student_id,
                           alert_type=alert_type,
                           crisis_triggered=analysis.crisis_protocol_triggered)
        
        # Track in hybrid assessment system
        assessment_service = HybridAssessmentService(db, llm_client)
        tier = assessment_service.get_assessment_tier(message.student_id)
        
        if tier == "TIER_1_PASSIVE":
            # Track passive monitoring (await async method)
            await assessment_service.track_passive_monitoring(
                message.student_id,
                message.message_text,
                {
                    "text": message.message_text,
                    "emoji_count": len([c for c in message.message_text if ord(c) > 127]),
                    "sentiment": "neutral",  # Will be calculated by LLM if available
                    "contains_humor": False,  # Will be detected by LLM if available
                    "mood": "neutral"
                }
            )
        
        return analysis
    except Exception as e:
        logger.error("message_processing_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{student_id}")
async def get_message_analyses(
    student_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent message analyses for a student."""
    from app.models.analysis import MessageAnalysis as MessageAnalysisModel
    
    analyses = db.query(MessageAnalysisModel).filter(
        MessageAnalysisModel.student_id == student_id
    ).order_by(MessageAnalysisModel.created_at.desc()).limit(limit).all()
    
    return [{
        "message_id": a.message_id,
        "message_text": a.message_text,
        "concern_indicators": a.concern_indicators,
        "safety_flags": a.safety_flags,
        "created_at": a.created_at.isoformat()
    } for a in analyses]




