"""Solution 3: Sequential Analysis Architecture."""
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.schemas.message import Message, CheckpointResult, MessageAnalysis
from app.services.analysis.emoji_analyzer import EmojiAnalyzer
from app.services.analysis.safety_screener import SafetyScreener
from app.services.alerts.risk_calculator import RiskCalculator
import structlog

logger = structlog.get_logger()


class SequentialProcessor:
    """Sequential checkpoint-based message processor."""
    
    def __init__(self, db_session, llm_client):
        self.db = db_session
        self.llm = llm_client
        self.safety_screener = SafetyScreener()
        self.emoji_analyzer = EmojiAnalyzer(llm_client, db_session)
        # Pass LLM client to RiskCalculator for contextual analysis
        self.risk_calculator = RiskCalculator(db_session, llm_client)
    
    async def process_message(self, message: Message) -> MessageAnalysis:
        """Process message through sequential checkpoints."""
        checkpoint_results = []
        start_time = time.time()
        
        # CHECKPOINT 1: Immediate Safety Screen
        checkpoint1_result = await self._checkpoint_1_safety_screen(message)
        checkpoint_results.append(checkpoint1_result)
        
        if not checkpoint1_result["passed"]:
            # Crisis protocol - but still calculate risk profile
            logger.warning("crisis_protocol_triggered",
                          student_id=message.student_id,
                          reason=checkpoint1_result["result"].get("reason"))
            
            # Still enrich context and calculate risk even for crisis
            checkpoint2_result = await self._checkpoint_2_context_enrichment(message, checkpoint1_result)
            checkpoint_results.append(checkpoint2_result)
            context = checkpoint2_result["result"]["context"]
            
            # Calculate risk profile even in crisis
            concern_indicators = ["crisis_detected"]
            risk_profile = None
            try:
                logger.info("calculating_risk_for_crisis",
                           student_id=message.student_id,
                           message_preview=message.message_text[:50],
                           safety_flags=context.get("safety_flags", []))
                risk_profile = await self.risk_calculator.calculate_risk(
                    message.student_id,
                    message.message_text,
                    context,
                    concern_indicators
                )
                logger.info("risk_profile_calculated",
                           student_id=message.student_id,
                           overall_risk=risk_profile.get("overall_risk"),
                           confidence=risk_profile.get("confidence"))
            except Exception as e:
                logger.error("risk_calculation_failed_in_crisis",
                            student_id=message.student_id,
                            error=str(e),
                            error_type=type(e).__name__,
                            exc_info=True)
                # Continue without risk profile rather than failing completely
            
            # Create crisis response with risk profile
            return self._create_crisis_response(message, checkpoint_results, risk_profile)
        
        # CHECKPOINT 2: Context Enrichment
        checkpoint2_result = await self._checkpoint_2_context_enrichment(message, checkpoint1_result)
        checkpoint_results.append(checkpoint2_result)
        context = checkpoint2_result["result"]["context"]
        
        # CHECKPOINT 3: LLM Generation with Safety Constraints
        checkpoint3_result = await self._checkpoint_3_llm_generation(message, context)
        checkpoint_results.append(checkpoint3_result)
        llm_response = checkpoint3_result["result"].get("response")
        
        # CHECKPOINT 4: Deep Analysis (Async)
        checkpoint4_result = await self._checkpoint_4_deep_analysis(message, context)
        checkpoint_results.append(checkpoint4_result)
        deep_analysis = checkpoint4_result["result"]
        
        # CHECKPOINT 5: Response Gating
        checkpoint5_result = await self._checkpoint_5_response_gating(
            message, llm_response, deep_analysis
        )
        checkpoint_results.append(checkpoint5_result)
        
        # Build final analysis
        total_time = int((time.time() - start_time) * 1000)
        
        analysis = MessageAnalysis(
            student_id=message.student_id,
            message_id=f"{message.student_id}_{int(time.time())}",
            message_text=message.message_text,
            checkpoint_results=[
                CheckpointResult(
                    checkpoint_name=cp["name"],
                    passed=cp["passed"],
                    result=cp["result"],
                    processing_time_ms=cp["time_ms"],
                    timestamp=datetime.utcnow()
                )
                for cp in checkpoint_results
            ],
            emoji_analysis=deep_analysis.get("emoji_analysis"),
            concern_indicators=deep_analysis.get("concern_indicators", []),
            safety_flags=checkpoint1_result["result"].get("flags", []),
            risk_profile=deep_analysis.get("risk_profile"),
            response_generated=checkpoint5_result["result"].get("response_sent", False),
            response_text=checkpoint5_result["result"].get("final_response"),
            crisis_protocol_triggered=checkpoint5_result["result"].get("crisis_triggered", False)
        )
        
        # Save messages to session
        self._save_to_session(message, analysis)
        
        # Log for auditing
        self._log_processing(message, analysis, total_time)
        
        return analysis
    
    async def _checkpoint_1_safety_screen(self, message: Message) -> Dict[str, Any]:
        """
        Checkpoint 1: Immediate safety screen (~10ms).
        
        What This Checkpoint Does:
        - Fast keyword detection for explicit crisis indicators
        - Halts all processing if crisis detected
        - Provides safety flags for downstream analysis
        
        What This Checkpoint Does NOT Do:
        - Does NOT use LLM (too slow for immediate screen)
        - Does NOT skip risk calculation (even if crisis, still calculates risk)
        - Does NOT analyze context (that's Checkpoint 4)
        """
        start = time.time()
        
        result = self.safety_screener.screen_immediate(message.message_text)
        
        time_ms = int((time.time() - start) * 1000)
        
        return {
            "name": "IMMEDIATE_SAFETY_SCREEN",
            "passed": not result.get("crisis_detected", False),
            "result": result,
            "time_ms": time_ms
        }
    
    async def _checkpoint_2_context_enrichment(self, message: Message, checkpoint1_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Checkpoint 2: Context enrichment (~50ms)."""
        start = time.time()
        
        # Get student information
        student_info = self._get_student_info(message.student_id)
        
        # Pull conversation history
        conversation_history = self._get_conversation_history(message.student_id, limit=10)
        
        # Pull behavioral metadata
        behavioral_metadata = self._get_behavioral_metadata(message.student_id)
        
        # Pull current risk profile
        current_risk = self.risk_calculator.get_current_risk_profile(message.student_id)
        
        context = {
            "student_info": student_info,
            "conversation_history": conversation_history,
            "behavioral_metadata": behavioral_metadata,
            "current_risk_profile": current_risk,
            "message_metadata": message.metadata or {}
        }
        
        # Add safety flags from checkpoint 1 if available
        if checkpoint1_result:
            context["safety_flags"] = checkpoint1_result.get("result", {}).get("flags", [])
            context["crisis_detected"] = checkpoint1_result.get("result", {}).get("crisis_detected", False)
        
        time_ms = int((time.time() - start) * 1000)
        
        return {
            "name": "CONTEXT_ENRICHMENT",
            "passed": True,
            "result": {"context": context},
            "time_ms": time_ms
        }
    
    async def _checkpoint_3_llm_generation(self, message: Message, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Checkpoint 3: LLM generation with safety constraints (~1-2s).
        
        What This Checkpoint Does:
        - Generates empathetic response using LLM
        - Embeds safety rules in prompt
        - Filters response for safety (removes medical advice, etc.)
        - Holds response in buffer (not sent yet)
        
        What This Checkpoint Does NOT Do:
        - Does NOT send response immediately (waits for Checkpoint 5)
        - Does NOT ignore safety constraints
        - Does NOT replace human counselors
        """
        start = time.time()
        
        # Build prompt with safety rules embedded
        prompt = self._build_safe_prompt(message, context)
        
        # Generate response
        try:
            response = await self.llm.generate(prompt)
            
            # Run output through content filter
            filtered_response = self.safety_screener.filter_response(response)
            
            time_ms = int((time.time() - start) * 1000)
            
            return {
                "name": "LLM_GENERATION",
                "passed": True,
                "result": {
                    "response": filtered_response,
                    "original_response": response
                },
                "time_ms": time_ms
            }
        except Exception as e:
            logger.error("llm_generation_failed", error=str(e))
            time_ms = int((time.time() - start) * 1000)
            return {
                "name": "LLM_GENERATION",
                "passed": False,
                "result": {"error": str(e)},
                "time_ms": time_ms
            }
    
    async def _checkpoint_4_deep_analysis(self, message: Message, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Checkpoint 4: Deep analysis (async, ~2-5s).
        
        What This Checkpoint Does:
        - Runs full NLP pipeline (emoji analysis, concern indicators, risk calculation)
        - Uses LLM for contextual risk understanding
        - Calculates multi-dimensional risk profile
        - Extracts concern indicators (language shifts, hopelessness)
        
        What This Checkpoint Does NOT Do:
        - Does NOT send response (that's Checkpoint 5)
        - Does NOT skip analysis for crisis cases
        - Does NOT use keyword matching alone (uses LLM for context)
        """
        start = time.time()
        
        # Run NLP pipeline
        emoji_analysis = await self.emoji_analyzer.analyze(message.student_id, message.message_text, context)
        
        # Extract concern indicators (await async method)
        concern_indicators = await self._extract_concern_indicators(message, context, emoji_analysis)
        
        # Update risk profile
        risk_profile = await self.risk_calculator.calculate_risk(
            message.student_id,
            message.message_text,
            context,
            concern_indicators
        )
        
        time_ms = int((time.time() - start) * 1000)
        
        return {
            "name": "DEEP_ANALYSIS",
            "passed": True,
            "result": {
                "emoji_analysis": emoji_analysis,
                "concern_indicators": concern_indicators,
                "risk_profile": risk_profile
            },
            "time_ms": time_ms
        }
    
    async def _checkpoint_5_response_gating(self, message: Message, 
                                           llm_response: Optional[str],
                                           deep_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Checkpoint 5: Response gating based on risk level.
        
        What This Checkpoint Does:
        - Routes response based on risk profile from Checkpoint 4
        - CRISIS or HIGH + confidence > 0.9 → Discard LLM response, send crisis protocol
        - MEDIUM or HIGH + confidence < 0.9 → Append counseling suggestion
        - LOW → Send LLM response as-is
        - Logs all decisions for audit
        
        What This Checkpoint Does NOT Do:
        - Does NOT send response before analysis completes
        - Does NOT ignore risk profile
        - Does NOT send inappropriate responses for high-risk cases
        """
        start = time.time()
        
        risk_profile = deep_analysis.get("risk_profile", {})
        overall_risk = risk_profile.get("overall_risk", "LOW")
        confidence = risk_profile.get("confidence", 0.0)
        
        final_response = None
        response_sent = False
        crisis_triggered = False
        
        if overall_risk == "CRISIS" or (overall_risk == "HIGH" and confidence > 0.9):
            # Discard LLM response, send crisis protocol
            final_response = self._get_crisis_protocol_message()
            crisis_triggered = True
            response_sent = True
        elif overall_risk == "MEDIUM" or (overall_risk == "HIGH" and confidence < 0.9):
            # Append counseling suggestion
            counseling_note = "\n\nI'm here to support you. Would you like me to connect you with a counselor?"
            final_response = (llm_response or "") + counseling_note
            response_sent = True
        else:
            # Send LLM response as-is
            final_response = llm_response
            response_sent = True
        
        time_ms = int((time.time() - start) * 1000)
        
        return {
            "name": "RESPONSE_GATING",
            "passed": True,
            "result": {
                "final_response": final_response,
                "response_sent": response_sent,
                "crisis_triggered": crisis_triggered,
                "gating_decision": overall_risk
            },
            "time_ms": time_ms
        }
    
    def _get_conversation_history(self, student_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history."""
        from app.models.analysis import MessageAnalysis as MessageAnalysisModel
        
        # Get recent message analyses for this student
        analyses = self.db.query(MessageAnalysisModel).filter(
            MessageAnalysisModel.student_id == student_id
        ).order_by(MessageAnalysisModel.created_at.desc()).limit(limit).all()
        
        # Return in chronological order (oldest first)
        history = []
        for analysis in reversed(analyses):
            # Extract response from checkpoint_results
            response_text = None
            if analysis.checkpoint_results:
                for checkpoint in analysis.checkpoint_results:
                    if isinstance(checkpoint, dict):
                        if checkpoint.get("name") == "LLM_GENERATION":
                            result = checkpoint.get("result", {})
                            response_text = result.get("response") or result.get("original_response")
                            break
                    elif hasattr(checkpoint, "checkpoint_name") and checkpoint.checkpoint_name == "LLM_GENERATION":
                        result = checkpoint.result if hasattr(checkpoint, "result") else {}
                        if isinstance(result, dict):
                            response_text = result.get("response") or result.get("original_response")
                            break
            
            history.append({
                "message_text": analysis.message_text,
                "response_text": response_text,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None
            })
        
        return history
    
    def _get_student_info(self, student_id: str) -> Dict[str, Any]:
        """Get student information from database."""
        from app.models.student import Student
        
        student = self.db.query(Student).filter(
            Student.student_id == student_id
        ).first()
        
        if student:
            return {
                "student_id": student.student_id,
                "name": student.name or "",
                "email": student.email or "",
                "session_count": student.session_count or 0,
                "baseline_profile": student.baseline_profile or {}
            }
        
        return {
            "student_id": student_id,
            "name": "",
            "email": "",
            "session_count": 0,
            "baseline_profile": {}
        }
    
    def _get_behavioral_metadata(self, student_id: str) -> Dict[str, Any]:
        """Get behavioral metadata."""
        # Implementation would calculate engagement patterns, time-of-day, etc.
        return {}
    
    def _build_safe_prompt(self, message: Message, context: Dict[str, Any]) -> str:
        """Build prompt with embedded safety rules."""
        student_info = context.get('student_info', {})
        student_name = student_info.get('name', 'there')
        student_email = student_info.get('email', '')
        
        # Build personalized greeting
        if student_name and student_name != 'there':
            greeting = f"Hello {student_name}! "
        else:
            greeting = "Hello! "
        
        # Get conversation history for context
        conversation_history = context.get('conversation_history', [])
        history_text = ""
        if conversation_history:
            history_text = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                history_text += f"- {msg.get('message_text', '')}\n"
        
        return f"""
You are a supportive mental health assistant. Respond to the student's message with empathy and care.

STUDENT INFORMATION:
- Name: {student_name if student_name else 'Not provided'}
- Email: {student_email if student_email else 'Not provided'}

SAFETY RULES:
- Never provide medical advice
- If student mentions self-harm, immediately acknowledge and provide crisis resources
- Maintain professional boundaries
- Focus on validation and support
- Use the student's name ({student_name}) when appropriate to personalize your response

{history_text}

Student message: {message.message_text}

IMPORTANT: Provide ONLY your response to the student. Do NOT include any reasoning, evidence, context, interpretation, uncertainty, or analysis sections. Just provide a warm, empathetic response directly to the student.

Response (be warm, empathetic, and use their name {student_name} naturally):
"""
    
    async def _extract_concern_indicators(self, message: Message, context: Dict[str, Any], 
                                         emoji_analysis: Dict[str, Any]) -> List[str]:
        """
        Extract concern indicators using LLM for contextual understanding.
        
        What This Method Does:
        - Detects language shifts from student's baseline
        - Identifies hopelessness themes in conversation
        - Analyzes engagement patterns
        - Uses LLM for contextual understanding
        
        What This Method Does NOT Do:
        - Does NOT assign risk scores (only flags indicators)
        - Does NOT replace validated assessments
        - Does NOT ignore baseline context
        """
        indicators = []
        
        # Check emoji analysis
        if emoji_analysis.get("genuine_distress"):
            indicators.append("genuine_distress_emoji")
        
        # Use LLM to detect language shifts and hopelessness themes
        if self.llm:
            try:
                llm_indicators = await self._analyze_concern_indicators(message, context)
                indicators.extend(llm_indicators)
            except Exception as e:
                logger.error("concern_indicators_llm_analysis_failed",
                            error=str(e),
                            exc_info=True)
                # Fallback to basic heuristics
                indicators.extend(self._fallback_concern_indicators(message, context))
        else:
            # Fallback to basic heuristics if LLM unavailable
            indicators.extend(self._fallback_concern_indicators(message, context))
        
        return indicators
    
    async def _analyze_concern_indicators(self, message: Message, context: Dict[str, Any]) -> List[str]:
        """Use LLM to analyze concern indicators like language shifts and hopelessness."""
        baseline = context.get("student_info", {}).get("baseline_profile", {})
        conversation_history = context.get("conversation_history", [])
        
        # Build prompt for concern indicator analysis
        baseline_info = ""
        if baseline:
            baseline_info = f"""
Student Baseline:
- Typical sentiment: {baseline.get('typical_sentiment', 'unknown')}
- Communication style: {baseline.get('communication_style', 'unknown')}
- Typical message length: {baseline.get('avg_message_length', 'unknown')}
- Common themes: {', '.join(baseline.get('common_themes', []))}
"""
        
        history_text = ""
        if conversation_history:
            history_text = "\n".join([
                f"Previous: {msg.get('message_text', '')[:100]}"
                for msg in conversation_history[-5:]
            ])
        
        prompt = f"""Analyze this message for concern indicators:

Current Message: "{message.message_text}"

Conversation History:
{history_text}

{baseline_info}

Identify if any of these concern indicators are present:
1. Language shift: Significant change in communication style, tone, or vocabulary from baseline
2. Hopelessness themes: Expressions of hopelessness, worthlessness, or no future
3. Engagement drop: Decreased participation or disengagement
4. Sudden mood change: Abrupt shift in emotional tone

Respond in JSON format:
{{
  "language_shift_detected": boolean,
  "hopelessness_themes": boolean,
  "engagement_drop": boolean,
  "sudden_mood_change": boolean,
  "reasoning": "string explaining detected indicators"
}}"""
        
        try:
            response = await self.llm.generate(prompt, max_tokens=400)
            
            # Parse JSON
            import json
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                analysis = json.loads(response[json_start:json_end])
            else:
                analysis = json.loads(response)
            
            # Convert to indicator list
            indicators = []
            if analysis.get("language_shift_detected"):
                indicators.append("sudden_language_shift")
            if analysis.get("hopelessness_themes"):
                indicators.append("hopelessness_themes")
            if analysis.get("engagement_drop"):
                indicators.append("significant_engagement_drop")
            if analysis.get("sudden_mood_change"):
                indicators.append("sudden_mood_change")
            
            logger.info("concern_indicators_analyzed",
                       student_id=message.student_id,
                       indicators=indicators)
            
            return indicators
            
        except Exception as e:
            logger.error("concern_indicators_llm_failed",
                        error=str(e),
                        exc_info=True)
            return []
    
    def _fallback_concern_indicators(self, message: Message, context: Dict[str, Any]) -> List[str]:
        """Fallback concern indicator detection using heuristics."""
        indicators = []
        
        # Basic keyword checks for hopelessness
        message_lower = message.message_text.lower()
        hopelessness_keywords = [
            "hopeless", "worthless", "no point", "no future", "nothing matters",
            "can't go on", "give up", "no reason to live"
        ]
        
        if any(keyword in message_lower for keyword in hopelessness_keywords):
            indicators.append("hopelessness_themes")
        
        # Check behavioral metadata for engagement drop
        behavioral_metadata = context.get("behavioral_metadata", {})
        engagement_drop = behavioral_metadata.get("engagement_drop_percentage", 0)
        if engagement_drop > 0.5:
            indicators.append("significant_engagement_drop")
        
        return indicators
    
    def _create_crisis_response(self, message: Message, checkpoint_results: List[Dict], risk_profile: Optional[Dict[str, Any]] = None) -> MessageAnalysis:
        """Create crisis protocol response."""
        return MessageAnalysis(
            student_id=message.student_id,
            message_id=f"{message.student_id}_{int(time.time())}",
            message_text=message.message_text,
            checkpoint_results=[
                CheckpointResult(
                    checkpoint_name=cp["name"],
                    passed=cp["passed"],
                    result=cp["result"],
                    processing_time_ms=cp["time_ms"],
                    timestamp=datetime.utcnow()
                )
                for cp in checkpoint_results
            ],
            response_generated=True,
            response_text=self._get_crisis_protocol_message(),
            crisis_protocol_triggered=True,
            risk_profile=risk_profile
        )
    
    def _get_crisis_protocol_message(self) -> str:
        """Get crisis protocol message."""
        return """I'm concerned about your safety. Please reach out for immediate help:

Crisis Text Line: Text HOME to 741741
National Suicide Prevention Lifeline: 988
Campus Counseling: [CAMPUS_NUMBER]

I'm here to support you, and professional help is available right now."""
    
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
    
    def _log_processing(self, message: Message, analysis: MessageAnalysis, total_time: int):
        """Log processing for auditing."""
        from app.models.analysis import MessageAnalysis as MessageAnalysisModel
        
        # Ensure student exists before saving analysis
        self._ensure_student_exists(message.student_id)
        
        # Convert checkpoint results - handle both Pydantic v1 and v2
        checkpoint_data = []
        for cp in analysis.checkpoint_results:
            if hasattr(cp, 'model_dump'):
                # Pydantic v2
                cp_dict = cp.model_dump(mode='json')
            else:
                # Pydantic v1
                cp_dict = cp.dict()
                # Convert datetime to ISO string
                if 'timestamp' in cp_dict:
                    if isinstance(cp_dict['timestamp'], datetime):
                        cp_dict['timestamp'] = cp_dict['timestamp'].isoformat()
                # Also check nested result dict for datetime objects
                if 'result' in cp_dict and isinstance(cp_dict['result'], dict):
                    for key, value in cp_dict['result'].items():
                        if isinstance(value, datetime):
                            cp_dict['result'][key] = value.isoformat()
            checkpoint_data.append(cp_dict)
        
        db_analysis = MessageAnalysisModel(
            student_id=message.student_id,
            message_id=analysis.message_id,
            message_text=message.message_text,
            emoji_analysis=analysis.emoji_analysis,
            concern_indicators=analysis.concern_indicators,
            safety_flags=analysis.safety_flags,
            checkpoint_results=checkpoint_data,
            processing_time_ms=total_time
        )
        
        self.db.add(db_analysis)
        self.db.commit()
    
    def _get_or_create_session(self, student_id: str, session_id: Optional[int] = None):
        """Get existing session or create a new one."""
        from app.models.student import Student, Session
        
        student = self.db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            self._ensure_student_exists(student_id)
            student = self.db.query(Student).filter(Student.student_id == student_id).first()
        
        # If session_id provided, try to get that session
        if session_id:
            session = self.db.query(Session).filter(
                Session.id == session_id,
                Session.student_id == student_id
            ).first()
            if session:
                return session
        
        # Only reuse today's session if session_id was explicitly None (continuing conversation)
        # If session_id is None and we want a new chat, always create a new session
        # For now, always create a new session when session_id is None to allow multiple chats per day
        # Create new session
        student.session_count = (student.session_count or 0) + 1
        new_session = Session(
            student_id=student_id,
            session_number=student.session_count,
            messages=[],
            session_metadata={}
        )
        self.db.add(new_session)
        self.db.commit()
        self.db.refresh(new_session)
        return new_session
    
    def _save_to_session(self, message: Message, analysis: MessageAnalysis):
        """Save user message and AI response to session."""
        from app.models.student import Session
        
        session = self._get_or_create_session(message.student_id, message.session_id)
        
        # Get current messages list
        messages = session.messages if session.messages else []
        
        # Add user message (use millisecond precision to avoid duplicate IDs)
        timestamp_ms = int(time.time() * 1000)
        user_msg = {
            "id": f"user_{timestamp_ms}",
            "content": message.message_text,
            "sender": "user",
            "timestamp": message.timestamp.isoformat() if hasattr(message.timestamp, 'isoformat') else datetime.utcnow().isoformat()
        }
        messages.append(user_msg)
        
        # Add AI response if available
        if analysis.response_text:
            ai_timestamp_ms = int(time.time() * 1000) + 1  # Ensure unique ID
            ai_msg = {
                "id": f"haven_{ai_timestamp_ms}",
                "content": analysis.response_text,
                "sender": "haven",
                "timestamp": datetime.utcnow().isoformat()
            }
            messages.append(ai_msg)
        
        # Update session
        session.messages = messages
        self.db.commit()
        self.db.refresh(session)  # Refresh to ensure changes are persisted
        logger.info("messages_saved_to_session",
                   student_id=message.student_id,
                   session_id=session.id,
                   message_count=len(messages))




