# Solution Documentation: What Each Solution Does and Does NOT Do

This document explicitly defines the capabilities and limitations of each solution in the mental health monitoring system.

## Core Principle

**Explicit is Better Than Inferred**: The system prioritizes explicit, validated assessments over inferred scores from conversation analysis.

---

## SOLUTION 1: Hybrid Assessment Model

**Location**: `app/services/assessment/hybrid_assessment.py`

### What It Does:

1. **Tier 1: Passive Monitoring (First 2-3 sessions)**
   - Tracks baseline patterns WITHOUT assigning scores
   - Builds baseline understanding of student's communication style
   - Identifies: typical language, humor patterns, baseline mood
   - Calculates baseline statistics: avg_message_length, typical_sentiment, sentiment_variance, sarcasm_frequency
   - Uses LLM for sentiment/humor detection when available
   - Stores raw data and computed statistics in `baseline_profile` JSON field

2. **Tier 2: Validated Checkpoint (Session 4, then monthly)**
   - Explicitly administers SHORT versions of tools (PHQ-2, GAD-2)
   - If scores indicate risk → full PHQ-9/GAD-7
   - Uses actual validated instruments, not conversation inference
   - Records assessment results in `assessments` table

3. **Tier 3: Continuous Contextual Flags**
   - Runs NLP analysis on ongoing conversations
   - Flags "concern indicators" WITHOUT assigning scores
   - Tracks: sudden language shifts, engagement changes, hopelessness themes
   - Uses flags to trigger earlier checkpoint assessment

### What It Does NOT Do:

- Does NOT infer depression/anxiety scores from conversation
- Does NOT assign risk levels during Tier 1
- Does NOT replace validated assessments with conversation analysis
- Does NOT skip the baseline building phase
- Does NOT use static thresholds (uses individual baselines)

### Baseline Schema:

```python
{
  "language_patterns": [  # Raw data
    {
      "timestamp": "ISO string",
      "message_length": int,
      "emoji_count": int,
      "sentiment": "positive|neutral|negative"
    }
  ],
  "statistics": {  # Computed from raw data
    "avg_message_length": float,
    "emoji_usage_rate": float,
    "typical_sentiment": float,  # -1 to +1
    "sentiment_variance": float,
    "typical_emotionality": float,  # 0-1
    "sarcasm_frequency": float,  # 0-1
    "dark_humor_baseline": boolean,
    "common_themes": [list of strings]
  },
  "humor_indicators": [list of timestamps],
  "mood_samples": [list of mood records]
}
```

---

## SOLUTION 2: Confidence-Weighted Alert System

**Location**: `app/services/alerts/risk_calculator.py`

### What It Does:

1. **Multi-dimensional Risk Profiles**
   - Creates risk profiles with calibrated confidence scores (0-1)
   - Assesses three risk factors: suicidal ideation, depression severity, behavior change
   - Uses LLM for contextual understanding to distinguish literal vs idiomatic expressions
   - Provides reasoning for each risk factor

2. **LLM-Based Contextual Analysis**
   - Analyzes messages in context of conversation history
   - Distinguishes literal threats from idiomatic expressions
   - Understands gaming context, sarcasm, dark humor
   - Provides calibrated confidence scores based on context availability

3. **Fallback Strategy**
   - If LLM unavailable: Uses keyword matching with low confidence (0.3)
   - Flags `requires_human_review: true` when using fallback
   - Never fails silently - always provides some assessment

4. **Confidence Calibration**
   - Adjusts raw LLM confidence based on:
     - Context availability (history length)
     - Baseline availability
     - Ambiguity indicators (sarcasm, idioms)
     - Multiple signal agreement
   - Formula: `calibrated_confidence = raw_confidence * context_factor * baseline_factor * ambiguity_factor * agreement_factor`

5. **Routing Logic**
   - Confidence > 0.9 AND High Risk → Immediate alert
   - Confidence < 0.7 OR Mixed signals → Human review queue
   - Behavioral flags + Assessment concerns → Escalate even if individual scores are moderate

### What It Does NOT Do:

