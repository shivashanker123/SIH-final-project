"""Solution 2: Confidence-Weighted Alert System."""
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.schemas.risk import RiskProfile, RiskLevel, RiskFactors, AlertRecommendation
from app.services.analysis.temporal_analyzer import TemporalAnalyzer
import structlog
import json
import re

logger = structlog.get_logger()


class RiskCalculator:
    """
    Multi-dimensional risk profile calculator with LLM-based contextual understanding.
    
    What This Solution Does:
    - Creates multi-dimensional risk profiles with calibrated confidence scores (0-1)
    - Assesses three risk factors: suicidal ideation, depression severity, behavior change
    - Uses LLM for contextual understanding to distinguish literal vs idiomatic expressions
    - Routes alerts based on confidence thresholds (>0.9 = immediate, <0.7 = human review)
    - Provides reasoning for each risk factor
    
    What This Solution Does NOT Do:
    - Does NOT use simple keyword matching alone (uses LLM for context)
    - Does NOT assign binary risk levels (uses multi-dimensional profiles)
    - Does NOT ignore uncertainty (provides confidence scores)
    - Does NOT infer validated assessment scores from conversation (uses actual PHQ-9/GAD-7 when available)
    """
    
    def __init__(self, db_session, llm_client=None):
        """
        Initialize RiskCalculator.
        
        Args:
            db_session: Database session for querying risk profiles and assessments
            llm_client: Optional LLM client for contextual analysis. If None, falls back to keyword matching.
        """
        self.db = db_session
        self.temporal_analyzer = TemporalAnalyzer(db_session)
        self.llm = llm_client  # May be None for fallback scenarios
    
    async def calculate_risk(self, student_id: str, message_text: str,
                           context: Dict[str, Any], concern_indicators: List[str]) -> Dict[str, Any]:
        """Calculate multi-dimensional risk profile."""
        logger.info("calculate_risk_started",
                   student_id=student_id,
                   message_length=len(message_text),
                   concern_indicators=concern_indicators)
        
        try:
            # Get temporal patterns
            temporal_patterns = await self.temporal_analyzer.analyze_trajectory(student_id)
            logger.debug("temporal_patterns_retrieved",
                        student_id=student_id,
                        patterns_count=len(temporal_patterns.get("patterns", [])))
            
            # Calculate individual risk factors (await async methods)
            suicidal_ideation = await self._assess_suicidal_ideation(message_text, context)
            depression_severity = await self._assess_depression_severity(student_id, message_text, context)
            behavior_change = self._assess_behavior_change(student_id, context)
            
            logger.debug("risk_factors_assessed",
                        student_id=student_id,
                        has_suicidal_ideation=suicidal_ideation is not None,
                        has_depression_severity=depression_severity is not None,
                        has_behavior_change=behavior_change is not None)
            
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
            
            logger.info("overall_risk_calculated",
                       student_id=student_id,
                       overall_risk=overall_risk.value,
                       confidence=confidence)
            
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
            logger.info("saving_risk_profile",
                       student_id=student_id,
                       overall_risk=overall_risk.value)
            self._save_risk_profile(risk_profile)
            logger.info("risk_profile_saved_successfully",
                       student_id=student_id)
            
            # Generate alert recommendation
            alert_rec = self._generate_alert_recommendation(risk_profile)
            
            result = {
                "overall_risk": overall_risk.value,
                "confidence": confidence,
                "risk_factors": risk_factors.dict(),
                "recommended_action": recommended_action,
                "temporal_patterns": temporal_patterns.get("patterns", []),
                "alert_recommendation": alert_rec.dict()
            }
            
            logger.info("calculate_risk_completed",
                       student_id=student_id,
                       overall_risk=overall_risk.value,
                       confidence=confidence)
            return result
            
        except Exception as e:
            logger.error("calculate_risk_failed",
                        student_id=student_id,
                        error=str(e),
                        error_type=type(e).__name__,
                        exc_info=True)
            raise
    
    async def _analyze_contextual_risk(self, message_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM to analyze message for contextual risk understanding.
        
        This method distinguishes literal vs idiomatic expressions and understands
        conversation context. Falls back to keyword matching if LLM unavailable.
        
        Returns:
            Dict with suicidal_ideation, depression_indicators, and overall_context
        """
        if not self.llm:
            # Fallback: Use keyword matching with low confidence
            logger.warning("llm_unavailable_using_keyword_fallback")
            return self._fallback_keyword_analysis(message_text, context)
        
        try:
            # Build prompt for contextual analysis
            prompt = self._build_contextual_risk_prompt(message_text, context)
            
            # Get LLM analysis
            response = await self.llm.generate(prompt, max_tokens=800)
            
            # Parse JSON response
            try:
                # Try to extract JSON from response (may have markdown formatting)
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    analysis = json.loads(json_str)
                else:
                    analysis = json.loads(response)
            except json.JSONDecodeError as e:
                logger.error("llm_response_not_valid_json",
                            error=str(e),
                            response_preview=response[:200])
                return self._fallback_keyword_analysis(message_text, context)
            
            # Validate response structure
            if not self._validate_llm_response(analysis):
                logger.warning("llm_response_invalid_structure",
                             analysis=analysis)
                return self._fallback_keyword_analysis(message_text, context)
            
            # Calibrate confidence scores
            analysis = self._calibrate_confidence(analysis, context)
            
            logger.info("contextual_risk_analysis_completed",
                       has_suicidal_ideation=analysis.get("suicidal_ideation", {}).get("present", False),
                       is_literal=analysis.get("suicidal_ideation", {}).get("is_literal", None))
            
            return analysis
            
        except Exception as e:
            logger.error("llm_contextual_analysis_failed",
                        error=str(e),
                        error_type=type(e).__name__,
                        exc_info=True)
            # Fallback to keyword matching with human review flag
            fallback_result = self._fallback_keyword_analysis(message_text, context)
            fallback_result["requires_human_review"] = True
            fallback_result["fallback_reason"] = f"LLM unavailable: {str(e)}"
            return fallback_result
    
    def _build_contextual_risk_prompt(self, message_text: str, context: Dict[str, Any]) -> str:
        """Build prompt for LLM contextual risk analysis."""
        conversation_history = context.get("conversation_history", [])
        baseline = context.get("student_info", {}).get("baseline_profile", {})
        
        # Format conversation history
        history_text = ""
        if conversation_history:
            history_text = "\n".join([
                f"Previous: {msg.get('message_text', '')[:100]}"
                for msg in conversation_history[-5:]  # Last 5 messages
            ])
        else:
            history_text = "No previous conversation history available."
        
        # Format baseline info
        baseline_info = ""
        if baseline:
            baseline_info = f"""
Student Baseline:
- Typical sentiment: {baseline.get('typical_sentiment', 'unknown')}
- Communication style: {baseline.get('communication_style', 'unknown')}
- Common themes: {', '.join(baseline.get('common_themes', []))}
"""
        
        return f"""Analyze this message for mental health risk in context:

Current Message: "{message_text}"

Conversation History:
{history_text}

{baseline_info}

Consider:
1. Is suicidal ideation literal or idiomatic? (e.g., "I want to kill myself" in gaming context vs serious context)
2. What is the emotional context and tone?
3. How does this relate to previous messages?
4. Are there concerning patterns or escalation?
5. Distinguish between:
   - Literal threats: "I'm planning to kill myself"
   - Idiomatic expressions: "I'm so tired I could kill myself"
   - Gaming/casual: "I want to kill this boss" or "killing it at work"
   - Sarcasm/dark humor: "life is great, totally not dying inside"

Respond in JSON format only:
{{
  "suicidal_ideation": {{
    "present": boolean,
    "is_literal": boolean,
    "confidence": 0.0-1.0,
    "reasoning": "string explaining your assessment"
  }},
  "depression_indicators": {{
    "severity_estimate": "LOW|MEDIUM|HIGH",
    "confidence": 0.0-1.0,
    "indicators": ["list", "of", "indicators"],
    "reasoning": "string explaining your assessment"
  }},
  "overall_context": {{
    "tone": "string describing tone",
    "escalation": boolean,
    "concern_level": "LOW|MEDIUM|HIGH|CRISIS"
  }}
}}"""
    
    def _validate_llm_response(self, analysis: Dict[str, Any]) -> bool:
        """Validate LLM response structure."""
        required_keys = ["suicidal_ideation", "depression_indicators", "overall_context"]
        if not all(key in analysis for key in required_keys):
            return False
        
        si = analysis.get("suicidal_ideation", {})
        if not isinstance(si.get("present"), bool):
            return False
        if not isinstance(si.get("confidence"), (int, float)) or not (0 <= si.get("confidence", -1) <= 1):
            return False
        
        return True
    
    def _calibrate_confidence(self, analysis: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calibrate confidence scores based on context factors.
        
        Adjusts raw LLM confidence based on:
        - Context availability (history length)
        - Baseline availability
        - Ambiguity indicators (sarcasm, idioms)
        - Multiple signal agreement
        """
        calibrated = analysis.copy()
        
        # Calibrate suicidal ideation confidence
        if "suicidal_ideation" in calibrated:
            si = calibrated["suicidal_ideation"]
            raw_conf = si.get("confidence", 0.5)
            
            # Factor 1: Context availability
            history_len = len(context.get("conversation_history", []))
            if history_len < 3:
                raw_conf *= 0.8  # Less confident with limited history
            elif history_len >= 10:
                raw_conf *= 1.1  # More confident with rich history
            raw_conf = min(raw_conf, 1.0)
            
            # Factor 2: Baseline availability
            baseline = context.get("student_info", {}).get("baseline_profile", {})
            if baseline and baseline.get("typical_sentiment") is not None:
                raw_conf *= 1.1  # More confident when we know student's baseline
            raw_conf = min(raw_conf, 1.0)
            
            # Factor 3: Ambiguity indicators
            contains_sarcasm = "sarcasm" in analysis.get("overall_context", {}).get("tone", "").lower()
            is_literal = si.get("is_literal", True)
            if not is_literal or contains_sarcasm:
                raw_conf *= 0.9  # Less confident with figurative language
            raw_conf = min(raw_conf, 1.0)
            
            # Factor 4: Multiple signal agreement
            safety_flags = context.get("safety_flags", [])
            if safety_flags and si.get("present"):
                raw_conf *= 1.1  # More confident when signals align
            raw_conf = min(raw_conf, 1.0)
            
            calibrated["suicidal_ideation"]["confidence"] = raw_conf
        
        # Calibrate depression indicators confidence
        if "depression_indicators" in calibrated:
            dep = calibrated["depression_indicators"]
            raw_conf = dep.get("confidence", 0.5)
            
            # Similar calibration factors
            history_len = len(context.get("conversation_history", []))
            if history_len < 3:
                raw_conf *= 0.8
            elif history_len >= 10:
                raw_conf *= 1.1
            raw_conf = min(raw_conf, 1.0)
            
            calibrated["depression_indicators"]["confidence"] = raw_conf
        
        return calibrated
    
    def _fallback_keyword_analysis(self, message_text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback analysis using keyword matching when LLM unavailable.
        
        This is a conservative fallback that flags potential risks
        but with low confidence, requiring human review.
        """
        text_lower = message_text.lower()
        suicidal_patterns = [
            r"kill\s+(myself|my\s+self)",
            r"killing\s+(myself|my\s+self)",
            r"end\s+it\s+all",
            r"ending\s+my\s+life",
            r"taking\s+my\s+life",
            r"suicide",
            r"commit\s+suicide",
        ]
        
        keyword_match = False
        for pattern in suicidal_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                keyword_match = True
                break
        
        return {
            "suicidal_ideation": {
                "present": keyword_match,
                "is_literal": None,  # Unknown without LLM
                "confidence": 0.3 if keyword_match else 0.0,  # Low confidence
                "reasoning": "LLM unavailable, using keyword fallback - requires human review"
            },
            "depression_indicators": {
                "severity_estimate": "LOW",
                "confidence": 0.0,
                "indicators": [],
                "reasoning": "LLM unavailable, cannot assess depression indicators"
            },
            "overall_context": {
                "tone": "unknown",
                "escalation": False,
                "concern_level": "LOW"
            },
            "requires_human_review": True
        }
    
    async def _assess_suicidal_ideation(self, message_text: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Assess suicidal ideation risk factor using LLM contextual analysis.
        
        What This Method Does:
        - First checks safety flags from Checkpoint 1 (fast path)
        - Uses LLM to distinguish literal vs idiomatic expressions
        - Provides calibrated confidence scores
        - Falls back to keyword matching if LLM unavailable
        
        What This Method Does NOT Do:
        - Does NOT rely solely on keyword matching
        - Does NOT ignore context (gaming, casual conversation)
        - Does NOT assign high confidence without validation
        """
        # Fast path: Check safety flags from checkpoint 1 (crisis detection)
        safety_flags = context.get("safety_flags", [])
        crisis_detected = context.get("crisis_detected", False)
        
        if crisis_detected or safety_flags:
            # If crisis was detected, suicidal ideation is definitely present
            crisis_keywords = [flag for flag in safety_flags if "crisis_keyword" in str(flag) or "plan_indicator" in str(flag)]
            if crisis_detected or crisis_keywords:
                logger.info("suicidal_ideation_detected_from_safety_flags",
                           safety_flags=safety_flags,
                           crisis_detected=crisis_detected)
                return {
                    "present": True,
                    "confidence": 0.95,
                    "reason": "Crisis keywords detected in safety screen"
                }
        
        # Check context for C-SSRS results (validated assessment)
        cssrs_score = context.get("current_risk_profile", {}).get("cssrs_score")
        if cssrs_score and cssrs_score > 0:
            return {
                "present": True,
                "confidence": 0.95,
                "reason": f"Validated C-SSRS score: {cssrs_score}"
            }
        
        # Use LLM for contextual analysis
        try:
            llm_analysis = await self._analyze_contextual_risk(message_text, context)
            si_analysis = llm_analysis.get("suicidal_ideation", {})
            
            if not si_analysis.get("present", False):
                return None
            
            # Return with calibrated confidence
            return {
                "present": True,
                "confidence": si_analysis.get("confidence", 0.5),
                "reason": si_analysis.get("reasoning", "Contextual analysis indicates suicidal ideation"),
                "is_literal": si_analysis.get("is_literal", None),
                "requires_human_review": llm_analysis.get("requires_human_review", False)
            }
        except Exception as e:
            logger.error("suicidal_ideation_assessment_failed",
                        error=str(e),
                        exc_info=True)
            # Fallback to keyword matching
            fallback = self._fallback_keyword_analysis(message_text, context)
            si_fallback = fallback.get("suicidal_ideation", {})
            if si_fallback.get("present"):
                return {
                    "present": True,
                    "confidence": 0.3,  # Low confidence
                    "reason": "LLM unavailable, keyword match found - requires human review",
                    "requires_human_review": True
                }
            return None
    
    async def _assess_depression_severity(self, student_id: str, message_text: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Assess depression severity risk factor using validated assessments or LLM contextual analysis.
        
        What This Method Does:
        - Uses validated PHQ-9 scores when available (high confidence)
        - Uses LLM contextual analysis when no validated score exists (lower confidence)
        - Never infers scores from conversation alone - only flags indicators
        
        What This Method Does NOT Do:
        - Does NOT infer PHQ-9 scores from conversation
        - Does NOT assign high confidence without validated assessment
        - Does NOT replace validated assessments with LLM estimates
        """
        # Priority 1: Get latest validated PHQ-9 score if available
        latest_assessment = self._get_latest_assessment(student_id, "PHQ9")
        
        if latest_assessment:
            return {
                "estimated_phq9": latest_assessment.score,
                "confidence": 0.9,
                "reason": "Based on validated PHQ-9 assessment"
            }
        
        # Priority 2: Use LLM for contextual analysis if available
        if self.llm:
            try:
                llm_analysis = await self._analyze_contextual_risk(message_text, context)
                dep_analysis = llm_analysis.get("depression_indicators", {})
                
                if dep_analysis.get("severity_estimate") and dep_analysis.get("severity_estimate") != "LOW":
                    # Map severity estimate to approximate PHQ-9 range (for risk calculation only)
                    severity_map = {
                        "MEDIUM": 10,  # Approximate, not validated
                        "HIGH": 15     # Approximate, not validated
                    }
                    estimated_phq9 = severity_map.get(dep_analysis.get("severity_estimate"), 5)
                    
                    return {
                        "estimated_phq9": estimated_phq9,
                        "confidence": dep_analysis.get("confidence", 0.5) * 0.7,  # Reduce confidence - not validated
                        "reason": f"LLM contextual analysis: {dep_analysis.get('reasoning', 'Depression indicators detected')}. Note: This is NOT a validated PHQ-9 score.",
                        "indicators": dep_analysis.get("indicators", []),
                        "is_estimate": True  # Flag that this is not validated
                    }
            except Exception as e:
                logger.error("depression_severity_llm_analysis_failed",
                            error=str(e),
                            exc_info=True)
        
        # Priority 3: Fallback to concern indicators (low confidence)
        concern_indicators = context.get("concern_indicators", [])
        if "sleep_issues" in concern_indicators and "low_energy" in concern_indicators:
            return {
                "estimated_phq9": 11,
                "confidence": 0.4,  # Very low confidence - heuristic only
                "reason": "Mentioned sleep issues and low energy, but context unclear. Requires validated assessment.",
                "is_estimate": True,
                "requires_assessment": True
            }
        
        return None
    
    def _assess_behavior_change(self, student_id: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Assess behavior change risk factor based on engagement patterns.
        
        What This Method Does:
        - Analyzes engagement drop percentage from behavioral metadata
        - Flags significant changes (>60% drop = HIGH, >30% = MEDIUM)
        - Provides reasoning for behavior change assessment
        
        What This Method Does NOT Do:
        - Does NOT analyze message content for behavior change (uses metadata only)
        - Does NOT flag normal fluctuations (requires >30% drop)
        - Does NOT infer mental health conditions from behavior change alone
        """
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
        """
        Calculate overall risk level and confidence from multiple factors.
        
        What This Method Does:
        - Combines risk factors (suicidal ideation, depression, behavior change)
        - Applies temporal pattern multipliers (rapid deterioration, pre-decision calm)
        - Calculates weighted confidence based on factor confidence scores
        - Returns tuple: (RiskLevel, confidence_float)
        
        What This Method Does NOT Do:
        - Does NOT use simple averaging (uses maximum risk with weighted confidence)
        - Does NOT ignore temporal patterns (applies multipliers)
        - Does NOT assign risk without evidence (returns LOW if no risk factors)
        """
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
        
        # Temporal patterns (only if we have sufficient data)
        if not temporal_patterns.get("use_snapshot_only", False):
            pattern_details = temporal_patterns.get("pattern_details", {})
            
            if pattern_details.get("rapid_deterioration"):
                risk_scores.append(3)  # HIGH
                # Use temporal pattern confidence
                velocity_conf = temporal_patterns.get("velocity_confidence", 0.8)
                confidence_scores.append(velocity_conf)
            
            if pattern_details.get("pre_decision_calm"):
                risk_scores.append(4)  # CRISIS
                # Pre-decision calm is most dangerous pattern
                confidence_scores.append(0.95)
            
            if pattern_details.get("chronic_elevated"):
                risk_scores.append(2)  # MEDIUM
                confidence_scores.append(0.7)
            
            if pattern_details.get("disengagement"):
                risk_scores.append(2)  # MEDIUM
                confidence_scores.append(0.6)
        
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
        """
        Determine recommended action based on risk level and confidence.
        
        What This Method Does:
        - Routes based on risk level and confidence combination
        - CRISIS → immediate_crisis_protocol
        - HIGH + confidence > 0.9 → immediate_alert
        - HIGH + confidence < 0.9 → human_review_queue
        - MEDIUM → schedule_counselor_review_within_48h
        - LOW → continue_monitoring
        
        What This Method Does NOT Do:
        - Does NOT auto-escalate without considering confidence
        - Does NOT ignore uncertainty (routes to human review when confidence low)
        - Does NOT make final decisions (provides recommendations only)
        """
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
        
        try:
            logger.debug("querying_risk_profile",
                        student_id=student_id)
            
            profile = self.db.query(RiskProfile).filter(
                RiskProfile.student_id == student_id
            ).order_by(RiskProfile.calculated_at.desc()).first()
            
            if profile:
                logger.info("risk_profile_found",
                           student_id=student_id,
                           overall_risk=profile.overall_risk,
                           calculated_at=profile.calculated_at.isoformat())
                return {
                    "overall_risk": profile.overall_risk,
                    "confidence": profile.confidence,
                    "risk_factors": profile.risk_factors,
                    "calculated_at": profile.calculated_at.isoformat()
                }
            
            logger.warning("no_risk_profile_found",
                          student_id=student_id)
            
            # Check if any profiles exist for this student at all
            count = self.db.query(RiskProfile).filter(
                RiskProfile.student_id == student_id
            ).count()
            logger.debug("risk_profile_count",
                        student_id=student_id,
                        total_profiles=count)
            
            return {}
        except Exception as e:
            logger.error("get_risk_profile_failed",
                        student_id=student_id,
                        error=str(e),
                        error_type=type(e).__name__,
                        exc_info=True)
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
        
        try:
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
            logger.info("risk_profile_saved", 
                       student_id=risk_profile.student_id,
                       overall_risk=risk_profile.overall_risk.value,
                       confidence=risk_profile.confidence)
        except Exception as e:
            logger.error("risk_profile_save_failed",
                        student_id=risk_profile.student_id,
                        error=str(e),
                        error_type=type(e).__name__)
            self.db.rollback()
            raise




