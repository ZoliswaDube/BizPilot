# PowerShell script to remove old test files
# Run this script to clean up old tests before using the new test suite

Write-Host "🧹 Removing old test files..." -ForegroundColor Yellow

# Remove old test directory
if (Test-Path "src\__tests__") {
    Remove-Item -Path "src\__tests__" -Recurse -Force
    Write-Host "✅ Removed src\__tests__" -ForegroundColor Green
} else {
    Write-Host "ℹ️  src\__tests__ not found" -ForegroundColor Cyan
}

# Remove old mobile tests
if (Test-Path "mobile\src\__tests__") {
    Remove-Item -Path "mobile\src\__tests__" -Recurse -Force
    Write-Host "✅ Removed mobile\src\__tests__" -ForegroundColor Green
} else {
    Write-Host "ℹ️  mobile\src\__tests__ not found" -ForegroundColor Cyan
}

# Remove old hook test (we have a new one)
if (Test-Path "src\hooks\__tests__\useOrders.test.ts") {
    Remove-Item -Path "src\hooks\__tests__\useOrders.test.ts" -Force
    Write-Host "✅ Removed src\hooks\__tests__\useOrders.test.ts" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Old tests removed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 New test structure:" -ForegroundColor Cyan
Write-Host "  src/tests/integration/    - Integration tests"
Write-Host "  src/tests/unit/           - Unit tests"
Write-Host "  src/store/__tests__/      - Store tests (kept)"
Write-Host "  src/hooks/__tests__/      - Hook tests (kept)"
Write-Host "  src/utils/__tests__/      - Utility tests (kept)"
Write-Host "  src/components/auth/__tests__/ - Component tests (kept)"
Write-Host "  src/lib/__tests__/        - Library tests (kept)"
Write-Host ""
Write-Host "▶️  Run tests with: pnpm test" -ForegroundColor Yellow
Write-Host "📊 Run with coverage: pnpm test --coverage" -ForegroundColor Yellow
Write-Host ""
