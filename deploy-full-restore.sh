#!/bin/bash

# Full restore deployment - cleans and deploys all changes

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"

echo "=========================================="
echo "🚀 Full Restore Deployment"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

echo "📂 Backend Directory..."
cd /var/www/vazifa/backend

echo "🧹 Cleaning all untracked files..."
git clean -fd

echo "🔄 Resetting to HEAD..."
git reset --hard HEAD

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔄 Restarting backend..."
pm2 restart vazifa-backend || pm2 restart backend || pm2 restart all

echo ""
echo "✅ Backend deployed!"
echo ""

echo "📂 Frontend Directory..."
cd /var/www/vazifa/frontend

echo "🧹 Cleaning all untracked files..."
git clean -fd

echo "🔄 Resetting to HEAD..."
git reset --hard HEAD

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "🔄 Restarting frontend..."
pm2 restart vazifa-frontend || pm2 restart frontend || pm2 restart all

echo ""
echo "✅ Frontend deployed!"
echo ""

echo "📊 PM2 Status:"
pm2 list

ENDSSH

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎯 Your changes are now live:"
echo "URL: https://protocol.oci.tj"
echo ""
echo "✅ Changes restored:"
echo "  - Welcome page removed"
echo "  - Sign-in without Apple login"
echo "  - Phone authentication added"
echo "  - Registration updated"
echo ""
echo "=========================================="
