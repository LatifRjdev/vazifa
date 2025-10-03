#!/bin/bash

echo "🔍 Диагностика 502 Bad Gateway..."
echo ""

echo "1. PM2 Status:"
pm2 list

echo ""
echo "2. Checking ports:"
echo "Port 5001 (backend):"
sudo netstat -tlnp | grep :5001 || echo "❌ Port 5001 not listening"

echo ""
echo "Port 3001 (frontend):"
sudo netstat -tlnp | grep :3001 || echo "❌ Port 3001 not listening"

echo ""
echo "Port 80 (NGINX):"
sudo netstat -tlnp | grep :80 || echo "❌ Port 80 not listening"

echo ""
echo "3. Testing backend directly:"
curl -I http://localhost:5001 2>&1 | head -3

echo ""
echo "4. Testing frontend directly:"
curl -I http://localhost:3001 2>&1 | head -3

echo ""
echo "5. Testing through NGINX:"
curl -I http://localhost 2>&1 | head -3

echo ""
echo "6. Backend logs (last 10 lines):"
pm2 logs vazifa-backend --lines 10 --nostream 2>&1 | tail -15

echo ""
echo "7. Frontend logs (last 10 lines):"
pm2 logs vazifa-frontend --lines 10 --nostream 2>&1 | tail -15

echo ""
echo "8. NGINX status:"
sudo systemctl status nginx --no-pager | head -15

echo ""
echo "9. NGINX error log (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log

echo ""
echo "📊 Analysis:"
echo "============"

# Check if services are running
if pm2 list | grep -q "vazifa-frontend.*online"; then
    echo "✅ Frontend PM2 process is online"
else
    echo "❌ Frontend PM2 process is NOT online"
fi

if pm2 list | grep -q "vazifa-backend.*online"; then
    echo "✅ Backend PM2 process is online"
else
    echo "❌ Backend PM2 process is NOT online"
fi

# Check if ports are listening
if sudo netstat -tlnp | grep -q ":3001"; then
    echo "✅ Port 3001 is listening"
else
    echo "❌ Port 3001 is NOT listening - Frontend may have crashed"
fi

if sudo netstat -tlnp | grep -q ":5001"; then
    echo "✅ Port 5001 is listening"
else
    echo "❌ Port 5001 is NOT listening - Backend may have crashed"
fi

echo ""
echo "🔧 Quick fixes:"
echo "==============="
echo "If frontend crashed, restart it:"
echo "  pm2 restart vazifa-frontend"
echo ""
echo "If backend crashed, restart it:"
echo "  pm2 restart vazifa-backend"
echo ""
echo "To see live logs:"
echo "  pm2 logs"
