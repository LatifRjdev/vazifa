# SSH PM2 Deployment Guide - Complete System Update

## Overview
This guide provides step-by-step instructions for updating your Vazifa application on your SSH server using PM2, including all the recent changes for Russian language support, email configuration, and Google OAuth fixes.

## Prerequisites
- SSH access to your production server
- PM2 installed and running
- Git repository access
- Node.js and npm installed

## Step-by-Step Deployment Process

### 1. Connect to Your SSH Server
```bash
ssh your-username@your-server-ip
# Replace with your actual SSH credentials
```

### 2. Navigate to Your Project Directory
```bash
cd /path/to/your/vazifa-project
# Replace with your actual project path
```

### 3. Stop the PM2 Process
```bash
# Stop the backend service
pm2 stop vazifa-backend

# Verify it's stopped
pm2 status
```

### 4. Backup Current State (Optional but Recommended)
```bash
# Create a backup of current state
cp -r . ../vazifa-backup-$(date +%Y%m%d_%H%M%S)

# Backup current environment file
cp backend/.env.production backend/.env.production.backup
```

### 5. Pull Latest Changes from GitHub
```bash
# Fetch latest changes
git fetch origin

# Check current status
git status

# Pull the latest changes from main branch
git pull origin main

# Verify the latest commit
git log --oneline -5
```

### 6. Install/Update Dependencies
```bash
# Update backend dependencies
cd backend
npm install

# Update frontend dependencies (if needed)
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 7. Verify Environment Configuration
The new `.env.production` should now include:
- Google OAuth credentials (securely configured)
- Internal SMTP server settings (activated)
- All existing production URLs

```bash
# Check if the environment file has the new configurations
cd backend
grep -E "(GOOGLE_CLIENT_ID|SMTP_HOST)" .env.production
```

Expected output should show:
```
GOOGLE_CLIENT_ID=848608292905-tlen0tnjgik9rb0rk8ifgn1l4ejkdedl.apps.googleusercontent.com
SMTP_HOST=172.16.55.75
```

### 8. Test Configuration (Optional)
```bash
# Test URL generation
node test-url-generation.js

# Test environment loading
node -e "require('dotenv').config(); console.log('SMTP_HOST:', process.env.SMTP_HOST); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');"
```

### 9. Build Frontend (if needed)
```bash
cd frontend
npm run build
cd ..
```

### 10. Start the PM2 Process
```bash
# Start the backend service
pm2 start vazifa-backend

# Check status
pm2 status

# View logs to ensure everything is working
pm2 logs vazifa-backend --lines 20
```

### 11. Monitor the Application
```bash
# Watch logs in real-time
pm2 logs vazifa-backend -f

# Check process status
pm2 monit
```

### 12. Verify the Updates Are Working

#### Test 1: Check API Endpoint
```bash
curl https://ptapi.oci.tj/
```
Should return JSON with correct frontend URL.

#### Test 2: Test Email Configuration
1. Go to your frontend: `https://protocol.oci.tj`
2. Try to register a new test user
3. Check PM2 logs for email sending attempts:
```bash
pm2 logs vazifa-backend | grep -i "email\|smtp"
```

#### Test 3: Test Google OAuth
1. Go to sign-in page: `https://protocol.oci.tj/sign-in`
2. Click "Google" button
3. Should redirect to Google OAuth properly

#### Test 4: Check Russian Messages
1. Try to sign up with an existing email
2. Verify error messages are in Russian
3. Check all popup messages are in Russian

## Troubleshooting

### Issue: PM2 Process Won't Start
```bash
# Check for port conflicts
sudo netstat -tlnp | grep :5001

# Kill conflicting processes if needed
sudo kill -9 <process-id>

# Check PM2 logs for errors
pm2 logs vazifa-backend --err

# Restart PM2 daemon if needed
pm2 kill
pm2 resurrect
```

### Issue: Environment Variables Not Loading
```bash
# Verify .env.production exists and has correct permissions
ls -la backend/.env.production

# Test environment loading manually
cd backend
node -e "require('dotenv').config(); console.log('NODE_ENV:', process.env.NODE_ENV);"
```

### Issue: Google OAuth Not Working
```bash
# Check if Google credentials are set
cd backend
node -e "require('dotenv').config(); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'); console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');"
```

### Issue: Email Not Sending
```bash
# Test SMTP connection
cd backend
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('SMTP OK')).catch(err => console.log('SMTP Error:', err.message));
"
```

### Issue: Frontend Not Loading
```bash
# Check if frontend build exists
ls -la frontend/build/

# Rebuild if necessary
cd frontend
npm run build
cd ..

# Restart PM2
pm2 restart vazifa-backend
```

## PM2 Useful Commands

```bash
# View all processes
pm2 list

# Restart specific process
pm2 restart vazifa-backend

# Stop specific process
pm2 stop vazifa-backend

# Delete process (removes from PM2)
pm2 delete vazifa-backend

# View detailed info
pm2 show vazifa-backend

# Save current PM2 configuration
pm2 save

# View logs with timestamps
pm2 logs vazifa-backend --timestamp

# Clear logs
pm2 flush vazifa-backend
```

## Verification Checklist

After deployment, verify these items:

- [ ] PM2 process is running without errors
- [ ] API endpoint returns correct data
- [ ] Frontend loads properly
- [ ] User registration shows Russian messages
- [ ] Google OAuth redirects correctly
- [ ] Email configuration attempts to send (check logs)
- [ ] All popup messages are in Russian
- [ ] Mobile responsiveness works
- [ ] No console errors in browser

## Rollback Procedure (If Needed)

If something goes wrong, you can rollback:

```bash
# Stop current process
pm2 stop vazifa-backend

# Restore from backup
rm -rf backend/.env.production
cp backend/.env.production.backup backend/.env.production

# Revert to previous commit (if needed)
git log --oneline -10
git checkout <previous-commit-hash>

# Restart
pm2 start vazifa-backend
```

## Key Changes Deployed

1. **Russian Language Support**: All toast messages standardized to Russian
2. **Email Configuration**: Switched from Gmail to internal SMTP server (172.16.55.75)
3. **Google OAuth**: Properly configured with secure environment variables
4. **Apple OAuth**: Improved messaging (still "coming soon")
5. **Security**: Google OAuth credentials secured in environment variables
6. **Responsive Design**: Verified mobile compatibility

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs vazifa-backend`
2. Verify environment variables are loaded correctly
3. Test individual components (API, frontend, email, OAuth)
4. Check server resources (disk space, memory, CPU)

The application should now have all popup messages in Russian, working Google OAuth, and proper email configuration using your internal SMTP server.
