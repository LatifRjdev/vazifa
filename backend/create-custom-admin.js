import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/users.js';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

const createCustomAdmin = async () => {
  try {
    console.log('🔧 Creating Custom Admin User');
    console.log('================================');

    // Get admin details from user input
    const adminEmail = await question('📧 Enter admin email: ');
    const adminPassword = await question('🔑 Enter admin password: ');
    const adminName = await question('👤 Enter admin first name: ');
    const adminLastName = await question('👤 Enter admin last name (optional): ');

    console.log('\n🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log('👤 User already exists. Promoting to admin...');
      
      // If user exists, promote them to admin
      existingUser.role = 'admin';
      existingUser.isEmailVerified = true;
      if (adminName) existingUser.name = adminName;
      if (adminLastName) existingUser.lastName = adminLastName;
      
      await existingUser.save();
      
      console.log('✅ Existing user promoted to Admin!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Name:', `${existingUser.name} ${existingUser.lastName || ''}`);
      console.log('👑 Role:', existingUser.role);
      console.log('✅ Email Verified:', existingUser.isEmailVerified);
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const newAdmin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        lastName: adminLastName || '',
        role: 'admin',
        isEmailVerified: true,
        authProvider: 'local'
      });

      console.log('✅ New Admin user created successfully!');
      console.log('📧 Email:', adminEmail);
      console.log('👤 Name:', `${adminName} ${adminLastName || ''}`);
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

    console.log('\n🎉 Admin creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    rl.close();
    process.exit(0);
  }
};

createCustomAdmin();
