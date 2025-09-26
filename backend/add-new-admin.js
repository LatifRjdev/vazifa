import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/users.js';

// Load production environment
dotenv.config({ path: '.env.production' });

const addNewAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin user details - you can modify these
    const adminEmail = 'newadmin@vazifa.com';
    const adminPassword = 'NewAdmin123!';
    const adminName = 'New Admin';
    const adminLastName = 'User';

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      // If user exists, promote them to admin
      existingUser.role = 'admin';
      existingUser.isEmailVerified = true;
      await existingUser.save();
      
      console.log('✅ Existing user promoted to Admin!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Name:', existingUser.name);
      console.log('👑 Role:', existingUser.role);
      console.log('✅ Email Verified:', existingUser.isEmailVerified);
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const newAdmin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        lastName: adminLastName,
        role: 'admin',
        isEmailVerified: true,
        authProvider: 'local'
      });

      console.log('✅ New Admin user created successfully!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('👤 Name:', `${adminName} ${adminLastName}`);
      console.log('👑 Role:', newAdmin.role);
      console.log('✅ Email Verified:', newAdmin.isEmailVerified);
    }

    // Display all admin users
    console.log('\n📋 All Admin Users:');
    const allAdmins = await User.find({ 
      role: { $in: ['admin', 'super_admin'] } 
    }).select('email name lastName role isEmailVerified createdAt');
    
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} - ${admin.name} ${admin.lastName || ''} (${admin.role}) - Verified: ${admin.isEmailVerified}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
};

addNewAdmin();
