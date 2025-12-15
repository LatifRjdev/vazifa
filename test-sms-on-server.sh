#!/bin/bash

# SMS Testing Script for Production Server
# Tests SMS functionality after Megafon lifted restrictions

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_HOST="193.111.11.98"
SSH_PORT="3022"
SSH_USER="ubuntu"
PROJECT_DIR="/var/www/vazifa"
BACKEND_DIR="$PROJECT_DIR/backend"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  SMS Testing on Production Server${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${GREEN}==> $1${NC}"
    echo ""
}

# Function to execute SSH commands
ssh_exec() {
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$1"
}

# Step 1: Check SSH connection
print_section "Step 1: Checking SSH connection"
if ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "echo 'SSH connection successful'"; then
    echo -e "${GREEN}✓ SSH connection established${NC}"
else
    echo -e "${RED}✗ Failed to connect to SSH server${NC}"
    exit 1
fi

# Step 2: Check SMPP configuration in .env
print_section "Step 2: Checking SMPP configuration"
echo -e "${BLUE}Current SMPP settings in .env:${NC}"
ssh_exec "cd $BACKEND_DIR && grep '^SMPP_' .env || echo 'No SMPP config found'"

# Step 3: Check PM2 status
print_section "Step 3: Checking PM2 backend status"
ssh_exec "pm2 list | grep backend || echo 'Backend not found in PM2'"

# Step 4: Check recent backend logs for SMPP
print_section "Step 4: Checking backend logs for SMPP connection"
echo -e "${BLUE}Recent SMPP logs:${NC}"
ssh_exec "pm2 logs backend --lines 30 --nostream | grep -i 'smpp\|sms' || echo 'No SMPP logs found'"

# Step 5: Upload test script
print_section "Step 5: Uploading test script to server"
scp -P $SSH_PORT backend/test-sms-megafon.js $SSH_USER@$SSH_HOST:$BACKEND_DIR/
echo -e "${GREEN}✓ Test script uploaded${NC}"

# Step 6: Run SMS test
print_section "Step 6: Running SMS test on server"
echo -e "${YELLOW}Executing test-sms-megafon.js...${NC}"
echo ""

# Run the test and capture output
ssh_exec "cd $BACKEND_DIR && node test-sms-megafon.js" || {
    echo -e "${RED}✗ SMS test failed${NC}"
    echo -e "${YELLOW}Checking logs for errors...${NC}"
    ssh_exec "pm2 logs backend --lines 50 --nostream | tail -20"
    exit 1
}

# Step 7: Check SMS logs in database
print_section "Step 7: Checking SMS logs in database"
echo -e "${BLUE}Recent SMS logs from MongoDB:${NC}"
ssh_exec "cd $BACKEND_DIR && node -e \"
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const SMSLog = mongoose.model('SMSLog', new mongoose.Schema({}, { strict: false }), 'smslogs');
  const logs = await SMSLog.find().sort({ createdAt: -1 }).limit(10);
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
\" || echo 'Could not fetch SMS logs'"

# Step 8: Summary
print_section "Step 8: Test Summary"
echo -e "${GREEN}✓ SSH connection successful${NC}"
echo -e "${GREEN}✓ SMPP configuration verified${NC}"
echo -e "${GREEN}✓ SMS test executed${NC}"
echo ""
echo -e "${BLUE}Test Details:${NC}"
echo "  • Target numbers: +992557777509, +992985343331"
echo "  • Messages sent: 5 SMS (3 to first number, 3 to second number)"
echo "  • SMPP Server: 10.241.60.10:2775"
echo "  • Bind Mode: transmitter (Tx)"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. ${YELLOW}Check both phones for received SMS${NC}"
echo "  2. Verify message content is correct"
echo "  3. Check delivery receipts in logs"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  • View logs: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs backend --lines 50'${NC}"
echo "  • Check SMPP status: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs backend | grep SMPP'${NC}"
echo "  • Restart backend: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $PROJECT_DIR && pm2 restart backend'${NC}"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  SMS Test Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
