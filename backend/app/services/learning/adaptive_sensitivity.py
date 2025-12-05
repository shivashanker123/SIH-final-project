"""Solution 6: Adaptive Sensitivity with Feedback Loop."""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.config import settings
import structlog

logger = structlog.get_logger()


class AdaptiveSensitivityService:
    """
    Dynamic threshold adjustment based on feedback with phased deployment.
    
    What This Solution Does:
    - Population-level: Adjusts thresholds monthly based on F1 score optimization
    - Individual-level: Tracks per-student baselines and flags deviations >2 standard deviations
    - Integrates counselor feedback to calibrate confidence thresholds
    - Calculates precision, recall, F1 from feedback data
    - Phased deployment: Cold start → Calibration → Optimization
    
    What This Solution Does NOT Do:
    - Does NOT adjust thresholds without feedback data
    - Does NOT ignore individual baselines
    - Does NOT use static thresholds
    - Does NOT operate in production mode during cold start (uses conservative thresholds)
    """
    
    # Phase 1: Cold Start (First 3 months) - Conservative thresholds
    INITIAL_THRESHOLDS = {
        "high_risk": 0.7,  # Conservative - lower threshold means more sensitive
        "medium_risk": 0.4,
        "minimum_confidence": 0.5
    }
    COLD_START_POLICY = "route_all_medium_plus_to_human"  # Higher human review rate
    
    # Phase 2: Calibration (Months 4-6) - Slightly less conservative
    CALIBRATION_THRESHOLDS = {
        "high_risk": 0.75,
        "medium_risk": 0.45,
        "minimum_confidence": 0.6
    }
    CALIBRATION_POLICY = "route_uncertain_to_human"  # Moderate review rate
    
    # Phase 3: Optimized (Month 7+) - Thresholds adjusted monthly
    OPTIMIZATION_GOAL = "maximize_F1"  # Can switch to "maximize_recall" if needed
    
    def __init__(self, db_session):
        self.db = db_session
        # Start with cold start thresholds
        self.current_thresholds = {
            "PHQ9": settings.initial_phq9_threshold,
            "GAD7": settings.initial_gad7_threshold,
            "confidence": settings.risk_confidence_threshold,
            "high_risk": self.INITIAL_THRESHOLDS["high_risk"],
            "medium_risk": self.INITIAL_THRESHOLDS["medium_risk"],
            "minimum_confidence": self.INITIAL_THRESHOLDS["minimum_confidence"]
        }
    
    def get_threshold(self, threshold_type: str) -> float:
        """
        Get current threshold for given type, based on deployment phase.
        
        Phases:
        - Cold Start (< 100 feedbacks): Conservative thresholds, route more to human
        - Calibration (100-500 feedbacks): Moderate thresholds
        - Optimization (500+ feedbacks): Data-driven thresholds
        """
        feedback_count = self._get_feedback_count()
        
        if feedback_count < 100:  # Cold start
            # Use initial conservative thresholds
            if threshold_type in self.INITIAL_THRESHOLDS:
                return self.INITIAL_THRESHOLDS[threshold_type]
        elif feedback_count < 500:  # Calibration
            # Use calibration thresholds
            if threshold_type in self.CALIBRATION_THRESHOLDS:
                return self.CALIBRATION_THRESHOLDS[threshold_type]
        
        # Optimization phase or standard thresholds
        return self.current_thresholds.get(threshold_type, 0.5)
    
    def get_deployment_phase(self) -> str:
        """Get current deployment phase based on feedback count."""
        feedback_count = self._get_feedback_count()
        
        if feedback_count < 100:
            return "COLD_START"
        elif feedback_count < 500:
            return "CALIBRATION"
        else:
            return "OPTIMIZATION"
    
    def get_routing_policy(self) -> str:
        """Get routing policy based on deployment phase."""
        phase = self.get_deployment_phase()
        
        if phase == "COLD_START":
            return self.COLD_START_POLICY
        elif phase == "CALIBRATION":
            return self.CALIBRATION_POLICY
        else:
            return "data_driven_routing"
    
    def _get_feedback_count(self) -> int:
        """Get total count of counselor feedback records."""
        from app.models.learning import CounselorFeedback
        return self.db.query(CounselorFeedback).count()
    
    def calculate_performance_metrics(self, days: int = 30) -> Dict[str, Any]:
        """Calculate performance metrics from feedback."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        from app.models.learning import CounselorFeedback
        
        feedbacks = self.db.query(CounselorFeedback).filter(
            CounselorFeedback.feedback_date >= cutoff_date
        ).all()
        
        if not feedbacks:
            return {"total": 0, "metrics": {}}
        
        # Calculate metrics
        total = len(feedbacks)
        true_positives = sum(1 for f in feedbacks 
                           if f.was_appropriate and f.actual_severity in ["Moderate", "Severe", "Crisis"])
        false_positives = sum(1 for f in feedbacks 
                            if not f.was_appropriate or f.ai_accuracy == "over_flagged")
        false_negatives = sum(1 for f in feedbacks 
                            if f.ai_accuracy == "missed_context" and f.actual_severity in ["Severe", "Crisis"])
        true_negatives = total - true_positives - false_positives - false_negatives
        
        # Calculate precision, recall, F1
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "total": total,
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "true_negatives": true_negatives,
            "precision": precision,
            "recall": recall,
            "f1_score": f1_score,
            "metrics": {
                "precision": precision,
                "recall": recall,
                "f1_score": f1_score
            }
        }
    
    def adjust_thresholds(self, performance_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Adjust thresholds based on performance metrics."""
        adjustments = {}
        
        # If too many false positives, increase thresholds (more conservative)
        if performance_metrics.get("false_positives", 0) > performance_metrics.get("true_positives", 0) * 0.5:
            # Too many false positives - be more conservative
            for threshold_type in ["PHQ9", "GAD7", "confidence"]:
                old_value = self.current_thresholds[threshold_type]
                new_value = old_value * 1.1  # Increase by 10%
                self.current_thresholds[threshold_type] = new_value
                adjustments[threshold_type] = {
                    "old": old_value,
                    "new": new_value,
                    "reason": "High false positive rate"
                }
        
        # If false negatives detected, decrease thresholds (more sensitive)
        if performance_metrics.get("false_negatives", 0) > 0:
            for threshold_type in ["PHQ9", "GAD7", "confidence"]:
                old_value = self.current_thresholds[threshold_type]
                new_value = old_value * 0.95  # Decrease by 5%
                self.current_thresholds[threshold_type] = new_value
                if threshold_type not in adjustments:
                    adjustments[threshold_type] = {
                        "old": old_value,
                        "new": new_value,
                        "reason": "False negatives detected"
                    }
        
        # Record calibration
        if adjustments:
            self._record_calibration(adjustments, performance_metrics)
        
        return adjustments
    
    def get_individual_baseline(self, student_id: str) -> Dict[str, Any]:
        """Get individual student baseline for personalized thresholds."""
        from app.models.student import Student
        
        student = self.db.query(Student).filter(Student.student_id == student_id).first()
        if not student or not student.baseline_profile:
            return {}
        
        baseline = student.baseline_profile
        
        # Calculate baseline statistics
        mood_samples = baseline.get("mood_samples", [])
        if not mood_samples:
            return {}
        
        # Calculate mean and std of mood
        moods = [m.get("mood", "neutral") for m in mood_samples]
        mood_values = {"very_negative": -2, "negative": -1, "neutral": 0, "positive": 1, "very_positive": 2}
        mood_scores = [mood_values.get(m, 0) for m in moods]
        
        if len(mood_scores) < 3:
            return {}
        
        import numpy as np
        mean_mood = np.mean(mood_scores)
        std_mood = np.std(mood_scores)
        
        return {
            "mean_mood": mean_mood,
            "std_mood": std_mood,
            "sample_count": len(mood_samples),
            "typical_emotionality": "high" if std_mood > 1.0 else "low"
        }
    
    def check_deviation_from_baseline(self, student_id: str, current_indicators: Dict[str, Any]) -> bool:
        """Check if current indicators deviate significantly from baseline."""
        baseline = self.get_individual_baseline(student_id)
        
        if not baseline:
            return False
        
        # Check if current mood deviates by more than 2 standard deviations
        current_mood = current_indicators.get("mood_score", 0)
        mean_mood = baseline.get("mean_mood", 0)
        std_mood = baseline.get("std_mood", 1)
        
        deviation = abs(current_mood - mean_mood)
        threshold = 2 * std_mood
        
        return deviation > threshold
    
    def _record_calibration(self, adjustments: Dict[str, Any], performance_metrics: Dict[str, Any]):
        """Record threshold calibration in database."""
        from app.models.learning import ThresholdCalibration
        
        for threshold_type, adjustment in adjustments.items():
            calibration = ThresholdCalibration(
                threshold_type=threshold_type,
                old_value=adjustment["old"],
                new_value=adjustment["new"],
                reason=adjustment["reason"],
                calibrated_at=datetime.utcnow(),
                performance_improvement=performance_metrics.get("f1_score", 0)
            )
            self.db.add(calibration)
        
        self.db.commit()
        logger.info("thresholds_calibrated", adjustments=adjustments)




