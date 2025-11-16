# Architecture Documentation

## Overview

This system implements a comprehensive mental health monitoring architecture with 8 core solutions addressing common flaws in AI-based mental health systems.

## Core Principles

**Explicit is Better Than Inferred**: The system prioritizes explicit, validated assessments over inferred scores from conversation analysis.

## Solution Implementations

### Solution 1: Hybrid Assessment Model

**Location**: `app/services/assessment/hybrid_assessment.py`

**Tiers**:
- **Tier 1 (Passive Monitoring)**: First 2-3 sessions track patterns without scoring
- **Tier 2 (Validated Checkpoint)**: Session 4 and monthly, explicit PHQ-2/GAD-2 administration
- **Tier 3 (Contextual Flags)**: Continuous NLP analysis flags concerns without assigning scores

**Key Methods**:
- `get_assessment_tier()`: Determines current tier for student
- `track_passive_monitoring()`: Records baseline patterns
- `flag_concern_indicators()`: Flags concerns without scoring

### Solution 2: Confidence-Weighted Alert System

**Location**: `app/services/alerts/risk_calculator.py`

**Features**:
- Multi-dimensional risk profiles with confidence scores
- Risk factors: suicidal ideation, depression severity, behavior change
- Routing logic based on confidence thresholds

**Risk Profile Structure**:
```python
{
    "overall_risk": "MEDIUM|HIGH|CRISIS",
    "confidence": 0.72,
    "risk_factors": {...},
    "recommended_action": "schedule_counselor_review_within_48h"
}
```

### Solution 3: Sequential Analysis Architecture

**Location**: `app/services/analysis/sequential_processor.py`

**Checkpoints**:
1. **Immediate Safety Screen** (~10ms): High-risk keyword detection
2. **Context Enrichment** (~50ms): Pull conversation history, behavioral metadata
3. **LLM Generation** (~1-2s): Generate response with safety constraints
4. **Deep Analysis** (~2-5s): Full NLP pipeline, risk calculation
5. **Response Gating**: Route response based on risk level

**Benefits**:
- No race conditions (sequential processing)
- Graceful degradation
- Full audit trail

### Solution 4: Proper C-SSRS Implementation

**Location**: `app/services/assessment/cssrs.py`

**Features**:
- Explicit trigger conditions
- Actual C-SSRS questions presented verbatim
- Proper scoring algorithm (0-5 scale)
- Clinical action routing based on scores

**Trigger Conditions**:
- Suicidal ideation detected in conversation
- PHQ-9 Item 9 > 0
- Concerning behavior + student requests help

### Solution 5: Contextual Emoji Understanding

**Location**: `app/services/analysis/emoji_analyzer.py`

**Approach**:
- LLM-based interpretation (not lexicons)
- Personal baseline tracking
- Generational/cultural context awareness

**Analysis Output**:
```python
{
    "genuine_distress": boolean,
    "confidence": 0-1,
    "reasoning": string,
    "emoji_function": "humor|emphasis|literal|ambiguous"
}
```

### Solution 6: Adaptive Sensitivity

**Location**: `app/services/learning/adaptive_sensitivity.py`

**Features**:
- Population-level calibration (monthly threshold adjustment)
- Individual-level adaptation (personal baselines)
- Counselor feedback integration
- F1 score optimization

**Threshold Types**:
- PHQ9 threshold
- GAD7 threshold
- Confidence threshold

### Solution 7: Temporal Pattern Recognition

**Location**: `app/services/analysis/temporal_analyzer.py`

**Patterns Detected**:
- Rapid deterioration
- Pre-decision calm (dangerous pattern)
- Chronic elevated
- Cyclical patterns
- Disengagement

**Metrics**:
- Velocity: Rate of change in risk scores
- Acceleration: Rate of change of velocity
- Risk multipliers based on patterns

### Solution 8: Continuous Learning Infrastructure

**Locations**:
- `app/services/learning/feedback_collector.py`
- `app/services/learning/performance_monitor.py`

**Components**:
1. **Ground Truth Collection**: Counselor feedback forms
2. **Performance Monitoring**: Daily/weekly metrics
3. **Threshold Calibration**: Automatic adjustment based on feedback
4. **Outcome Tracking**: Track intervention effectiveness

## Database Schema

### Core Tables

- `students`: Student profiles and baseline data
- `sessions`: Conversation sessions
- `assessments`: PHQ-9, GAD-7, C-SSRS records
- `risk_profiles`: Multi-dimensional risk assessments
- `message_analyses`: Individual message analysis results
- `temporal_patterns`: Detected temporal patterns
- `alerts`: Alert records
- `counselor_feedback`: Feedback on flagged cases
- `model_performance`: Performance metrics
- `threshold_calibrations`: Threshold adjustment history

## API Endpoints

### Messages
- `POST /api/messages/process`: Process student message
- `GET /api/messages/analysis/{student_id}`: Get message analyses

### Assessments
- `GET /api/assessments/checkpoint-plan/{student_id}`: Get checkpoint plan
- `POST /api/assessments/phq2`: Submit PHQ-2
- `POST /api/assessments/cssrs/trigger-check`: Check C-SSRS trigger
- `POST /api/assessments/cssrs/submit`: Submit C-SSRS

### Alerts
- `GET /api/alerts/risk-profile/{student_id}`: Get risk profile
- `GET /api/alerts/pending`: Get pending alerts

### Learning
- `POST /api/learning/feedback`: Submit counselor feedback
- `GET /api/learning/feedback/summary`: Get feedback summary
- `GET /api/learning/performance/daily`: Daily performance metrics
- `GET /api/learning/performance/weekly`: Weekly performance report
- `POST /api/learning/calibrate-thresholds`: Trigger calibration

## Configuration

Environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for LLM
- `INITIAL_PHQ9_THRESHOLD`: Initial PHQ-9 threshold (default: 10)
- `INITIAL_GAD7_THRESHOLD`: Initial GAD-7 threshold (default: 10)
- `RISK_CONFIDENCE_THRESHOLD`: Confidence threshold (default: 0.7)
- `PASSIVE_MONITORING_SESSIONS`: Sessions before checkpoint (default: 3)
- `CHECKPOINT_INTERVAL_DAYS`: Days between checkpoints (default: 30)

## Deployment

1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables
3. Initialize database: `alembic upgrade head`
4. Run application: `uvicorn app.main:app --reload`

## Testing

Run tests: `pytest tests/`

## Monitoring

- Daily performance metrics available via API
- Weekly reports for trend analysis
- Threshold calibration logs in database
- Full audit trail of all message processing




