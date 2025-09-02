#!/bin/bash

# Vazifa Deployment Test Script
# This script tests the deployment configuration and validates the setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY-TEST]${NC} $1"
}

print_header "🧪 Vazifa Deployment Configuration Test"
echo "========================================"

# Test 1: Check Node.js installation
print_status "Testing Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo "✅ Node.js $NODE_VERSION (OK)"
    else
        print_error "Node.js version $NODE_VERSION is too old. Minimum required: 18.x"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    exit 1
fi

# Test 2: Check npm installation
print_status "Testing npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm $NPM_VERSION (OK)"
else
    print_error "npm is not installed"
    exit 1
fi

# Test 3: Check project structure
print_status "Testing project structure..."
REQUIRED_DIRS=("backend" "frontend")
REQUIRED_FILES=("package.json" "deploy.sh" "deploy-ssh.sh" "docker-compose.yml")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ Directory $dir exists"
    else
        print_error "Required directory $dir is missing"
        exit 1
    fi
done

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ File $file exists"
    else
        print_warning "File $file is missing (may be optional)"
    fi
done

# Test 4: Check backend configuration
print_status "Testing backend configuration..."
if [ -f "backend/package.json" ]; then
    echo "✅ Backend package.json exists"
    
    # Check if main dependencies exist
    if grep -q "express" backend/package.json; then
        echo "✅ Express.js dependency found"
    else
        print_warning "Express.js dependency not found in backend/package.json"
    fi
    
    if grep -q "mongoose" backend/package.json; then
        echo "✅ Mongoose dependency found"
    else
        print_warning "Mongoose dependency not found in backend/package.json"
    fi
else
    print_error "backend/package.json is missing"
    exit 1
fi

if [ -f "backend/.env" ]; then
    echo "✅ Backend .env file exists"
    
    # Check for required environment variables
    REQUIRED_BACKEND_VARS=("PORT" "NODE_ENV" "MONGODB_URI" "JWT_SECRET")
    for var in "${REQUIRED_BACKEND_VARS[@]}"; do
        if grep -q "^$var=" backend/.env; then
            echo "✅ $var is configured"
        else
            print_warning "$var is not configured in backend/.env"
        fi
    done
else
    print_warning "backend/.env file is missing"
fi

# Test 5: Check frontend configuration
print_status "Testing frontend configuration..."
if [ -f "frontend/package.json" ]; then
    echo "✅ Frontend package.json exists"
    
    # Check if main dependencies exist
    if grep -q "react" frontend/package.json; then
        echo "✅ React dependency found"
    else
        print_warning "React dependency not found in frontend/package.json"
    fi
    
    if grep -q "vite" frontend/package.json; then
        echo "✅ Vite dependency found"
    else
        print_warning "Vite dependency not found in frontend/package.json"
    fi
else
    print_error "frontend/package.json is missing"
    exit 1
fi

if [ -f "frontend/.env" ]; then
    echo "✅ Frontend .env file exists"
    
    # Check for required environment variables
    REQUIRED_FRONTEND_VARS=("VITE_API_URL" "VITE_APP_CLOUDINARY_CLOUD_NAME")
    for var in "${REQUIRED_FRONTEND_VARS[@]}"; do
        if grep -q "^$var=" frontend/.env; then
            echo "✅ $var is configured"
        else
            print_warning "$var is not configured in frontend/.env"
        fi
    done
else
    print_warning "frontend/.env file is missing"
fi

# Test 6: Test backend dependencies installation
print_status "Testing backend dependencies..."
cd backend
if [ -d "node_modules" ]; then
    echo "✅ Backend node_modules exists"
else
    print_status "Installing backend dependencies..."
    npm install --silent
    if [ $? -eq 0 ]; then
        echo "✅ Backend dependencies installed successfully"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
fi
cd ..

# Test 7: Test frontend dependencies installation
print_status "Testing frontend dependencies..."
cd frontend
if [ -d "node_modules" ]; then
    echo "✅ Frontend node_modules exists"
else
    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps --silent
    if [ $? -eq 0 ]; then
        echo "✅ Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
fi
cd ..

# Test 8: Test frontend build
print_status "Testing frontend build process..."
cd frontend
if npm run build --silent; then
    echo "✅ Frontend builds successfully"
    if [ -d "build" ] || [ -d "dist" ]; then
        echo "✅ Build output directory exists"
    else
        print_warning "Build output directory not found"
    fi
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Test 9: Test backend startup (basic syntax check)
print_status "Testing backend startup (syntax check)..."
cd backend
if node -c index.js 2>/dev/null; then
    echo "✅ Backend syntax is valid"
else
    print_error "Backend has syntax errors"
    exit 1
fi
cd ..

# Test 10: Check deployment scripts
print_status "Testing deployment scripts..."
if [ -x "deploy.sh" ]; then
    echo "✅ deploy.sh is executable"
else
    print_warning "deploy.sh is not executable (run: chmod +x deploy.sh)"
fi

if [ -x "deploy-ssh.sh" ]; then
    echo "✅ deploy-ssh.sh is executable"
else
    print_warning "deploy-ssh.sh is not executable (run: chmod +x deploy-ssh.sh)"
fi

# Test 11: Check Docker configuration (if exists)
print_status "Testing Docker configuration..."
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml exists"
    
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        if docker-compose config &>/dev/null || docker compose config &>/dev/null; then
            echo "✅ Docker Compose configuration is valid"
        else
            print_warning "Docker Compose configuration has issues"
        fi
    else
        print_warning "Docker/Docker Compose not installed (optional)"
    fi
else
    print_warning "docker-compose.yml not found (optional)"
fi

# Test 12: Environment validation
print_status "Running environment validation..."
if [ -f "validate-env.js" ]; then
    if node validate-env.js 2>/dev/null; then
        echo "✅ Environment validation passed"
    else
        print_warning "Environment validation failed (check your .env files)"
    fi
else
    print_warning "validate-env.js not found (optional)"
fi

# Test 13: Check Git configuration
print_status "Testing Git configuration..."
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    
    if git status &>/dev/null; then
        UNCOMMITTED=$(git status --porcelain | wc -l)
        if [ "$UNCOMMITTED" -eq 0 ]; then
            echo "✅ No uncommitted changes"
        else
            print_warning "$UNCOMMITTED uncommitted changes found"
        fi
    fi
else
    print_warning "Not a Git repository (optional)"
fi

# Test 14: Security checks
print_status "Running security checks..."

# Check for exposed secrets
if grep -r "password\|secret\|key" --include="*.js" --include="*.json" --exclude-dir=node_modules . | grep -v ".env" | grep -v "test" | head -5; then
    print_warning "Potential secrets found in code (review manually)"
fi

# Check .env files are in .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo "✅ .env files are in .gitignore"
    else
        print_warning ".env files should be added to .gitignore"
    fi
else
    print_warning ".gitignore file not found"
fi

# Summary
echo ""
print_header "📋 Test Summary"
echo "==============="

print_status "✅ All critical tests passed!"
echo ""
echo "Your Vazifa application is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. 🚀 For Hostinger deployment: ./deploy.sh"
echo "2. 🖥️  For SSH server deployment: ./deploy-ssh.sh --help"
echo "3. 🐳 For Docker deployment: docker-compose up -d"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - DEPLOYMENT_GUIDE.md (Hostinger)"
echo "   - SSH_DEPLOYMENT_GUIDE.md (SSH servers)"
echo "   - ENV_MANAGEMENT_GUIDE.md (Environment variables)"
echo ""
print_status "🎉 Deployment test completed successfully!"
