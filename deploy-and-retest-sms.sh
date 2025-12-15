#!/bin/bash

# Quick Deploy and Retest SMS with Fixed TON/NPI Parameters

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SSH_HOST="193.111.11.98"
SSH_PORT="3022"
SSH_USER="ubuntu"
PROJECT_DIR="/var/www/vazifa"
BACKEND_DIR="$PROJECT_DIR/backend"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Deploy Fixed SMPP Code & Retest SMS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: Upload fixed send-sms.js
echo -e "${GREEN}==> Step 1: Uploading fixed send-sms.js${NC}"
scp -P $SSH_PORT backend/libs/send-sms.js $SSH_USER@$SSH_HOST:$BACKEND_DIR/libs/
echo -e "${GREEN}✓ File uploaded${NC}"

# Step 2: Restart backend
echo -e "${GREEN}==> Step 2: Restarting backend${NC}"
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $PROJECT_DIR && pm2 restart vazifa-backend"
echo -e "${GREEN}✓ Backend restarted${NC}"

# Wait for backend to start
echo "Waiting 5 seconds for backend to initialize..."
sleep 5

# Step 3: Check backend status
echo -e "${GREEN}==> Step 3: Checking backend status${NC}"
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "pm2 list | grep vaz"

# Step 4: Run SMS test
echo -e "${GREEN}==> Step 4: Running SMS test${NC}"
echo -e "${YELLOW}Sending SMS to +992557777509 and +992985343331...${NC}"
echo ""

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $BACKEND_DIR && node test-sms-megafon.js"

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Test Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}📱 Check your phones for SMS!${NC}"
echo ""
echo -e "${GREEN}Changes made:${NC}"
echo "  • source_addr_ton: 5 (Alphanumeric sender)"
echo "  • source_addr_npi: 0 (Unknown for alphanumeric)"
echo "  • dest_addr_ton: 1 (International number)"
echo "  • dest_addr_npi: 1 (ISDN/E.164)"
echo ""
echo -e "${GREEN}If SMS still don't arrive:${NC}"
echo "  1. Check PM2 logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs vazifa-backend'"
echo "  2. Look for delivery receipts in logs"
echo "  3. Contact Megafon for sender ID registration"
echo ""
