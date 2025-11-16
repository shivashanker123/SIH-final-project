"""Alert API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.risk import RiskProfile, AlertRecommendation
from app.services.alerts.risk_calculator import RiskCalculator
from app.db.database import get_db
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/risk-profile/{student_id}")
async def get_risk_profile(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Get current risk profile for student."""
    calculator = RiskCalculator(db)
    profile = calculator.get_current_risk_profile(student_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="No risk profile found")
    
    return profile


@router.get("/pending")
async def get_pending_alerts(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get pending alerts, prioritized by risk."""
    from app.models.analysis import Alert
    
    alerts = db.query(Alert).filter(
        Alert.routing_status == "PENDING"
    ).order_by(Alert.created_at.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "student_id": a.student_id,
        "alert_type": a.alert_type,
        "message": a.message,
        "created_at": a.created_at.isoformat()
    } for a in alerts]




