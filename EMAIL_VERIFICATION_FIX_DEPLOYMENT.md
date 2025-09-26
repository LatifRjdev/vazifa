# Email Verification Fix - SSH Deployment Guide

## Overview
This guide shows how to deploy the email verification URL fix to your production server via SSH.

## Changes Made
- Fixed email verification URLs to use production domain (https://protocol.oci.tj)
- Updated password reset URLs for production
- Fixed OAuth callback URLs
- Applied environment-aware URL selection

## Git Commit Details
- **Commit Hash**: `c796ecd4`
- **Branch**: `main`
- **Files Changed**: `backend/controllers/auth-controller.js`

## SSH Deployment Steps

### 1. Connect to Your Server
```bash
ssh your-username@your-server-ip
# or if you have a specific SSH key:
ssh -i /path/to/your/key.pem your-username@your-server-ip
```

### 2. Navigate to Your Project Directory
```bash
cd /path/to/your/vazifa-project
# Example: cd /var/www/vazifa or cd ~/vazifa
```

### 3. Pull the Latest Changes
```bash
# Fetch the latest changes from GitHub
git fetch origin main

# Pull and merge the changes
git pull origin main
```

### 4. Verify the Changes
```bash
# Check that the commit was pulled successfully
git log --oneline -5

# You should see the commit: "Fix email verification URLs to use production domain"
```

### 5. Check Environment Configuration
```bash
# Verify your production environment file exists and has correct settings
cat backend/.env.production

# Should contain:
# NODE_ENV=production
# FRONTEND_URL=https://protocol.oci.tj
# PRODUCTION_FRONTEND_URL=https://protocol.oci.tj
```

### 6. Restart Your Backend Service

#### If using PM2:
```bash
# Restart the backend service
pm2 restart backend

# Or restart all services
pm2 restart all

# Check status
pm2 status
```

#### If using systemd:
```bash
# Restart your service (replace 'vazifa-backend' with your actual service name)
sudo systemctl restart vazifa-backend

# Check status
sudo systemctl status vazifa-backend
```

#### If using Docker:
```bash
# Navigate to your docker-compose directory
cd /path/to/your/docker-compose-directory

# Rebuild and restart the backend container
docker-compose up -d --build backend

# Or restart all services
docker-compose restart
```

#### If running directly with Node.js:
```bash
# Kill the existing process (find the PID first)
ps aux | grep node

# Kill the process (replace XXXX with actual PID)
kill XXXX

# Start the backend again
cd backend
NODE_ENV=production node index.js

# Or if you have a start script:
npm run start:production
```

### 7. Verify the Fix

#### Test Email Verification:
1. Register a new user on your website
2. Check the server logs for the verification URL
3. The URL should now show `https://protocol.oci.tj/verify-email?token=...`

#### Check Server Logs:
```bash
# If using PM2:
pm2 logs backend

# If using systemd:
sudo journalctl -u vazifa-backend -f

# If using Docker:
docker-compose logs -f backend
```

### 8. Test the Fix
1. Go to your website: https://protocol.oci.tj
2. Try to register a new account
3. Check your email - the verification button should now redirect to your domain instead of localhost:5173

## Troubleshooting

### If the changes don't appear:
```bash
# Check if you're on the right branch
git branch

# Check if the latest commit is present
git log --oneline -1

# Force pull if needed (be careful - this will overwrite local changes)
git reset --hard origin/main
```

### If the service won't restart:
```bash
# Check for syntax errors
cd backend
node -c index.js

# Check for missing dependencies
npm install
```

### If emails still show localhost:
1. Verify `NODE_ENV=production` is set in your environment
2. Check that your process is actually using the `.env.production` file
3. Restart the service completely

## Environment Variables Checklist
Make sure these are set in your production environment:
- ✅ `NODE_ENV=production`
- ✅ `FRONTEND_URL=https://protocol.oci.tj`
- ✅ `PRODUCTION_FRONTEND_URL=https://protocol.oci.tj`
- ✅ `BACKEND_URL=https://ptapi.oci.tj`
- ✅ `PRODUCTION_BACKEND_URL=https://ptapi.oci.tj`

## Success Indicators
- ✅ Git pull completed successfully
- ✅ Service restarted without errors
- ✅ Server logs show production URLs in verification links
- ✅ New user registration emails contain correct domain links
- ✅ Email verification buttons redirect to https://protocol.oci.tj

## 🚨 TROUBLESHOOTING - If Still Getting localhost:5173

If you're still seeing localhost:5173 in emails after deployment, the issue is likely with your production environment configuration. Follow these steps:

### Step 1: Run the Diagnostic Script
```bash
# SSH into your server and navigate to your project
ssh your-username@your-server-ip
cd /path/to/your/vazifa-project

# Pull the latest changes (includes the diagnostic script)
git pull origin main

# Run the diagnostic script
cd backend
node debug-env.js
```

### Step 2: Check the Diagnostic Output
The script will show you:
- ✅ What NODE_ENV is currently set to
- ✅ What environment variables are loaded
- ✅ Which .env files exist and their contents
- ✅ What URL would be selected for emails

### Step 3: Common Issues and Fixes

#### Issue 1: NODE_ENV is not set to "production"
**Symptoms:** Script shows `NODE_ENV: undefined` or `NODE_ENV: development`

**Fix:**
```bash
# Set NODE_ENV permanently for your service
# If using PM2:
pm2 set NODE_ENV production
pm2 restart all

# If using systemd, edit your service file:
sudo nano /etc/systemd/system/your-service.service
# Add: Environment=NODE_ENV=production
sudo systemctl daemon-reload
sudo systemctl restart your-service

# If using Docker, add to docker-compose.yml:
environment:
  - NODE_ENV=production
```

#### Issue 2: .env.production file not being loaded
**Symptoms:** Script shows `.env.production does not exist` or variables are empty

**Fix:**
```bash
# Make sure .env.production exists in the backend directory
ls -la backend/.env.production

# If it doesn't exist, create it:
cat > backend/.env.production << 'EOF'
# Server Configuration
PORT=5001
NODE_ENV=production

# Frontend URLs
FRONTEND_URL=https://protocol.oci.tj
PRODUCTION_FRONTEND_URL=https://protocol.oci.tj

# Backend URLs
BACKEND_URL=https://ptapi.oci.tj
PRODUCTION_BACKEND_URL=https://ptapi.oci.tj

# Add your other production variables here...
EOF
```

#### Issue 3: Process is loading wrong .env file
**Symptoms:** Script shows correct .env.production but wrong variables in process.env

**Fix:**
```bash
# Check your application startup
# Make sure your app loads .env.production in production

# If using PM2, create ecosystem.config.js:
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'backend',
    script: 'backend/index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Then start with:
pm2 start ecosystem.config.js --env production
```

#### Issue 4: Environment variables not being exported
**Symptoms:** Variables exist in .env.production but not in process.env

**Fix:**
```bash
# Manually export variables before starting your app:
export NODE_ENV=production
export FRONTEND_URL=https://protocol.oci.tj
export PRODUCTION_FRONTEND_URL=https://protocol.oci.tj

# Then restart your service
```

### Step 4: Force Environment Configuration
If the above doesn't work, you can force the correct configuration by modifying your startup:

```bash
# Create a production startup script
cat > backend/start-production.js << 'EOF'
// Force production environment
process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://protocol.oci.tj';
process.env.PRODUCTION_FRONTEND_URL = 'https://protocol.oci.tj';
process.env.BACKEND_URL = 'https://ptapi.oci.tj';
process.env.PRODUCTION_BACKEND_URL = 'https://ptapi.oci.tj';

// Load your main application
require('./index.js');
EOF

# Use this script to start your app:
node backend/start-production.js
```

### Step 5: Verify the Fix
After making changes:
1. Restart your backend service
2. Run the diagnostic script again: `node backend/debug-env.js`
3. Check that "Selected Frontend URL" shows your production domain
4. Test user registration to confirm emails now use correct URLs

### Step 6: Alternative Quick Fix
If you need an immediate fix while troubleshooting environment issues:

```bash
# Temporarily hardcode the production URL in auth-controller.js
# Edit the file and replace the environment logic with:
# const frontendUrl = 'https://protocol.oci.tj';

# This is not recommended for long-term but will work immediately
```

## Support
If you encounter any issues during deployment, check:
1. **Environment Configuration**: Run `node backend/debug-env.js`
2. **Server logs**: Check for environment-related errors
3. **Process manager**: Ensure NODE_ENV=production is set
4. **File permissions**: Make sure .env.production is readable
5. **Service restart**: Fully restart your backend service

The fix is now live and email verification should work correctly with your production domain!
