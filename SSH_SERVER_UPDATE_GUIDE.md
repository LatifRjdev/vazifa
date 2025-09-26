# SSH Server Update Guide - Email Verification URL Fix

## Overview
This guide will help you update your SSH server with the email verification URL fixes that have been committed to GitHub.

## Prerequisites
- SSH access to your production server
- Git installed on your server
- Your server should have the repository cloned

## Step-by-Step Update Process

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

### 3. Check Current Status
```bash
# Check current branch and status
git status
git branch

# Check current commit
git log --oneline -5
```

### 4. Pull Latest Changes from GitHub
```bash
# Fetch latest changes
git fetch origin

# Pull the latest changes from main branch
git pull origin main
```

### 5. Verify the Updates
Check that the key files have been updated:

```bash
# Check if the auth controller has been updated
grep -n "PRODUCTION_FRONTEND_URL.*FRONTEND_URL" backend/controllers/auth-controller.js

# Check if index.js has been updated
grep -n "PRODUCTION_FRONTEND_URL.*FRONTEND_URL" backend/index.js

# Verify the debug script exists
ls -la backend/test-url-generation.js
```

### 6. Test the URL Generation (Optional)
Run the debug script to verify URLs are generated correctly:

```bash
cd backend
node test-url-generation.js
```

Expected output should show:
- ✅ All URLs pointing to `https://protocol.oci.tj`
- ✅ No localhost references

### 7. Restart Your Backend Service

#### Option A: If using PM2
```bash
# Restart the backend service
pm2 restart backend

# Check status
pm2 status

# View logs
pm2 logs backend --lines 20
```

#### Option B: If using systemd
```bash
# Restart the service (replace 'vazifa-backend' with your service name)
sudo systemctl restart vazifa-backend

# Check status
sudo systemctl status vazifa-backend

# View logs
sudo journalctl -u vazifa-backend -f --lines 20
```

#### Option C: If running manually
```bash
# Stop the current process (Ctrl+C if running in foreground)
# Then restart
cd backend
npm start
# or
node index.js
```

### 8. Verify the Fix is Working

#### Test 1: Check API Root Endpoint
```bash
curl https://ptapi.oci.tj/
```

Should return JSON with `live: "https://protocol.oci.tj"`

#### Test 2: Register a Test User
1. Go to your frontend: `https://protocol.oci.tj`
2. Try to register a new user
3. Check server logs for the verification URL
4. Verify the URL points to `https://protocol.oci.tj/verify-email?token=...`

#### Test 3: Monitor Server Logs
```bash
# Watch logs for URL generation
tail -f /path/to/your/logs/backend.log
# or if using PM2:
pm2 logs backend --lines 0 -f
```

Look for the debug output showing:
```
================================================================================
📧 EMAIL VERIFICATION LINK FOR: user@example.com
🌍 NODE_ENV: production
🔗 FRONTEND_URL: https://protocol.oci.tj
🔗 PRODUCTION_FRONTEND_URL: https://protocol.oci.tj
✅ FINAL FRONTEND URL: https://protocol.oci.tj
🔗 VERIFICATION URL: https://protocol.oci.tj/verify-email?token=...
================================================================================
```

## Troubleshooting

### Issue: Git Pull Fails
```bash
# If you have local changes conflicting
git stash
git pull origin main
git stash pop
```

### Issue: Environment Variables Not Loading
```bash
# Check if .env files exist
ls -la backend/.env*

# Verify environment variables
cd backend
node -e "require('dotenv').config(); console.log('FRONTEND_URL:', process.env.FRONTEND_URL); console.log('PRODUCTION_FRONTEND_URL:', process.env.PRODUCTION_FRONTEND_URL);"
```

### Issue: Service Won't Restart
```bash
# Check what's using the port
sudo netstat -tlnp | grep :5001

# Kill process if needed
sudo kill -9 <process-id>

# Then restart your service
```

### Issue: Still Getting localhost URLs
1. Verify the files were actually updated:
   ```bash
   git log --oneline -1
   # Should show: "Fix email verification URLs pointing to localhost"
   ```

2. Check if you're using the correct environment file:
   ```bash
   cd backend
   node test-url-generation.js
   ```

3. Restart the service completely:
   ```bash
   pm2 delete backend
   pm2 start ecosystem.config.js
   # or your startup command
   ```

## Files Modified in This Update

1. **`backend/controllers/auth-controller.js`**
   - Fixed email verification URL generation
   - Fixed password reset URL generation
   - Fixed OAuth callback URLs
   - Added comprehensive debug logging

2. **`backend/index.js`**
   - Updated CORS configuration
   - Fixed root route URL generation

3. **`backend/test-url-generation.js`** (New file)
   - Debug script for testing URL generation

4. **`EMAIL_VERIFICATION_URL_FIX_SUMMARY.md`** (New file)
   - Comprehensive documentation of the fix

## Verification Checklist

- [ ] Successfully pulled latest changes from GitHub
- [ ] Backend service restarted without errors
- [ ] Debug script shows correct URLs (no localhost)
- [ ] API root endpoint returns correct frontend URL
- [ ] New user registration generates correct verification URLs
- [ ] Server logs show proper URL generation with debug info

## Support

If you encounter any issues during the update process:

1. Check the server logs for specific error messages
2. Verify your environment variables are correctly set
3. Ensure your server has proper permissions to read the updated files
4. Test the debug script to isolate URL generation issues

The email verification links should now correctly point to `https://protocol.oci.tj` instead of `localhost:5173`.
