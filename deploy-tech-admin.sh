#!/bin/bash

# Tech Admin Deployment Script
# Deploys tech admin functionality to production server

set -e  # Exit on error

# Server configuration
SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"
BACKEND_DIR="/var/www/vazifa/backend"
TECH_ADMIN_EMAIL="latifrjdev@gmail.com"
TECH_ADMIN_PASSWORD="fwr123456"

echo "=========================================="
echo "🚀 Tech Admin Deployment"
echo "=========================================="
echo ""

# Step 1: Commit changes locally
echo "📦 Step 1: Committing changes to Git..."
git add backend/models/users.js
git add backend/middleware/tech-admin-middleware.js
git add backend/controllers/tech-admin-controller.js
git add backend/routes/tech-admin.js
git add backend/routes/index.js
git add backend/create-tech-admin.js
git add frontend/app/types/index.ts
git add frontend/app/providers/auth-context.tsx
git add frontend/app/routes/dashboard/tech-admin.tsx
git add .gitignore

git commit -m "feat: Add Tech Admin role and dashboard

- Add tech_admin role to User model
- Create tech admin middleware with access control
- Implement 13 API endpoints for system monitoring
- Add frontend dashboard with live stats
- Update .gitignore to exclude .env and .md files
- Add role helper functions to auth context
- Implement user, task, SMS, and system management" || echo "No changes to commit"

echo "✅ Changes committed"
echo ""

# Step 2: Push to GitHub
echo "📤 Step 2: Pushing to GitHub..."
git push origin main || git push origin master
echo "✅ Pushed to GitHub"
echo ""

# Step 3: Deploy to production server
echo "🌐 Step 3: Deploying to production server..."
echo "Server: $SSH_HOST:$SSH_PORT"
echo "Directory: $BACKEND_DIR"
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

echo "📂 Navigating to backend directory..."
cd /var/www/vazifa/backend

echo "🔄 Resetting local changes..."
git reset --hard HEAD

echo "🔄 Pulling latest changes from Git..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "✅ Code deployed successfully"
ENDSSH

echo ""
echo "=========================================="
echo "👤 Creating Tech Admin User on Server"
echo "=========================================="
echo ""

# Step 4: Create tech admin user on production
echo "Creating tech admin: $TECH_ADMIN_EMAIL"

ssh -p $SSH_PORT $SSH_HOST << ENDSSH
set -e

cd /var/www/vazifa/backend

echo "👤 Creating tech admin user using create-tech-admin.js script..."
node create-tech-admin.js $TECH_ADMIN_EMAIL

ENDSSH

echo ""
echo "=========================================="
echo "🔄 Restarting Backend Server"
echo "=========================================="
echo ""

# Step 5: Restart PM2
ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

echo "🔄 Restarting PM2..."
pm2 restart backend || pm2 restart all

echo "✅ Backend restarted"
echo ""
echo "📊 PM2 Status:"
pm2 list
ENDSSH

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎉 Tech Admin has been deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Login at: https://protocol.oci.tj/sign-in"
echo "2. Email: $TECH_ADMIN_EMAIL"
echo "3. Password: [provided]"
echo "4. You'll be auto-redirected to: /dashboard/tech-admin"
echo ""
echo "🔧 Tech Admin Features:"
echo "  ✓ System Health Monitoring"
echo "  ✓ SMS Logs & Analytics"
echo "  ✓ User Management"
echo "  ✓ Task Management"
echo "  ✓ Database Statistics"
echo ""
echo "=========================================="
