# Vazifa Production SSH Deployment Guide

## 🚀 Complete Production Deployment for protocol.oci.tj and ptapi.oci.tj

This guide provides step-by-step instructions for deploying your Vazifa application to production servers using SSH with the domains:
- **Frontend**: `https://protocol.oci.tj`
- **Backend API**: `https://ptapi.oci.tj`

---

## 📋 Prerequisites

### Local Requirements
- ✅ Git repository access
- ✅ SSH client configured
- ✅ Node.js 18+ (for local testing)

### Server Requirements
- ✅ Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- ✅ Root or sudo access
- ✅ Minimum 2GB RAM, 20GB storage
- ✅ Domain DNS records configured:
  - `protocol.oci.tj` → Your server IP
  - `ptapi.oci.tj` → Your server IP

---

## 🔧 Phase 1: Server Preparation

### Step 1: Initial Server Setup

```bash
# Connect to your server
ssh root@your-server-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx htop unzip

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
nginx -v        # Should show nginx version
```

### Step 2: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

### Step 3: Create Deployment User (Recommended)

```bash
# Create deployment user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Set up SSH access for deploy user
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user
su - deploy
```

### Step 4: Configure Firewall

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

---

## 📁 Phase 2: Application Deployment

### Step 1: Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/vazifa
sudo chown -R deploy:deploy /var/www/vazifa
sudo chmod -R 755 /var/www/vazifa

# Create log directories
sudo mkdir -p /var/log/vazifa
sudo chown -R deploy:deploy /var/log/vazifa
```

### Step 2: Clone and Deploy Application

```bash
# Navigate to application directory
cd /var/www/vazifa

# Clone the repository
git clone https://github.com/LatifRjdev/vazifa.git .

# Install backend dependencies
cd backend
npm install --production

# Build frontend
cd ../frontend
npm install --legacy-peer-deps
npm run build

# Return to root directory
cd /var/www/vazifa
```

### Step 3: Configure Environment Variables

#### Backend Environment Configuration

```bash
# Copy and edit backend production environment
cd /var/www/vazifa/backend
cp .env.production .env

# Edit the environment file with your actual values
nano .env
```

**Update these values in `/var/www/vazifa/backend/.env`:**

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Database Configuration (Update with your MongoDB details)
MONGODB_URI=mongodb://your-username:your-password@your-mongodb-host:27017/vazifa-production

# JWT Configuration (Generate a strong secret)
JWT_SECRET=your-super-secure-jwt-secret-key-for-production-min-32-chars

# Email Configuration (Update with your SMTP details)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary Configuration (Update with your Cloudinary details)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# SendGrid Configuration (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key

# Arcjet Configuration (Optional)
ARCJET_KEY=your-arcjet-key

# Frontend URLs
FRONTEND_URL=https://protocol.oci.tj
PRODUCTION_FRONTEND_URL=https://protocol.oci.tj

# Backend URLs
BACKEND_URL=https://ptapi.oci.tj
PRODUCTION_BACKEND_URL=https://ptapi.oci.tj

# CORS Configuration
CORS_ORIGIN=https://protocol.oci.tj
```

#### Frontend Environment Configuration

```bash
# Copy and edit frontend production environment
cd /var/www/vazifa/frontend
cp .env.production .env

# Edit the environment file
nano .env
```

**Update these values in `/var/www/vazifa/frontend/.env`:**

```env
# Cloudinary Configuration (Update with your Cloudinary details)
VITE_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset

# Production API URL
VITE_API_URL=https://ptapi.oci.tj/api-v1
VITE_PRODUCTION_API_URL=https://ptapi.oci.tj/api-v1

# Domain Configuration
VITE_DOMAIN=https://protocol.oci.tj
VITE_PRODUCTION_DOMAIN=https://protocol.oci.tj

# Environment
NODE_ENV=production
```

### Step 4: Rebuild Frontend with Production Environment

