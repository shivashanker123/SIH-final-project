# Frontend Troubleshooting Guide

## Quick Fix: Use the Correct Port

**Your frontend runs on port 8080, NOT 5173!**

✅ **Correct URL:** `http://localhost:8080`  
❌ **Wrong URL:** `http://localhost:5173`

---

## Step-by-Step Troubleshooting

### Step 1: Check Terminal 3 (Frontend)

Look at your frontend terminal window. You should see something like:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

**If you see errors:**
- Red error messages = problem
- Share the error message

**If you see "ready":**
- Frontend is running correctly ✅
- Move to Step 2

---

### Step 2: Open Browser Console

1. Open `http://localhost:8080` in your browser
2. Press **F12** (or right-click → Inspect)
3. Click the **Console** tab
4. Look for **red error messages**

**Common errors and fixes:**

#### Error: "Failed to fetch" or "Network error"
- **Fix:** Make sure backend is running on port 8000
- Check: `http://localhost:8000/health` should work

#### Error: "Cannot find module" or "Import error"
- **Fix:** Stop frontend (Ctrl+C) and run:
  ```cmd
  npm install
  npm run dev
  ```

#### Error: "React" or "ReactDOM" errors
- **Fix:** Reinstall dependencies:
  ```cmd
  rm -rf node_modules
  npm install
  npm run dev
  ```

---

### Step 3: Check Network Tab

1. In browser DevTools (F12), click **Network** tab
2. Refresh the page (F5)
3. Look for **red/failed requests**

**If you see failed requests:**
- Check the URL - should be `http://localhost:8080`
- Check if backend is running: `http://localhost:8000/health`

---

### Step 4: Clear Browser Cache

Sometimes cached files cause issues:

1. Press **Ctrl + Shift + Delete**
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (Ctrl + F5)

---

### Step 5: Try Hard Refresh

- **Windows:** `Ctrl + F5` or `Ctrl + Shift + R`
- This forces the browser to reload everything

---

### Step 6: Check if React is Loading

1. Open browser console (F12)
2. Type: `React`
3. Press Enter

**If you see an error:**
- React isn't loading properly
- Try reinstalling: `npm install`

**If you see an object:**
- React is loaded ✅
- The issue is elsewhere

---

### Step 7: Verify All Services

Make sure all 3 terminals are running:

**Terminal 1 - Ollama:**
```cmd
ollama serve
```

**Terminal 2 - Backend:**
```cmd
uvicorn app.main:app --reload
```
Test: `http://localhost:8000/health`

**Terminal 3 - Frontend:**
```cmd
npm run dev
```
Test: `http://localhost:8080`

---

## Common Issues

### Blank White Page

**Possible causes:**
1. JavaScript error (check console)
2. CSS not loading
3. React not rendering

**Fix:**
1. Open browser console (F12)
2. Check for errors
3. Try hard refresh (Ctrl + F5)

### "This site can't be reached"

**Possible causes:**
1. Frontend not running
2. Wrong port

**Fix:**
1. Check Terminal 3 is running
2. Use `http://localhost:8080` (not 5173)

### Page loads but nothing shows

**Possible causes:**
1. React component error
2. Routing issue
3. API connection failed

**Fix:**
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify backend is running

---

## Quick Test Commands

### Test Backend:
```cmd
curl http://localhost:8000/health
```
Should return: `{"status": "healthy"}`

### Test Frontend:
```cmd
curl http://localhost:8080
```
Should return HTML content

### Test Ollama:
```cmd
curl http://localhost:11434/api/tags
```
Should return JSON with models

---

## Still Not Working?

Share these details:
1. What you see in Terminal 3 (frontend terminal)
2. Any error messages from browser console (F12)
3. What happens when you visit `http://localhost:8080`
4. Screenshot if possible

