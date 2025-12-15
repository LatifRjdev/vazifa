#!/bin/bash

# Deploy frontend with tech admin dashboard

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"

echo "=========================================="
echo "🚀 Deploying Frontend Tech Admin"
echo "=========================================="
echo ""

echo "Step 1: Checking backend logs..."
ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
echo "📊 Backend PM2 Status:"
pm2 list

echo ""
echo "📝 Last 20 lines of backend logs:"
pm2 logs backend --lines 20 --nostream
ENDSSH

echo ""
echo "=========================================="
echo "Step 2: Deploying Frontend"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

cd /var/www/vazifa/frontend

echo "📂 Current directory: $(pwd)"

echo "🔄 Pulling latest code..."
git reset --hard HEAD
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "🔄 Restarting frontend with PM2..."
pm2 restart frontend || pm2 restart all

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "✅ Frontend deployed and restarted!"

ENDSSH

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎯 Now try to login again:"
echo "URL: https://protocol.oci.tj/sign-in"
echo "Email: latifrjdev@gmail.com"
echo "Password: fwr123456"
echo ""
echo "You should be redirected to: /dashboard/tech-admin"
echo "=========================================="
