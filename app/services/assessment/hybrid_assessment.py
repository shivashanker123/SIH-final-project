"""Solution 1: Hybrid Assessment Model."""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.core.config import settings
from app.schemas.assessment import AssessmentType
import structlog

logger = structlog.get_logger()


class HybridAssessmentService:
    """Manages tiered assessment approach."""
    
    def __init__(self, db_session):
        self.db = db_session
        self.passive_sessions = settings.passive_monitoring_sessions
        self.checkpoint_interval = timedelta(days=settings.checkpoint_interval_days)
    
    def get_assessment_tier(self, student_id: str) -> str:
        """Determine which assessment tier student is in."""
        # Get student session count
        student = self._get_student(student_id)
        session_count = student.session_count if student else 0
        
        if session_count < self.passive_sessions:
            return "TIER_1_PASSIVE"
        elif self._should_trigger_checkpoint(student_id):
            return "TIER_2_CHECKPOINT"
        else:
            return "TIER_3_CONTEXTUAL"
    
    def _get_student(self, student_id: str):
        """Get student record."""
        from app.models.student import Student
        return self.db.query(Student).filter(Student.student_id == student_id).first()
    
    def _should_trigger_checkpoint(self, student_id: str) -> bool:
        """Check if checkpoint assessment should be triggered."""
        student = self._get_student(student_id)
        if not student or not student.last_checkpoint_date:
            return True
        
        last_checkpoint = datetime.fromisoformat(student.last_checkpoint_date)
        return datetime.utcnow() - last_checkpoint >= self.checkpoint_interval
    
    def track_passive_monitoring(self, student_id: str, message_data: Dict[str, Any]):
        """Tier 1: Track patterns without scoring."""
        student = self._get_student(student_id)
        if not student:
            self._create_student(student_id)
            student = self._get_student(student_id)
        
        # Update baseline profile
        baseline = student.baseline_profile or {}
        
        # Track language patterns
        if "language_patterns" not in baseline:
            baseline["language_patterns"] = []
        baseline["language_patterns"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "message_length": len(message_data.get("text", "")),
            "emoji_count": message_data.get("emoji_count", 0),
            "sentiment": message_data.get("sentiment", "neutral")
        })
        
        # Track humor patterns
        if "humor_indicators" not in baseline:
            baseline["humor_indicators"] = []
        if message_data.get("contains_humor"):
            baseline["humor_indicators"].append(datetime.utcnow().isoformat())
        
        # Track baseline mood
        if "mood_samples" not in baseline:
            baseline["mood_samples"] = []
        baseline["mood_samples"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "mood": message_data.get("mood", "neutral")
        })
        
        student.baseline_profile = baseline
        self.db.commit()
        
        logger.info("passive_monitoring_tracked", student_id=student_id)
    
    def should_trigger_checkpoint_assessment(self, student_id: str) -> bool:
        """Check if checkpoint assessment should be administered."""
        tier = self.get_assessment_tier(student_id)
        return tier == "TIER_2_CHECKPOINT"
    
    def get_checkpoint_assessment_plan(self, student_id: str) -> Dict[str, Any]:
        """Get plan for checkpoint assessment."""
        return {
            "assessment_sequence": [
                {
                    "type": "PHQ2",
                    "reason": "Initial depression screening",
                    "if_positive_threshold": 3,
                    "then_administer": "PHQ9"
                },
                {
                    "type": "GAD2",
                    "reason": "Initial anxiety screening",
                    "if_positive_threshold": 3,
                    "then_administer": "GAD7"
                }
            ],
            "message": "I'd like to check in on how you've been feeling. This helps me support you better."
        }
    
    def flag_concern_indicators(self, student_id: str, analysis: Dict[str, Any]) -> List[str]:
        """Tier 3: Flag concern indicators without assigning scores."""
        indicators = []
        
        # Check for sudden language shifts
        if analysis.get("language_shift_detected"):
            indicators.append("sudden_language_shift")
        
        # Check for engagement changes
        if analysis.get("engagement_drop") and analysis.get("engagement_drop") > 0.5:
            indicators.append("significant_engagement_drop")
        
        # Check for hopelessness themes
        if analysis.get("hopelessness_themes"):
            indicators.append("hopelessness_themes")
        
        # Check for disengagement
        if analysis.get("disengagement_pattern"):
            indicators.append("disengagement_pattern")
        
        # If indicators found, suggest earlier checkpoint
        if indicators:
            logger.info("concern_indicators_flagged", 
                       student_id=student_id, 
                       indicators=indicators)
        
        return indicators
    
    def _create_student(self, student_id: str):
        """Create new student record."""
        from app.models.student import Student
        student = Student(
            student_id=student_id,
            baseline_profile={},
            session_count=0
        )
        self.db.add(student)
        self.db.commit()




