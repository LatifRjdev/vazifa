#!/bin/bash

# Vazifa SSH Server Deployment Script
# This script deploys the Vazifa application to an SSH server using external .env files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables (can be overridden by environment variables)
SSH_HOST=${SSH_HOST:-""}
SSH_USER=${SSH_USER:-""}
SSH_PORT=${SSH_PORT:-"22"}
SSH_KEY=${SSH_KEY:-""}
REMOTE_PATH=${REMOTE_PATH:-"/var/www/vazifa"}
DOMAIN=${DOMAIN:-""}
API_DOMAIN=${API_DOMAIN:-""}
ENV_SOURCE_PATH=${ENV_SOURCE_PATH:-""}

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

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST          SSH server hostname or IP"
    echo "  -u, --user USER          SSH username"
    echo "  -p, --port PORT          SSH port (default: 22)"
    echo "  -k, --key KEY_PATH       SSH private key path"
    echo "  -r, --remote-path PATH   Remote deployment path (default: /var/www/vazifa)"
    echo "  -d, --domain DOMAIN      Main domain (e.g., vazifa.com)"
    echo "  -a, --api-domain DOMAIN  API subdomain (e.g., api.vazifa.com)"
    echo "  -e, --env-path PATH      Path to external .env files directory"
    echo "  --help                   Show this help message"
    echo ""
    echo "Environment variables can also be used:"
    echo "  SSH_HOST, SSH_USER, SSH_PORT, SSH_KEY, REMOTE_PATH, DOMAIN, API_DOMAIN, ENV_SOURCE_PATH"
    echo ""
    echo "Example:"
    echo "  $0 -h server.com -u deploy -k ~/.ssh/id_rsa -d vazifa.com -a api.vazifa.com -e ./production-env"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            SSH_HOST="$2"
            shift 2
            ;;
        -u|--user)
            SSH_USER="$2"
            shift 2
            ;;
        -p|--port)
            SSH_PORT="$2"
            shift 2
            ;;
        -k|--key)
            SSH_KEY="$2"
            shift 2
            ;;
        -r|--remote-path)
            REMOTE_PATH="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -a|--api-domain)
            API_DOMAIN="$2"
            shift 2
            ;;
        -e|--env-path)
            ENV_SOURCE_PATH="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$SSH_HOST" || -z "$SSH_USER" || -z "$DOMAIN" || -z "$API_DOMAIN" ]]; then
    print_error "Missing required parameters!"
    show_usage
    exit 1
fi

# Set SSH command options
SSH_OPTS="-p $SSH_PORT"
if [[ -n "$SSH_KEY" ]]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

SSH_CMD="ssh $SSH_OPTS $SSH_USER@$SSH_HOST"
SCP_CMD="scp $SSH_OPTS"

print_header "🚀 Starting Vazifa SSH Deployment"
print_status "Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
print_status "Remote path: $REMOTE_PATH"
print_status "Domain: $DOMAIN"
print_status "API Domain: $API_DOMAIN"

# Check SSH connection
print_status "Testing SSH connection..."
if ! $SSH_CMD "echo 'SSH connection successful'"; then
    print_error "Failed to connect to SSH server"
    exit 1
fi

# Check if Node.js is installed on remote server
print_status "Checking Node.js installation on remote server..."
NODE_VERSION=$($SSH_CMD "node -v 2>/dev/null || echo 'not_installed'")
if [[ "$NODE_VERSION" == "not_installed" ]]; then
    print_error "Node.js is not installed on the remote server"
    print_status "Please install Node.js 18+ on the remote server first"
    exit 1
fi
print_status "Remote Node.js version: $NODE_VERSION ✓"

# Check if PM2 is installed
print_status "Checking PM2 installation on remote server..."
PM2_VERSION=$($SSH_CMD "pm2 -v 2>/dev/null || echo 'not_installed'")
if [[ "$PM2_VERSION" == "not_installed" ]]; then
    print_warning "PM2 is not installed. Installing PM2..."
    $SSH_CMD "npm install -g pm2"
    print_status "PM2 installed ✓"
else
    print_status "PM2 version: $PM2_VERSION ✓"
fi

# Create remote directory structure
print_status "Creating remote directory structure..."
$SSH_CMD "mkdir -p $REMOTE_PATH/{backend,frontend,logs,backups}"

# Prepare local build
print_status "Preparing local build..."

# Check if Node.js is installed locally
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed locally. Please install Node.js 18 or higher."
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
print_status "Building frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

# Handle external .env files
if [[ -n "$ENV_SOURCE_PATH" && -d "$ENV_SOURCE_PATH" ]]; then
    print_status "Using external .env files from: $ENV_SOURCE_PATH"
    
    # Copy external .env files to local directories
    if [[ -f "$ENV_SOURCE_PATH/backend.env" ]]; then
        cp "$ENV_SOURCE_PATH/backend.env" backend/.env.production
        print_status "Backend .env copied from external source"
    fi
    
    if [[ -f "$ENV_SOURCE_PATH/frontend.env" ]]; then
        cp "$ENV_SOURCE_PATH/frontend.env" frontend/.env.production
        print_status "Frontend .env copied from external source"
    fi
