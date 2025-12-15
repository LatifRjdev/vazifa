#!/bin/bash

echo "========================================"
echo "📱 Phone Verification API Test"
echo "========================================"
echo ""

# Configuration
API_URL="https://ptapi.oci.tj/api-v1/auth/resend-code"
PHONE_NUMBER="+992557777509"  # Change this to your test phone number

echo "🔧 Configuration:"
echo "   API URL: $API_URL"
echo "   Phone Number: $PHONE_NUMBER"
echo ""
echo "========================================"
echo ""

# Test 1: Send verification code via API
echo "📤 Test 1: Sending verification code request to API..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE_NUMBER\"}")

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "📊 API Response:"
echo "   Status Code: $HTTP_STATUS"
echo "   Response Body:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ API request successful!"
else
    echo "❌ API request failed with status $HTTP_STATUS"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check if API is accessible"
    echo "   2. Verify phone number format"
    echo "   3. Check rate limiting"
    exit 1
fi

echo ""
echo "========================================"
echo ""

# Test 2: Check backend logs for SMS sending
echo "📋 Test 2: Checking backend logs for SMS activity..."
echo ""
echo "⏳ Waiting 2 seconds for SMS processing..."
sleep 2
echo ""

ssh -p 3022 ubuntu@193.111.11.98 << 'EOF'
echo "🔍 Recent SMS activity from backend logs:"
echo "========================================"
pm2 logs vazifa-backend --lines 50 --nostream | grep -A 5 -B 2 -E "(Verification code:|SMS|SMPP|$PHONE_NUMBER)" | tail -30
echo ""
echo "========================================"
echo ""
echo "📊 SMPP Connection Status:"
pm2 logs vazifa-backend --lines 20 --nostream | grep -i "smpp.*connect" | tail -5
echo ""
echo "========================================"
echo ""
echo "✅ Queue Status:"
pm2 logs vazifa-backend --lines 20 --nostream | grep -i "queue.*job" | tail -5
EOF

echo ""
echo "========================================"
echo "✅ TEST COMPLETED"
echo "========================================"
echo ""
echo "📱 Next Steps:"
echo "   1. Check your phone for SMS"
echo "   2. SMS may take 1-3 minutes to deliver"
echo "   3. Look for verification code in logs above"
echo "   4. Multi-part SMS may arrive in 2 separate messages"
echo ""
