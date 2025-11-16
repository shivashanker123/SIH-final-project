"""Solution 8: Continuous Learning Infrastructure - Performance Monitoring."""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import structlog

logger = structlog.get_logger()


class PerformanceMonitor:
    """Monitor system performance metrics."""
    
    def __init__(self, db_session):
        self.db = db_session
    
    def record_metric(self, metric_type: str, value: float, metadata: Dict[str, Any] = None):
        """Record a performance metric."""
        from app.models.learning import ModelPerformance
        
        metric = ModelPerformance(
            metric_date=datetime.utcnow(),
            metric_type=metric_type,
            value=value,
            metadata=metadata or {}
        )
        
        self.db.add(metric)
        self.db.commit()
    
    def get_daily_metrics(self, date: datetime = None) -> Dict[str, Any]:
        """Get daily performance metrics."""
        if date is None:
            date = datetime.utcnow()
        
        start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        from app.models.learning import ModelPerformance, CounselorFeedback, Alert
        
        # Get metrics from database
        metrics = self.db.query(ModelPerformance).filter(
            ModelPerformance.metric_date >= start_date,
            ModelPerformance.metric_date < end_date
        ).all()
        
        # Get alert volume
        alerts = self.db.query(Alert).filter(
            Alert.created_at >= start_date,
            Alert.created_at < end_date
        ).all()
        
        alert_by_severity = {}
        for alert in alerts:
            alert_by_severity[alert.alert_type] = alert_by_severity.get(alert.alert_type, 0) + 1
        
        # Get feedback stats
        feedbacks = self.db.query(CounselorFeedback).filter(
            CounselorFeedback.feedback_date >= start_date,
            CounselorFeedback.feedback_date < end_date
        ).all()
        
        return {
            "date": date.isoformat(),
            "metrics": {m.metric_type: m.value for m in metrics},
            "alert_volume": len(alerts),
            "alerts_by_severity": alert_by_severity,
            "feedback_count": len(feedbacks),
            "false_positive_rate": self._calculate_fp_rate(feedbacks),
            "false_negative_rate": self._calculate_fn_rate(feedbacks)
        }
    
    def get_weekly_report(self) -> Dict[str, Any]:
        """Generate weekly performance report."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        daily_reports = []
        for i in range(7):
            date = start_date + timedelta(days=i)
            daily_reports.append(self.get_daily_metrics(date))
        
        # Aggregate weekly stats
        total_alerts = sum(r["alert_volume"] for r in daily_reports)
        avg_fp_rate = sum(r.get("false_positive_rate", 0) for r in daily_reports) / 7
        avg_fn_rate = sum(r.get("false_negative_rate", 0) for r in daily_reports) / 7
        
        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "daily_reports": daily_reports,
            "aggregate": {
                "total_alerts": total_alerts,
                "average_false_positive_rate": avg_fp_rate,
                "average_false_negative_rate": avg_fn_rate
            }
        }
    
    def _calculate_fp_rate(self, feedbacks: List) -> float:
        """Calculate false positive rate from feedbacks."""
        if not feedbacks:
            return 0.0
        
        false_positives = sum(1 for f in feedbacks 
                            if not f.was_appropriate or f.ai_accuracy == "over_flagged")
        return false_positives / len(feedbacks)
    
    def _calculate_fn_rate(self, feedbacks: List) -> float:
        """Calculate false negative rate from feedbacks."""
        if not feedbacks:
            return 0.0
        
        false_negatives = sum(1 for f in feedbacks 
                            if f.ai_accuracy == "missed_context" and 
                            f.actual_severity in ["Severe", "Crisis"])
        return false_negatives / len(feedbacks)