- Does NOT use simple keyword matching alone (uses LLM for context)
- Does NOT assign binary risk levels (uses multi-dimensional profiles)
- Does NOT ignore uncertainty (provides confidence scores)
- Does NOT infer validated assessment scores from conversation (uses actual PHQ-9/GAD-7 when available)
- Does NOT fail silently when LLM unavailable (uses fallback)
- Does NOT use raw LLM confidence without calibration

### Risk Profile Structure:

```python
{
  "overall_risk": "LOW|MEDIUM|HIGH|CRISIS",
  "confidence": 0.0-1.0,  # Calibrated, not raw LLM output
  "risk_factors": {
    "suicidal_ideation": {
      "present": boolean,
      "is_literal": boolean,  # Distinguishes literal vs idiomatic
      "confidence": 0.0-1.0,
      "reason": "string"
    },
    "depression_severity": {
      "estimated_phq9": int,  # Only if validated assessment exists
      "confidence": 0.0-1.0,
      "reason": "string",
      "is_estimate": boolean,  # True if not from validated assessment
      "requires_assessment": boolean  # True if needs PHQ-9
    },
    "behavior_change": {
      "concern": "LOW|MEDIUM|HIGH",
      "confidence": 0.0-1.0,
      "reason": "string"
    }
  },
  "recommended_action": "string",
  "requires_human_review": boolean  # True if LLM failed or low confidence
}
```

---

## SOLUTION 3: Sequential Analysis Architecture

**Location**: `app/services/analysis/sequential_processor.py`

### What It Does:

1. **Sequential Checkpoints (No Race Conditions)**
   - CHECKPOINT 1: Immediate Safety Screen (~10ms) - Fast keyword detection
   - CHECKPOINT 2: Context Enrichment (~50ms) - Pull history, metadata, risk profile
   - CHECKPOINT 3: LLM Generation (~1-2s) - Generate response with safety constraints
   - CHECKPOINT 4: Deep Analysis (~2-5s) - Full NLP pipeline, LLM-based risk calculation
   - CHECKPOINT 5: Response Gating - Route response based on risk level

2. **Crisis Protocol Handling**
   - Even when crisis detected in Checkpoint 1, still calculates risk profile
   - Enriches context before risk calculation
   - Saves risk profile to database for tracking

3. **Full Audit Trail**
   - Every checkpoint result logged
   - All decisions traceable
   - Processing times recorded

### What It Does NOT Do:

- Does NOT send response before analysis completes
- Does NOT skip risk calculation for crisis cases
- Does NOT use parallel processing that could cause race conditions
- Does NOT proceed to next checkpoint if previous fails critically

---

## SOLUTION 4: Proper C-SSRS Implementation

**Location**: `app/services/assessment/cssrs.py`

### What It Does:

1. **Trigger Conditions**
   - Suicidal ideation detected in conversation
   - PHQ-9 Item 9 > 0
   - Concerning behavior pattern + student requests help

2. **Smooth UX Transition**
   - Provides empathetic transition message
   - Requests consent before presenting questions
   - Explains why questions are being asked
   - Allows student to decline (with graceful fallback)

3. **Verbatim Question Presentation**
   - Presents actual C-SSRS questions exactly as specified
   - Includes explanations of why each question is asked
   - Provides examples of what counts
   - No paraphrasing or simplification

4. **Proper Scoring**
   - Uses actual C-SSRS algorithm (0-5 scale)
   - Maps responses directly to severity levels
   - Does not infer answers from conversation

5. **Clinical Routing**
   - Scores 3-5 → Immediate crisis protocol
   - Scores 1-2 → Urgent counselor notification
   - Score 0 → Continue monitoring (but document trigger)

### What It Does NOT Do:

- Does NOT embed questions in conversation
- Does NOT paraphrase or simplify questions
- Does NOT infer answers from conversation
- Does NOT skip consent/explanation step
- Does NOT present questions without transition

---

## SOLUTION 5: Contextual Emoji Understanding

**Location**: `app/services/analysis/emoji_analyzer.py`

### What It Does:

- Uses LLM to interpret emoji meaning in context (not lexicons)
- Tracks personal baseline for each student
- Considers generational/cultural context (college students, 2025)
- Distinguishes genuine distress from casual expression
- Updates baseline over time

### What It Does NOT Do:

- Does NOT use universal emoji dictionaries
- Does NOT ignore personal communication style
- Does NOT assume emoji meaning is static

---

