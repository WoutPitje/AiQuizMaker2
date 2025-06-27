#!/bin/bash

# Test script for Auth API endpoints
# Make sure the API server is running before running this script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

# Functions
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test registration
test_register() {
    print_status "Testing user registration..."
    
    # Use timestamp to ensure unique email
    TIMESTAMP=$(date +%s)
    TEST_EMAIL="testuser${TIMESTAMP}@example.com"
    
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${TEST_EMAIL}\",
            \"password\": \"TestPassword123\",
            \"firstName\": \"Test\",
            \"lastName\": \"User\"
        }")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "User registration successful"
        # Extract access token for further tests
        ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        echo "Access Token: ${ACCESS_TOKEN:0:20}..."
    else
        print_error "User registration failed: $RESPONSE"
        return 1
    fi
}

# Test login
test_login() {
    print_status "Testing user login..."
    
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${TEST_EMAIL}\",
            \"password\": \"TestPassword123\"
        }")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "User login successful"
        # Extract access token for further tests
        ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        echo "Access Token: ${ACCESS_TOKEN:0:20}..."
    else
        print_error "User login failed: $RESPONSE"
        return 1
    fi
}

# Test protected route
test_profile() {
    print_status "Testing protected profile endpoint..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "No access token available. Run login test first."
        return 1
    fi
    
    RESPONSE=$(curl -s -X GET "${API_URL}/auth/profile" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$RESPONSE" | grep -q '"email"'; then
        print_success "Profile endpoint accessible"
        echo "Profile: $RESPONSE"
    else
        print_error "Profile endpoint failed: $RESPONSE"
        return 1
    fi
}

# Test invalid login
test_invalid_login() {
    print_status "Testing invalid login..."
    
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${TEST_EMAIL}\",
            \"password\": \"WrongPassword\"
        }")
    
    if echo "$RESPONSE" | grep -q '"error":"Unauthorized"'; then
        print_success "Invalid login correctly rejected"
    else
        print_error "Invalid login test failed: $RESPONSE"
        return 1
    fi
}

# Test duplicate registration
test_duplicate_registration() {
    print_status "Testing duplicate user registration..."
    
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testuser@example.com",
            "password": "TestPassword123",
            "firstName": "Test",
            "lastName": "User"
        }')
    
    if echo "$RESPONSE" | grep -q '"error":"Conflict"'; then
        print_success "Duplicate registration correctly rejected"
    else
        print_error "Duplicate registration test failed: $RESPONSE"
        return 1
    fi
}

# Main execution
echo "Starting Auth API Tests..."
echo "=========================="

# Check if server is running
if ! curl -s "${API_URL}/" > /dev/null; then
    print_error "API server is not running at $API_URL"
    print_status "Please start the server with: npm run start:dev"
    exit 1
fi

print_success "API server is running"

# Run tests
test_register || exit 1
test_login || exit 1
test_profile || exit 1
test_invalid_login || exit 1
test_duplicate_registration || exit 1

echo ""
print_success "All auth tests passed!"
echo "=========================="