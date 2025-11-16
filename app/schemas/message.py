"""Message processing schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class Message(BaseModel):
    """Incoming message from student."""
    student_id: str
    message_text: str
    session_id: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None


class CheckpointResult(BaseModel):
    """Result from a processing checkpoint."""
    checkpoint_name: str
    passed: bool
    result: Dict[str, Any]
    processing_time_ms: int
    timestamp: datetime


class MessageAnalysis(BaseModel):
    """Complete message analysis."""
    student_id: str
    message_id: str
    message_text: str
    
    # Checkpoint results
    checkpoint_results: List[CheckpointResult]
    
    # Analysis results
    emoji_analysis: Optional[Dict[str, Any]] = None
    concern_indicators: List[str] = []
    safety_flags: List[str] = []
    
    # Risk assessment
    risk_profile: Optional[Dict[str, Any]] = None
    
    # Response handling
    response_generated: bool
    response_text: Optional[str] = None
    crisis_protocol_triggered: bool = False


class EmojiAnalysis(BaseModel):
    """Emoji interpretation result."""
    genuine_distress: bool
    confidence: float
    reasoning: str
    emoji_function: str  # "humor", "emphasis", "literal", "ambiguous"
    emoji_context: Dict[str, Any]

