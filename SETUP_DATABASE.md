# Database Setup Guide

## Quick Fix for Permission Error

You're getting this error because your database user doesn't have permission to create tables. Here's how to fix it:

## Option 1: Use the Setup Script (Easiest)

1. **Run the PowerShell script:**
   ```powershell
   .\setup_database.ps1
   ```

2. **Follow the prompts** - it will ask for:
   - Database name
   - Username
   - Password

3. **The script will:**
   - Grant necessary permissions
   - Update your `.env` file automatically

## Option 2: Manual Setup

### Step 1: Find PostgreSQL Installation

PostgreSQL is usually installed at:
- `C:\Program Files\PostgreSQL\18\bin\`
- `C:\Program Files\PostgreSQL\17\bin\`
- `C:\Program Files\PostgreSQL\16\bin\`

### Step 2: Open PostgreSQL Command Line

1. Open **Command Prompt** (as Administrator if needed)
2. Navigate to PostgreSQL bin directory:
   ```cmd
   cd "C:\Program Files\PostgreSQL\18\bin"
   ```
   (Replace `18` with your PostgreSQL version)

3. Connect to PostgreSQL:
   ```cmd
   psql -U postgres
   ```
   (Enter your PostgreSQL password when prompted)

### Step 3: Grant Permissions

Once connected, run these SQL commands (replace `your_username` and `your_database` with your actual values):

```sql
-- If you need to create a database first:
CREATE DATABASE mentalhealth_db;

-- Grant permissions (replace 'your_username' with your actual username)
GRANT ALL PRIVILEGES ON SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON DATABASE mentalhealth_db TO your_username;

-- If you want to make the user the owner:
ALTER SCHEMA public OWNER TO your_username;
```

### Step 4: Create Your .env File

Create a file named `.env` in the project root with:

```env
# Database Configuration
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/mentalhealth_db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# LLM Provider: "openai" or "local"
LLM_PROVIDER=local

# Local LLM Configuration
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**Replace:**
- `your_username` with your PostgreSQL username
- `your_password` with your PostgreSQL password
- `mentalhealth_db` with your database name

### Step 5: Run Migrations

After setting up permissions and `.env` file:

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Common Issues

### "psql: command not found"
- Make sure you're in the PostgreSQL bin directory
- Or add PostgreSQL bin to your PATH environment variable

### "password authentication failed"
- Make sure you're using the correct PostgreSQL password
- If you forgot it, you may need to reset it or use the `postgres` superuser

### "database does not exist"
- Create the database first: `CREATE DATABASE mentalhealth_db;`

## Need Help?

If you're still having issues:
1. Make sure PostgreSQL is running (check Windows Services)
2. Verify your database name, username, and password are correct
3. Try using the `postgres` superuser temporarily to test

