#!/bin/bash

# Configuration
BASE_URL="http://localhost:3001/users"
EMAIL="testuser_$(date +%s)@example.com"
USERNAME="user_$(date +%s)"
PASSWORD="Password123!"

echo "🚀 Starting Comprehensive User Service Verification"
echo "Target: $BASE_URL"
echo "Test User: $EMAIL / $USERNAME"

# 1. REGISTER
echo -e "\n1️⃣  Testing Registration..."
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"username\": \"$USERNAME\", \"password\": \"$PASSWORD\", \"role\": \"viewer\"}" > register_response.json
cat register_response.json
echo ""

# 1.5 VERIFY USER (Database Hack for Test)
echo -e "\nTesting: Manually verifying user in DB to allow login..."
docker exec streamverse-postgres-1 psql -U postgres -d streamverse -c "UPDATE users SET status = 'active', email_verified_at = NOW() WHERE email = '$EMAIL';" > /dev/null
echo "✅ User forcefully verified in DB"


# 2. LOGIN
echo -e "\n2️⃣  Testing Login..."
# Capture cookies for refresh token
curl -s -c cookies.txt -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" > login_response.json
cat login_response.json
ACCESS_TOKEN=$(cat login_response.json | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo ""

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed, cannot proceed with protected routes."
  exit 1
fi
echo "✅ Access Token Received: ${ACCESS_TOKEN:0:10}..."

# 3. REFRESH TOKEN
echo -e "\n3️⃣  Testing Refresh Token..."
# Use cookies from login
curl -s -b cookies.txt -c cookies_refreshed.txt -X POST "$BASE_URL/refresh" > refresh_response.json
cat refresh_response.json
NEW_ACCESS_TOKEN=$(cat refresh_response.json | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo ""

if [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "❌ Refresh failed."
else
  echo "✅ Refresh Successful: ${NEW_ACCESS_TOKEN:0:10}..."
fi

# 4. MAGIC LINK REQUEST
echo -e "\n4️⃣  Testing Magic Link Request..."
curl -s -X POST "$BASE_URL/auth/magic-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}" > magic_link_response.json
cat magic_link_response.json
echo ""

# 5. OTP REQUEST
echo -e "\n5️⃣  Testing OTP Request..."
curl -s -X POST "$BASE_URL/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$EMAIL\", \"type\": \"email\"}" > otp_request_response.json
cat otp_request_response.json
echo ""

# 6. OTP VERIFY (Manual Step Simulation)
echo -e "\n6️⃣  Testing OTP Verify..."
# Retrieve OTP from Redis
OTP_CODE=$(docker exec streamverse-redis-1 redis-cli get "otp:$EMAIL")
echo "   Retrieved OTP from Redis: $OTP_CODE"

if [ -z "$OTP_CODE" ]; then
  echo "❌ Could not retrieve OTP from Redis (expired or not sent)."
else 
  curl -s -X POST "$BASE_URL/auth/otp/verify" \
    -H "Content-Type: application/json" \
    -d "{\"identifier\": \"$EMAIL\", \"code\": \"$OTP_CODE\"}" > otp_verify_response.json
  cat otp_verify_response.json
  echo ""
fi

# 7. LOGOUT
echo -e "\n7️⃣  Testing Logout..."
curl -s -b cookies_refreshed.txt -X POST "$BASE_URL/logout" > logout_response.json
cat logout_response.json
echo ""

echo "✨ Verification Complete"
rm -f register_response.json login_response.json refresh_response.json magic_link_response.json otp_request_response.json otp_verify_response.json logout_response.json cookies.txt cookies_refreshed.txt
