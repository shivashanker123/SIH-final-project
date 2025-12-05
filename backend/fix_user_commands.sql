-- Step 1: Reset password for mentalhealth_user
ALTER USER mentalhealth_user WITH PASSWORD 'shreeyan';

-- Step 2: Connect to the database
\c mentalhealth_db

-- Step 3: Grant schema permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO mentalhealth_user;
ALTER SCHEMA public OWNER TO mentalhealth_user;
GRANT ALL PRIVILEGES ON DATABASE mentalhealth_db TO mentalhealth_user;

-- Step 4: Verify user
\du mentalhealth_user

