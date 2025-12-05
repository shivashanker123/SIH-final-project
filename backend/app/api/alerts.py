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
    from app.models.student import Student
    
    alerts = db.query(Alert).filter(
        Alert.routing_status == "PENDING"
    ).order_by(Alert.created_at.desc()).limit(limit).all()
    
    result = []
    for a in alerts:
        # Get student information
        student = db.query(Student).filter(Student.student_id == a.student_id).first()
        student_name = student.name if student and student.name else a.student_id
        
        # Map alert_type to severity
        severity_map = {
            "IMMEDIATE": "Critical",
            "URGENT": "High",
            "ROUTINE": "Medium"
        }
        severity = severity_map.get(a.alert_type, "Medium")
        
        # Determine alert type display
        if "Crisis protocol" in a.message:
            alert_type_display = "Crisis Keywords"
        elif "High risk" in a.message:
            alert_type_display = "High Risk Score"
        else:
            alert_type_display = "Risk Alert"
        
        result.append({
            "id": a.id,
            "student_id": a.student_id,
            "studentName": student_name,
            "alert_type": a.alert_type,
            "type": alert_type_display,
            "severity": severity,
            "message": a.message,
            "status": "Unread",
            "triggeredAt": a.created_at.strftime("%Y-%m-%d %I:%M %p"),
            "actionRequired": "Immediate intervention recommended" if severity == "Critical" else "Review and follow-up needed",
            "testType": "Message Analysis"
        })
    
    return result




