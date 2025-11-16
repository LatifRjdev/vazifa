#!/bin/bash

echo "🚀 Deploying Routing Fix..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Committing routing fixes...${NC}"
git add frontend/app/routes.ts frontend/app/components/layout/sidebar-component.tsx
git commit -m "Fix: Correct React Router 7 nested route configuration

- Add dashboard/ prefix to all nested dashboard routes
- Fix settings route path from workspace-setting to settings
- Remove duplicate my-tasks route outside layout
- This fixes 404 errors on nested routes like /dashboard/my-tasks"

echo -e "${YELLOW}Step 2: Pushing to repository...${NC}"
git push origin main

echo -e "${YELLOW}Step 3: Deploying to production server...${NC}"
ssh root@45.93.136.101 << 'ENDSSH'
cd /root/vazifa

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding frontend..."
cd frontend
npm run build

echo "Restarting frontend with PM2..."
pm2 restart vazifa-frontend

echo "✅ Frontend restarted successfully!"
pm2 status

ENDSSH

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🧪 Test these URLs:"
echo "   https://protocol.oci.tj/dashboard"
echo "   https://protocol.oci.tj/dashboard/my-tasks"
echo "   https://protocol.oci.tj/dashboard/all-tasks"
echo "   https://protocol.oci.tj/dashboard/achieved"
echo "   https://protocol.oci.tj/dashboard/settings"
