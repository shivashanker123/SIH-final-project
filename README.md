# Mental Health Monitoring System - Architecture Implementation

A comprehensive mental health monitoring system with explicit assessment, confidence-weighted alerts, and continuous learning capabilities.

## Architecture Overview

This system implements 8 core solutions:

1. **Hybrid Assessment Model**: Tiered approach with passive monitoring, validated checkpoints, and contextual flags
2. **Confidence-Weighted Alert System**: Multi-dimensional risk profiles with confidence scores
3. **Sequential Analysis Architecture**: 5-stage checkpoint pipeline for message processing
4. **Proper C-SSRS Implementation**: Structured suicide risk assessment
5. **Contextual Emoji Understanding**: LLM-based emoji interpretation with personal baselines
6. **Adaptive Sensitivity**: Dynamic threshold adjustment with feedback loops
7. **Temporal Pattern Recognition**: Trajectory analysis and pattern detection
8. **Continuous Learning Infrastructure**: Feedback collection and performance monitoring

## Project Structure

```
archi/
├── app/
│   ├── core/              # Core configuration and utilities
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   │   ├── assessment/    # Assessment services
│   │   ├── analysis/      # NLP and analysis services
│   │   ├── alerts/        # Alert system
│   │   └── learning/      # Continuous learning
│   ├── api/               # API endpoints
│   └── db/                # Database setup
├── tests/                 # Test suite
├── config/                # Configuration files
└── scripts/               # Utility scripts
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (see `.env.example`)

   **For Local LLM (Recommended):**
   - Install Ollama: https://ollama.ai
   - Download a model: `ollama pull llama3`
   - Set `LLM_PROVIDER=local` in `.env`
   - See [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) for detailed instructions

   **For OpenAI:**
   - Set `LLM_PROVIDER=openai` in `.env`
   - Add your `OPENAI_API_KEY`

3. Initialize database:
```bash
alembic upgrade head
```

4. Run the application:
```bash
uvicorn app.main:app --reload
```

## Key Features

- **Explicit Assessment**: Uses validated instruments (PHQ-9, GAD-7, C-SSRS) instead of inference
- **Confidence Scoring**: Multi-dimensional risk profiles with confidence levels
- **Sequential Processing**: Safe, auditable message processing pipeline
- **Temporal Analysis**: Pattern recognition across time series data
- **Adaptive Learning**: System improves through counselor feedback
- **Clinical Validity**: Follows evidence-based protocols
- **Local LLM Support**: Use Ollama, LM Studio, or any OpenAI-compatible local LLM for privacy and cost savings

## License

Proprietary - Mental Health Monitoring System