```bash
# Rebuild frontend with production environment variables
cd /var/www/vazifa/frontend
npm run build
```

---

## ⚙️ Phase 3: Process Management with PM2

### Step 1: Create PM2 Ecosystem Configuration

```bash
# Create PM2 configuration file
cd /var/www/vazifa
nano ecosystem.config.js
```

**Add this content to `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [
    {
      name: 'vazifa-backend',
      script: './backend/index.js',
      cwd: '/var/www/vazifa',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_file: '/var/www/vazifa/backend/.env',
      log_file: '/var/log/vazifa/backend.log',
      error_file: '/var/log/vazifa/backend-error.log',
      out_file: '/var/log/vazifa/backend-out.log',
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      merge_logs: true,
      time: true
    }
  ]
};
```

### Step 2: Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Check application status
pm2 status

# View logs
pm2 logs vazifa-backend

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

---

## 🌐 Phase 4: Nginx Configuration

### Step 1: Create Nginx Configuration

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/vazifa
```

**Add this content to `/etc/nginx/sites-available/vazifa`:**

```nginx
# Vazifa Frontend Configuration
server {
    listen 80;
    server_name protocol.oci.tj;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name protocol.oci.tj;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/protocol.oci.tj/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/protocol.oci.tj/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    root /var/www/vazifa/frontend/build/client;
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
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (fallback for any API calls from frontend)
    location /api-v1/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Vazifa API Configuration
server {
    listen 80;
    server_name ptapi.oci.tj;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ptapi.oci.tj;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/ptapi.oci.tj/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ptapi.oci.tj/privkey.pem;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # File upload size limit
    client_max_body_size 50M;
}
```

### Step 2: Enable Nginx Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/vazifa /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Phase 5: SSL Certificate Setup

### Step 1: Install SSL Certificates

```bash
# Install SSL certificates for both domains
sudo certbot --nginx -d protocol.oci.tj -d ptapi.oci.tj

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms of service
# 3. Choose whether to share email with EFF
# 4. Select option 2 (Redirect HTTP to HTTPS)
```

### Step 2: Test SSL Renewal

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal (add to crontab)
sudo crontab -e

# Add this line to run renewal check twice daily:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🧪 Phase 6: Testing and Verification

### Step 1: Test Backend API

```bash
# Test backend health
curl -k https://ptapi.oci.tj/api-v1/health

# Test backend with verbose output
curl -v https://ptapi.oci.tj/api-v1/health
```

### Step 2: Test Frontend

```bash
# Test frontend accessibility
curl -I https://protocol.oci.tj

# Check if frontend loads properly
curl -s https://protocol.oci.tj | grep -i "vazifa\|protocol"
```

### Step 3: Check Application Status

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs vazifa-backend --lines 50

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Phase 7: Monitoring and Maintenance

### Step 1: Set Up Log Rotation

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### Step 2: Create Backup Script

```bash
# Create backup script
sudo nano /var/www/vazifa/backup.sh
```

**Add this content to `backup.sh`:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vazifa"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/vazifa_app_$DATE.tar.gz -C /var/www/vazifa .

# Keep only last 7 backups
find $BACKUP_DIR -name "vazifa_app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: vazifa_app_$DATE.tar.gz"
```

```bash
# Make script executable
chmod +x /var/www/vazifa/backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /var/www/vazifa/backup.sh
```

### Step 3: Set Up Monitoring Commands

```bash
# Create monitoring script
nano /var/www/vazifa/monitor.sh
```

**Add this content to `monitor.sh`:**

```bash
#!/bin/bash
echo "=== Vazifa Application Status ==="
echo "Date: $(date)"
echo ""

echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== System Resources ==="
free -h
df -h /var/www/vazifa

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l

echo ""
echo "=== Recent Backend Logs ==="
pm2 logs vazifa-backend --lines 10 --nostream

echo ""
echo "=== SSL Certificate Status ==="
sudo certbot certificates
```

```bash
# Make script executable
chmod +x /var/www/vazifa/monitor.sh

# Run monitoring
./monitor.sh
```

---

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check PM2 logs for errors
pm2 logs vazifa-backend

# Check environment variables
pm2 show vazifa-backend

# Restart application
pm2 restart vazifa-backend

# If still failing, check Node.js version
node --version  # Should be 18+
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection from server
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));
"
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test SSL configuration
openssl s_client -connect protocol.oci.tj:443
openssl s_client -connect ptapi.oci.tj:443
```

#### 4. Nginx Configuration Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx configuration
sudo systemctl reload nginx
```

