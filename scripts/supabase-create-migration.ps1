# Supabase Create Migration Script
# This script creates a new SQL migration file with a timestamp

param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

Write-Host "=== Creating New Supabase Migration ===" -ForegroundColor Cyan
Write-Host ""

# Validate migration name
if ($Name -notmatch '^[a-z0-9_]+$') {
    Write-Host "ERROR: Migration name must contain only lowercase letters, numbers, and underscores" -ForegroundColor Red
    Write-Host "Example: create_products_table" -ForegroundColor Yellow
    exit 1
}

# Generate timestamp (YYYYMMDDHHMMSS format)
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$fileName = "${timestamp}_${Name}.sql"
$migrationsPath = Join-Path $PSScriptRoot ".." "supabase" "migrations"

# Ensure migrations directory exists
if (-not (Test-Path $migrationsPath)) {
    Write-Host "Creating migrations directory: $migrationsPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $migrationsPath -Force | Out-Null
}

# Create migration file
$filePath = Join-Path $migrationsPath $fileName

$template = @"
-- Migration: $Name
-- Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Description: [Add description here]

-- ============================================
-- UP Migration
-- ============================================

-- Add your SQL statements here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================

-- Add rollback statements here (optional)
-- Example:
-- DROP TABLE IF EXISTS example_table;
"@

Set-Content -Path $filePath -Value $template -Encoding UTF8

Write-Host "SUCCESS: Migration file created!" -ForegroundColor Green
Write-Host ""
Write-Host "File: $fileName" -ForegroundColor Cyan
Write-Host "Path: $filePath" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit the migration file and add your SQL statements" -ForegroundColor Gray
Write-Host "  2. Test locally with: npx supabase db reset" -ForegroundColor Gray
Write-Host "  3. Push to remote: .\scripts\supabase-push-migrations.ps1" -ForegroundColor Gray
Write-Host ""

# Open file in default editor (optional)
$openFile = Read-Host "Open the file now? (Y/n)"
if ($openFile -eq "" -or $openFile -eq "Y" -or $openFile -eq "y") {
    Start-Process $filePath
}
"@

Set-Content -Path $filePath -Value $template -Encoding UTF8

Write-Host "SUCCESS: Migration file created!" -ForegroundColor Green
Write-Host ""
Write-Host "File: $fileName" -ForegroundColor Cyan
Write-Host "Path: $filePath" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit the migration file and add your SQL statements" -ForegroundColor Gray
Write-Host "  2. Test locally with: npx supabase db reset" -ForegroundColor Gray
Write-Host "  3. Push to remote: .\scripts\supabase-push-migrations.ps1" -ForegroundColor Gray
Write-Host ""

# Open file in default editor (optional)
$openFile = Read-Host "Open the file now? (Y/n)"
if ($openFile -eq "" -or $openFile -eq "Y" -or $openFile -eq "y") {
    Start-Process $filePath
}
