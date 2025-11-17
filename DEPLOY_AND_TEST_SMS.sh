#!/bin/bash

echo "==========================================="
echo "📱 SMS System Final Deployment & Test"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
cd /var/www/vazifa
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pulled successfully${NC}"
else
    echo -e "${RED}❌ Failed to pull code${NC}"
    exit 1
fi

echo ""

# Step 2: Navigate to backend
echo -e "${YELLOW}Step 2: Navigating to backend...${NC}"
cd /var/www/vazifa/backend
echo -e "${GREEN}✅ In backend directory${NC}"
echo ""

# Step 3: Check dependencies
echo -e "${YELLOW}Step 3: Checking dependencies...${NC}"
npm list smpp bull redis 2>/dev/null
echo -e "${GREEN}✅ Dependencies checked${NC}"
echo ""

# Step 4: Restart backend
echo -e "${YELLOW}Step 4: Restarting backend...${NC}"
pm2 restart vazifa-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend restarted successfully${NC}"
else
    echo -e "${RED}❌ Failed to restart backend${NC}"
    exit 1
fi

# Wait for backend to stabilize
echo "⏳ Waiting 5 seconds for backend to stabilize..."
sleep 5
echo ""

# Step 5: Check backend status
echo -e "${YELLOW}Step 5: Checking backend status...${NC}"
pm2 status vazifa-backend
echo ""

# Step 6: Test SMPP connection
echo -e "${YELLOW}Step 6: Testing SMS to +992905504866...${NC}"
echo "==========================================="
echo ""

node test-sms.js

echo ""
echo "==========================================="
echo "📋 FINAL CHECKLIST"
echo "==========================================="
echo ""
echo "1. ✅ Code pulled from GitHub"
echo "2. ✅ Backend restarted"
echo "3. ✅ Test script executed"
echo ""
echo "❓ Did you receive SMS on +992905504866?"
echo ""
echo "If YES:"
echo "  🎉 System is working!"
echo "  Run: node test-sms-bulk.js (to test all 5 numbers)"
echo ""
echo "If NO:"
echo "  📞 Contact Megafon:"
echo "  1. Ask about sender ID 'Protocol' approval"
echo "  2. Request message trace for today's message IDs"
echo "  3. Confirm bind_transmitter is allowed"
echo ""
echo "==========================================="
