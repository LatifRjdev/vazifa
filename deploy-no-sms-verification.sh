#!/bin/bash

echo "========================================"
echo "🚀 Deploying No-SMS Registration"
echo "========================================"
echo ""

# Configuration
SERVER="ubuntu@193.111.11.98"
PORT="3022"
BACKEND_PATH="/var/www/vazifa/backend"
FRONTEND_PATH="/var/www/vazifa/frontend"

echo "📦 Changes to deploy:"
echo "   1. Fixed 'Войти' link (sign-up page)"
echo "   2. Removed SMS verification requirement"
echo "   3. Auto-verify all new registrations"
echo "   4. Direct login after registration"
echo ""
echo "========================================"
echo ""

# Step 1: Deploy Backend
echo "📤 Step 1: Uploading backend changes..."
echo ""

echo "  📄 Uploading auth-controller..."
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
echo "📤 Step 3: Uploading frontend changes..."
echo ""

echo "  📄 Uploading sign-up page..."
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
echo "   ✅ 'Войти' link on sign-up page now works (/ instead of /sign-in)"
echo "   ✅ SMS verification completely removed"
echo "   ✅ Users auto-verified on registration"
echo "   ✅ Direct login after registration (no SMS needed)"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "1. Test 'Войти' Link:"
echo "   - Go to https://protocol.oci.tj/sign-up"
echo "   - Click 'Войти' link at bottom"
echo "   - ✅ Should redirect to home/sign-in page (NO 404!)"
echo ""
echo "2. Test Registration (NO SMS):"
echo "   - Go to https://protocol.oci.tj/sign-up"
echo "   - Fill all fields:"
echo "     * Name: Test User"
echo "     * Phone: +992901234567"
echo "     * Email: test@example.com"
echo "     * Password: test1234"
echo "   - Click 'Создать аккаунт'"
echo "   - ✅ Should immediately login and redirect to dashboard"
echo "   - ✅ NO SMS verification step!"
echo ""
echo "3. Test Login:"
echo "   - Login with the newly created account"
echo "   - ✅ Should work immediately"
echo ""
echo "========================================"
echo ""
echo "🎉 Ready to test!"
