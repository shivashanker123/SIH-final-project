# Admin Login Walkthrough

## Quick Start Guide

### Step 1: Create Admin User (First Time Only)

If you haven't created an admin user yet, run this script:

```bash
cd backend
python scripts/create_admin_user.py
```

This creates an admin user with:
- **Email:** `admin@gmail.com`
- **Password:** `admin`
- **Student ID:** `admin_001`

### Step 2: Start the Servers

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```
Backend runs on: `http://localhost:8000`

**Frontend:**
```bash
cd Frontend
npm run dev
```
Frontend runs on: `http://localhost:8080`

### Step 3: Access Admin Login

1. Open your browser and go to: **http://localhost:8080/admin-login**

2. You'll see the Admin Portal login page with:
   - Shield icon
   - Email input field
   - Password input field
   - "Access Dashboard" button

### Step 4: Login

Enter the credentials:
- **Email:** `admin@gmail.com`
- **Password:** `admin`

Click **"Access Dashboard"**

### Step 5: What Happens After Login

✅ **Success:**
- You'll see a success toast: "Welcome back! Logged in as admin@gmail.com"
- You're automatically redirected to `/admin-dashboard`
- Your session is stored in localStorage:
  - `admin_token` - Authentication token
  - `admin_email` - Your email
  - `admin_id` - Your student ID

❌ **If login fails:**
- You'll see an error message
- Common errors:
  - "Invalid email or password" - Wrong credentials
  - "Authentication failed" - Backend connection issue

### Step 6: Admin Dashboard Features

Once logged in, you can access:
- **Dashboard Overview** - Student statistics and wellness trends
- **Results & Alerts** - Assessment results and risk alerts
- **Student Requests** - Counseling and support requests
- **Resources** - Mental health resources

### Troubleshooting

**Problem: "Invalid email or password"**
- Solution: Make sure you ran `create_admin_user.py` script
- Verify the admin user exists in the database

**Problem: Blank screen after login**
- Check browser console (F12) for errors
- Verify backend is running on port 8000
- Check network tab for failed API calls

**Problem: Can't access admin dashboard**
- Clear browser localStorage
- Try logging in again
- Check if backend API is responding: `http://localhost:8000/health`

### Security Notes

⚠️ **Important:**
- Default credentials (`admin/admin`) are for development only
- Change the password in production
- The admin user has `is_admin=True` flag in the database
- All admin activities are logged for security

### Quick Test

To verify admin user exists:
```bash
# Check if admin exists
curl http://localhost:8000/api/auth/check-email/admin@gmail.com
```

Expected response:
```json
{
  "exists": true,
  "student_id": "admin_001",
  "email": "admin@gmail.com",
  "name": "Administrator"
}
```

---

**That's it!** You're now ready to use the admin dashboard. 🎉


