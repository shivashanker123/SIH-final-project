# Quick Start - Your System is Running! 🎉

## ✅ Everything is Working

You now have:
- ✅ **Ollama** running with Mistral model
- ✅ **Backend API** running on `http://localhost:8000`
- ✅ **Frontend** running on `http://localhost:8080`

---

## 🚀 What You Can Do Now

### 1. Explore the Frontend

Visit: `http://localhost:8080`

You should see the **MindCare** landing page with:
- Navigation menu
- Login options (Student/Admin)
- Resources and information

### 2. Test the Backend API

Visit: `http://localhost:8000/docs`

This is the **Swagger UI** - an interactive API documentation where you can:
- See all available endpoints
- Test API calls directly
- View request/response formats

### 3. Send a Test Message

**Option A: Using the Frontend**
1. Go to `http://localhost:8080`
2. Navigate to the AI chat interface
3. Enter a student ID (e.g., "test123")
4. Send a test message like: "I'm feeling anxious today"

**Option B: Using the API Directly**
1. Go to `http://localhost:8000/docs`
2. Find `/api/messages/process`
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
6. See the analysis results!

---

## 📋 Key URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:8080 | Your web application |
| **Backend API** | http://localhost:8000 | API server |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Health Check** | http://localhost:8000/health | Verify backend is running |

---

## 🧪 Test the Complete Flow

### Step 1: Send a Message
1. Open `http://localhost:8000/docs`
2. Use the `/api/messages/process` endpoint
3. Send: `{"student_id": "test123", "message_text": "I've been feeling down lately", "metadata": {}}`

### Step 2: Check Analysis
The response will include:
- Risk assessment
- Concern indicators
- Safety flags
- LLM-generated response (from your Mistral model!)

### Step 3: View Risk Profile
Use `/api/alerts/risk-profile/{student_id}` to see the student's risk profile

---

## 🎯 Next Steps

### For Development:
1. **Explore the code:**
   - Backend: `app/` folder
   - Frontend: `frontend/src/` folder
   - Models: `app/models/` folder

2. **Customize:**
   - Adjust risk thresholds in `.env`
   - Modify LLM prompts in `app/services/`
   - Update frontend UI in `frontend/src/components/`

### For Testing:
1. **Test different scenarios:**
   - Low-risk messages
   - High-risk messages
   - Crisis situations

2. **Monitor the system:**
   - Check database: `psql -U mentalhealth_user -d mentalhealth_db`
   - View logs in terminal windows
   - Check API responses

---

## 🛑 Stopping the System

When you're done:

1. **Frontend Terminal:** Press `Ctrl+C`
2. **Backend Terminal:** Press `Ctrl+C`
3. **Ollama Terminal:** Press `Ctrl+C`

---

## 💡 Tips

- **Keep all 3 terminals open** while using the system
- **Check the terminal outputs** for any errors or logs
- **Use the API docs** (`/docs`) to explore all features
- **The database stores everything** - messages, analyses, risk profiles

---

## 🆘 Need Help?

- **Backend issues:** Check Terminal 2 for error messages
- **Frontend issues:** Check browser console (F12)
- **LLM issues:** Check Terminal 1 (Ollama) is running
- **Database issues:** Verify PostgreSQL is running

---

## 🎉 You're All Set!

Your mental health monitoring system is fully operational. Start exploring and testing!

