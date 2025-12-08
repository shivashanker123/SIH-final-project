"""Admin dashboard API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.student import Student, Session as SessionModel
from app.models.analysis import Alert
from app.models.assessment import Assessment, RiskProfile
from typing import List, Dict, Any
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for admin."""
    # Total students
    total_students = db.query(func.count(Student.id)).filter(
        Student.is_admin == False
    ).scalar() or 0
    
    # Active sessions (sessions from last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    active_sessions = db.query(func.count(SessionModel.id)).filter(
        SessionModel.created_at >= seven_days_ago
    ).scalar() or 0
    
    # Pending alerts
    pending_alerts = db.query(func.count(Alert.id)).filter(
        Alert.routing_status == "PENDING"
    ).scalar() or 0
    
    # High-risk cases (alerts with IMMEDIATE or URGENT type)
    high_risk_cases = db.query(func.count(Alert.id)).filter(
        and_(
            Alert.routing_status == "PENDING",
            or_(Alert.alert_type == "IMMEDIATE", Alert.alert_type == "URGENT")
        )
    ).scalar() or 0
    
    return {
        "total_students": total_students,
        "active_sessions": active_sessions,
        "pending_alerts": pending_alerts,
        "high_risk_cases": high_risk_cases
    }


@router.get("/wellness/monthly")
async def get_monthly_wellness(
    months: int = 6,
    db: Session = Depends(get_db)
):
    """Get monthly wellness trends."""
    # Get assessments grouped by month
    six_months_ago = datetime.utcnow() - timedelta(days=months * 30)
    
    assessments = db.query(Assessment).filter(
        Assessment.administered_at >= six_months_ago
    ).all()
    
    # Group by month
    monthly_data: Dict[str, Dict[str, Any]] = {}
    
    for assessment in assessments:
        month_key = assessment.administered_at.strftime("%b")
        year = assessment.administered_at.year
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": month_key,
                "overall": 0,
                "anxiety": 0,
                "depression": 0,
                "stress": 0,
                "satisfaction": 0,
                "count": 0
            }
        
        monthly_data[month_key]["count"] += 1
        
        # Map assessment types to wellness categories
        if assessment.assessment_type == "PHQ9":
            monthly_data[month_key]["depression"] += assessment.score
        elif assessment.assessment_type == "GAD7":
            monthly_data[month_key]["anxiety"] += assessment.score
    
    # Calculate averages and normalize to 0-100 scale
    result = []
    for month_key in sorted(monthly_data.keys(), key=lambda x: datetime.strptime(x, "%b").month):
        data = monthly_data[month_key]
        count = data["count"]
        
        if count > 0:
            # Normalize scores (PHQ-9: 0-27, GAD-7: 0-21) to 0-100 scale
            anxiety_score = min(100, (data["anxiety"] / count / 21) * 100) if data["anxiety"] > 0 else 0
            depression_score = min(100, (data["depression"] / count / 27) * 100) if data["depression"] > 0 else 0
            
            # Calculate overall wellness (inverse of anxiety + depression)
            overall = max(0, 100 - ((anxiety_score + depression_score) / 2))
            
            result.append({
                "month": month_key,
                "overall": round(overall, 1),
                "anxiety": round(anxiety_score, 1),
                "depression": round(depression_score, 1),
                "stress": round(anxiety_score * 0.8, 1),  # Estimate stress from anxiety
                "satisfaction": round(overall * 0.9, 1)  # Estimate satisfaction from overall
            })
    
    return result if result else []


@router.get("/wellness/daily")
async def get_daily_wellness(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get daily wellness trends."""
    days_ago = datetime.utcnow() - timedelta(days=days)
    
    assessments = db.query(Assessment).filter(
        Assessment.administered_at >= days_ago
    ).all()
    
    # Group by day
    daily_data: Dict[str, Dict[str, Any]] = {}
    
    for assessment in assessments:
        day_key = assessment.administered_at.strftime("%a")
        date_key = assessment.administered_at.strftime("%Y-%m-%d")
        
        if date_key not in daily_data:
            daily_data[date_key] = {
                "day": day_key,
                "score": 0,
                "sessions": 0,
                "count": 0
            }
        
        daily_data[date_key]["count"] += 1
        
        # Calculate wellness score from assessment
        if assessment.assessment_type == "PHQ9":
            # Normalize PHQ-9 (0-27) to wellness score (0-100)
            wellness = max(0, 100 - (assessment.score / 27) * 100)
            daily_data[date_key]["score"] += wellness
        elif assessment.assessment_type == "GAD7":
            # Normalize GAD-7 (0-21) to wellness score (0-100)
            wellness = max(0, 100 - (assessment.score / 21) * 100)
            daily_data[date_key]["score"] += wellness
    
    # Count sessions per day
    sessions = db.query(SessionModel).filter(
        SessionModel.created_at >= days_ago
    ).all()
    
    for session in sessions:
        date_key = session.created_at.strftime("%Y-%m-%d")
        if date_key in daily_data:
            daily_data[date_key]["sessions"] += 1
    
    # Calculate averages
    result = []
    for date_key in sorted(daily_data.keys()):
        data = daily_data[date_key]
        count = data["count"]
        
        result.append({
            "day": data["day"],
            "score": round(data["score"] / count, 1) if count > 0 else 0,
            "sessions": data["sessions"]
        })
    
    return result if result else []
