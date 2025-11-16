"""Solution 7: Temporal Pattern Recognition."""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import numpy as np
import structlog

logger = structlog.get_logger()


class TemporalAnalyzer:
    """Temporal pattern recognition for trajectory analysis."""
    
    def __init__(self, db_session):
        self.db = db_session
    
    async def analyze_trajectory(self, student_id: str) -> Dict[str, Any]:
        """Analyze temporal patterns in student's risk trajectory."""
        # Get time-series data
        history = self._get_risk_history(student_id, days=30)
        
        if len(history) < 3:
            return {"patterns": [], "velocity": 0, "acceleration": 0}
        
        # Calculate derivatives
        velocity = self._calculate_velocity(history)
        acceleration = self._calculate_acceleration(history)
        
        # Pattern matching
        patterns = self._detect_patterns(history, velocity, acceleration)
        
        # Risk multiplier based on patterns
        risk_multiplier = self._calculate_risk_multiplier(patterns)
        
        return {
            "patterns": list(patterns.keys()),
            "pattern_details": patterns,
            "velocity": velocity,
            "acceleration": acceleration,
            "risk_multiplier": risk_multiplier,
            "history": history
        }
    
    def _get_risk_history(self, student_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get risk score history for student."""
        from app.models.assessment import RiskProfile
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        profiles = self.db.query(RiskProfile).filter(
            RiskProfile.student_id == student_id,
            RiskProfile.calculated_at >= cutoff_date
        ).order_by(RiskProfile.calculated_at.asc()).all()
        
        # Convert to risk scores (0-4 scale)
        risk_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRISIS": 4}
        
        history = []
        for profile in profiles:
            history.append({
                "date": profile.calculated_at,
                "risk_score": risk_map.get(profile.overall_risk, 1),
                "confidence": profile.confidence
            })
        
        return history
    
    def _calculate_velocity(self, history: List[Dict[str, Any]]) -> float:
        """Calculate rate of change (velocity) in risk scores."""
        if len(history) < 2:
            return 0.0
        
        scores = [h["risk_score"] for h in history]
        dates = [h["date"] for h in history]
        
        # Calculate average daily change
        total_days = (dates[-1] - dates[0]).days
        if total_days == 0:
            return 0.0
        
        score_change = scores[-1] - scores[0]
        velocity = score_change / total_days
        
        return velocity
    
    def _calculate_acceleration(self, history: List[Dict[str, Any]]) -> float:
        """Calculate acceleration (rate of change of velocity)."""
        if len(history) < 3:
            return 0.0
        
        # Split into two halves
        mid = len(history) // 2
        first_half = history[:mid+1]
        second_half = history[mid:]
        
        v1 = self._calculate_velocity(first_half)
        v2 = self._calculate_velocity(second_half)
        
        # Acceleration is change in velocity
        dates = [h["date"] for h in history]
        total_days = (dates[-1] - dates[0]).days
        if total_days == 0:
            return 0.0
        
        acceleration = (v2 - v1) / (total_days / 2)
        
        return acceleration
    
    def _detect_patterns(self, history: List[Dict[str, Any]], 
                        velocity: float, acceleration: float) -> Dict[str, bool]:
        """Detect specific temporal patterns."""
        patterns = {}
        
        scores = [h["risk_score"] for h in history]
        dates = [h["date"] for h in history]
        
        # Rapid deterioration
        patterns["rapid_deterioration"] = velocity < -0.5 and acceleration < 0
        
        # Pre-decision calm (sudden improvement after sustained distress)
        patterns["pre_decision_calm"] = self._detect_pre_decision_calm(history)
        
        # Chronic elevated
        mean_score = np.mean(scores)
        std_score = np.std(scores)
        patterns["chronic_elevated"] = mean_score > 2.5 and std_score < 0.5
        
        # Cyclical pattern (possible bipolar indicator)
        patterns["cyclical"] = self._detect_cyclical_pattern(scores)
        
        # Disengagement
        patterns["disengagement"] = self._detect_disengagement(history[0]["date"], dates)
        
        return patterns
    
    def _detect_pre_decision_calm(self, history: List[Dict[str, Any]]) -> bool:
        """Detect sudden improvement after sustained distress (dangerous pattern)."""
        if len(history) < 5:
            return False
        
        scores = [h["risk_score"] for h in history]
        
        # Check if first 70% had high scores and last 30% dropped significantly
        split_point = int(len(scores) * 0.7)
        first_part = scores[:split_point]
        last_part = scores[split_point:]
        
        if len(first_part) == 0 or len(last_part) == 0:
            return False
        
        first_mean = np.mean(first_part)
        last_mean = np.mean(last_part)
        
        # Sudden improvement after high distress
        return first_mean >= 3.0 and last_mean < 2.0 and (first_mean - last_mean) > 1.5
    
    def _detect_cyclical_pattern(self, scores: List[float]) -> bool:
        """Detect cyclical pattern in scores."""
        if len(scores) < 6:
            return False
        
        # Simple check: look for alternating high/low patterns
        # More sophisticated: FFT or autocorrelation
        differences = [scores[i+1] - scores[i] for i in range(len(scores)-1)]
        sign_changes = sum(1 for i in range(len(differences)-1) 
                          if (differences[i] > 0) != (differences[i+1] > 0))
        
        # High number of sign changes suggests cyclical pattern
        return sign_changes > len(scores) * 0.5
    
    def _detect_disengagement(self, start_date: datetime, dates: List[datetime]) -> bool:
        """Detect disengagement pattern (decreasing message frequency)."""
        if len(dates) < 3:
            return False
        
        # Calculate message frequency over time
        total_days = (dates[-1] - start_date).days
        if total_days == 0:
            return False
        
        # Split into early and late periods
        mid_date = start_date + timedelta(days=total_days / 2)
        early_count = sum(1 for d in dates if d < mid_date)
        late_count = sum(1 for d in dates if d >= mid_date)
        
        early_period_days = (mid_date - start_date).days
        late_period_days = (dates[-1] - mid_date).days
        
        if early_period_days == 0 or late_period_days == 0:
            return False
        
        early_freq = early_count / early_period_days
        late_freq = late_count / late_period_days
        
        # Significant drop in frequency
        return late_freq < early_freq * 0.5
    
    def _calculate_risk_multiplier(self, patterns: Dict[str, bool]) -> float:
        """Calculate risk multiplier based on detected patterns."""
        multiplier = 1.0
        
        if patterns.get("rapid_deterioration"):
            multiplier *= 2.0
        
        if patterns.get("pre_decision_calm"):
            multiplier *= 3.0  # Most dangerous pattern
        
        if patterns.get("chronic_elevated"):
            multiplier *= 1.5
        
        if patterns.get("disengagement"):
            multiplier *= 1.3
        
        return multiplier
    
    def save_temporal_pattern(self, student_id: str, pattern_data: Dict[str, Any]):
        """Save detected temporal pattern to database."""
        from app.models.analysis import TemporalPattern
        
        for pattern_type, detected in pattern_data.get("pattern_details", {}).items():
            if detected:
                pattern = TemporalPattern(
                    student_id=student_id,
                    pattern_type=pattern_type,
                    detected_at=datetime.utcnow(),
                    pattern_data=pattern_data,
                    risk_multiplier=pattern_data.get("risk_multiplier", 1.0)
                )
                self.db.add(pattern)
        
        self.db.commit()




