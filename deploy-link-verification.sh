#!/bin/bash

echo "========================================"
echo "🚀 Deploying Link-Based Verification"
echo "========================================"
echo ""

# Configuration
SERVER="ubuntu@193.111.11.98"
PORT="3022"
BACKEND_PATH="/var/www/vazifa/backend"
FRONTEND_PATH="/var/www/vazifa/frontend"

echo "📦 Deployment Details:"
echo "   Server: $SERVER"
echo "   Backend: $BACKEND_PATH"
echo "   Frontend: $FRONTEND_PATH"
echo ""
echo "========================================"
echo ""

# Step 1: Deploy Backend Files
echo "📤 Step 1: Uploading backend files..."
echo ""

echo "  📄 Uploading phone-verification model..."
scp -P $PORT backend/models/phone-verification.js $SERVER:$BACKEND_PATH/models/

echo "  📄 Uploading phone-auth controller..."
scp -P $PORT backend/controllers/phone-auth-controller.js $SERVER:$BACKEND_PATH/controllers/

echo "  📄 Uploading auth routes..."
scp -P $PORT backend/routes/auth.js $SERVER:$BACKEND_PATH/routes/

echo "  📄 Uploading send-notification lib..."
scp -P $PORT backend/libs/send-notification.js $SERVER:$BACKEND_PATH/libs/

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

# Step 3: Deploy Frontend Files
echo "📤 Step 3: Uploading frontend files..."
echo ""

echo "  📄 Uploading verify route..."
scp -P $PORT frontend/app/routes/verify.\$token.tsx $SERVER:$FRONTEND_PATH/app/routes/

echo ""
echo "✅ Frontend files uploaded!"
echo ""
echo "========================================"
echo ""

# Step 4: Rebuild and Restart Frontend
echo "🔨 Step 4: Rebuilding frontend..."
echo ""

ssh -p $PORT $SERVER << 'EOF'
cd /var/www/vazifa/frontend
echo "📦 Installing dependencies..."
npm install --silent
echo "🔨 Building frontend..."
npm run build
echo "🔄 Restarting frontend..."
pm2 restart vazifa-frontend
sleep 3
echo "📊 Frontend status:"
pm2 list | grep vazifa-frontend
EOF

echo ""
echo "✅ Frontend rebuilt and restarted!"
echo ""
echo "========================================"
echo ""

# Step 5: Verification
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 What was deployed:"
echo "   ✅ Link-based phone verification (SMS with links)"
echo "   ✅ Task links in SMS notifications"
echo "   ✅ New verify route: /verify/:token"
echo ""
echo "🧪 Testing Instructions:"
echo ""
echo "1. Register with phone number:"
echo "   https://protocol.oci.tj/sign-up"
echo ""
echo "2. Check SMS for verification link:"
echo "   Format: https://protocol.oci.tj/verify/TOKEN"
echo ""
echo "3. Click link to verify phone"
echo ""
echo "4. Create task and assign to user with phone"
echo "   SMS should include task link"
echo ""
echo "📱 SMS Message Formats:"
echo ""
echo "Verification:"
echo "  'Подтвердите регистрацию в Protocol:"
echo "   https://protocol.oci.tj/verify/abc123"
echo "   Ссылка действительна 10 минут.'"
echo ""
echo "Task Assignment:"
echo "  '📋 Новая задача: Task Title"
echo "   Открыть задачу:"
echo "   https://protocol.oci.tj/task/TASK_ID'"
echo ""
echo "========================================"
echo ""
echo "🎉 Ready to test!"
