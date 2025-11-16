"""Solution 2: Confidence-Weighted Alert System."""
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.schemas.risk import RiskProfile, RiskLevel, RiskFactors, AlertRecommendation
from app.services.analysis.temporal_analyzer import TemporalAnalyzer
import structlog

logger = structlog.get_logger()


class RiskCalculator:
    """Multi-dimensional risk profile calculator."""
    
    def __init__(self, db_session):
        self.db = db_session
        self.temporal_analyzer = TemporalAnalyzer(db_session)
    
    async def calculate_risk(self, student_id: str, message_text: str,
                           context: Dict[str, Any], concern_indicators: List[str]) -> Dict[str, Any]:
        """Calculate multi-dimensional risk profile."""
        
        # Get temporal patterns
        temporal_patterns = await self.temporal_analyzer.analyze_trajectory(student_id)
        
        # Calculate individual risk factors
        suicidal_ideation = self._assess_suicidal_ideation(message_text, context)
        depression_severity = self._assess_depression_severity(student_id, context)
        behavior_change = self._assess_behavior_change(student_id, context)
        
        # Build risk factors
        risk_factors = RiskFactors(
            suicidal_ideation=suicidal_ideation,
            depression_severity=depression_severity,
            behavior_change=behavior_change
        )
        
        # Calculate overall risk and confidence
        overall_risk, confidence = self._calculate_overall_risk(
            risk_factors, temporal_patterns, concern_indicators
        )
        
        # Determine recommended action
        recommended_action = self._determine_action(overall_risk, confidence, risk_factors)
        
        # Create risk profile
        risk_profile = RiskProfile(
            student_id=student_id,
            overall_risk=overall_risk,
            confidence=confidence,
            risk_factors=risk_factors,
            recommended_action=recommended_action,
            calculated_at=datetime.utcnow(),
            temporal_patterns=temporal_patterns.get("patterns", [])
        )
        
        # Save to database
        self._save_risk_profile(risk_profile)
        
        # Generate alert recommendation
        alert_rec = self._generate_alert_recommendation(risk_profile)
        
        return {
            "overall_risk": overall_risk.value,
            "confidence": confidence,
            "risk_factors": risk_factors.dict(),
            "recommended_action": recommended_action,
            "temporal_patterns": temporal_patterns.get("patterns", []),
            "alert_recommendation": alert_rec.dict()
        }
    
    def _assess_suicidal_ideation(self, message_text: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Assess suicidal ideation risk factor."""
        # Check for explicit mentions
        text_lower = message_text.lower()
        present = any(keyword in text_lower for keyword in ["suicide", "kill myself", "end it all"])
        
        # Check context for C-SSRS results
        cssrs_score = context.get("current_risk_profile", {}).get("cssrs_score")
        if cssrs_score and cssrs_score > 0:
            present = True
            confidence = 0.95
        elif present:
            confidence = 0.85
        else:
            return None
        
        return {
            "present": present,
            "confidence": confidence
        }
    
    def _assess_depression_severity(self, student_id: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Assess depression severity risk factor."""
        # Get latest PHQ-9 score if available
        latest_assessment = self._get_latest_assessment(student_id, "PHQ9")
        
        if latest_assessment:
            return {
                "estimated_phq9": latest_assessment.score,
                "confidence": 0.9,
                "reason": "Based on validated PHQ-9 assessment"
            }
        
        # Otherwise, estimate from conversation indicators
        concern_indicators = context.get("concern_indicators", [])
        if "sleep_issues" in concern_indicators and "low_energy" in concern_indicators:
            return {
                "estimated_phq9": 11,
                "confidence": 0.65,
                "reason": "Mentioned sleep issues and low energy, but context unclear"
            }
        
        return None
    
    def _assess_behavior_change(self, student_id: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Assess behavior change risk factor."""
        behavioral_metadata = context.get("behavioral_metadata", {})
        engagement_drop = behavioral_metadata.get("engagement_drop_percentage", 0)
        
        if engagement_drop > 0.6:
            return {
                "concern": "HIGH",
                "confidence": 0.88,
                "reason": f"Engagement dropped {engagement_drop*100:.0f}% in last 7 days, language becoming more negative"
            }
        elif engagement_drop > 0.3:
            return {
                "concern": "MEDIUM",
                "confidence": 0.75,
                "reason": f"Engagement dropped {engagement_drop*100:.0f}% in last 7 days"
            }
        
        return None
    
    def _calculate_overall_risk(self, risk_factors: RiskFactors, 
                               temporal_patterns: Dict[str, Any],
                               concern_indicators: List[str]) -> tuple:
        """Calculate overall risk level and confidence."""
        risk_scores = []
        confidence_scores = []
        
        # Suicidal ideation - highest weight
        if risk_factors.suicidal_ideation and risk_factors.suicidal_ideation.present:
            risk_scores.append(4)  # CRISIS
            confidence_scores.append(risk_factors.suicidal_ideation.confidence)
        
        # Depression severity
        if risk_factors.depression_severity:
            phq9 = risk_factors.depression_severity.estimated_phq9
            if phq9 >= 20:
                risk_scores.append(4)  # CRISIS
            elif phq9 >= 15:
                risk_scores.append(3)  # HIGH
            elif phq9 >= 10:
                risk_scores.append(2)  # MEDIUM
            confidence_scores.append(risk_factors.depression_severity.confidence)
        
        # Behavior change
        if risk_factors.behavior_change:
            if risk_factors.behavior_change.concern == "HIGH":
                risk_scores.append(3)  # HIGH
            elif risk_factors.behavior_change.concern == "MEDIUM":
                risk_scores.append(2)  # MEDIUM
            confidence_scores.append(risk_factors.behavior_change.confidence)
        
        # Temporal patterns
        if temporal_patterns.get("rapid_deterioration"):
            risk_scores.append(3)  # HIGH
            confidence_scores.append(0.8)
        
        if temporal_patterns.get("pre_decision_calm"):
            risk_scores.append(4)  # CRISIS
            confidence_scores.append(0.9)
        
        # Determine overall risk
        if not risk_scores:
            return RiskLevel.LOW, 0.5
        
        max_risk = max(risk_scores)
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
        
        if max_risk >= 4:
            overall_risk = RiskLevel.CRISIS
        elif max_risk >= 3:
            overall_risk = RiskLevel.HIGH
        elif max_risk >= 2:
            overall_risk = RiskLevel.MEDIUM
        else:
            overall_risk = RiskLevel.LOW
        
        return overall_risk, avg_confidence
    
    def _determine_action(self, overall_risk: RiskLevel, confidence: float,
                         risk_factors: RiskFactors) -> str:
        """Determine recommended action."""
        if overall_risk == RiskLevel.CRISIS:
            return "immediate_crisis_protocol"
        elif overall_risk == RiskLevel.HIGH and confidence > 0.9:
            return "immediate_alert"
        elif overall_risk == RiskLevel.HIGH and confidence < 0.9:
            return "human_review_queue"
        elif overall_risk == RiskLevel.MEDIUM:
            return "schedule_counselor_review_within_48h"
        else:
            return "continue_monitoring"
    
    def _generate_alert_recommendation(self, risk_profile: RiskProfile) -> AlertRecommendation:
        """Generate alert routing recommendation."""
        should_alert = False
        alert_type = "NONE"
        reasoning = ""
        priority_score = None
        
        if risk_profile.overall_risk == RiskLevel.CRISIS:
            should_alert = True
            alert_type = "IMMEDIATE"
            reasoning = "Crisis-level risk detected"
            priority_score = 100.0
        elif risk_profile.overall_risk == RiskLevel.HIGH and risk_profile.confidence > 0.9:
            should_alert = True
            alert_type = "IMMEDIATE"
            reasoning = "High risk with high confidence"
            priority_score = 90.0
        elif risk_profile.overall_risk == RiskLevel.HIGH and risk_profile.confidence < 0.7:
            should_alert = True
            alert_type = "URGENT"
            reasoning = "High risk but low confidence - requires human review"
            priority_score = 70.0
        elif risk_profile.overall_risk == RiskLevel.MEDIUM:
            should_alert = True
            alert_type = "ROUTINE"
            reasoning = "Medium risk - routine review recommended"
            priority_score = 50.0
        
        # Calculate priority score if not set
        if priority_score is None:
            risk_value = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRISIS": 4}[risk_profile.overall_risk.value]
            priority_score = risk_value * risk_profile.confidence * 25
        
        return AlertRecommendation(
            should_alert=should_alert,
            alert_type=alert_type,
            confidence=risk_profile.confidence,
            reasoning=reasoning,
            priority_score=priority_score
        )
    
    def get_current_risk_profile(self, student_id: str) -> Dict[str, Any]:
        """Get current risk profile from database."""
        from app.models.assessment import RiskProfile
        
        profile = self.db.query(RiskProfile).filter(
            RiskProfile.student_id == student_id
        ).order_by(RiskProfile.calculated_at.desc()).first()
        
        if profile:
            return {
                "overall_risk": profile.overall_risk,
                "confidence": profile.confidence,
                "risk_factors": profile.risk_factors,
                "calculated_at": profile.calculated_at.isoformat()
            }
        
        return {}
    
    def _get_latest_assessment(self, student_id: str, assessment_type: str):
        """Get latest assessment of given type."""
        from app.models.assessment import Assessment
        
        return self.db.query(Assessment).filter(
            Assessment.student_id == student_id,
            Assessment.assessment_type == assessment_type
        ).order_by(Assessment.administered_at.desc()).first()
    
    def _ensure_student_exists(self, student_id: str):
        """Ensure student record exists in database."""
        from app.models.student import Student
        
        student = self.db.query(Student).filter(
            Student.student_id == student_id
        ).first()
        
        if not student:
            student = Student(
                student_id=student_id,
                baseline_profile={},
                session_count=0
            )
            self.db.add(student)
            self.db.commit()
            logger.info("created_student", student_id=student_id)
    
    def _save_risk_profile(self, risk_profile: RiskProfile):
        """Save risk profile to database."""
        from app.models.assessment import RiskProfile as RiskProfileModel
        
        # Ensure student exists before saving risk profile
        self._ensure_student_exists(risk_profile.student_id)
        
        db_profile = RiskProfileModel(
            student_id=risk_profile.student_id,
            overall_risk=risk_profile.overall_risk.value,
            confidence=risk_profile.confidence,
            risk_factors=risk_profile.risk_factors.dict(),
            recommended_action=risk_profile.recommended_action,
            calculated_at=risk_profile.calculated_at
        )
        
        self.db.add(db_profile)
        self.db.commit()




