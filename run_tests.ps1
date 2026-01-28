# Test Runner Script for ApplianceIQ (PowerShell)
# Runs all tests and generates reports

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ApplianceIQ Testing Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if in backend directory
if (-not (Test-Path "requirements.txt")) {
    Write-Host "Error: Must run from backend directory" -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt

Write-Host ""
Write-Host "Running Tests..." -ForegroundColor Yellow
Write-Host ""

# Run unit tests
Write-Host "[1/4] Running unit tests (test_auth.py)..." -ForegroundColor Yellow
pytest tests/test_auth.py -v --tb=short
$UNIT_RESULT = $LASTEXITCODE

Write-Host ""
Write-Host "[2/4] Running API endpoint tests (test_api_endpoints.py)..." -ForegroundColor Yellow
pytest tests/test_api_endpoints.py -v --tb=short
$API_RESULT = $LASTEXITCODE

Write-Host ""
Write-Host "[3/4] Generating coverage report..." -ForegroundColor Yellow
pytest tests/ --cov=backend --cov-report=html --cov-report=term-missing -q
$COVERAGE_RESULT = $LASTEXITCODE

Write-Host ""
Write-Host "[4/4] Running all tests with timeout..." -ForegroundColor Yellow
pytest tests/ -v --timeout=30
$ALL_RESULT = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($UNIT_RESULT -eq 0) {
    Write-Host "✓ Unit Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Unit Tests: FAILED" -ForegroundColor Red
}

if ($API_RESULT -eq 0) {
    Write-Host "✓ API Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ API Tests: FAILED" -ForegroundColor Red
}

if ($COVERAGE_RESULT -eq 0) {
    Write-Host "✓ Coverage Report: GENERATED" -ForegroundColor Green
    Write-Host "  See htmlcov/index.html for details" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Coverage Report: GENERATION SKIPPED" -ForegroundColor Yellow
}

if ($ALL_RESULT -eq 0) {
    Write-Host "✓ All Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ All Tests: FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Exit with failure if any test failed
if ($UNIT_RESULT -ne 0 -or $API_RESULT -ne 0 -or $ALL_RESULT -ne 0) {
    exit 1
}

exit 0
