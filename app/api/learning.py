"""Learning and feedback API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.learning import CounselorFeedbackInput
from app.services.learning.feedback_collector import FeedbackCollector
from app.services.learning.performance_monitor import PerformanceMonitor
from app.services.learning.adaptive_sensitivity import AdaptiveSensitivityService
from app.db.database import get_db
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.post("/feedback")
async def submit_feedback(
    feedback: CounselorFeedbackInput,
    db: Session = Depends(get_db)
):
    """Submit counselor feedback on flagged case."""
    collector = FeedbackCollector(db)
    result = collector.submit_feedback(feedback.dict())
    return result


@router.get("/feedback/summary")
async def get_feedback_summary(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get feedback summary for monitoring."""
    collector = FeedbackCollector(db)
    return collector.get_feedback_summary(days)


@router.get("/performance/daily")
async def get_daily_performance(
    db: Session = Depends(get_db)
):
    """Get daily performance metrics."""
    monitor = PerformanceMonitor(db)
    return monitor.get_daily_metrics()


@router.get("/performance/weekly")
async def get_weekly_performance(
    db: Session = Depends(get_db)
):
    """Get weekly performance report."""
    monitor = PerformanceMonitor(db)
    return monitor.get_weekly_report()


@router.post("/calibrate-thresholds")
async def calibrate_thresholds(
    db: Session = Depends(get_db)
):
    """Trigger threshold calibration based on recent performance."""
    sensitivity_service = AdaptiveSensitivityService(db)
    performance_metrics = sensitivity_service.calculate_performance_metrics()
    adjustments = sensitivity_service.adjust_thresholds(performance_metrics)
    
    return {
        "status": "success",
        "performance_metrics": performance_metrics,
        "adjustments": adjustments
    }




