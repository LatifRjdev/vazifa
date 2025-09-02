# Vazifa SSH Server Deployment Guide

This guide provides comprehensive instructions for deploying the Vazifa application to any SSH server using external environment configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Prerequisites

### Local Requirements
- Node.js 18+ installed locally
- SSH client configured
- Git (for version control)
- Access to external .env files (if using)

### Server Requirements
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+ installed
- Nginx installed and configured
- PM2 process manager
- SSL certificates (Let's Encrypt recommended)
- Minimum 2GB RAM, 20GB storage
- SSH access with sudo privileges

### Domain Requirements
- Main domain (e.g., `vazifa.com`)
- API subdomain (e.g., `api.vazifa.com`)
- DNS records pointing to your server

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create deployment user (optional but recommended)
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 2. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 3. Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/vazifa
sudo chown -R deploy:deploy /var/www/vazifa
sudo chmod -R 755 /var/www/vazifa

# Create log and backup directories
sudo mkdir -p /var/log/vazifa /var/backups/vazifa
sudo chown -R deploy:deploy /var/log/vazifa /var/backups/vazifa
```

## Environment Configuration

### Method 1: Using External .env Files

Create a directory structure for your environment files:

```
production-env/
├── backend.env      # Backend environment variables
└── frontend.env     # Frontend environment variables
```

#### Backend Environment File (`backend.env`)
```env
# Server Configuration
PORT=5001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here

# Frontend URLs
FRONTEND_URL=https://vazifa.com
PRODUCTION_FRONTEND_URL=https://vazifa.com

# Backend URLs
BACKEND_URL=https://api.vazifa.com
PRODUCTION_BACKEND_URL=https://api.vazifa.com

# Email Configuration (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@vazifa.com

# Security (Arcjet)
ARCJET_KEY=ajkey_your_arcjet_key_here
ARCJET_ENV=production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

#### Frontend Environment File (`frontend.env`)
```env
# Cloudinary Configuration
VITE_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# API Configuration
VITE_API_URL=https://api.vazifa.com/api-v1
VITE_PRODUCTION_API_URL=https://api.vazifa.com/api-v1

# Domain Configuration
VITE_DOMAIN=https://vazifa.com
VITE_PRODUCTION_DOMAIN=https://vazifa.com
```

### Method 2: Using Existing .env Files

If you don't have external .env files, the deployment script will automatically create production versions from your existing development .env files and update the URLs accordingly.

## Deployment Methods

### Method 1: Automated SSH Deployment (Recommended)

Use the provided `deploy-ssh.sh` script for automated deployment:

```bash
# Basic deployment with external .env files
./deploy-ssh.sh \
  --host your-server.com \
  --user deploy \
  --key ~/.ssh/id_rsa \
  --domain vazifa.com \
  --api-domain api.vazifa.com \
  --env-path ./production-env

# Deployment using environment variables
export SSH_HOST="your-server.com"
export SSH_USER="deploy"
export SSH_KEY="~/.ssh/id_rsa"
export DOMAIN="vazifa.com"
export API_DOMAIN="api.vazifa.com"
export ENV_SOURCE_PATH="./production-env"

./deploy-ssh.sh
```

#### Script Options

| Option | Description | Default |
|--------|-------------|---------|
| `-h, --host` | SSH server hostname or IP | Required |
| `-u, --user` | SSH username | Required |
| `-p, --port` | SSH port | 22 |
| `-k, --key` | SSH private key path | Optional |
| `-r, --remote-path` | Remote deployment path | /var/www/vazifa |
| `-d, --domain` | Main domain | Required |
| `-a, --api-domain` | API subdomain | Required |
| `-e, --env-path` | External .env files directory | Optional |

### Method 2: Manual Deployment

If you prefer manual deployment or need to customize the process:

#### Step 1: Prepare Local Build

```bash
# Install dependencies and build
cd backend && npm install --production && cd ..
cd frontend && npm install --legacy-peer-deps && npm run build && cd ..

# Create deployment archive
tar -czf vazifa-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  backend/ \
  frontend/build/ \
  package.json
```

#### Step 2: Upload to Server

```bash
# Upload files
scp vazifa-deploy.tar.gz deploy@your-server.com:/var/www/vazifa/

# Extract on server
ssh deploy@your-server.com "cd /var/www/vazifa && tar -xzf vazifa-deploy.tar.gz && rm vazifa-deploy.tar.gz"

# Install dependencies on server
ssh deploy@your-server.com "cd /var/www/vazifa/backend && npm install --production"
```

#### Step 3: Configure PM2

Create `ecosystem.config.js` on the server:

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
      env_file: '/var/www/vazifa/backend/.env.production',
      log_file: '/var/www/vazifa/logs/backend.log',
      error_file: '/var/www/vazifa/logs/backend-error.log',
      out_file: '/var/www/vazifa/logs/backend-out.log',
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

#### Step 4: Start Application

```bash
# Start with PM2
ssh deploy@your-server.com "cd /var/www/vazifa && pm2 start ecosystem.config.js"
ssh deploy@your-server.com "pm2 save && pm2 startup"
```

## Post-Deployment Configuration

### 1. Nginx Configuration

Create `/etc/nginx/sites-available/vazifa`:

```nginx
# Vazifa Frontend Configuration
server {
    listen 80;
    server_name vazifa.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vazifa.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/vazifa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vazifa.com/privkey.pem;
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
}

# Vazifa API Configuration
server {
    listen 80;
    server_name api.vazifa.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.vazifa.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.vazifa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vazifa.com/privkey.pem;
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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/vazifa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. SSL Certificate Setup

```bash
# Install SSL certificates using Let's Encrypt
sudo certbot --nginx -d vazifa.com -d api.vazifa.com

# Set up automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Database Configuration

Ensure your MongoDB connection is properly configured:

```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('your_mongodb_uri')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));
"
```

## Monitoring and Maintenance

### 1. Application Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs vazifa-backend

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart vazifa-backend

# Reload application (zero-downtime)
pm2 reload vazifa-backend
```

### 2. System Monitoring

```bash
# Check system resources
htop
df -h
free -h

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Log Management

Set up log rotation for PM2:

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 4. Automated Backups

Create a backup script (`/var/www/vazifa/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vazifa"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/vazifa_app_$DATE.tar.gz -C /var/www/vazifa .

# Backup database (if using local MongoDB)
# mongodump --out $BACKUP_DIR/vazifa_db_$DATE

# Keep only last 7 backups
find $BACKUP_DIR -name "vazifa_app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: vazifa_app_$DATE.tar.gz"
```

Set up automated backups:

```bash
# Make script executable
chmod +x /var/www/vazifa/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/vazifa/backup.sh
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check PM2 logs
pm2 logs vazifa-backend

# Check environment variables
pm2 show vazifa-backend

# Restart application
pm2 restart vazifa-backend
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"

# Check network connectivity
telnet your-mongodb-host 27017
```

#### 3. Nginx Configuration Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test SSL configuration
openssl s_client -connect vazifa.com:443
```

#### 5. File Permission Issues

```bash
# Fix file permissions
sudo chown -R deploy:deploy /var/www/vazifa
sudo chmod -R 755 /var/www/vazifa
sudo chmod 644 /var/www/vazifa/backend/.env.production
```

### Performance Optimization

#### 1. Enable Gzip Compression

Already included in the Nginx configuration above.

#### 2. Optimize PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'vazifa-backend',
    script: './backend/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

#### 3. Database Optimization

- Use MongoDB indexes for frequently queried fields
- Enable MongoDB connection pooling
- Consider using Redis for session storage

## Security Best Practices

### 1. Server Security

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change default SSH port (optional)
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart sshd

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. Application Security

- Keep all dependencies updated
- Use strong JWT secrets
- Enable rate limiting (Arcjet is already configured)
- Regularly audit npm packages: `npm audit`
- Use HTTPS everywhere
- Implement proper CORS policies

### 3. Database Security

- Use strong database passwords
- Enable MongoDB authentication
- Restrict database access to specific IPs
- Regular database backups
- Keep MongoDB updated

### 4. Environment Variables Security

- Never commit .env files to version control
- Use secure methods to transfer .env files
- Regularly rotate secrets and API keys
- Use different credentials for different environments

## Deployment Checklist

### Pre-Deployment
- [ ] Server meets minimum requirements
- [ ] Node.js 18+ installed on server
- [ ] Nginx installed and configured
- [ ] PM2 installed globally
- [ ] Domain DNS records configured
- [ ] SSL certificates ready
- [ ] Environment variables prepared
- [ ] Database accessible from server

### Deployment
- [ ] Run deployment script successfully
- [ ] Application starts without errors
- [ ] PM2 process running
- [ ] Nginx configuration applied
- [ ] SSL certificates installed
- [ ] Frontend accessible via domain
- [ ] API endpoints responding
- [ ] Database connection working

### Post-Deployment
- [ ] Application monitoring set up
- [ ] Log rotation configured
- [ ] Backup script created and scheduled
- [ ] Security measures implemented
- [ ] Performance optimization applied
- [ ] Documentation updated

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check application logs for errors
- Monitor system resources
- Review security logs
- Test backup restoration

**Monthly:**
- Update system packages
- Update Node.js dependencies
- Review and rotate logs
- Performance analysis

**Quarterly:**
- Security audit
- Dependency vulnerability scan
- Backup strategy review
- Disaster recovery testing

### Getting Help

1. **Check Logs First:**
   - PM2 logs: `pm2 logs`
   - Nginx logs: `/var/log/nginx/`
   - System logs: `journalctl -u nginx`

2. **Common Commands:**
   ```bash
   # Application status
   pm2 status
   pm2 monit
   
   # System status
   systemctl status nginx
   systemctl status mongodb
   
   # Resource usage
   htop
   df -h
   free -h
   ```

3. **Emergency Procedures:**
   - Application crash: `pm2 restart vazifa-backend`
   - High memory usage: `pm2 reload vazifa-backend`
   - Nginx issues: `sudo systemctl restart nginx`
   - SSL problems: `sudo certbot renew`

---

**🎉 Your Vazifa application is now successfully deployed on your SSH server!**

For additional support or questions, refer to the troubleshooting section or check the application logs for specific error messages.
