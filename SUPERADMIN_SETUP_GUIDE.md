# Superadmin Setup & Deployment Guide

## Overview
This guide walks you through creating a superadmin user using the existing script and deploying it to production.

---

## 🚀 Quick Setup (Local Development)

### Prerequisites
- Node.js installed
- MongoDB running locally
- Backend dependencies installed

### Create Superadmin in 3 Steps

**Step 1: Navigate to backend directory**
```bash
cd backend
```

**Step 2: Run the superadmin creation script**
```bash
node create-verified-super-admin.js
```

**Step 3: Login with default credentials**
```
Email: superadmin@vazifa.com
Password: SuperAdmin123!
Role: super_admin
Status: Email verified
```

✅ **Done!** You now have a verified superadmin account.

---

## 🌐 Production Deployment

### Server Details
- **Server IP**: 193.111.11.98
- **SSH Port**: 3022
- **Domain**: protocol.oci.tj
- **Project Path**: `/var/www/vazifa`

### Step-by-Step Production Setup

#### 1. Connect to Production Server
```bash
ssh -p 3022 ubuntu@193.111.11.98
```

#### 2. Navigate to Backend Directory
```bash
cd /var/www/vazifa/backend
```

#### 3. Verify Environment Setup
```bash
# Check if .env file exists and has MongoDB URI
cat .env.production | grep MONGODB_URI

# Should show something like:
# MONGODB_URI=mongodb://vazifa:password@localhost:27017/vazifa-production
```

If `.env.production` doesn't exist, create it:
```bash
nano .env.production
```

Add these essential variables:
```env
# Database Configuration
MONGODB_URI=mongodb://vazifa:your_secure_password@localhost:27017/vazifa-production

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Frontend/Backend URLs
FRONTEND_URL=http://protocol.oci.tj
BACKEND_URL=http://protocol.oci.tj/api-v1
```

#### 4. Verify MongoDB is Running
```bash
sudo systemctl status mongod
```

Expected output should show: `Active: active (running)`

#### 5. Run Superadmin Creation Script
```bash
node create-verified-super-admin.js
```

You should see:
```
Using MongoDB URI: mongodb://***:***@localhost:27017/vazifa-production
Connected to MongoDB
Verified super admin created successfully!
Email: superadmin@vazifa.com
Password: SuperAdmin123!
Role: super_admin
Status: Verified
Disconnected from MongoDB
```

#### 6. Restart Backend Service (if running with PM2)
```bash
pm2 restart vazifa-backend
```

---

## ✅ Verification Steps

### 1. Check Database
Connect to MongoDB and verify the user was created:
```bash
mongosh "mongodb://vazifa:your_password@localhost:27017/vazifa-production"
```

In MongoDB shell:
```javascript
db.users.findOne({ email: "superadmin@vazifa.com" })
```

You should see the user document with:
- `role: "super_admin"`
- `isEmailVerified: true`
- `authProvider: "local"`

Exit MongoDB:
```javascript
exit
```

### 2. Test Login via Frontend

**Local Testing:**
1. Open your browser to `http://localhost:3000` (or your local frontend URL)
2. Click "Login"
3. Enter credentials:
   - Email: `superadmin@vazifa.com`
   - Password: `SuperAdmin123!`
4. You should be logged in with admin privileges

**Production Testing:**
1. Open browser to `http://protocol.oci.tj`
2. Login with the same credentials
3. Verify admin features are accessible

### 3. Test API Access
```bash
# From your local machine or server
curl -X POST http://protocol.oci.tj/api-v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@vazifa.com",
    "password": "SuperAdmin123!"
  }'
```

Expected response should include:
- `token`: JWT authentication token
- `user` object with `role: "super_admin"`

---

## 🔒 Security Best Practices

### Immediate Actions

**1. Change Default Password**
```bash
# After first login, immediately change password through:
# - Frontend: Profile Settings → Change Password
# OR
# - Create a password reset script if needed
```

**2. Secure Environment Variables**
```bash
# Ensure .env files have restricted permissions
chmod 600 /var/www/vazifa/backend/.env.production
```

**3. Update JWT Secret**
Generate a strong JWT secret:
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update in `.env.production`:
```env
JWT_SECRET=your_newly_generated_secret_here
```

### Ongoing Security Measures

