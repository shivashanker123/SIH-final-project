"""Safety screening for immediate crisis detection."""
from typing import Dict, Any, List
import re


class SafetyScreener:
    """Immediate safety screening for high-risk keywords."""
    
    # High-risk keywords that trigger immediate crisis protocol
    CRISIS_KEYWORDS = [
        r"kill\s+myself",
        r"end\s+it\s+all",
        r"suicide",
        r"goodbye\s+forever",
        r"won't\s+be\s+here\s+tomorrow",
        r"final\s+message",
        r"ending\s+my\s+life",
        r"taking\s+my\s+life",
    ]
    
    # Suicide plan indicators
    PLAN_INDICATORS = [
        r"plan\s+to\s+kill",
        r"going\s+to\s+end",
        r"method\s+to",
        r"way\s+to\s+die",
    ]
    
    def screen_immediate(self, message_text: str) -> Dict[str, Any]:
        """Screen message for immediate safety concerns."""
        text_lower = message_text.lower()
        flags = []
        crisis_detected = False
        
        # Check for crisis keywords
        for pattern in self.CRISIS_KEYWORDS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                flags.append(f"crisis_keyword: {pattern}")
                crisis_detected = True
        
        # Check for plan indicators
        for pattern in self.PLAN_INDICATORS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                flags.append(f"plan_indicator: {pattern}")
                crisis_detected = True
        
        return {
            "crisis_detected": crisis_detected,
            "flags": flags,
            "reason": "immediate_safety_concern" if crisis_detected else None
        }
    
    def filter_response(self, response: str) -> str:
        """Filter LLM response for safety."""
        # Remove any potentially harmful content
        # Basic filtering - can be enhanced
        
        # Remove medical advice keywords
        harmful_patterns = [
            r"take\s+\d+\s+mg",
            r"prescribe\s+",
            r"you\s+should\s+take\s+medication",
        ]
        
        import re
        filtered = response
        for pattern in harmful_patterns:
            filtered = re.sub(pattern, "[medical advice removed]", filtered, flags=re.IGNORECASE)
        
        return filtered