#### 5. Frontend Not Loading

```bash
# Check if frontend build exists
ls -la /var/www/vazifa/frontend/build/client/

# Rebuild frontend if needed
cd /var/www/vazifa/frontend
npm run build

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Deployment Updates

### For Future Updates

```bash
# Navigate to application directory
cd /var/www/vazifa

# Pull latest changes
git pull origin main

# Update backend dependencies (if needed)
cd backend
npm install --production

# Rebuild frontend
cd ../frontend
npm install --legacy-peer-deps
npm run build

# Restart backend
pm2 restart vazifa-backend

# Reload Nginx (if config changed)
sudo systemctl reload nginx
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Server meets minimum requirements (2GB RAM, 20GB storage)
- [ ] Node.js 20.x installed
- [ ] Nginx installed and configured
- [ ] PM2 installed globally
- [ ] Domain DNS records configured (protocol.oci.tj, ptapi.oci.tj)
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] MongoDB accessible from server

### Deployment
- [ ] Application cloned from GitHub
- [ ] Backend dependencies installed
- [ ] Frontend built successfully
- [ ] Environment variables configured
- [ ] PM2 ecosystem configured
- [ ] Application started with PM2
- [ ] Nginx configuration applied
- [ ] SSL certificates installed
- [ ] Both domains accessible via HTTPS

### Post-Deployment
- [ ] Frontend loads at https://protocol.oci.tj
- [ ] API responds at https://ptapi.oci.tj/api-v1/health
- [ ] Database connection working
- [ ] File uploads working (if applicable)
- [ ] Email functionality working (if configured)
- [ ] Log rotation configured
- [ ] Backup script created and scheduled
- [ ] Monitoring script created
- [ ] SSL auto-renewal configured

---

## 📞 Support

### Useful Commands

```bash
# Application Management
pm2 status                    # Check application status
pm2 logs vazifa-backend      # View application logs
pm2 restart vazifa-backend   # Restart application
pm2 reload vazifa-backend    # Zero-downtime reload

# System Monitoring
htop                         # System resource monitor
df -h                        # Disk usage
free -h                      # Memory usage
sudo systemctl status nginx # Nginx status

# Log Monitoring
sudo tail -f /var/log/nginx/access.log    # Nginx access logs
sudo tail -f /var/log/nginx/error.log     # Nginx error logs
pm2 logs vazifa-backend --lines 100       # Application logs

# SSL Management
sudo certbot certificates    # Check SSL certificates
sudo certbot renew          # Renew SSL certificates
```

### Emergency Procedures

```bash
# If application crashes
pm2 restart vazifa-backend

# If high memory usage
pm2 reload vazifa-backend

# If Nginx issues
sudo systemctl restart nginx

# If SSL problems
sudo certbot renew --force-renewal
```

---

## 🎉 Congratulations!

Your Vazifa application is now successfully deployed in production!

- **Frontend**: https://protocol.oci.tj
- **Backend API**: https://ptapi.oci.tj

The application is configured with:
- ✅ Production-optimized environment variables
- ✅ SSL certificates for secure HTTPS access
- ✅ Process management with PM2
- ✅ Reverse proxy with Nginx
- ✅ Automatic log rotation
- ✅ Backup procedures
- ✅ Monitoring capabilities

For ongoing maintenance, refer to the monitoring and troubleshooting sections above.
