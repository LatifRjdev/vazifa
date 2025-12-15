#!/bin/bash

echo "========================================"
echo "🔧 SMPP Bind Parameter Fix Deployment"
echo "========================================"
echo ""

SERVER="ubuntu@193.111.11.98"
PORT="3022"
REMOTE_PATH="/var/www/vazifa/backend"

echo "📤 Step 1: Uploading fixed send-sms.js to server..."
scp -P $PORT backend/libs/send-sms.js $SERVER:$REMOTE_PATH/libs/send-sms.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload file"
    exit 1
fi

echo "✅ File uploaded successfully"
echo ""

echo "🔄 Step 2: Restarting backend with PM2..."
ssh -p $PORT $SERVER << 'EOF'
cd /var/www/vazifa/backend
pm2 restart vazifa-backend
echo ""
echo "⏳ Waiting 5 seconds for restart..."
sleep 5
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "📋 Recent logs:"
pm2 logs vazifa-backend --lines 20 --nostream
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "🧪 Next Steps:"
echo "   Run the SMS test with:"
echo "   ssh -p 3022 ubuntu@193.111.11.98 \"cd /var/www/vazifa/backend && node test-two-numbers.js\""
echo ""
