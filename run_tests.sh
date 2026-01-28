#!/bin/bash
# Test Runner Script for ApplianceIQ
# Runs all tests and generates reports

echo "========================================"
echo "ApplianceIQ Testing Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in backend directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Error: Must run from backend directory${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/Scripts/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q -r requirements.txt

echo ""
echo -e "${YELLOW}Running Tests...${NC}"
echo ""

# Run unit tests
echo -e "${YELLOW}[1/4] Running unit tests (test_auth.py)...${NC}"
pytest tests/test_auth.py -v --tb=short
UNIT_RESULT=$?

echo ""
echo -e "${YELLOW}[2/4] Running API endpoint tests (test_api_endpoints.py)...${NC}"
pytest tests/test_api_endpoints.py -v --tb=short
API_RESULT=$?

echo ""
echo -e "${YELLOW}[3/4] Generating coverage report...${NC}"
pytest tests/ --cov=backend --cov-report=html --cov-report=term-missing -q
COVERAGE_RESULT=$?

echo ""
echo -e "${YELLOW}[4/4] Running all tests with timeout...${NC}"
pytest tests/ -v --timeout=30
ALL_RESULT=$?

echo ""
echo "========================================"
echo "Test Results Summary"
echo "========================================"

if [ $UNIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Unit Tests: PASSED${NC}"
else
    echo -e "${RED}✗ Unit Tests: FAILED${NC}"
fi

if [ $API_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ API Tests: PASSED${NC}"
else
    echo -e "${RED}✗ API Tests: FAILED${NC}"
fi

if [ $COVERAGE_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Coverage Report: GENERATED${NC}"
    echo -e "${YELLOW}  See htmlcov/index.html for details${NC}"
else
    echo -e "${YELLOW}⚠ Coverage Report: GENERATION SKIPPED${NC}"
fi

if [ $ALL_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ All Tests: PASSED${NC}"
else
    echo -e "${RED}✗ All Tests: FAILED${NC}"
fi

echo ""
echo "========================================"

# Exit with failure if any test failed
if [ $UNIT_RESULT -ne 0 ] || [ $API_RESULT -ne 0 ] || [ $ALL_RESULT -ne 0 ]; then
    exit 1
fi

exit 0
