# Database Setup Script for Windows
# This script helps you set up PostgreSQL permissions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "Step 1: Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
}
if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
}
if (-not (Test-Path $pgPath)) {
    Write-Host "ERROR: PostgreSQL not found in standard locations." -ForegroundColor Red
    Write-Host "Please install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found PostgreSQL at: $pgPath" -ForegroundColor Green
Write-Host ""

# Get database information
Write-Host "Step 2: Database Configuration" -ForegroundColor Yellow
$dbName = Read-Host "Enter database name (e.g., mentalhealth_db)"
$dbUser = Read-Host "Enter database username (e.g., postgres or your_username)"
$dbPassword = Read-Host "Enter database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host ""
Write-Host "Step 3: Granting permissions..." -ForegroundColor Yellow

# Create SQL commands
$sqlCommands = @"
-- Grant schema permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO $dbUser;

-- Grant database permissions
GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;

-- Make user owner of public schema (if needed)
ALTER SCHEMA public OWNER TO $dbUser;
"@

# Write SQL to temp file
$tempSql = "$env:TEMP\setup_db_$(Get-Date -Format 'yyyyMMddHHmmss').sql"
$sqlCommands | Out-File -FilePath $tempSql -Encoding UTF8

Write-Host ""
Write-Host "Run these commands in PostgreSQL:" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan
Write-Host $sqlCommands
Write-Host "-----------------------------------" -ForegroundColor Cyan
Write-Host ""

$runNow = Read-Host "Do you want to run these commands now? (y/n)"
if ($runNow -eq "y" -or $runNow -eq "Y") {
    Write-Host "Connecting to PostgreSQL..." -ForegroundColor Yellow
    $env:PGPASSWORD = $dbPasswordPlain
    & $pgPath -U $dbUser -d $dbName -f $tempSql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Permissions granted!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to grant permissions. Please run the SQL commands manually." -ForegroundColor Red
    }
    Remove-Item $tempSql -ErrorAction SilentlyContinue
} else {
    Write-Host ""
    Write-Host "Please run these SQL commands manually:" -ForegroundColor Yellow
    Write-Host "1. Open Command Prompt" -ForegroundColor White
    Write-Host "2. Navigate to: $($pgPath.Replace('\bin\psql.exe', '\bin'))" -ForegroundColor White
    Write-Host "3. Run: psql -U $dbUser -d $dbName" -ForegroundColor White
    Write-Host "4. Copy and paste the SQL commands shown above" -ForegroundColor White
}

Write-Host ""
Write-Host "Step 4: Update .env file" -ForegroundColor Yellow
$databaseUrl = "postgresql://$dbUser`:$dbPasswordPlain@localhost:5432/$dbName"
Write-Host "Add this to your .env file:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=$databaseUrl" -ForegroundColor White
Write-Host ""

$updateEnv = Read-Host "Do you want to update .env file now? (y/n)"
if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
    $envContent = @"
# Database Configuration
DATABASE_URL=$databaseUrl

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
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "SUCCESS: .env file updated!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setup complete! You can now run:" -ForegroundColor Green
Write-Host "  alembic revision --autogenerate -m `"Initial migration`"" -ForegroundColor White
Write-Host "  alembic upgrade head" -ForegroundColor White

