# Complete Launch Guide - Step by Step

This guide will help you launch the entire mental health monitoring system from scratch.

## Prerequisites Checklist

Before starting, make sure you have:
- ✅ PostgreSQL installed and running
- ✅ Python 3.12 installed
- ✅ Node.js installed (for frontend)
- ✅ Ollama installed and Mistral model downloaded
- ✅ All dependencies installed

---

## Step 1: Verify Ollama is Running

**Open a new Command Prompt or PowerShell window**

1. Check if Ollama is running:
   ```cmd
   curl http://localhost:11434/api/tags
   ```
   
   If you see JSON output with your models, Ollama is running! ✅
   
   If you get an error, start Ollama:
   ```cmd
   ollama serve
   ```
   (Keep this window open - Ollama needs to keep running)

2. Verify Mistral model is available:
   ```cmd
   ollama list
   ```
   
   You should see `mistral:7b-instruct` in the list.

---

## Step 2: Start the Backend Server

**Open a NEW Command Prompt or PowerShell window** (keep Ollama running in the first one)

1. Navigate to your project folder:
   ```cmd
   cd C:\Users\shree\Desktop\archi
   ```

2. Activate the virtual environment:
   ```cmd
   venv\Scripts\activate
   ```
   
   You should see `(venv)` at the start of your command prompt.

3. Start the backend server:
   ```cmd
   uvicorn app.main:app --reload
   ```

4. Wait for this message:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO:     Application startup complete.
   ```

   ✅ **Backend is now running!** Keep this window open.

5. Test the backend (optional):
   - Open your browser and go to: `http://localhost:8000/docs`
   - You should see the API documentation page (Swagger UI)

---

## Step 3: Start the Frontend

**Open a THIRD Command Prompt or PowerShell window** (keep Ollama and backend running)

1. Navigate to the frontend folder:
   ```cmd
   cd C:\Users\shree\Desktop\archi\frontend
   ```

2. Install dependencies (only needed the first time):
   ```cmd
   npm install
   ```
   
   This may take a few minutes. Wait for it to complete.

3. Start the frontend development server:
   ```cmd
   npm run dev
   ```

4. Wait for this message:
   ```
   VITE v5.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

   ✅ **Frontend is now running!**

5. Open your browser:
   - Go to: `http://localhost:5173`
   - You should see the frontend application

---

## Step 4: Test the Complete System

### Test 1: Backend API Health Check

1. Open browser: `http://localhost:8000/health`
2. You should see: `{"status": "healthy"}`

### Test 2: Send a Test Message

1. Go to: `http://localhost:8000/docs`
2. Find the `/api/messages/process` endpoint
3. Click "Try it out"
4. Enter this test data:
   ```json
   {
     "student_id": "test123",
     "message_text": "Hello, I'm feeling a bit anxious today",
     "metadata": {}
   }
   ```
5. Click "Execute"
6. You should see a response with analysis results

### Test 3: Frontend Connection

1. Go to: `http://localhost:5173`
2. Try sending a message through the UI
3. Check if it connects to the backend

---

## What You Should See

### Window 1: Ollama
```
Ollama is running...
```

### Window 2: Backend
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Window 3: Frontend
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Browser
- Frontend: `http://localhost:5173` ✅
- Backend API Docs: `http://localhost:8000/docs` ✅

---

## Troubleshooting

### Problem: "Ollama not found" or connection error

**Solution:**
1. Make sure Ollama is installed
2. Start Ollama: `ollama serve`
3. Verify: `curl http://localhost:11434/api/tags`

### Problem: Backend won't start - "Module not found"

**Solution:**
1. Make sure virtual environment is activated: `venv\Scripts\activate`
2. Reinstall dependencies: `pip install -r requirements.txt`

### Problem: Backend error - "Database connection failed"

**Solution:**
1. Check PostgreSQL is running (Windows Services)
2. Verify `.env` file has correct database credentials
3. Test connection: `psql -U mentalhealth_user -d mentalhealth_db`

### Problem: Frontend won't start - "npm not found"

**Solution:**
1. Install Node.js from https://nodejs.org
2. Restart your terminal
3. Try again: `npm install`

### Problem: Frontend can't connect to backend

**Solution:**
1. Check `frontend/.env` has: `VITE_API_URL=http://localhost:8000/api`
2. Make sure backend is running on port 8000
3. Restart frontend after changing `.env`

### Problem: "Port already in use"

**Solution:**
- Backend (port 8000): Change in `app/main.py` or kill the process using port 8000
- Frontend (port 5173): Vite will automatically use the next available port

---

## Quick Reference: All Commands

### Terminal 1: Ollama
```cmd
ollama serve
```

### Terminal 2: Backend
```cmd
cd C:\Users\shree\Desktop\archi
venv\Scripts\activate
uvicorn app.main:app --reload
```

### Terminal 3: Frontend
```cmd
cd C:\Users\shree\Desktop\archi\frontend
npm run dev
```

---

## Stopping the System

To stop everything:
1. **Frontend**: Press `Ctrl+C` in Terminal 3
2. **Backend**: Press `Ctrl+C` in Terminal 2
3. **Ollama**: Press `Ctrl+C` in Terminal 1

---

## Next Steps

Once everything is running:
1. Explore the frontend at `http://localhost:5173`
2. Check API documentation at `http://localhost:8000/docs`
3. Try sending test messages
4. Review the analysis results

---

## Need Help?

If you encounter any issues:
1. Check the error messages in the terminal windows
2. Verify all services are running (Ollama, PostgreSQL, Backend, Frontend)
3. Check the `.env` files are configured correctly
4. Make sure all ports are available (8000 for backend, 5173 for frontend, 11434 for Ollama)

