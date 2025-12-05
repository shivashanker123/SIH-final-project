-- Reset password for mentalhealth_user
ALTER USER mentalhealth_user WITH PASSWORD 'shreeyan';

-- Verify user exists and has correct permissions
\du mentalhealth_user

