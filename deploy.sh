#!/bin/bash

# =============================================================================
# Vazifa Deployment Script
# Deploy to: ubuntu@193.111.11.98 -p3022
# Path: /var/www/vazifa
# =============================================================================

set -e  # Exit on error

# Configuration
SSH_USER="ubuntu"
SSH_HOST="193.111.11.98"
SSH_PORT="3022"
REMOTE_PATH="/var/www/vazifa"
SSH_CMD="ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
SCP_CMD="scp -P $SSH_PORT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
DEPLOY_FRONTEND=false
DEPLOY_BACKEND=false
DEPLOY_ALL=false
SKIP_BUILD=false
RESTART_ONLY=false

show_help() {
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -a, --all         Deploy both frontend and backend (default)"
    echo "  -f, --frontend    Deploy frontend only"
    echo "  -b, --backend     Deploy backend only"
    echo "  -s, --skip-build  Skip build step, deploy existing build"
    echo "  -r, --restart     Restart services only (no deploy)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh              # Deploy everything"
    echo "  ./deploy.sh -f           # Deploy frontend only"
    echo "  ./deploy.sh -b           # Deploy backend only"
    echo "  ./deploy.sh -r           # Restart services only"
    echo "  ./deploy.sh -f -s        # Deploy frontend without rebuilding"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    DEPLOY_ALL=true
else
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                DEPLOY_ALL=true
                shift
                ;;
            -f|--frontend)
                DEPLOY_FRONTEND=true
                shift
                ;;
            -b|--backend)
                DEPLOY_BACKEND=true
                shift
                ;;
            -s|--skip-build)
                SKIP_BUILD=true
                shift
                ;;
            -r|--restart)
                RESTART_ONLY=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
fi

if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=true
fi

# =============================================================================
# Main deployment functions
# =============================================================================

check_connection() {
    log_info "Checking SSH connection..."
    if $SSH_CMD "echo 'Connection OK'" > /dev/null 2>&1; then
        log_success "SSH connection established"
    else
        log_error "Cannot connect to server. Check your SSH key and network."
        exit 1
    fi
}

build_frontend() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping frontend build (--skip-build)"
        return
    fi

    log_info "Building frontend..."
    cd frontend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi

    # Build
    npm run build

    cd ..
    log_success "Frontend build complete"
}

build_backend() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping backend preparation (--skip-build)"
        return
    fi

    log_info "Preparing backend..."
    cd backend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing backend dependencies..."
        npm install
    fi

    cd ..
    log_success "Backend preparation complete"
}

deploy_frontend() {
    log_info "Deploying frontend to server..."

    # Create temp archive
    log_info "Creating frontend archive..."
    cd frontend
    tar -czf ../frontend-build.tar.gz build server.js package.json package-lock.json
    cd ..

    # Upload to server
    log_info "Uploading frontend..."
    $SCP_CMD frontend-build.tar.gz $SSH_USER@$SSH_HOST:/tmp/

    # Extract and setup on server
    log_info "Extracting and setting up frontend on server..."
    $SSH_CMD << 'ENDSSH'
        set -e
        cd /var/www/vazifa

        # Backup current frontend
        if [ -d "frontend" ]; then
            echo "Backing up current frontend..."
            rm -rf frontend.backup 2>/dev/null || true
            mv frontend frontend.backup
        fi

        # Create new frontend directory
        mkdir -p frontend
        cd frontend

        # Extract new build
        tar -xzf /tmp/frontend-build.tar.gz

        # Install production dependencies
        echo "Installing production dependencies..."
        npm ci --omit=dev 2>/dev/null || npm install --omit=dev

        # Cleanup
        rm /tmp/frontend-build.tar.gz

        echo "Frontend deployed successfully"
ENDSSH

    # Cleanup local archive
    rm -f frontend-build.tar.gz

    log_success "Frontend deployed"
}

