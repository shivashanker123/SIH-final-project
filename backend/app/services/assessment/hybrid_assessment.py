"""Solution 1: Hybrid Assessment Model."""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.core.config import settings
from app.schemas.assessment import AssessmentType
import structlog
import json

logger = structlog.get_logger()


class HybridAssessmentService:
    """
    Manages tiered assessment approach with explicit baseline tracking.
    
    What This Solution Does:
    - Tier 1: Tracks baseline patterns (language, humor, mood) WITHOUT scoring for first 2-3 sessions
    - Tier 2: Triggers explicit PHQ-2/GAD-2 assessments at session 4 and monthly intervals
    - Tier 3: Flags concern indicators (language shifts, engagement drops, hopelessness) WITHOUT assigning scores
    
    What This Solution Does NOT Do:
    - Does NOT infer depression/anxiety scores from conversation
    - Does NOT assign risk levels during Tier 1
    - Does NOT replace validated assessments with conversation analysis
    """
    
    def __init__(self, db_session, llm_client=None):
        """
        Initialize HybridAssessmentService.
        
        Args:
            db_session: Database session
            llm_client: Optional LLM client for sentiment/humor detection in Tier 1
        """
        self.db = db_session
        self.llm = llm_client
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
    
    async def track_passive_monitoring(self, student_id: str, message_text: str, message_data: Dict[str, Any]):
        """
        Tier 1: Track baseline patterns without scoring.
        
        What This Method Does:
        - Tracks communication style, sentiment, humor patterns
        - Builds baseline profile for deviation detection
        - Uses LLM for sentiment/humor detection when available
        - Calculates baseline statistics (averages, variance)
        
        What This Method Does NOT Do:
        - Does NOT assign risk scores
        - Does NOT infer depression/anxiety levels
        - Does NOT flag concerns (that's Tier 3)
        """
        student = self._get_student(student_id)
        if not student:
            self._create_student(student_id)
            student = self._get_student(student_id)
        
        # Analyze message with LLM if available
        sentiment = message_data.get("sentiment", "neutral")
        contains_humor = message_data.get("contains_humor", False)
        
        if self.llm:
            try:
                llm_analysis = await self._analyze_message_for_baseline(message_text)
                sentiment = llm_analysis.get("sentiment", sentiment)
                contains_humor = llm_analysis.get("contains_humor", contains_humor)
            except Exception as e:
                logger.warning("baseline_llm_analysis_failed",
                             error=str(e),
                             student_id=student_id)
        
        # Update baseline profile with concrete schema
        baseline = student.baseline_profile or {}
        
        # Track language patterns (raw data for statistics)
        if "language_patterns" not in baseline:
            baseline["language_patterns"] = []
        baseline["language_patterns"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "message_length": len(message_text),
            "emoji_count": message_data.get("emoji_count", 0),
            "sentiment": sentiment
        })
        
        # Track humor patterns
        if "humor_indicators" not in baseline:
            baseline["humor_indicators"] = []
        if contains_humor:
            baseline["humor_indicators"].append(datetime.utcnow().isoformat())
        
        # Track mood samples
        if "mood_samples" not in baseline:
            baseline["mood_samples"] = []
        baseline["mood_samples"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "mood": message_data.get("mood", "neutral")
        })
        
        # Calculate baseline statistics (concrete schema)
        baseline = self._calculate_baseline_statistics(baseline)
        
        student.baseline_profile = baseline
        self.db.commit()
        
        logger.info("passive_monitoring_tracked", student_id=student_id)
    
    async def _analyze_message_for_baseline(self, message_text: str) -> Dict[str, Any]:
        """Use LLM to analyze message for baseline tracking (sentiment, humor)."""
        if not self.llm:
            return {"sentiment": "neutral", "contains_humor": False}
        
        prompt = f"""Analyze this message for baseline tracking:

Message: "{message_text}"

Determine:
1. Sentiment: "positive", "neutral", or "negative" (on a -1 to +1 scale, map to these categories)
2. Contains humor: boolean (sarcasm, jokes, lighthearted tone)

Respond in JSON:
{{
  "sentiment": "positive|neutral|negative",
  "sentiment_score": -1.0 to 1.0,
  "contains_humor": boolean,
  "reasoning": "brief explanation"
}}"""
        
        try:
            response = await self.llm.generate(prompt, max_tokens=200)
            
            # Parse JSON
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                analysis = json.loads(response[json_start:json_end])
            else:
                analysis = json.loads(response)
            
            return {
                "sentiment": analysis.get("sentiment", "neutral"),
                "sentiment_score": analysis.get("sentiment_score", 0.0),
                "contains_humor": analysis.get("contains_humor", False)
            }
        except Exception as e:
            logger.error("baseline_llm_analysis_failed", error=str(e))
            return {"sentiment": "neutral", "contains_humor": False}
    
    def _calculate_baseline_statistics(self, baseline: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate baseline statistics from raw data.
        
        Creates concrete baseline schema:
        - avg_message_length
        - lexical_diversity
        - typical_emotionality
        - emoji_usage_rate
        - typical_sentiment
        - sentiment_variance
        - sarcasm_frequency
        - etc.
        """
        stats = {}
        
        # Communication style statistics
        language_patterns = baseline.get("language_patterns", [])
        if language_patterns:
            message_lengths = [p.get("message_length", 0) for p in language_patterns]
            stats["avg_message_length"] = sum(message_lengths) / len(message_lengths) if message_lengths else 0
            
            emoji_counts = [p.get("emoji_count", 0) for p in language_patterns]
            stats["emoji_usage_rate"] = sum(emoji_counts) / len(emoji_counts) if emoji_counts else 0
        
        # Emotional baseline statistics
        mood_samples = baseline.get("mood_samples", [])
        if mood_samples:
            sentiments = [m.get("mood", "neutral") for m in mood_samples]
            # Map to numeric for calculation
            sentiment_map = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}
            sentiment_scores = [sentiment_map.get(s, 0.0) for s in sentiments]
            
            if sentiment_scores:
                stats["typical_sentiment"] = sum(sentiment_scores) / len(sentiment_scores)
                # Calculate variance
                mean = stats["typical_sentiment"]
                variance = sum((x - mean) ** 2 for x in sentiment_scores) / len(sentiment_scores)
                stats["sentiment_variance"] = variance
                stats["typical_emotionality"] = abs(mean)  # How emotional (regardless of direction)
        
        # Humor/sarcasm frequency
        humor_indicators = baseline.get("humor_indicators", [])
        language_patterns_count = len(baseline.get("language_patterns", []))
        if language_patterns_count > 0:
            stats["sarcasm_frequency"] = len(humor_indicators) / language_patterns_count
            stats["dark_humor_baseline"] = stats["sarcasm_frequency"] > 0.3  # If >30% humor
        
        # Engagement statistics (if available)
        if "session_lengths" in baseline:
            stats["typical_session_length"] = sum(baseline["session_lengths"]) / len(baseline["session_lengths"])
        
        # Common themes (would be extracted from message content)
        stats["common_themes"] = baseline.get("common_themes", [])
        
        # Store statistics in baseline
        baseline["statistics"] = stats
        
        return baseline
    
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




