"""Solution 5: Contextual Emoji Understanding."""
from typing import Dict, Any, Optional
from app.schemas.message import EmojiAnalysis
import json
import structlog

logger = structlog.get_logger()


class EmojiAnalyzer:
    """LLM-based emoji interpretation with personal baselines."""
    
    def __init__(self, llm_client, db_session):
        self.llm = llm_client
        self.db = db_session
    
    async def analyze(self, student_id: str, message_text: str, 
                     context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze emoji usage in message."""
        # Get student's emoji baseline
        baseline = self._get_emoji_baseline(student_id)
        
        # Build prompt for LLM analysis
        prompt = self._build_emoji_analysis_prompt(message_text, baseline, context)
        
        try:
            # Get LLM analysis
            response = await self.llm.generate(prompt)
            
            # Parse JSON response
            analysis = json.loads(response)
            
            # Update baseline if needed
            self._update_baseline(student_id, message_text, analysis)
            
            return analysis
        except Exception as e:
            logger.error("emoji_analysis_failed", error=str(e))
            return {
                "genuine_distress": False,
                "confidence": 0.0,
                "reasoning": "Analysis failed",
                "emoji_function": "ambiguous"
            }
    
    def _build_emoji_analysis_prompt(self, message_text: str, baseline: Dict[str, Any],
                                    context: Dict[str, Any]) -> str:
        """Build prompt for emoji analysis."""
        baseline_info = ""
        if baseline:
            baseline_info = f"""
Student's typical emoji patterns:
- Uses emojis {baseline.get('frequency', 'moderately')}
- Common emojis: {', '.join(baseline.get('common_emojis', []))}
- Typical function: {baseline.get('typical_function', 'unknown')}
"""
        
        return f"""
Analyze this message for genuine distress vs. casual expression:

Message: "{message_text}"

{baseline_info}

Consider:
1. The emoji's typical usage in this demographic (college students, 2025)
2. The relationship between emoji and text content
3. Whether the emoji amplifies, contradicts, or softens the text
4. How this compares to the student's personal baseline

Respond in JSON format:
{{
  "genuine_distress": boolean,
  "confidence": 0-1,
  "reasoning": string,
  "emoji_function": "humor" | "emphasis" | "literal" | "ambiguous",
  "emoji_context": {{
    "emojis_found": [list of emojis],
    "text_emoji_alignment": "amplifies" | "contradicts" | "softens" | "neutral"
  }}
}}
"""
    
    def _get_emoji_baseline(self, student_id: str) -> Dict[str, Any]:
        """Get student's emoji usage baseline."""
        from app.models.student import Student
        
        student = self.db.query(Student).filter(Student.student_id == student_id).first()
        if not student or not student.baseline_profile:
            return {}
        
        return student.baseline_profile.get("emoji_baseline", {})
    
    def _update_baseline(self, student_id: str, message_text: str, analysis: Dict[str, Any]):
        """Update student's emoji baseline."""
        from app.models.student import Student
        
        student = self.db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            return
        
        baseline = student.baseline_profile or {}
        emoji_baseline = baseline.get("emoji_baseline", {})
        
        # Extract emojis from message
        emojis = self._extract_emojis(message_text)
        
        # Update frequency
        if "emoji_count" not in emoji_baseline:
            emoji_baseline["emoji_count"] = []
        emoji_baseline["emoji_count"].append(len(emojis))
        
        # Update common emojis
        if "common_emojis" not in emoji_baseline:
            emoji_baseline["common_emojis"] = {}
        for emoji in emojis:
            emoji_baseline["common_emojis"][emoji] = emoji_baseline["common_emojis"].get(emoji, 0) + 1
        
        # Update typical function
        emoji_function = analysis.get("emoji_function", "ambiguous")
        if "function_distribution" not in emoji_baseline:
            emoji_baseline["function_distribution"] = {}
        emoji_baseline["function_distribution"][emoji_function] = \
            emoji_baseline["function_distribution"].get(emoji_function, 0) + 1
        
        baseline["emoji_baseline"] = emoji_baseline
        student.baseline_profile = baseline
        
        self.db.commit()
    
    def _extract_emojis(self, text: str) -> list:
        """Extract emojis from text."""
        import re
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+",
            flags=re.UNICODE
        )
        return emoji_pattern.findall(text)




