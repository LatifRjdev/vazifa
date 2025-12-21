#!/bin/bash

# Clean deployment - removes all untracked files

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"

echo "=========================================="
echo "🧹 Clean & Deploy"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

echo "📂 Root directory..."
cd /var/www/vazifa

echo "🧹 Cleaning ALL untracked files recursively..."
git clean -ffdx

echo "🔄 Resetting to HEAD..."
git reset --hard HEAD

echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "📂 Backend..."
cd backend
echo "📦 Installing backend dependencies..."
npm install
echo "🔄 Restarting backend..."
pm2 restart vazifa-backend || pm2 restart backend || pm2 restart all

echo ""
echo "📂 Frontend..."
cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install
echo "🔨 Building frontend..."
npm run build
echo "🔄 Restarting frontend..."
pm2 restart vazifa-frontend || pm2 restart frontend || pm2 restart all

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "✅ All services restarted!"

ENDSSH

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎯 Check your site:"
echo "URL: https://protocol.oci.tj"
echo ""
echo "✅ Your changes should now be live!"
echo "=========================================="
