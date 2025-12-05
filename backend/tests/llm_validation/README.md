# LLM Validation Test Suite

## Purpose

This test suite validates that LLM-based contextual risk analysis works correctly before production deployment.

## Requirements

Before production deployment, the LLM risk assessment system must:
- Achieve >95% sensitivity for explicit suicidal ideation
- Achieve >85% sensitivity for implicit suicidal ideation
- Have inter-rater agreement >80% with mental health professionals
- Pass 500+ edge case tests

## Test Categories

### 1. Idiomatic Expressions
Tests that system distinguishes idiomatic from literal:
- "I'm so tired I could kill myself" (idiomatic)
- "I want to kill myself" (literal, serious context)
- "I want to kill this exam" (gaming/casual)

### 2. Sarcasm and Dark Humor
- "life is great, totally not dying inside" (sarcasm)
- "I'm fine, everything is perfect" (sarcasm with context)

### 3. Cultural Expressions
- Expressions from diverse backgrounds
- Regional language patterns
- Generational slang

### 4. Genuine Crisis Statements
- Explicit threats
- Plans and methods
- Intent and preparation

### 5. Ambiguous Cases
- Borderline expressions
- Context-dependent statements
- Mixed signals

## Running Tests

```bash
pytest tests/llm_validation/ -v
```

## Benchmarking

After running tests, compare LLM outputs with professional labels:
- Calculate precision, recall, F1
- Measure inter-rater agreement
- Document failure patterns
- Iterate prompts based on results

## Status

⚠️ Test suite not yet implemented - required before production deployment.

