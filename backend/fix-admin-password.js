import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/users.js';

// Load environment variables
dotenv.config({ path: '.env.production' });

const fixAdminPassword = async () => {
  try {
    console.log('🔧 Fixing admin password...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@vazifa2.com' });
    
    if (user) {
      console.log('👤 User found:', user.email);
      console.log('🔍 Current password status:', !!user.password);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('fwr123456', 10);
      
      // Update the user with the hashed password
      user.password = hashedPassword;
      await user.save();
      
      console.log('✅ Password successfully added to admin user!');
      console.log('📧 Email: admin@vazifa2.com');
      console.log('🔑 Password: fwr123456');
      console.log('👑 Role:', user.role);
      console.log('✅ Email Verified:', user.isEmailVerified);
    } else {
      console.log('❌ User not found with email: admin@vazifa2.com');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    process.exit(0);
  }
};

fixAdminPassword();
