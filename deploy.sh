#!/bin/bash

# Vazifa Deployment Script for Hostinger
echo "🚀 Starting Vazifa deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✓"

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
if [ ! -f ".env" ]; then
    print_error "Backend .env file not found. Please create it from .env.example"
    exit 1
fi

npm install --production
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "Backend dependencies installed ✓"

# Build and install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend

if [ ! -f ".env.production" ]; then
    print_error "Frontend .env.production file not found. Please create it."
    exit 1
fi

npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Frontend dependencies installed ✓"

# Build frontend for production
print_status "Building frontend for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build frontend"
    exit 1
fi

print_status "Frontend built successfully ✓"

# Go back to root directory
cd ..

print_status "✅ Deployment preparation completed!"
print_status "📋 Next steps:"
echo "   1. Upload the entire project to your Hostinger hosting"
echo "   2. Set up Node.js app in Hostinger control panel"
echo "   3. Point the app to backend/index.js"
echo "   4. Upload frontend/build contents to public_html"
echo "   5. Configure domain and SSL"

print_warning "⚠️  Make sure to:"
echo "   - Update environment variables in Hostinger"
echo "   - Configure your domain DNS"
echo "   - Enable SSL certificate"
echo "   - Test both frontend and backend endpoints"

echo ""
print_status "🎉 Ready for deployment to Hostinger!"