deploy_backend() {
    log_info "Deploying backend to server..."

    # Create temp archive (excluding node_modules and .env)
    log_info "Creating backend archive..."
    cd backend
    tar -czf ../backend-build.tar.gz \
        --exclude='node_modules' \
        --exclude='.env' \
        --exclude='*.log' \
        --exclude='logs' \
        --exclude='uploads' \
        .
    cd ..

    # Upload to server
    log_info "Uploading backend..."
    $SCP_CMD backend-build.tar.gz $SSH_USER@$SSH_HOST:/tmp/

    # Extract and setup on server
    log_info "Extracting and setting up backend on server..."
    $SSH_CMD << 'ENDSSH'
        set -e
        cd /var/www/vazifa

        # Backup current backend (except .env and node_modules)
        if [ -d "backend" ]; then
            echo "Backing up current backend..."
            # Save .env file
            if [ -f "backend/.env" ]; then
                cp backend/.env /tmp/backend-env-backup
            fi
            rm -rf backend.backup 2>/dev/null || true
            mv backend backend.backup
        fi

        # Create new backend directory
        mkdir -p backend
        cd backend

        # Extract new build
        tar -xzf /tmp/backend-build.tar.gz

        # Restore .env file
        if [ -f "/tmp/backend-env-backup" ]; then
            echo "Restoring .env file..."
            mv /tmp/backend-env-backup .env
        fi

        # Create necessary directories
        mkdir -p uploads logs

        # Install production dependencies
        echo "Installing production dependencies..."
        npm ci --omit=dev 2>/dev/null || npm install --omit=dev

        # Cleanup
        rm /tmp/backend-build.tar.gz

        echo "Backend deployed successfully"
ENDSSH

    # Cleanup local archive
    rm -f backend-build.tar.gz

    log_success "Backend deployed"
}

restart_services() {
    log_info "Restarting services on server..."

    $SSH_CMD << 'ENDSSH'
        set -e
        
        # Source NVM if it exists to ensure node/npm/pm2 are in PATH
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        echo "Restarting PM2 processes..."

        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo "PM2 not found, installing..."
            npm install -g pm2
        fi

        cd /var/www/vazifa

        # Restart or start backend
        if pm2 describe vazifa-backend > /dev/null 2>&1; then
            echo "Restarting backend..."
            pm2 restart vazifa-backend
        else
            echo "Starting backend..."
            cd backend
            pm2 start index.js --name vazifa-backend
            cd ..
        fi

        # Restart or start frontend
        if pm2 describe vazifa-frontend > /dev/null 2>&1; then
            echo "Restarting frontend..."
            pm2 restart vazifa-frontend
        else
            echo "Starting frontend..."
            cd frontend
            pm2 start server.js --name vazifa-frontend
            cd ..
        fi

        # Save PM2 config
        pm2 save

        # Wait a moment for processes to stabilize
        sleep 2

        # Show status
        echo ""
        echo "=== PM2 Status ==="
        pm2 status

        echo ""
        echo "Services restarted successfully!"
ENDSSH

    log_success "Services restarted"
}

show_status() {
    log_info "Checking server status..."
    $SSH_CMD << 'ENDSSH'
        # Source NVM if it exists
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        echo "=== PM2 Status ==="
        pm2 status
        
        echo ""
        echo "=== Recent Logs (Last 10 lines) ==="
        pm2 logs --lines 10 --nostream
ENDSSH
}

# =============================================================================
# Main execution
# =============================================================================

echo ""
echo "=========================================="
echo "  Vazifa Deployment Script"
echo "=========================================="
echo ""
log_info "Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
log_info "Path: $REMOTE_PATH"
echo ""

# Check connection
check_connection

if [ "$RESTART_ONLY" = true ]; then
    restart_services
    show_status
    echo ""
    log_success "Restart complete!"
    exit 0
fi

# Build phase
if [ "$DEPLOY_FRONTEND" = true ]; then
    build_frontend
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    build_backend
fi

# Deploy phase
if [ "$DEPLOY_FRONTEND" = true ]; then
    deploy_frontend
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    deploy_backend
fi

# Restart services
restart_services

# Show final status
show_status

echo ""
echo "=========================================="
log_success "Deployment complete!"
echo "=========================================="
echo ""
log_info "Useful commands:"
log_info "  View logs:    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs'"
log_info "  Check status: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 status'"
log_info "  Restart:      ./deploy.sh -r"
echo ""
