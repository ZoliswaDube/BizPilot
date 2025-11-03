

param(
    [string]$SeedFile = "20251028000000_seed_south_african_data.sql"
)

Write-Host "=== Direct Database Seeding ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Validate
if (-not $env:SUPABASE_PROJECT_ID) {
    Write-Host "ERROR: SUPABASE_PROJECT_ID not set" -ForegroundColor Red
    exit 1
}

if (-not $env:SUPABASE_DB_PASSWORD) {
    Write-Host "ERROR: SUPABASE_DB_PASSWORD not set" -ForegroundColor Red
    exit 1
}

# Build connection string
$projectId = $env:SUPABASE_PROJECT_ID
$password = $env:SUPABASE_DB_PASSWORD
$connectionString = "postgresql://postgres:$password@db.$projectId.supabase.co:5432/postgres"

# Get seed file path
$seedPath = Join-Path $PSScriptRoot ".." "supabase" "migrations" $SeedFile

if (-not (Test-Path $seedPath)) {
    Write-Host "ERROR: Seed file not found: $seedPath" -ForegroundColor Red
    exit 1
}

Write-Host "Seed file: $SeedFile" -ForegroundColor Green
Write-Host "Database: db.$projectId.supabase.co" -ForegroundColor Gray
Write-Host ""

# Check if psql is available
$psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlAvailable) {
    Write-Host "Running seed via psql..." -ForegroundColor Cyan
    
    # Set PGPASSWORD environment variable
    $env:PGPASSWORD = $password
    
    # Run psql
    psql -h "db.$projectId.supabase.co" -U postgres -d postgres -p 5432 -f $seedPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Database seeded!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Seeding failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "psql not found. Using Supabase API..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For direct SQL execution, you have two options:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Install PostgreSQL client tools" -ForegroundColor White
    Write-Host "  Download from: https://www.postgresql.org/download/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Use Supabase Dashboard" -ForegroundColor White
    Write-Host "  1. Go to: https://app.supabase.com/project/$projectId/sql/new" -ForegroundColor Gray
    Write-Host "  2. Copy contents from: $seedPath" -ForegroundColor Gray
    Write-Host "  3. Paste and run in SQL Editor" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3: Use Supabase CLI direct connection" -ForegroundColor White
    Write-Host "  npx supabase db execute --project-ref $projectId --file $seedPath" -ForegroundColor Gray
    
    # Try supabase db execute
    Write-Host ""
    Write-Host "Attempting via Supabase CLI..." -ForegroundColor Cyan
    
    npx supabase db execute --project-ref $projectId --file $seedPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Database seeded!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Please use one of the options above" -ForegroundColor Red
        exit 1
    }
}