else
    print_warning "No external .env path specified. Using existing .env files."
    
    # Create production .env files from existing ones
    if [[ -f "backend/.env" ]]; then
        cp backend/.env backend/.env.production
        # Update production-specific values
        sed -i.bak "s|NODE_ENV=development|NODE_ENV=production|g" backend/.env.production
        sed -i.bak "s|http://localhost:5173|https://$DOMAIN|g" backend/.env.production
        sed -i.bak "s|http://localhost:5001|https://$API_DOMAIN|g" backend/.env.production
        rm backend/.env.production.bak 2>/dev/null || true
    fi
    
    if [[ -f "frontend/.env" ]]; then
        cp frontend/.env frontend/.env.production
        # Update production-specific values
        sed -i.bak "s|http://localhost:5001/api-v1|https://$API_DOMAIN/api-v1|g" frontend/.env.production
        sed -i.bak "s|http://localhost:5173|https://$DOMAIN|g" frontend/.env.production
        rm frontend/.env.production.bak 2>/dev/null || true
    fi
fi

# Create deployment archive
print_status "Creating deployment archive..."
tar -czf vazifa-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='frontend/build' \
    backend/ \
    frontend/build/ \
    package.json \
    docker-compose.yml

# Upload files to server
print_status "Uploading files to server..."
$SCP_CMD vazifa-deploy.tar.gz $SSH_USER@$SSH_HOST:$REMOTE_PATH/

# Extract files on server
print_status "Extracting files on server..."
$SSH_CMD "cd $REMOTE_PATH && tar -xzf vazifa-deploy.tar.gz && rm vazifa-deploy.tar.gz"

# Install dependencies on server
print_status "Installing dependencies on server..."
$SSH_CMD "cd $REMOTE_PATH/backend && npm install --production"

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'vazifa-backend',
      script: './backend/index.js',
      cwd: '$REMOTE_PATH',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_file: '$REMOTE_PATH/backend/.env.production',
      log_file: '$REMOTE_PATH/logs/backend.log',
      error_file: '$REMOTE_PATH/logs/backend-error.log',
      out_file: '$REMOTE_PATH/logs/backend-out.log',
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Upload PM2 config
$SCP_CMD ecosystem.config.js $SSH_USER@$SSH_HOST:$REMOTE_PATH/

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > vazifa.nginx.conf << EOF
# Vazifa Frontend Configuration
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration (update paths as needed)
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    root $REMOTE_PATH/frontend/build/client;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Vazifa API Configuration
server {
    listen 80;
    server_name $API_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $API_DOMAIN;

    # SSL Configuration (update paths as needed)
    ssl_certificate /etc/ssl/certs/$API_DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$API_DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # File upload size limit
    client_max_body_size 50M;
}
EOF

# Upload Nginx config
$SCP_CMD vazifa.nginx.conf $SSH_USER@$SSH_HOST:/tmp/

# Deploy application with PM2
print_status "Deploying application with PM2..."
$SSH_CMD "cd $REMOTE_PATH && pm2 delete vazifa-backend 2>/dev/null || true"
$SSH_CMD "cd $REMOTE_PATH && pm2 start ecosystem.config.js"
$SSH_CMD "pm2 save"
$SSH_CMD "pm2 startup | tail -1 | bash || true"

# Set up log rotation
print_status "Setting up log rotation..."
$SSH_CMD "pm2 install pm2-logrotate"
$SSH_CMD "pm2 set pm2-logrotate:max_size 10M"
$SSH_CMD "pm2 set pm2-logrotate:retain 30"
$SSH_CMD "pm2 set pm2-logrotate:compress true"

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/vazifa"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/vazifa_app_$DATE.tar.gz -C /var/www/vazifa .

# Keep only last 7 backups
find $BACKUP_DIR -name "vazifa_app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: vazifa_app_$DATE.tar.gz"
EOF

$SCP_CMD backup.sh $SSH_USER@$SSH_HOST:$REMOTE_PATH/
$SSH_CMD "chmod +x $REMOTE_PATH/backup.sh"

# Clean up local files
rm -f vazifa-deploy.tar.gz ecosystem.config.js vazifa.nginx.conf backup.sh

print_status "✅ Deployment completed successfully!"
print_header "📋 Post-deployment steps:"
echo ""
echo "1. 🔧 Configure Nginx:"
echo "   sudo cp /tmp/vazifa.nginx.conf /etc/nginx/sites-available/vazifa"
echo "   sudo ln -s /etc/nginx/sites-available/vazifa /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. 🔒 Set up SSL certificates:"
echo "   sudo certbot --nginx -d $DOMAIN -d $API_DOMAIN"
echo ""
echo "3. 🔍 Check application status:"
echo "   pm2 status"
echo "   pm2 logs vazifa-backend"
echo ""
echo "4. 🧪 Test endpoints:"
echo "   curl https://$API_DOMAIN/api-v1/auth/health"
echo "   curl https://$DOMAIN"
echo ""
echo "5. 📊 Monitor logs:"
echo "   tail -f $REMOTE_PATH/logs/backend.log"
echo ""
echo "6. 🔄 Set up automated backups (optional):"
echo "   echo '0 2 * * * $REMOTE_PATH/backup.sh' | crontab -"
echo ""
print_status "🎉 Vazifa is now deployed on your SSH server!"
print_warning "⚠️  Don't forget to update your DNS records to point to this server"
