# Supabase Pull Schema Script
# This script pulls the current database schema from your remote Supabase project

param(
    [string]$ProjectId,
    [string]$OutputPath = ".\supabase\schema.sql"
)

Write-Host "=== Supabase Schema Pull Script ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env
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

# Set ProjectId from parameter or environment variable
if (-not $ProjectId) {
    $ProjectId = $env:SUPABASE_PROJECT_ID
}

# Validate required environment variables
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "ERROR: SUPABASE_ACCESS_TOKEN not set" -ForegroundColor Red
    exit 1
}

if (-not $ProjectId) {
    Write-Host "ERROR: SUPABASE_PROJECT_ID not set" -ForegroundColor Red
    exit 1
}

# Link to remote project
Write-Host "Linking to Supabase project: $ProjectId" -ForegroundColor Cyan
npx supabase link --project-ref $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to link to Supabase project" -ForegroundColor Red
    exit 1
}

# Pull schema from remote
Write-Host ""
Write-Host "Pulling schema from remote database..." -ForegroundColor Cyan
npx supabase db pull

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Schema pulled successfully!" -ForegroundColor Green
    Write-Host "Schema saved to: supabase/schema.sql" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to pull schema" -ForegroundColor Red
    exit 1
}