## SOLUTION 6: Adaptive Sensitivity with Feedback Loop

**Location**: `app/services/learning/adaptive_sensitivity.py`

### What It Does:

1. **Phased Deployment**
   - **Cold Start (< 100 feedbacks)**: Conservative thresholds, route more to human
   - **Calibration (100-500 feedbacks)**: Moderate thresholds
   - **Optimization (500+ feedbacks)**: Data-driven thresholds

2. **Population-Level Calibration**
   - Adjusts thresholds monthly based on F1 score optimization
   - Tracks: precision, recall, F1 from counselor feedback
   - Records all threshold adjustments in database

3. **Individual-Level Adaptation**
   - Tracks per-student baselines
   - Flags when deviation exceeds 2 standard deviations from personal baseline
   - Accounts for individual communication style

4. **Feedback Integration**
   - Every flagged case shows system's reasoning to counselor
   - Counselor marks: severity, urgency, AI accuracy
   - Feeds back to retrain confidence calibration

### What It Does NOT Do:

- Does NOT adjust thresholds without feedback data
- Does NOT ignore individual baselines
- Does NOT use static thresholds
- Does NOT operate in production mode during cold start (uses conservative thresholds)

### Cold Start Strategy:

```python
# Phase 1: Cold Start (< 100 feedbacks)
INITIAL_THRESHOLDS = {
    "high_risk": 0.7,  # Conservative - more sensitive
    "medium_risk": 0.4,
    "minimum_confidence": 0.5
}
POLICY = "route_all_medium_plus_to_human"  # Higher human review

# Phase 2: Calibration (100-500 feedbacks)
CALIBRATION_THRESHOLDS = {
    "high_risk": 0.75,
    "medium_risk": 0.45,
    "minimum_confidence": 0.6
}
POLICY = "route_uncertain_to_human"

# Phase 3: Optimization (500+ feedbacks)
# Thresholds adjusted monthly based on F1 score
```

---

## SOLUTION 7: Temporal Pattern Recognition

**Location**: `app/services/analysis/temporal_analyzer.py`

### What It Does:

1. **Trajectory Analysis**
   - Calculates velocity (rate of change) in risk scores
   - Calculates acceleration (rate of change of velocity)
   - Requires minimum 5 data points for velocity, 10 for acceleration
   - Confidence increases with more data points

2. **Pattern Detection**
   - Rapid deterioration: velocity < -0.5 and acceleration < 0
   - Pre-decision calm: Sudden improvement after sustained distress (most dangerous)
   - Chronic elevated: Mean > 2.5 and low variance
   - Cyclical patterns: Possible bipolar indicator
   - Disengagement: Dropping message frequency

3. **Risk Multipliers**
   - Rapid deterioration: 2.0x multiplier
   - Pre-decision calm: 3.0x multiplier (most dangerous)
   - Chronic elevated: 1.5x multiplier
   - Disengagement: 1.3x multiplier

### What It Does NOT Do:

- Does NOT only look at current snapshot (requires history)
- Does NOT ignore trajectory direction
- Does NOT treat all patterns equally
- Does NOT provide analysis with insufficient data (< 5 data points for velocity)
- Does NOT calculate acceleration with < 10 data points

### Minimum Data Requirements:

```python
MINIMUM_HISTORY_FOR_VELOCITY = 5  # Need 5+ risk profiles
MINIMUM_HISTORY_FOR_ACCELERATION = 10  # Need 10+ risk profiles

# If insufficient data:
{
  "velocity": None,
  "acceleration": None,
  "velocity_confidence": 0.0,
  "use_snapshot_only": True,
  "reason": "Insufficient history for temporal analysis"
}
```

---

## SOLUTION 8: Continuous Learning Infrastructure

**Locations**: 
- `app/services/learning/feedback_collector.py`
- `app/services/learning/performance_monitor.py`

### What It Does:

1. **Ground Truth Collection**
   - Counselor dashboard for every flagged case
   - Structured feedback form: Was flag appropriate? Actual severity? What did AI miss/over-interpret?
   - Links to actual clinical assessment scores when available

2. **Performance Monitoring**
   - Real-time dashboards: Daily false positive/negative rates
   - Weekly model performance reports
   - Monthly calibration reviews
   - Tracks intervention outcomes (did student engage? did condition improve?)

