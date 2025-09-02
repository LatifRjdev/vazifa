import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/users.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin users
    await User.deleteMany({ role: 'admin' });
    console.log('Deleted existing admin users');

    // Create admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminName = 'System Administrator';

    // Check if user with this email exists
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      // Update existing user to admin
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      await adminUser.save();
      console.log('✅ Existing user promoted to Admin:', adminEmail);
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      adminUser = await User.create({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'admin',
        isEmailVerified: true
      });

      console.log('✅ Admin user created successfully!');
    }

    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👑 Role:', adminUser.role);
    console.log('✅ Email Verified:', adminUser.isEmailVerified);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
