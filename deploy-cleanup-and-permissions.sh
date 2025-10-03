#!/bin/bash

# Deployment script for user cleanup and permission changes
# This script will:
# 1. Upload modified files to the production server
# 2. Run the database cleanup script
# 3. Restart the backend service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configuration
SERVER_USER="root"
SERVER_HOST="165.232.65.247"
REMOTE_PATH="/root/vazifa"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment: Cleanup & Permissions${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Upload modified backend files
echo -e "\n${YELLOW}Step 1: Uploading modified backend files...${NC}"

echo "Uploading task-controller.js..."
scp backend/controllers/task-controller.js ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/backend/controllers/

echo "Uploading cleanup-database.js..."
scp backend/cleanup-database.js ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/backend/

echo "Uploading routes/index.js..."
scp backend/routes/index.js ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/backend/routes/

echo -e "${GREEN}✓ Files uploaded successfully${NC}"

# Step 2: Run cleanup script on server
echo -e "\n${YELLOW}Step 2: Running cleanup script on server...${NC}"
echo -e "${RED}WARNING: This will delete users and tasks!${NC}"
echo "The script will show what will be deleted before proceeding."

ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /root/vazifa/backend
echo "Running cleanup script..."
node cleanup-database.js
ENDSSH

echo -e "${GREEN}✓ Cleanup completed${NC}"

# Step 3: Restart backend service
echo -e "\n${YELLOW}Step 3: Restarting backend service...${NC}"

ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /root/vazifa/backend
echo "Restarting backend with PM2..."
pm2 restart vazifa-backend
pm2 save
echo "Waiting for service to start..."
sleep 3
pm2 status
ENDSSH

echo -e "${GREEN}✓ Backend service restarted${NC}"

# Step 4: Verify deployment
echo -e "\n${YELLOW}Step 4: Verifying deployment...${NC}"

ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /root/vazifa/backend
echo "Checking backend logs..."
pm2 logs vazifa-backend --lines 20 --nostream
ENDSSH

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Changes applied:${NC}"
echo "1. ✓ Member role restrictions added (can't edit task title/description/assignees)"
echo "2. ✓ Database cleaned up (users and tasks deleted as specified)"
echo "3. ✓ Workspace/Project routes removed from backend"
echo "4. ✓ Backend service restarted"
echo ""
echo -e "${YELLOW}Note:${NC} Frontend changes for workspace/project removal will need separate deployment"
