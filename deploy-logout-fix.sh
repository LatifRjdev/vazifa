#!/bin/bash

echo "========================================"
echo "🚀 Deploying Logout Fix"
echo "========================================"
echo ""

# Configuration
SERVER="ubuntu@193.111.11.98"
PORT="3022"
FRONTEND_PATH="/var/www/vazifa/frontend"

echo "📦 Fixes to deploy:"
echo "   1. User deleted: +992989328080 / latifrj78@gmail.com"
echo "   2. Logout redirect changed from /sign-in to /"
echo "   3. All auth redirects now use / instead of /sign-in"
echo ""
echo "========================================"
echo ""

# Deploy Frontend
echo "📤 Uploading auth-context fix..."
echo ""

scp -P $PORT frontend/app/providers/auth-context.tsx $SERVER:$FRONTEND_PATH/app/providers/

echo ""
echo "✅ File uploaded!"
echo ""
echo "========================================"
echo ""

# Rebuild Frontend
echo "🔨 Rebuilding frontend..."
echo ""

ssh -p $PORT $SERVER << 'EOF'
cd /var/www/vazifa/frontend
echo "🔨 Building frontend..."
npm run build
echo "🔄 Restarting frontend..."
pm2 restart vazifa-frontend
sleep 3
echo "📊 Frontend status:"
pm2 list | grep vazifa-frontend
EOF

echo ""
echo "✅ Frontend rebuilt!"
echo ""
echo "========================================"
echo ""

# Summary
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 What was fixed:"
echo "   ✅ User deleted: +992989328080 / latifrj78@gmail.com"
echo "   ✅ Logout now redirects to / (home/sign-in)"
echo "   ✅ No more 404 error after logout"
echo ""
echo "🧪 Test Instructions:"
echo ""
echo "1. Test Logout:"
echo "   - Login to https://protocol.oci.tj"
echo "   - Click logout button"
echo "   - Should redirect to home (sign-in page)"
echo "   - NO 404 error!"
echo ""
echo "2. Test Registration:"
echo "   - Go to https://protocol.oci.tj/sign-up"
echo "   - Register with:"
echo "     * Name: Rashid Khan"
echo "     * Phone: +992989328080"
echo "     * Email: latifrj78@gmail.com"
echo "   - Should receive SMS with verification link"
echo ""
echo "========================================"
echo ""
echo "🎉 Ready to test!"
