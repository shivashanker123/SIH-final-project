# Troubleshooting Chat Connection Error

## Error Message
"I apologize, but I encountered an error connecting to the AI. Please make sure the backend is running and try again."

## Quick Fix Steps

### 1. Check if Backend is Running

Open a new terminal and run:
```powershell
# Check if backend is accessible
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
```

If you get an error, the backend is not running.

### 2. Start the Backend

**In a new terminal window:**

```powershell
# Navigate to project directory
cd C:\Users\shree\Desktop\archi

# Activate virtual environment
.\venv\Scripts\activate

# Navigate to backend directory
cd backend

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
```

### 3. Verify Backend is Working

Open your browser and go to:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

You should see `{"status": "healthy"}` for the health check.

### 4. Check Frontend Configuration

Make sure your frontend is configured to connect to the backend:

**Check `Frontend/.env` file exists and contains:**
```env
VITE_API_URL=http://localhost:8000/api
```

If the file doesn't exist, create it in the `Frontend` directory.

### 5. Common Issues

#### Issue: "ModuleNotFoundError: No module named 'openai'"

**Solution:**
```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r backend\requirements.txt
```

#### Issue: "Database connection failed"

**Solution:**
1. Make sure PostgreSQL is running (check Windows Services)
2. Verify `.env` file in `backend/` has correct database credentials:
   ```
   DATABASE_URL=postgresql://user:password@localhost/mentalhealth_db
   ```

#### Issue: "LLM provider not configured"

**Solution:**
In `backend/.env`, set one of:
- For OpenAI: `LLM_PROVIDER=openai` and `OPENAI_API_KEY=your-key`
- For Local LLM: `LLM_PROVIDER=local` and make sure Ollama is running

#### Issue: CORS errors in browser console

**Solution:**
The backend should already be configured for CORS. If you see CORS errors:
1. Check `backend/app/main.py` has CORS middleware configured
2. Restart the backend server

### 6. Test the Connection

Once backend is running, test the API directly:

```powershell
# Test message processing endpoint
$body = @{
    student_id = "student123"
    message_text = "Hello, I'm feeling stressed"
    metadata = @{}
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/messages/process" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

If this works, the backend is functioning correctly.

### 7. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for any error messages
- **Network tab**: Check if requests to `http://localhost:8000/api/messages/process` are being made
  - If you see "Failed to fetch" or "NetworkError", the backend is not running
  - If you see a 500 error, check backend terminal for error logs

## Still Having Issues?

1. **Check Backend Logs**: Look at the terminal where you started `uvicorn` for error messages
2. **Check Frontend Logs**: Open browser console (F12) and look for errors
3. **Verify Ports**: Make sure nothing else is using port 8000
4. **Restart Everything**: 
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Restart both

## Expected Behavior

When everything is working:
1. Backend runs on `http://localhost:8000`
2. Frontend runs on `http://localhost:5173` (or similar)
3. Sending a message in chat should:
   - Show "typing..." indicator
   - Receive a response from Haven
   - No error messages in console


