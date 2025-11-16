# Quick Start Guide

## Prerequisites

- Python 3.9+
- PostgreSQL database
- **Either:**
  - OpenAI API key (for LLM features), OR
  - Local LLM setup (Ollama recommended - see [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md))

## Setup

1. **Clone and navigate to project**:
```bash
cd archi
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:pass@localhost/mentalhealth_db`)
- `LLM_PROVIDER`: Either `"openai"` or `"local"`

**If using OpenAI:**
- `OPENAI_API_KEY`: Your OpenAI API key

**If using Local LLM (Recommended):**
- `LOCAL_LLM_BASE_URL`: e.g., `http://localhost:11434/v1` (Ollama default)
- `LOCAL_LLM_MODEL`: e.g., `llama3` or `mistral`
- See [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) for detailed setup instructions

5. **Initialize database**:
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

6. **Run the application**:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Example Usage

### Process a Message

```bash
curl -X POST "http://localhost:8000/api/messages/process" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student123",
    "message_text": "I have been feeling really down lately",
    "metadata": {}
  }'
```

### Get Risk Profile

```bash
curl "http://localhost:8000/api/alerts/risk-profile/student123"
```

### Submit Counselor Feedback

```bash
curl -X POST "http://localhost:8000/api/learning/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student123",
    "was_appropriate": true,
    "actual_severity": "Moderate",
    "urgency": "soon",
    "ai_accuracy": "appropriate",
    "counselor_id": "counselor1"
  }'
```

## Architecture Overview

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation of all 8 solutions.

## Key Features

1. **Hybrid Assessment**: Tiered approach with passive monitoring → checkpoints → contextual flags
2. **Confidence-Weighted Alerts**: Multi-dimensional risk profiles with confidence scores
3. **Sequential Processing**: 5-stage checkpoint pipeline for safe message processing
4. **C-SSRS Implementation**: Proper suicide risk assessment protocol
5. **Contextual Emoji Analysis**: LLM-based emoji interpretation with personal baselines
6. **Adaptive Sensitivity**: Dynamic threshold adjustment based on feedback
7. **Temporal Patterns**: Trajectory analysis and pattern detection
8. **Continuous Learning**: Feedback collection and performance monitoring

## Testing

Run tests:
```bash
pytest tests/
```

## Monitoring

View performance metrics:
```bash
# Daily metrics
curl "http://localhost:8000/api/learning/performance/daily"

# Weekly report
curl "http://localhost:8000/api/learning/performance/weekly"
```

## Next Steps

1. Configure database connection
2. Set up OpenAI API key
3. Customize assessment thresholds in `.env`
4. Review and adjust safety screening keywords
5. Set up monitoring dashboards
6. Configure counselor feedback workflows


