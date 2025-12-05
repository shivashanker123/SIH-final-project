# Script to fix database user password and permissions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database User Password Reset" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL installation
$pgPath = $null
$versions = @(18, 17, 16, 15, 14)
foreach ($version in $versions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $testPath) {
        $pgPath = $testPath
        break
    }
}

if (-not $pgPath) {
    Write-Host "ERROR: PostgreSQL not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or provide the path manually." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found PostgreSQL at: $pgPath" -ForegroundColor Green
Write-Host ""

# Get postgres password
$postgresPassword = Read-Host "Enter PostgreSQL 'postgres' user password" -AsSecureString
$postgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword))

Write-Host ""
Write-Host "Resetting password and granting permissions..." -ForegroundColor Yellow

# SQL commands to fix user
$sqlCommands = @"
-- Reset password
ALTER USER mentalhealth_user WITH PASSWORD 'shreeyan';

-- Grant schema permissions
\c mentalhealth_db
GRANT ALL PRIVILEGES ON SCHEMA public TO mentalhealth_user;
ALTER SCHEMA public OWNER TO mentalhealth_user;
GRANT ALL PRIVILEGES ON DATABASE mentalhealth_db TO mentalhealth_user;

-- Verify
\du mentalhealth_user
"@

# Write to temp file
$tempSql = "$env:TEMP\fix_user_$(Get-Date -Format 'yyyyMMddHHmmss').sql"
$sqlCommands | Out-File -FilePath $tempSql -Encoding UTF8

# Set password environment variable
$env:PGPASSWORD = $postgresPasswordPlain

# Run SQL
Write-Host "Executing SQL commands..." -ForegroundColor Yellow
& $pgPath -U postgres -f $tempSql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Password reset and permissions granted!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Cyan
    Write-Host "  alembic revision --autogenerate -m `"Initial migration`"" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to execute SQL commands." -ForegroundColor Red
    Write-Host "Please run these commands manually in psql:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $sqlCommands
}

# Cleanup
Remove-Item $tempSql -ErrorAction SilentlyContinue
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

