# Supabase Seed Script
# This script seeds your Supabase database with test/production data

param(
    [string]$ProjectId,
    [switch]$Local,
    [string]$SeedFile
)

Write-Host "=== Supabase Database Seeding Script ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Yellow
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

# Determine target
$target = if ($Local) { "local" } else { "remote" }
Write-Host "Target: $target database" -ForegroundColor Cyan
Write-Host ""

# If specific seed file provided
if ($SeedFile) {
    $seedPath = Join-Path $PSScriptRoot ".." "supabase" "migrations" $SeedFile
    
    if (-not (Test-Path $seedPath)) {
        Write-Host "ERROR: Seed file not found: $seedPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Running seed file: $SeedFile" -ForegroundColor Green
    
    if ($Local) {
        # Seed local database
        npx supabase db reset
    } else {
        # Seed remote database
        if (-not $env:SUPABASE_ACCESS_TOKEN) {
            Write-Host "ERROR: SUPABASE_ACCESS_TOKEN not set" -ForegroundColor Red
            exit 1
        }
        
        if (-not $ProjectId) {
            Write-Host "ERROR: SUPABASE_PROJECT_ID not set" -ForegroundColor Red
            exit 1
        }
        
        # Link and push
        npx supabase link --project-ref $ProjectId
        npx supabase db push
    }
} else {
    # Run all seed files (migrations with 'seed' in name)
    $migrationsPath = Join-Path $PSScriptRoot ".." "supabase" "migrations"
    $seedFiles = Get-ChildItem -Path $migrationsPath -Filter "*seed*.sql" | Sort-Object Name
    
    if ($seedFiles.Count -eq 0) {
        Write-Host "No seed files found in migrations folder" -ForegroundColor Yellow
        Write-Host "Seed files should contain 'seed' in their filename" -ForegroundColor Gray
        exit 0
    }
    
    Write-Host "Found $($seedFiles.Count) seed file(s):" -ForegroundColor Green
    $seedFiles | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    
    if ($Local) {
        Write-Host "Resetting local database with all migrations (including seeds)..." -ForegroundColor Cyan
        npx supabase db reset
    } else {
        Write-Host "Pushing migrations to remote database (including seeds)..." -ForegroundColor Cyan
        
        if (-not $env:SUPABASE_ACCESS_TOKEN) {
            Write-Host "ERROR: SUPABASE_ACCESS_TOKEN not set" -ForegroundColor Red
            exit 1
        }
        
        if (-not $ProjectId) {
            Write-Host "ERROR: SUPABASE_PROJECT_ID not set" -ForegroundColor Red
            exit 1
        }
        
        npx supabase link --project-ref $ProjectId
        npx supabase db push
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Database seeded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verify in:" -ForegroundColor Cyan
    if ($Local) {
        Write-Host "  Supabase Studio: http://localhost:54323" -ForegroundColor Gray
    } else {
        Write-Host "  Supabase Dashboard: https://app.supabase.com/project/$ProjectId" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Seeding failed" -ForegroundColor Red
    exit 1
}
