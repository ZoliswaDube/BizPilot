# Create Seed File Script
# Creates a new seed SQL file for database seeding

param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

Write-Host "=== Creating New Seed File ===" -ForegroundColor Cyan
Write-Host ""

# Validate seed name
if ($Name -notmatch '^[a-z0-9_]+$') {
    Write-Host "ERROR: Seed name must contain only lowercase letters, numbers, and underscores" -ForegroundColor Red
    Write-Host "Example: south_african_customers" -ForegroundColor Yellow
    exit 1
}

# Generate timestamp (YYYYMMDDHHMMSS format)
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$fileName = "${timestamp}_seed_${Name}.sql"
$migrationsPath = Join-Path $PSScriptRoot ".." "supabase" "migrations"

# Ensure migrations directory exists
if (-not (Test-Path $migrationsPath)) {
    Write-Host "Creating migrations directory: $migrationsPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $migrationsPath -Force | Out-Null
}

# Create seed file
$filePath = Join-Path $migrationsPath $fileName

$template = @"
-- =====================================================
-- SEED DATA: $Name
-- =====================================================
-- Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Description: [Add description here]
-- =====================================================

-- IMPORTANT: This is a seed file, not a migration
-- It will be run when you execute: npm run db:seed

-- Example: Insert sample data
-- INSERT INTO table_name (column1, column2) VALUES
-- ('value1', 'value2'),
-- ('value3', 'value4');

-- Example: Insert with business_id reference
-- INSERT INTO customers (
--   business_id, 
--   name, 
--   email, 
--   phone
-- ) VALUES 
-- (
--   (SELECT id FROM businesses LIMIT 1),
--   'John Doe',
--   'john@example.com',
--   '+27 11 123 4567'
-- );

-- Example: Conditional insert (only if table is empty)
-- INSERT INTO categories (name, description)
-- SELECT 'Electronics', 'Electronic goods and devices'
-- WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics');

-- Add your seed data here:


-- =====================================================
-- END OF SEED
-- =====================================================
"@

Set-Content -Path $filePath -Value $template -Encoding UTF8

Write-Host "SUCCESS: Seed file created!" -ForegroundColor Green
Write-Host ""
Write-Host "File: $fileName" -ForegroundColor Cyan
Write-Host "Path: $filePath" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit the seed file and add your INSERT statements" -ForegroundColor Gray
Write-Host "  2. Test locally: npm run db:seed:local" -ForegroundColor Gray
Write-Host "  3. Seed production: npm run db:seed" -ForegroundColor Gray
Write-Host ""

# Open file in default editor (optional)
$openFile = Read-Host "Open the file now? (Y/n)"
if ($openFile -eq "" -or $openFile -eq "Y" -or $openFile -eq "y") {
    Start-Process $filePath
}
