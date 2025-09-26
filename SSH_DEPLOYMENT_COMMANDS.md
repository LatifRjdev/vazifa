# SSH Server Update Commands

## 🚀 **Quick Deployment to Your Server**

Run these commands on your SSH server to get all the latest fixes:

```bash
# 1. Navigate to your project directory
cd /var/www/vazifa

# 2. Pull the latest changes from GitHub
git pull origin main

# 3. Make the deployment script executable
chmod +x deploy-complete-fix.sh

# 4. Run the automated deployment script
./deploy-complete-fix.sh
```

## 🎯 **What This Will Do**

The deployment script will automatically:
- ✅ Fix admin password in database
- ✅ Update nginx configuration with reverse proxy
- ✅ Verify all services are running
- ✅ Test API endpoints
- ✅ Show you the final status

## 🔧 **Manual Steps (If Automated Script Fails)**

If the automated script doesn't work, run these commands manually:

### **Step 1: Fix Admin Password**
```bash
cd /var/www/vazifa/backend
node fix-admin-password.js
```

### **Step 2: Update Nginx Configuration**
```bash
# Backup current config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Install new config
sudo cp /var/www/vazifa/nginx-vazifa-config /etc/nginx/sites-available/default

# Test and reload nginx
sudo nginx -t
sudo nginx -s reload
```

### **Step 3: Restart Services**
```bash
pm2 restart all
pm2 status
```

## 🎉 **Test Your System**

After deployment, test with these credentials:
- **Email**: `admin@vazifa2.com`
- **Password**: `fwr123456`

### **Test Commands:**
```bash
# Test backend API
curl -X POST http://localhost:5001/api-v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vazifa2.com","password":"fwr123456"}'

# Check services
pm2 status
```

### **Test Website:**
1. Go to `https://protocol.oci.tj`
2. Login with the admin credentials above
3. Register a new user to test email verification URLs

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Backend API returns a JWT token (not "Invalid credentials")
- ✅ Website login redirects to admin dashboard
- ✅ Email verification links point to `https://protocol.oci.tj`
- ✅ No errors in PM2 logs

## 🆘 **If You Need Help**

If something doesn't work:
1. Check PM2 logs: `pm2 logs --lines 20`
2. Check nginx status: `sudo systemctl status nginx`
3. Verify services: `pm2 status`

**Your system should now be fully functional!**
