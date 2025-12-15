#!/bin/bash

# Final script to install dependencies and create tech admin

SSH_HOST="ubuntu@193.111.11.98"
SSH_PORT="3022"
TECH_ADMIN_EMAIL="latifrjdev@gmail.com"
TECH_ADMIN_PASSWORD="fwr123456"

echo "=========================================="
echo "👤 Creating Tech Admin User"
echo "=========================================="
echo ""

ssh -p $SSH_PORT $SSH_HOST << 'ENDSSH'
set -e

cd /var/www/vazifa/backend

echo "📦 Installing all dependencies (including dev)..."
npm install

echo ""
echo "👤 Creating tech admin user..."

node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTechAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = (await import('./models/users.js')).default;
    
    const email = 'latifrjdev@gmail.com';
    const password = 'fwr123456';
    const name = 'Latif';
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('📝 User exists, updating to tech_admin...');
      user.role = 'tech_admin';
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ Updated to tech_admin');
    } else {
      console.log('➕ Creating new user...');
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
      
      console.log('✅ New tech admin created!');
    }
    
    console.log('');
    console.log('========================================');
    console.log('✅ TECH ADMIN READY!');
    console.log('========================================');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('========================================');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTechAdmin();
"

echo ""
echo "🔄 Restarting PM2..."
pm2 restart backend || pm2 restart all

echo ""
echo "📊 PM2 Status:"
pm2 list

ENDSSH

echo ""
echo "=========================================="
echo "✅ SUCCESS!"
echo "=========================================="
echo ""
echo "📋 Login at:"
echo "URL: https://protocol.oci.tj/sign-in"
echo "Email: $TECH_ADMIN_EMAIL"
echo "Password: $TECH_ADMIN_PASSWORD"
echo ""
echo "🎯 Auto-redirect to: /dashboard/tech-admin"
echo "=========================================="
