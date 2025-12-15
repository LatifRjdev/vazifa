#!/bin/bash

# Quick script to create tech admin on server and restart

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"
TECH_ADMIN_EMAIL="latifrjdev@gmail.com"

echo "=========================================="
echo "👤 Creating Tech Admin on Production"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << ENDSSH
set -e

cd /var/www/vazifa/backend

echo "👤 Creating tech admin: $TECH_ADMIN_EMAIL"
node create-tech-admin.js $TECH_ADMIN_EMAIL

echo ""
echo "🔄 Restarting backend..."
pm2 restart backend || pm2 restart all

echo ""
echo "📊 PM2 Status:"
pm2 list

ENDSSH

echo ""
echo "=========================================="
echo "✅ DONE!"
echo "=========================================="
echo ""
echo "📋 Login Details:"
echo "URL: https://protocol.oci.tj/sign-in"
echo "Email: $TECH_ADMIN_EMAIL"
echo "Password: fwr123456"
echo ""
echo "You'll be auto-redirected to: /dashboard/tech-admin"
echo "=========================================="
