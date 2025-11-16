# Local LLM Setup Guide

This guide shows you how to use a locally running LLM instead of OpenAI.

## Supported Local LLM Options

1. **Ollama** (Recommended - Easiest to set up)
2. **LM Studio** (Windows/Mac GUI)
3. **vLLM** (High performance)
4. **Any OpenAI-compatible API** (Text Generation Inference, etc.)

---

## Option 1: Ollama (Recommended)

### Step 1: Install Ollama

**Windows/Mac/Linux:**
Download from [ollama.ai](https://ollama.ai)

Or use command line:
```bash
# Mac/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows - Download installer from website
```

### Step 2: Start Ollama Server

```bash
ollama serve
```

This starts the server on `http://localhost:11434`

### Step 3: Download a Model

```bash
# Recommended models for mental health use:
ollama pull llama3          # Meta's Llama 3 (8B parameters, good balance)
ollama pull mistral         # Mistral 7B (fast and efficient)
ollama pull llama2          # Llama 2 (older but stable)
ollama pull phi3            # Microsoft Phi-3 (small, fast)

# For better quality (requires more RAM):
ollama pull llama3:70b      # Llama 3 70B (requires 40GB+ RAM)
ollama pull mistral-nemo    # Mistral Nemo (12B, good quality)
```

**Check available models:**
```bash
ollama list
```

### Step 4: Configure Your .env File

Update your `.env` file:

```env
# Use local LLM instead of OpenAI
LLM_PROVIDER=local

# Ollama Configuration
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3

# OpenAI settings (not needed when using local)
# OPENAI_API_KEY=your_key_here
```

### Step 5: Test the Connection

```bash
# Test if Ollama is running
curl http://localhost:11434/api/tags

# Test a simple generation
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### Step 6: Start Your Backend

```bash
cd archi
uvicorn app.main:app --reload
```

You should see in the logs:
```
INFO: Using local LLM at http://localhost:11434/v1 with model llama3
```

---

## Option 2: LM Studio

### Step 1: Install LM Studio

Download from [lmstudio.ai](https://lmstudio.ai)

### Step 2: Download a Model

1. Open LM Studio
2. Go to "Search" tab
3. Search for a model (e.g., "Llama 3", "Mistral")
4. Click "Download"

### Step 3: Start Local Server

1. Go to "Local Server" tab
2. Select your downloaded model
3. Click "Start Server"
4. Note the port (usually 1234)

### Step 4: Configure .env

```env
LLM_PROVIDER=local
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=your-model-name
```

---

## Option 3: vLLM (Advanced)

### Step 1: Install vLLM

```bash
pip install vllm
```

### Step 2: Start vLLM Server

```bash
python -m vllm.entrypoints.openai.api_server \
    --model mistralai/Mistral-7B-Instruct-v0.2 \
    --port 8001
```

### Step 3: Configure .env

```env
LLM_PROVIDER=local
LOCAL_LLM_BASE_URL=http://localhost:8001/v1
LOCAL_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

---

## Model Recommendations for Mental Health Use

### Best Balance (Recommended)
- **Llama 3 8B**: Good quality, reasonable speed, ~5GB RAM
- **Mistral 7B**: Fast, efficient, good reasoning, ~4GB RAM

### High Quality (More RAM Required)
- **Llama 3 70B**: Best quality, requires 40GB+ RAM
- **Mistral Nemo 12B**: Good quality, ~8GB RAM

### Fast & Lightweight
- **Phi-3**: Very fast, small model, ~2GB RAM
- **TinyLlama**: Extremely fast, ~1GB RAM (lower quality)

---

## Configuration Options

### Environment Variables

```env
# Required: Choose provider
LLM_PROVIDER=local  # or "openai"

# Local LLM Settings
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3
LOCAL_LLM_API_KEY=  # Usually not needed

# OpenAI Settings (only if using OpenAI)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4
```

### Switching Between Providers

**To use OpenAI:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

**To use Local LLM:**
```env
LLM_PROVIDER=local
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3
```

---

## Troubleshooting

### Error: "Could not connect to LLM"

**Solution:**
1. Make sure your local LLM server is running
2. Check the port in your `.env` matches the server port
3. For Ollama: Run `ollama serve` in a terminal
4. Test connection: `curl http://localhost:11434/api/tags`

### Error: "Model not found"

**Solution:**
1. Make sure you've downloaded the model
2. For Ollama: Run `ollama pull <model-name>`
3. Check model name matches exactly in `.env`
4. List available models: `ollama list`

### Slow Response Times

**Solutions:**
1. Use a smaller model (e.g., `phi3` instead of `llama3:70b`)
2. Reduce `max_tokens` in prompts
3. Ensure you have enough RAM
4. Close other applications using GPU/RAM

### Out of Memory Errors

**Solutions:**
1. Use a smaller model
2. Reduce batch size if using vLLM
3. Close other applications
4. Consider using CPU-only mode (slower but uses less RAM)

---

## Testing Your Setup

### Test 1: Check Server is Running

```bash
# Ollama
curl http://localhost:11434/api/tags

# Should return list of available models
```

### Test 2: Test API Endpoint

```bash
curl -X POST "http://localhost:8000/api/messages/process" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test",
    "message_text": "Hello, I need help"
  }'
```

### Test 3: Check Logs

When you start the backend, you should see:
```
INFO: Using local LLM at http://localhost:11434/v1 with model llama3
```

If you see connection errors, check:
- Is the LLM server running?
- Is the port correct?
- Is the model name correct?

---

## Performance Tips

1. **Use GPU if available**: Ollama automatically uses GPU if available
2. **Choose right model size**: Balance between quality and speed
3. **Monitor RAM usage**: Larger models need more RAM
4. **Batch requests**: If processing multiple messages, batch them
5. **Cache responses**: Consider caching common responses

---

## Security Notes

- Local LLMs run entirely on your machine - no data sent to external servers
- Perfect for sensitive mental health data
- No API costs
- Works offline once models are downloaded

---

## Next Steps

1. Install Ollama or your preferred local LLM
2. Download a model
3. Update `.env` file
4. Start the LLM server
5. Start your backend
6. Test with a message

Your system will now use the local LLM for all AI responses!



