#!/bin/bash

echo "🔧 Fixing backend .env configuration..."
echo ""

cd /var/www/vazifa/backend

echo "1. Copying .env.production to .env..."
cp .env.production .env
echo "✅ .env created"

echo ""
echo "2. Verifying MONGODB_URI in .env..."
grep "^MONGODB_URI=" .env || echo "❌ MONGODB_URI not found!"

echo ""
echo "3. Restarting backend..."
pm2 restart vazifa-backend

echo ""
echo "4. Waiting 3 seconds..."
sleep 3

echo ""
echo "5. Backend logs (last 15 lines):"
pm2 logs vazifa-backend --lines 15 --nostream

echo ""
echo "6. PM2 Status:"
pm2 list

echo ""
echo "7. Testing MongoDB connection..."
if pm2 logs vazifa-backend --lines 20 --nostream | grep -q "Connected to MongoDB"; then
    echo "✅ Backend connected to MongoDB!"
else
    echo "❌ MongoDB connection failed. Check logs above."
fi

echo ""
echo "8. Testing backend API:"
curl -I http://localhost:5001 2>&1 | head -5

echo ""
echo "9. Testing frontend:"
curl -I http://localhost:3001 2>&1 | head -5

echo ""
echo "✅ Done! If you see 'Connected to MongoDB' above, everything is working."
echo ""
echo "Test the website: curl -I http://localhost"
