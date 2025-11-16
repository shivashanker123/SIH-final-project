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
        
        # Track in hybrid assessment system
        assessment_service = HybridAssessmentService(db)
        tier = assessment_service.get_assessment_tier(message.student_id)
        
        if tier == "TIER_1_PASSIVE":
            # Track passive monitoring
            assessment_service.track_passive_monitoring(
                message.student_id,
                {
                    "text": message.message_text,
                    "emoji_count": len([c for c in message.message_text if ord(c) > 127]),
                    "sentiment": "neutral",  # Would be calculated
                    "contains_humor": False,  # Would be detected
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