- ✅ Use strong, unique passwords for all admin accounts
- ✅ Never commit `.env` files to version control
- ✅ Regularly rotate JWT secrets
- ✅ Enable MongoDB authentication in production
- ✅ Use HTTPS with SSL certificates (Let's Encrypt)
- ✅ Set up firewall rules to restrict database access
- ✅ Implement rate limiting on login endpoints
- ✅ Enable audit logging for admin actions
- ✅ Regularly backup MongoDB database

---

## 🛠️ Troubleshooting

### Problem: "Command find requires authentication" Error

**Cause**: MongoDB authentication is enabled but script isn't loading credentials properly.

**Solution**:
```bash
# 1. Verify .env file exists and has correct MongoDB URI
cd /var/www/vazifa/backend
cat .env.production | grep MONGODB_URI

# 2. If missing, create it with correct credentials
nano .env.production

# 3. Run script with explicit dotenv loading
node -r dotenv/config create-verified-super-admin.js dotenv_config_path=.env.production
```

### Problem: MongoDB Connection Failed

**Cause**: MongoDB service not running or connection string incorrect.

**Solution**:
```bash
# Check MongoDB status
sudo systemctl status mongod

# If not running, start it
sudo systemctl start mongod

# Test connection manually
mongosh "mongodb://vazifa:your_password@localhost:27017/vazifa-production"

# Check MongoDB logs for errors
sudo tail -50 /var/log/mongodb/mongod.log
```

### Problem: User Already Exists

**Cause**: Superadmin was already created previously.

**Solution**: The script handles this gracefully by updating the existing user to verified status. If you see "Super admin updated to verified status!", this is expected behavior.

To create a different admin user, use `add-new-admin.js` instead:
```bash
node add-new-admin.js
```

### Problem: Wrong Database

**Cause**: Script connecting to wrong database (e.g., development instead of production).

**Solution**:
```bash
# Check which database is being used
node -e "require('dotenv').config({path: '.env.production'}); console.log(process.env.MONGODB_URI)"

# Update MONGODB_URI in .env.production to correct database
nano .env.production
```

### Problem: Script Runs but Login Fails

**Possible causes**:
1. Backend not restarted after user creation
2. JWT secret mismatch
3. Frontend using wrong API URL

**Solutions**:
```bash
# 1. Restart backend
pm2 restart vazifa-backend

# 2. Verify JWT_SECRET is same in backend .env
cat .env.production | grep JWT_SECRET

# 3. Check frontend API URL
cd /var/www/vazifa/frontend
cat .env | grep VITE_API_URL
# Should be: VITE_API_URL=http://protocol.oci.tj/api-v1

# 4. Check PM2 logs for errors
pm2 logs vazifa-backend --lines 50
```

### Problem: PM2 Process Crashed After User Creation

**Cause**: Backend error due to environment issues.

**Solution**:
```bash
# Check PM2 logs
pm2 logs vazifa-backend --lines 100

# Restart with logging
pm2 restart vazifa-backend --watch

# If persistent, check Node.js version
node --version  # Should be v20.x.x
```

---

## 📋 Quick Reference

### Default Superadmin Credentials
```
Email: superadmin@vazifa.com
Password: SuperAdmin123!
Role: super_admin
```

### Important File Locations
```
Script: /var/www/vazifa/backend/create-verified-super-admin.js
Env: /var/www/vazifa/backend/.env.production
Logs: pm2 logs vazifa-backend
```

### Essential Commands
```bash
# Create superadmin
cd /var/www/vazifa/backend
node create-verified-super-admin.js

# Check PM2 status
pm2 list
pm2 logs vazifa-backend

# Restart services
pm2 restart vazifa-backend
sudo systemctl restart mongod

# View MongoDB users
mongosh "mongodb://vazifa:password@localhost:27017/vazifa-production"
db.users.find({ role: "super_admin" })
```

---

## 🎯 Next Steps

After successfully creating the superadmin:

1. ✅ **Login and change password** immediately
2. ✅ **Verify admin features** work correctly
3. ✅ **Create additional admin users** if needed (using frontend admin panel or `add-new-admin.js`)
4. ✅ **Set up SSL certificate** for HTTPS (use Let's Encrypt)
5. ✅ **Configure email notifications** (update SMTP settings in .env)
6. ✅ **Set up database backups** (MongoDB backup scripts)
7. ✅ **Enable monitoring** (PM2 monitoring, log aggregation)
8. ✅ **Document admin procedures** for your team

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check PM2 logs: `pm2 logs`
2. Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`
3. Check NGINX logs: `sudo tail -f /var/log/nginx/error.log`
4. Review existing deployment guides in the project root
5. Check the backend code: `backend/create-verified-super-admin.js`

---

## ✨ Summary

You now have:
- ✅ A verified superadmin account created
- ✅ Production deployment instructions
- ✅ Verification procedures
- ✅ Security best practices
- ✅ Troubleshooting guide

**Remember**: Always change the default password after first login in production!
