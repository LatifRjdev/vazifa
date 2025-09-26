# Admin User Creation Guide

## Overview
This guide provides multiple ways to create admin users for your Vazifa application.

## Available Scripts

### 1. **create-verified-super-admin.js** (Fixed)
Creates a default super admin with predefined credentials.

**Usage:**
```bash
cd /var/www/vazifa/backend
node create-verified-super-admin.js
```

**Default Credentials:**
- Email: `superadmin@vazifa.com`
- Password: `SuperAdmin123!`
- Role: `super_admin`
- Status: Email verified

### 2. **add-new-admin.js** (Ready to use)
Creates a predefined admin user or promotes existing user.

**Usage:**
```bash
cd /var/www/vazifa/backend
node add-new-admin.js
```

**Default Credentials:**
- Email: `newadmin@vazifa.com`
- Password: `NewAdmin123!`
- Role: `admin`
- Status: Email verified

### 3. **create-custom-admin.js** (New - Interactive)
Interactive script that lets you create admin with custom credentials.

**Usage:**
```bash
cd /var/www/vazifa/backend
node create-custom-admin.js
```

This script will prompt you for:
- Admin email
- Admin password
- First name
- Last name (optional)

## What Was Fixed

### Problem
The original scripts had MongoDB authentication issues because they weren't loading environment variables properly.

### Solution
- Added `dotenv.config()` to load environment variables
- Added debug logging to show which MongoDB URI is being used
- Fixed connection string to use your production MongoDB with authentication

## Step-by-Step Instructions

### Option 1: Quick Super Admin Creation
```bash
# SSH into your server
ssh your-username@your-server-ip

# Navigate to backend directory
cd /var/www/vazifa/backend

# Create super admin
node create-verified-super-admin.js
```

### Option 2: Create Custom Admin
```bash
# SSH into your server
ssh your-username@your-server-ip

# Navigate to backend directory
cd /var/www/vazifa/backend

# Run interactive admin creation
node create-custom-admin.js

# Follow the prompts to enter:
# - Email address
# - Password
# - First name
# - Last name (optional)
```

### Option 3: Promote Existing User
If you already have a user account:

```bash
cd /var/www/vazifa/backend

# Edit the add-new-admin.js file to use existing user's email
# Then run:
node add-new-admin.js
```

## Verification

After creating an admin, you can verify it worked by:

1. **Check the script output** - it will show all admin users
2. **Try logging in** to your frontend with the admin credentials
3. **Check admin features** are available in the interface

## Troubleshooting

### If you get "Command find requires authentication" error:
- The script is now fixed to load environment variables properly
- Make sure you're running from the `/var/www/vazifa/backend` directory
- Verify your `.env` file has the correct `MONGODB_URI`

### If MongoDB connection fails:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check your environment variables
cd /var/www/vazifa/backend
node -e "require('dotenv').config(); console.log('MONGODB_URI:', process.env.MONGODB_URI);"
```

### If user creation fails:
- Check that the email doesn't already exist
- Verify MongoDB has write permissions
- Check server logs for detailed error messages

## Security Notes

- **Change default passwords** immediately after creation
- **Use strong passwords** for admin accounts
- **Limit admin access** to trusted users only
- **Enable 2FA** if available in your application

## Admin Roles

- **super_admin**: Full system access
- **admin**: Administrative access with some limitations

Choose the appropriate role based on the user's responsibilities.
