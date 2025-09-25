import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/users.js';
import dotenv from 'dotenv';

dotenv.config();

async function createVerifiedUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      // Update existing user to be verified
      existingUser.isEmailVerified = true;
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('Updated existing user to verified status');
    } else {
      // Create new verified user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = new User({
        fullName: 'Тест Пользователь',
        email: 'test@example.com',
        password: hashedPassword,
        isEmailVerified: true,
        role: 'admin'
      });

      await user.save();
      console.log('Created new verified user');
    }

    console.log('User details:');
    const user = await User.findOne({ email: 'test@example.com' });
    console.log('Email:', user.email);
    console.log('Name:', user.fullName);
    console.log('Verified:', user.isEmailVerified);
    console.log('Role:', user.role);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createVerifiedUser();
