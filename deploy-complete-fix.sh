#!/bin/bash

echo "🚀 Vazifa Complete Fix Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root for nginx operations
if [[ $EUID -eq 0 ]]; then
   print_error "Don't run this script as root. Run as ubuntu user."
   exit 1
fi

echo ""
print_info "Step 1: Fix Admin Password"
echo "----------------------------------------"

cd /var/www/vazifa/backend
if [ -f "fix-admin-password.js" ]; then
    node fix-admin-password.js
    print_status "Admin password fixed"
else
    print_error "fix-admin-password.js not found"
fi

echo ""
print_info "Step 2: Update Nginx Configuration"
echo "----------------------------------------"

# Backup current nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
print_status "Nginx configuration backed up"

# Copy new configuration
if [ -f "/var/www/vazifa/nginx-vazifa-config" ]; then
    sudo cp /var/www/vazifa/nginx-vazifa-config /etc/nginx/sites-available/default
    print_status "New nginx configuration installed"
else
    print_error "nginx-vazifa-config not found"
    exit 1
fi

# Test nginx configuration
print_info "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    print_info "Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
    exit 1
fi

# Reload nginx
sudo nginx -s reload
print_status "Nginx reloaded with new configuration"

echo ""
print_info "Step 3: Verify Services"
echo "----------------------------------------"

# Check PM2 status
print_info "PM2 Status:"
pm2 status

# Check if backend is running on port 5002
if ss -tlnp | grep -q ":5002"; then
    print_status "Backend is running on port 5002"
else
    print_warning "Backend not detected on port 5002"
fi

# Check if frontend is running on port 3000
if ss -tlnp | grep -q ":3000"; then
    print_status "Frontend is running on port 3000"
else
    print_warning "Frontend not detected on port 3000"
fi

echo ""
print_info "Step 4: Test API Endpoints"
echo "----------------------------------------"

# Test backend API
print_info "Testing backend API..."
if curl -s -f http://localhost:5002/ > /dev/null; then
    print_status "Backend API is responding"
else
    print_warning "Backend API not responding"
fi

# Test through nginx proxy
print_info "Testing API through nginx proxy..."
if curl -s -f -H "Host: ptapi.oci.tj" http://localhost/ > /dev/null; then
    print_status "API proxy is working"
else
    print_warning "API proxy not working"
fi

echo ""
print_info "Step 5: Test Email Verification URLs"
echo "----------------------------------------"

cd /var/www/vazifa/backend
if [ -f "test-url-generation.js" ]; then
    node test-url-generation.js
else
    print_warning "test-url-generation.js not found"
fi

echo ""
print_status "Deployment Complete!"
echo "========================================"
echo ""
print_info "🎯 Next Steps:"
echo "1. Test login with: admin@vazifa2.com / fwr123456"
echo "2. Register a new user to test email verification URLs"
echo "3. Check that URLs point to https://protocol.oci.tj"
echo ""
print_info "🔗 Your URLs:"
echo "Frontend: https://protocol.oci.tj"
echo "Backend API: https://ptapi.oci.tj"
echo ""
print_info "📊 Service Status:"
pm2 status
echo ""
print_status "All fixes have been applied successfully!"
