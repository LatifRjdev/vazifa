#!/bin/bash

# Vazifa Production Deployment Test Script
# This script tests the production deployment locally before deploying to server

echo "🧪 Testing Vazifa Production Deployment..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1. Checking Node.js version..."
node_version=$(node --version 2>/dev/null)
if [[ $node_version == v1[89]* ]] || [[ $node_version == v2[0-9]* ]]; then
    print_status 0 "Node.js version: $node_version"
else
    print_status 1 "Node.js version $node_version is not supported. Need v18+ or v20+"
fi

echo ""
echo "2. Checking production environment files..."
if [ -f "backend/.env.production" ]; then
    print_status 0 "Backend production environment file exists"
else
    print_status 1 "Backend production environment file missing"
fi

if [ -f "frontend/.env.production" ]; then
    print_status 0 "Frontend production environment file exists"
else
    print_status 1 "Frontend production environment file missing"
fi

echo ""
echo "3. Testing backend dependencies..."
cd backend
if npm install --production --silent; then
    print_status 0 "Backend dependencies installed successfully"
else
    print_status 1 "Backend dependencies installation failed"
fi

echo ""
echo "4. Testing backend startup..."
timeout 10s node index.js > /dev/null 2>&1 &
backend_pid=$!
sleep 3

if kill -0 $backend_pid 2>/dev/null; then
    print_status 0 "Backend starts successfully"
    kill $backend_pid 2>/dev/null
else
    print_status 1 "Backend failed to start"
fi

cd ..

echo ""
echo "5. Testing frontend build..."
cd frontend
if npm install --legacy-peer-deps --silent; then
    print_status 0 "Frontend dependencies installed successfully"
else
    print_status 1 "Frontend dependencies installation failed"
fi

if npm run build > /dev/null 2>&1; then
    print_status 0 "Frontend builds successfully"
else
    print_status 1 "Frontend build failed"
fi

cd ..

echo ""
echo "6. Checking production configuration..."
if [ -f "production-config.js" ]; then
    print_status 0 "Production configuration file exists"
else
    print_status 1 "Production configuration file missing"
fi

if [ -f "docker-compose.yml" ]; then
    print_status 0 "Docker Compose configuration exists"
else
    print_status 1 "Docker Compose configuration missing"
fi

echo ""
echo "7. Checking deployment documentation..."
if [ -f "PRODUCTION_SSH_DEPLOYMENT_GUIDE.md" ]; then
    print_status 0 "SSH deployment guide exists"
else
    print_status 1 "SSH deployment guide missing"
fi

echo ""
echo "8. Validating environment variables..."
print_warning "Make sure to update these values before deployment:"
echo "   - MongoDB connection string"
echo "   - JWT secret (minimum 32 characters)"
echo "   - Email/SMTP configuration"
echo "   - Cloudinary credentials"
echo "   - Domain-specific settings"

echo ""
echo "9. Checking Git status..."
if git status --porcelain | grep -q .; then
    print_warning "You have uncommitted changes. Consider committing them before deployment."
else
    print_status 0 "Git repository is clean"
fi

echo ""
echo "🎉 Production Deployment Test Complete!"
echo "=========================================="
echo ""
echo "✅ Your application is ready for production deployment!"
echo ""
echo "Next steps:"
echo "1. Update environment variables with production values"
echo "2. Ensure your server meets the requirements (2GB RAM, Node.js 20+)"
echo "3. Configure DNS records for protocol.oci.tj and ptapi.oci.tj"
echo "4. Follow the PRODUCTION_SSH_DEPLOYMENT_GUIDE.md for deployment"
echo ""
echo "Deployment domains:"
echo "  Frontend: https://protocol.oci.tj"
echo "  Backend:  https://ptapi.oci.tj"
echo ""
