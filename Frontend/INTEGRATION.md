# Frontend-Backend Integration Guide

## ✅ Integration Complete!

Your frontend has been successfully integrated with the backend API.

## What Was Done

1. **Created API Service** (`src/services/api.ts`)
   - All API functions to communicate with backend
   - TypeScript interfaces for type safety
   - Error handling

2. **Created Student Context** (`src/contexts/StudentContext.tsx`)
   - Manages student ID across the app
   - Persists to localStorage

3. **Updated AIInterface Component**
   - Now uses real backend API instead of mock data
   - Displays real risk profiles
   - Shows crisis alerts when needed

4. **Updated App.tsx**
   - Added StudentProvider wrapper

5. **Updated Backend CORS**
   - Allows requests from frontend (port 8080)

6. **Environment Configuration**
   - Created `.env` file (you may need to create this manually if it was blocked)

## Setup Instructions

### 1. Create Environment File

If `.env` file doesn't exist in `frontend/` folder, create it with:

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Set Student ID (Optional)

The AIInterface will use `student123` as default. To set a real student ID:

```typescript
import { useStudent } from '@/contexts/StudentContext';

const { setStudentId } = useStudent();
setStudentId('your-student-id-here');
```

### 3. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd archi
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Test the Integration

1. Open `http://localhost:8080`
2. Navigate to a page with AIInterface
3. Send a message like "I've been feeling stressed"
4. Check browser console for API responses
5. Verify risk profile updates in real-time

## API Endpoints Available

All endpoints are accessible via `src/services/api.ts`:

- `processMessage()` - Send student messages
- `getRiskProfile()` - Get current risk assessment
- `getMessageAnalyses()` - Get message history
- `submitPHQ2()` - Submit PHQ-2 assessment
- `checkCSSRSTrigger()` - Check if C-SSRS needed
- `submitCSSRS()` - Submit C-SSRS assessment
- `submitFeedback()` - Submit counselor feedback
- `getPendingAlerts()` - Get alerts for counselors

## Troubleshooting

### CORS Errors
- Make sure backend is running on port 8000
- Check that CORS in `app/main.py` includes your frontend URL

### API Connection Errors
- Verify backend is running: `http://localhost:8000/docs`
- Check `.env` file has correct `VITE_API_URL`
- Check browser console for detailed error messages

### Student ID Not Set
- AIInterface defaults to `student123` if no student ID is set
- Set it using `useStudent()` hook in your login component

## Next Steps

1. **Connect Login**: Update `StudentLogin.tsx` to set student ID on login
2. **Add Alerts Page**: Use `getPendingAlerts()` in `Alerts.tsx`
3. **Add Assessments**: Integrate PHQ-2 and C-SSRS in `ScreeningTests.tsx`
4. **Add Risk Dashboard**: Display risk profiles in student dashboard

## Example Usage in Other Components

```typescript
import { useStudent } from '@/contexts/StudentContext';
import { getRiskProfile, processMessage } from '@/services/api';

function MyComponent() {
  const { studentId } = useStudent();
  
  const handleAction = async () => {
    if (!studentId) return;
    
    try {
      const profile = await getRiskProfile(studentId);
      console.log('Risk level:', profile.overall_risk);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <button onClick={handleAction}>Check Risk</button>;
}
```




