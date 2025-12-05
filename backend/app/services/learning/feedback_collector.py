"""Solution 8: Continuous Learning Infrastructure - Feedback Collection."""
from typing import Dict, Any, Optional
from datetime import datetime
from app.schemas.learning import CounselorFeedbackInput
import structlog

logger = structlog.get_logger()


class FeedbackCollector:
    """Collect and process counselor feedback."""
    
    def __init__(self, db_session):
        self.db = db_session
    
    def submit_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit counselor feedback on flagged case."""
        from app.models.learning import CounselorFeedback
        
        feedback = CounselorFeedback(
            student_id=feedback_data["student_id"],
            alert_id=feedback_data.get("alert_id"),
            risk_profile_id=feedback_data.get("risk_profile_id"),
            was_appropriate=feedback_data["was_appropriate"],
            actual_severity=feedback_data["actual_severity"],
            urgency=feedback_data["urgency"],
            ai_accuracy=feedback_data["ai_accuracy"],
            what_ai_missed=feedback_data.get("what_ai_missed"),
            what_ai_over_interpreted=feedback_data.get("what_ai_over_interpreted"),
            actual_clinical_scores=feedback_data.get("actual_clinical_scores"),
            counselor_id=feedback_data["counselor_id"],
            feedback_date=datetime.utcnow()
        )
        
        self.db.add(feedback)
        self.db.commit()
        
        logger.info("feedback_submitted",
                   student_id=feedback_data["student_id"],
                   counselor_id=feedback_data["counselor_id"],
                   was_appropriate=feedback_data["was_appropriate"])
        
        return {"status": "success", "feedback_id": feedback.id}
    
    def get_feedback_summary(self, days: int = 30) -> Dict[str, Any]:
        """Get summary of feedback for monitoring."""
        from app.models.learning import CounselorFeedback
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        feedbacks = self.db.query(CounselorFeedback).filter(
            CounselorFeedback.feedback_date >= cutoff_date
        ).all()
        
        # Aggregate statistics
        total = len(feedbacks)
        appropriate_count = sum(1 for f in feedbacks if f.was_appropriate)
        over_flagged_count = sum(1 for f in feedbacks if f.ai_accuracy == "over_flagged")
        missed_context_count = sum(1 for f in feedbacks if f.ai_accuracy == "missed_context")
        
        severity_distribution = {}
        for feedback in feedbacks:
            severity = feedback.actual_severity
            severity_distribution[severity] = severity_distribution.get(severity, 0) + 1
        
        return {
            "total_feedbacks": total,
            "appropriate_rate": appropriate_count / total if total > 0 else 0,
            "over_flagged_rate": over_flagged_count / total if total > 0 else 0,
            "missed_context_rate": missed_context_count / total if total > 0 else 0,
            "severity_distribution": severity_distribution,
            "period_days": days
        }