3. **Experiment Framework**
   - A/B testing for prompt variations
   - Shadow mode for new models
   - Feature flags for threshold adjustments
   - Version control for all prompts

4. **Outcome Tracking**
   - Tracks if student engaged with counseling
   - Tracks if condition improved
   - Ultimate metric: "Did our intervention change trajectory?"

### What It Does NOT Do:

- Does NOT operate without feedback
- Does NOT ignore outcome data
- Does NOT make changes without testing
- Does NOT deploy untested prompt changes

---

## LLM Validation Strategy (Critical Requirement)

### Before Production Deployment:

1. **Test Suite Creation**
   - 500+ edge cases covering:
     - Idiomatic expressions ("dead tired", "killing it")
     - Sarcasm with dark humor ("life is great, totally not dying inside")
     - Cultural expressions from diverse backgrounds
     - Genuine crisis statements
     - Ambiguous cases
   - Location: `tests/llm_validation/`

2. **Benchmarking**
   - Run test suite through proposed prompt
   - Have 3 mental health professionals label same cases
   - Calculate: precision, recall, F1, inter-rater agreement
   - Require: >95% sensitivity for explicit ideation, >85% for implicit

3. **Prompt Iteration**
   - Add few-shot examples to prompt based on failure patterns
   - Re-test after each change
   - Document all prompt versions

4. **Shadow Deployment**
   - Run LLM analysis in parallel with current system for 2 weeks
   - Compare outputs, don't act on them yet
   - Validate against counselor assessments
   - Only promote to production after validation

### Current Status:

⚠️ **LLM validation test suite not yet created** - This must be completed before production deployment.

---

## Integration Points

### How Solutions Work Together:

1. **Sequential Processor** orchestrates all solutions:
   - Checkpoint 1: Safety screen (fast keyword check)
   - Checkpoint 2: Context enrichment (includes baseline from Solution 1)
   - Checkpoint 3: LLM response generation
   - Checkpoint 4: Deep analysis (Solution 2 + Solution 5 + Solution 7)
   - Checkpoint 5: Response gating (uses Solution 2 risk profile)

2. **Solution 1** provides baseline to **Solution 2**:
   - RiskCalculator uses baseline to calibrate confidence
   - Baseline helps distinguish normal vs concerning patterns

3. **Solution 2** triggers **Solution 4**:
   - When suicidal ideation detected → triggers C-SSRS
   - C-SSRS results feed back into risk profile

4. **Solution 7** informs **Solution 2**:
   - Temporal patterns provide risk multipliers
   - Trajectory direction affects overall risk calculation

5. **Solution 8** improves **Solution 2** and **Solution 6**:
   - Feedback calibrates confidence scores
   - Feedback adjusts thresholds in Solution 6

---

## Critical Limitations

### What the System Cannot Do:

1. **Cannot replace human judgment**
   - System provides recommendations, not decisions
   - All high-risk cases require human review
   - System admits uncertainty (low confidence scores)

2. **Cannot diagnose mental health conditions**
   - System flags concerns and routes to professionals
   - Does not provide diagnoses or treatment plans

3. **Cannot guarantee 100% accuracy**
   - False positives and false negatives are possible
   - System is designed to err on side of caution
   - Continuous learning improves over time

4. **Cannot work without baseline data**
   - Tier 1 requires 2-3 sessions to build baseline
   - Temporal analysis requires 5+ data points
   - Individual adaptation requires sufficient history

5. **Cannot operate without LLM validation**
   - LLM prompts must be validated before production
   - Test suite and benchmarking required
   - Shadow deployment recommended

---

## Deployment Checklist

Before production deployment:

- [ ] LLM validation test suite created (500+ edge cases)
- [ ] LLM prompts benchmarked (>95% sensitivity for explicit ideation)
- [ ] Shadow deployment completed (2 weeks parallel run)
- [ ] Fallback strategies tested (LLM unavailable scenarios)
- [ ] Confidence calibration validated
- [ ] Baseline schema implemented and tested
- [ ] Temporal analyzer minimum data requirements enforced
- [ ] Cold start strategy implemented
- [ ] C-SSRS UX transition tested
- [ ] All docstrings added explaining capabilities/limitations



