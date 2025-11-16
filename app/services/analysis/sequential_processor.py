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
        self.risk_calculator = RiskCalculator(db_session)
    
    async def process_message(self, message: Message) -> MessageAnalysis:
        """Process message through sequential checkpoints."""
        checkpoint_results = []
        start_time = time.time()
        
        # CHECKPOINT 1: Immediate Safety Screen
        checkpoint1_result = await self._checkpoint_1_safety_screen(message)
        checkpoint_results.append(checkpoint1_result)
        
        if not checkpoint1_result["passed"]:
            # Crisis protocol - halt processing
            logger.warning("crisis_protocol_triggered",
                          student_id=message.student_id,
                          reason=checkpoint1_result["result"].get("reason"))
            return self._create_crisis_response(message, checkpoint_results)
        
        # CHECKPOINT 2: Context Enrichment
        checkpoint2_result = await self._checkpoint_2_context_enrichment(message)
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
        
        # Log for auditing
        self._log_processing(message, analysis, total_time)
        
        return analysis
    
    async def _checkpoint_1_safety_screen(self, message: Message) -> Dict[str, Any]:
        """Checkpoint 1: Immediate safety screen (~10ms)."""
        start = time.time()
        
        result = self.safety_screener.screen_immediate(message.message_text)
        
        time_ms = int((time.time() - start) * 1000)
        
        return {
            "name": "IMMEDIATE_SAFETY_SCREEN",
            "passed": not result.get("crisis_detected", False),
            "result": result,
            "time_ms": time_ms
        }
    
    async def _checkpoint_2_context_enrichment(self, message: Message) -> Dict[str, Any]:
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
        
        time_ms = int((time.time() - start) * 1000)
        
        return {
            "name": "CONTEXT_ENRICHMENT",
            "passed": True,
            "result": {"context": context},
            "time_ms": time_ms
        }
    
    async def _checkpoint_3_llm_generation(self, message: Message, context: Dict[str, Any]) -> Dict[str, Any]:
        """Checkpoint 3: LLM generation with safety constraints (~1-2s)."""
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
        """Checkpoint 4: Deep analysis (async, ~2-5s)."""
        start = time.time()
        
        # Run NLP pipeline
        emoji_analysis = await self.emoji_analyzer.analyze(message.student_id, message.message_text, context)
        
        # Extract concern indicators
        concern_indicators = self._extract_concern_indicators(message, context, emoji_analysis)
        
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
        """Checkpoint 5: Response gating."""
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

Response (be warm, empathetic, and use their name {student_name} naturally):
"""
    
    def _extract_concern_indicators(self, message: Message, context: Dict[str, Any], 
                                   emoji_analysis: Dict[str, Any]) -> List[str]:
        """Extract concern indicators from analysis."""
        indicators = []
        
        if emoji_analysis.get("genuine_distress"):
            indicators.append("genuine_distress_emoji")
        
        # Add more indicator extraction logic
        return indicators
    
    def _create_crisis_response(self, message: Message, checkpoint_results: List[Dict]) -> MessageAnalysis:
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
            crisis_protocol_triggered=True
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




