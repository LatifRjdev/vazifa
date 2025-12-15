#!/bin/bash

echo "========================================"
echo "🔧 Deploying Registration Fixes"
echo "========================================"
echo ""

# Configuration
SERVER="ubuntu@193.111.11.98"
PORT="3022"
BACKEND_PATH="/var/www/vazifa/backend"
FRONTEND_PATH="/var/www/vazifa/frontend"

echo "📦 Fixes to deploy:"
echo "   1. Email sparse index (already configured)"
echo "   2. Link-based verification in registration"
echo "   3. Updated sign-up UI (show link message)"
echo ""
echo "========================================"
echo ""

# Step 1: Deploy Backend
echo "📤 Step 1: Uploading backend files..."
echo ""

echo "  📄 Uploading auth controller..."
scp -P $PORT backend/controllers/auth-controller.js $SERVER:$BACKEND_PATH/controllers/

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
echo "   ✅ Email sparse index (no more duplicate null error)"
echo "   ✅ Link-based SMS verification (no code input)"
echo "   ✅ Updated UI shows 'Check SMS for link' message"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "1. Delete test users (if needed):"
echo "   ssh -p 3022 ubuntu@193.111.11.98"
echo "   cd /var/www/vazifa/backend"
echo "   node cleanup-test-users.js"
echo ""
echo "2. Register new user:"
echo "   https://protocol.oci.tj/sign-up"
echo ""
echo "3. Expected behavior:"
echo "   - Registration form submitted"
echo "   - NO email duplicate error"
echo "   - Message: 'Проверьте SMS для ссылки подтверждения'"
echo "   - SMS contains verification LINK (not code)"
echo "   - Click link → auto-verified → login"
echo ""
echo "========================================"
echo ""
echo "🎉 Ready to test!"
