"""Solution 4: Proper C-SSRS Implementation."""
from typing import Dict, Any, List
from datetime import datetime
from app.core.config import settings
from app.schemas.assessment import CSSRSRequest, AssessmentResult
import structlog

logger = structlog.get_logger()


class CSSRSService:
    """C-SSRS assessment service."""
    
    def __init__(self, db_session):
        self.db = db_session
        self.high_risk_score = settings.cssrs_high_risk_score
        self.urgent_score = settings.cssrs_urgent_score
    
    def should_trigger_cssrs(self, student_id: str, context: Dict[str, Any]) -> bool:
        """Determine if C-SSRS should be triggered."""
        # Trigger conditions:
        # 1. Suicidal ideation detected in conversation
        if context.get("suicidal_ideation_detected"):
            return True
        
        # 2. PHQ-9 Item 9 > 0 (thoughts of self-harm)
        if context.get("phq9_item9_score") and context.get("phq9_item9_score") > 0:
            return True
        
        # 3. Concerning behavior pattern + student requests help
        if context.get("concerning_behavior") and context.get("student_requests_help"):
            return True
        
        return False
    
    def get_cssrs_questions(self) -> CSSRSRequest:
        """Get C-SSRS questions in proper format."""
        return CSSRSRequest()
    
    def score_cssrs(self, responses: Dict[str, Any]) -> Dict[str, Any]:
        """Score C-SSRS responses using actual algorithm."""
        # C-SSRS scoring algorithm
        # Questions are yes/no (1 = yes, 0 = no)
        
        score = 0
        severity_level = "NONE"
        
        # Question 1: Wish to be dead
        if responses.get("cssrs_1") == 1:
            score = 1
            severity_level = "LOW"
        
        # Question 2: Thoughts of killing self
        if responses.get("cssrs_2") == 1:
            score = 2
            severity_level = "MODERATE"
        
        # Question 3: Method/plan
        if responses.get("cssrs_3") == 1:
            score = 3
            severity_level = "HIGH"
        
        # Question 4: Intent/communication
        if responses.get("cssrs_4") == 1:
            score = 4
            severity_level = "HIGH"
        
        # Question 5: Behavior/attempt
        if responses.get("cssrs_5") == 1:
            score = 5
            severity_level = "CRISIS"
        
        return {
            "score": score,
            "severity_level": severity_level,
            "responses": responses
        }
    
    def determine_clinical_action(self, score: int) -> Dict[str, Any]:
        """Determine clinical action based on C-SSRS score."""
        if score >= self.high_risk_score:  # Score 3-5
            return {
                "action": "IMMEDIATE_CRISIS_PROTOCOL",
                "urgency": "CRISIS",
                "message": "Immediate crisis intervention required",
                "notify": ["crisis_team", "counselor", "campus_safety"]
            }
        elif score >= self.urgent_score:  # Score 1-2
            return {
                "action": "URGENT_COUNSELOR_NOTIFICATION",
                "urgency": "URGENT",
                "message": "Urgent counselor review required",
                "notify": ["counselor"],
                "timeframe": "within_24h"
            }
        else:  # Score 0 but trigger was hit
            return {
                "action": "CONTINUE_MONITORING",
                "urgency": "ROUTINE",
                "message": "No active suicidal ideation, continue monitoring",
                "document": True
            }
    
    def create_assessment_record(self, student_id: str, responses: Dict[str, Any], 
                                score_result: Dict[str, Any], trigger_reason: str):
        """Create assessment record in database."""
        from app.models.assessment import Assessment
        
        assessment = Assessment(
            student_id=student_id,
            assessment_type="C_SSRS",
            score=score_result["score"],
            responses=responses,
            administered_at=datetime.utcnow(),
            trigger_reason=trigger_reason
        )
        
        self.db.add(assessment)
        self.db.commit()
        
        logger.info("cssrs_assessment_recorded",
                   student_id=student_id,
                   score=score_result["score"],
                   severity=score_result["severity_level"])
        
        return assessment




