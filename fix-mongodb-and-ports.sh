#!/bin/bash

echo "🔧 Fixing MongoDB connection and port conflicts..."
echo ""

# Stop all PM2 processes
echo "1. Stopping all PM2 processes..."
pm2 delete all

# Kill any process using port 3001
echo ""
echo "2. Killing processes on port 3001..."
sudo fuser -k 3001/tcp 2>/dev/null || echo "Port 3001 is free"

# Check if .env.production exists
echo ""
echo "3. Checking backend .env.production..."
cd /var/www/vazifa/backend

if [ ! -f .env.production ]; then
    echo "❌ .env.production not found! Creating from template..."
    
    # Check if .env.production.template exists
    if [ -f .env.production.template ]; then
        cp .env.production.template .env.production
        echo "✅ Created .env.production from template"
    else
        echo "❌ .env.production.template also not found!"
        echo "Creating basic .env.production..."
        cat > .env.production << 'ENVEOF'
# Server Configuration
PORT=5001
NODE_ENV=production

# Database Configuration (MongoDB)
MONGODB_URI=mongodb://vazifa:Asd123@localhost:27017/vazifa-production

# JWT Configuration  
JWT_SECRET=fsajfj515fasfqrqw2025

# Frontend URL
FRONTEND_URL=https://protocol.oci.tj
PRODUCTION_FRONTEND_URL=https://protocol.oci.tj

# Backend URL
BACKEND_URL=https://ptapi.oci.tj
PRODUCTION_BACKEND_URL=https://ptapi.oci.tj

# SMTP Configuration
SMTP_HOST=172.16.55.75
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=protocol@oci.tj
SMTP_PASS=Pro1o$ol
SMTP_FROM_EMAIL=protocol@oci.tj
SMTP_FROM_NAME=Protocol

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dzugdbdxb
CLOUDINARY_API_KEY=349324657524961
CLOUDINARY_API_SECRET=k4OHfX_UgOA20Nz-iYWmvKyr3v4

# Arcjet Configuration
ARCJET_KEY=ajkey_01jzsvvmzqe86b6dj35hpwny9m
ARCJET_ENV=development

# CORS Configuration
CORS_ORIGIN=https://protocol.oci.tj
ENVEOF
        echo "✅ Created basic .env.production"
    fi
else
    echo "✅ .env.production exists"
fi

# Show the MONGODB_URI
echo ""
echo "4. Current MONGODB_URI:"
grep MONGODB_URI .env.production || echo "❌ MONGODB_URI not found in .env.production!"

# Start MongoDB if not running
echo ""
echo "5. Checking MongoDB status..."
sudo systemctl status mongod --no-pager | grep "Active:" || {
    echo "Starting MongoDB..."
    sudo systemctl start mongod
}

# Restart backend
echo ""
echo "6. Starting backend..."
cd /var/www/vazifa/backend
pm2 start index.js --name vazifa-backend --env production

# Wait a bit
sleep 3

# Restart frontend
echo ""
echo "7. Starting frontend..."
cd /var/www/vazifa/frontend
pm2 start server.js --name vazifa-frontend

# Save PM2 config
echo ""
echo "8. Saving PM2 configuration..."
pm2 save

# Show status
echo ""
echo "9. PM2 Status:"
pm2 list

echo ""
echo "10. Backend logs (last 5 lines):"
pm2 logs vazifa-backend --lines 5 --nostream

echo ""
echo "11. Frontend logs (last 5 lines):"
pm2 logs vazifa-frontend --lines 5 --nostream

echo ""
echo "✅ Done! Check the logs above for any errors."
echo ""
echo "If you see MongoDB connection errors, run:"
echo "  grep MONGODB_URI /var/www/vazifa/backend/.env.production"
echo ""
echo "If you see port 3001 errors, run:"
echo "  sudo netstat -tlnp | grep 3001"
