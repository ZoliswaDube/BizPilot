# Supabase Migration Push Script
# This script pushes SQL migrations to your Supabase database

param(
    [switch]$DryRun,
    [switch]$Force,
    [string]$ProjectId
)

Write-Host "=== Supabase Push Migrations Script ===" -ForegroundColor Cyan
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
    Write-Host "ERROR: SUPABASE_ACCESS_TOKEN not set in environment or .env file" -ForegroundColor Red
    Write-Host "Please set it in your .env file or run:" -ForegroundColor Yellow
    Write-Host '$env:SUPABASE_ACCESS_TOKEN="your_token_here"' -ForegroundColor Gray
    exit 1
}

if (-not $ProjectId) {
    Write-Host "ERROR: SUPABASE_PROJECT_ID not set" -ForegroundColor Red
    Write-Host "Please set it in your .env file or pass it as -ProjectId parameter" -ForegroundColor Yellow
    exit 1
}

# Check if Supabase CLI is installed
try {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Host "Supabase CLI version: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Supabase CLI not found" -ForegroundColor Red
    Write-Host "Install it with: npm install supabase --save-dev" -ForegroundColor Yellow
    exit 1
}

# Link to remote project
Write-Host ""
Write-Host "Linking to Supabase project: $ProjectId" -ForegroundColor Cyan
npx supabase link --project-ref $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to link to Supabase project" -ForegroundColor Red
    exit 1
}

# List pending migrations
Write-Host ""
Write-Host "Checking for pending migrations..." -ForegroundColor Cyan
$migrationsPath = Join-Path $PSScriptRoot ".." "supabase" "migrations"
$migrations = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name

if ($migrations.Count -eq 0) {
    Write-Host "No SQL migration files found in: $migrationsPath" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($migrations.Count) migration file(s):" -ForegroundColor Green
$migrations | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

# Dry run option
if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply migrations" -ForegroundColor Yellow
    exit 0
}

# Push migrations to remote database
Write-Host ""
Write-Host "Pushing migrations to remote database..." -ForegroundColor Cyan

$pushCommand = "npx supabase db push"
if ($Force) {
    $pushCommand += " --force"
    Write-Host "WARNING: Force mode enabled - this will overwrite remote changes!" -ForegroundColor Yellow
}

Write-Host "Executing: $pushCommand" -ForegroundColor Gray
Invoke-Expression $pushCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Migrations pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify migrations in Supabase Dashboard" -ForegroundColor Gray
    Write-Host "  2. Test your application with the new schema" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to push migrations" -ForegroundColor Red
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}
