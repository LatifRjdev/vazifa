#!/bin/bash

# SMPP Configuration Deployment and Testing Script
# This script deploys SMPP configuration to production and tests SMS sending

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
echo -e "${BLUE}  SMPP Configuration Deployment & Testing${NC}"
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

# Step 2: Backup current .env file
print_section "Step 2: Backing up current .env file"
ssh_exec "cd $BACKEND_DIR && cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Backup created${NC}"

# Step 3: Check if SMPP variables already exist
print_section "Step 3: Checking existing SMPP configuration"
if ssh_exec "cd $BACKEND_DIR && grep -q 'SMPP_HOST' .env"; then
    echo -e "${YELLOW}⚠ SMPP configuration already exists${NC}"
    echo -e "Updating existing configuration..."
    
    # Update existing SMPP variables
    ssh_exec "cd $BACKEND_DIR && \
        sed -i 's/^SMPP_HOST=.*/SMPP_HOST=10.241.60.10/' .env && \
        sed -i 's/^SMPP_PORT=.*/SMPP_PORT=2775/' .env && \
        sed -i 's/^SMPP_SYSTEM_ID=.*/SMPP_SYSTEM_ID=Rushdie_Roh/' .env && \
        sed -i 's/^SMPP_PASSWORD=.*/SMPP_PASSWORD=J7PCez/' .env && \
        sed -i 's/^SMPP_SYSTEM_TYPE=.*/SMPP_SYSTEM_TYPE=smpp/' .env && \
        sed -i 's/^SMPP_SOURCE_ADDR=.*/SMPP_SOURCE_ADDR=Protocol/' .env && \
        sed -i 's/^SMPP_BIND_MODE=.*/SMPP_BIND_MODE=transmitter/' .env"
else
    echo -e "Adding new SMPP configuration..."
    
    # Add SMPP configuration after NODE_ENV
    ssh_exec "cd $BACKEND_DIR && \
        sed -i '/^NODE_ENV=production/a\\
\\
# SMPP Configuration (SMS Gateway)\\
SMPP_HOST=10.241.60.10\\
SMPP_PORT=2775\\
SMPP_SYSTEM_ID=Rushdie_Roh\\
SMPP_PASSWORD=J7PCez\\
SMPP_SYSTEM_TYPE=smpp\\
SMPP_SOURCE_ADDR=Protocol\\
SMPP_BIND_MODE=transmitter' .env"
fi
echo -e "${GREEN}✓ SMPP configuration updated${NC}"

# Step 4: Verify configuration
print_section "Step 4: Verifying SMPP configuration"
echo -e "${BLUE}Current SMPP settings:${NC}"
ssh_exec "cd $BACKEND_DIR && grep '^SMPP_' .env"

# Step 5: Restart backend service
print_section "Step 5: Restarting backend service"
ssh_exec "cd $PROJECT_DIR && pm2 restart backend || pm2 start backend/index.js --name backend"
echo -e "${GREEN}✓ Backend service restarted${NC}"

# Wait for service to start
echo "Waiting 5 seconds for service to initialize..."
sleep 5

# Step 6: Check PM2 status
print_section "Step 6: Checking PM2 status"
ssh_exec "pm2 list"

# Step 7: Check backend logs for SMPP connection
print_section "Step 7: Checking SMPP connection in logs"
echo -e "${BLUE}Recent backend logs (SMPP related):${NC}"
ssh_exec "pm2 logs backend --lines 20 --nostream | grep -i 'smpp' || echo 'No SMPP logs yet'"

# Step 8: Run SMS test
print_section "Step 8: Running SMS test"
echo -e "${YELLOW}Running test-sms.js script...${NC}"
echo ""

# Create a test execution script on the server
ssh_exec "cd $BACKEND_DIR && cat > run-sms-test.sh << 'EOFTEST'
#!/bin/bash
cd $BACKEND_DIR
export NODE_ENV=production
node test-sms.js
EOFTEST"

ssh_exec "chmod +x $BACKEND_DIR/run-sms-test.sh"

# Execute the test
ssh_exec "cd $BACKEND_DIR && node test-sms.js" || {
    echo -e "${RED}✗ SMS test failed${NC}"
    echo -e "${YELLOW}Check logs for more details${NC}"
    ssh_exec "pm2 logs backend --lines 50 --nostream"
    exit 1
}

# Step 9: Summary
print_section "Step 9: Deployment Summary"
echo -e "${GREEN}✓ SMPP configuration deployed successfully${NC}"
echo -e "${GREEN}✓ Backend service restarted${NC}"
echo -e "${GREEN}✓ SMS test completed${NC}"
echo ""
echo -e "${BLUE}Configuration Details:${NC}"
echo "  • Host: 10.241.60.10:2775"
echo "  • System ID: Rushdie_Roh"
echo "  • Bind Mode: transmitter (Tx)"
echo "  • Source Address: Protocol"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Check if SMS was received on test phone"
echo "  2. Monitor logs: ${YELLOW}pm2 logs backend${NC}"
echo "  3. Check SMS queue status in Redis"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  • View logs: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs backend'${NC}"
echo "  • Restart: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 restart backend'${NC}"
echo "  • Test SMS: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $BACKEND_DIR && node test-sms.js'${NC}"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
