#!/bin/bash

echo "========================================"
echo "🚀 Deploying All Fixes"
echo "========================================"
echo ""

# Configuration
SERVER="ubuntu@193.111.11.98"
PORT="3022"
BACKEND_PATH="/var/www/vazifa/backend"
FRONTEND_PATH="/var/www/vazifa/frontend"

echo "📦 Fixes to deploy:"
echo "   1. Email required (backend + frontend)"
echo "   2. Profile update with better error messages"
echo "   3. Auth controller email handling"
echo ""
echo "========================================"
echo ""

# Step 1: Deploy Backend
echo "📤 Step 1: Uploading backend files..."
echo ""

echo "  📄 Uploading auth routes..."
scp -P $PORT backend/routes/auth.js $SERVER:$BACKEND_PATH/routes/

echo "  📄 Uploading auth controller..."
scp -P $PORT backend/controllers/auth-controller.js $SERVER:$BACKEND_PATH/controllers/

echo "  📄 Uploading user controller..."
scp -P $PORT backend/controllers/user-controller.js $SERVER:$BACKEND_PATH/controllers/

echo ""
echo "✅ Backend files uploaded!"
echo ""
echo "========================================"
echo ""

# Step 2: Restart Backend
echo "🔄 Step 2: Restarting backend..."
echo ""

ssh -p $PORT $SERVER << 'EOF'
cd /var/www/vazifa/backend
echo "🛑 Stopping backend..."
pm2 stop vazifa-backend
sleep 2
echo "🚀 Starting backend..."
pm2 start vazifa-backend
sleep 3
echo "📊 Backend status:"
pm2 list | grep vazifa-backend
EOF

echo ""
echo "✅ Backend restarted!"
echo ""
echo "========================================"
echo ""

# Step 3: Deploy Frontend
echo "📤 Step 3: Uploading frontend files..."
echo ""

echo "  📄 Uploading schema..."
scp -P $PORT frontend/app/utils/schema.ts $SERVER:$FRONTEND_PATH/app/utils/

echo "  📄 Uploading sign-up route..."
scp -P $PORT frontend/app/routes/auth/sign-up.tsx $SERVER:$FRONTEND_PATH/app/routes/auth/

echo ""
echo "✅ Frontend files uploaded!"
echo ""
echo "========================================"
echo ""

# Step 4: Rebuild Frontend
echo "🔨 Step 4: Rebuilding frontend..."
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

# Step 5: Summary
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 What was fixed:"
echo "   ✅ Email now required (backend + frontend)"
echo "   ✅ Profile update shows 'Номер уже используется' error"
echo "   ✅ Auth controller properly handles email"
echo "   ✅ Test user +992985343331 deleted"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "1. Test Email Required:"
echo "   - Go to https://protocol.oci.tj/sign-up"
echo "   - Leave email empty → should show error"
echo "   - Email field shows 'Email *' (not 'необязательно')"
echo ""
echo "2. Test Profile Update:"
echo "   - Login as admin@vazifa2.com"
echo "   - Add phone +992985343331"
echo "   - Should work now (user deleted)"
echo ""
echo "3. Test Registration:"
echo "   - Register with all fields filled"
echo "   - Should receive SMS with verification link"
echo ""
echo "========================================"
echo ""
echo "🎉 Ready to test!"
