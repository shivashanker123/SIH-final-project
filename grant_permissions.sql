-- Grant schema permissions to mentalhealth_user
GRANT ALL PRIVILEGES ON SCHEMA public TO mentalhealth_user;
ALTER SCHEMA public OWNER TO mentalhealth_user;

-- Make sure the user can connect to the database
GRANT CONNECT ON DATABASE mentalhealth_db TO mentalhealth_user;

