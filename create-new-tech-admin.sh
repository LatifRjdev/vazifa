#!/bin/bash

# Script to create a new tech admin user with password

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"
TECH_ADMIN_EMAIL="latifrjdev@gmail.com"
TECH_ADMIN_PASSWORD="fwr123456"
TECH_ADMIN_NAME="Latif"

echo "=========================================="
echo "👤 Creating New Tech Admin User"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << ENDSSH
set -e

cd /var/www/vazifa/backend

echo "Creating user: $TECH_ADMIN_EMAIL"

node << 'ENDNODE'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTechAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Dynamic import for ES module
    const User = (await import('./models/users.js')).default;
    
    const email = '$TECH_ADMIN_EMAIL';
    const password = '$TECH_ADMIN_PASSWORD';
    const name = '$TECH_ADMIN_NAME';
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('📝 User already exists, updating to tech_admin role...');
      user.role = 'tech_admin';
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ User updated to tech_admin');
    } else {
      console.log('➕ Creating new tech admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        role: 'tech_admin',
        isEmailVerified: true,
        isPhoneVerified: false,
        authProvider: 'local'
      });
      
      console.log('✅ New tech admin user created!');
    }
    
    console.log('');
    console.log('========================================');
    console.log('✅ TECH ADMIN READY!');
    console.log('========================================');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Verified:', user.isEmailVerified);
    console.log('Dashboard: https://protocol.oci.tj/dashboard/tech-admin');
    console.log('========================================');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTechAdmin();
ENDNODE

echo ""
echo "🔄 Restarting backend..."
pm2 restart backend || pm2 restart all

echo ""
echo "📊 PM2 Status:"
pm2 list

ENDSSH

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📋 Login Credentials:"
echo "URL: https://protocol.oci.tj/sign-in"
echo "Email: $TECH_ADMIN_EMAIL"
echo "Password: $TECH_ADMIN_PASSWORD"
echo ""
echo "🎯 After login, you'll be automatically redirected to:"
echo "/dashboard/tech-admin"
echo ""
echo "🔧 Available Features:"
echo "  ✓ System Health Monitoring"
echo "  ✓ SMS Logs & Analytics"
echo "  ✓ User Management"
echo "  ✓ Task Management"
echo "  ✓ Database Statistics"
echo ""
echo "=========================================="
