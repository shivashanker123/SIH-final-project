"""Solution 4: Proper C-SSRS Implementation."""
from typing import Dict, Any, List
from datetime import datetime
from app.core.config import settings
from app.schemas.assessment import CSSRSRequest, AssessmentResult
import structlog

logger = structlog.get_logger()


class CSSRSService:
    """
    Proper C-SSRS Implementation with smooth UX integration.
    
    What This Solution Does:
    - Triggers C-SSRS when: suicidal ideation detected, PHQ-9 Item 9 > 0, or concerning behavior + student requests help
    - Presents actual C-SSRS questions verbatim (not conversationalized)
    - Scores using actual C-SSRS algorithm (0-5 scale)
    - Routes to clinical action: Score 3-5 = crisis protocol, 1-2 = urgent notification, 0 = continue monitoring
    - Provides smooth transition from conversation to assessment
    
    What This Solution Does NOT Do:
    - Does NOT embed questions in conversation
    - Does NOT paraphrase or simplify questions
    - Does NOT infer answers from conversation
    - Does NOT skip consent/explanation step
    """
    
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
    
    def get_cssrs_transition_message(self, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get empathetic transition message for C-SSRS assessment.
        
        Provides smooth UX transition from conversation to formal assessment
        to prevent jarring context switch and drop-off.
        
        Returns:
            Dict with transition message, consent prompt, and question explanations
        """
        trigger_reason = context.get("trigger_reason", "safety concern") if context else "safety concern"
        
        transition_message = f"""I want to make sure I understand how you're feeling so I can connect you with the right support. 

I'm going to ask you some specific questions that help me do that. These questions might feel direct, but they're important for your safety.

You can skip any question, but please know that honest answers help me help you better. Is it okay if I ask these now?"""
        
        return {
            "transition_message": transition_message,
            "consent_required": True,
            "explanation": "These are standardized safety questions used by mental health professionals to assess risk.",
            "can_decline": True,
            "decline_message": "That's okay. We can continue our conversation, and I'm here if you want to talk about anything."
        }
    
    def get_cssrs_questions(self) -> Dict[str, Any]:
        """
        Get C-SSRS questions in proper format with verbatim text.
        
        Returns questions exactly as specified in C-SSRS protocol,
        with explanations of why each question is asked.
        """
        return {
            "questions": [
                {
                    "id": "cssrs_1",
                    "verbatim_text": "In the past month, have you wished you were dead or wished you could go to sleep and not wake up?",
                    "why_we_ask": "This helps us understand if you've had thoughts about not wanting to be alive.",
                    "examples": "Thoughts like 'I wish I could just disappear' or 'I don't want to wake up'",
                    "response_type": "yes_no"
                },
                {
                    "id": "cssrs_2",
                    "verbatim_text": "In the past month, have you actually had any thoughts of killing yourself?",
                    "why_we_ask": "This helps us understand if you've had specific thoughts about ending your life.",
                    "examples": "Thoughts about ways to end your life, even if you didn't plan to act on them",
                    "response_type": "yes_no"
                },
                {
                    "id": "cssrs_3",
                    "verbatim_text": "In the past month, have you been thinking about how you might kill yourself?",
                    "why_we_ask": "This helps us understand if you've thought about specific methods.",
                    "examples": "Thinking about specific ways or methods to end your life",
                    "response_type": "yes_no"
                },
                {
                    "id": "cssrs_4",
                    "verbatim_text": "In the past month, have you had these thoughts and had some intention of acting on them?",
                    "why_we_ask": "This helps us understand if you've had intent to act on suicidal thoughts.",
                    "examples": "Having thoughts and feeling like you might actually do it",
                    "response_type": "yes_no"
                },
                {
                    "id": "cssrs_5",
                    "verbatim_text": "In the past month, have you started to work out or worked out the details of how to kill yourself? Have you done anything, started to do anything, or prepared to do anything to end your life?",
                    "why_we_ask": "This helps us understand if you've taken any steps toward ending your life.",
                    "examples": "Making preparations, gathering means, or taking any action toward suicide",
                    "response_type": "yes_no"
                }
            ],
            "closing_message": """Thank you for answering those questions. That helps me understand how to support you. Let's talk about what would help you right now."""
        }
    
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




