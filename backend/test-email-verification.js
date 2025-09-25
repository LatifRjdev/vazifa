import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendEmail } from './libs/send-emails.js';

dotenv.config();

const testEmailVerification = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test email verification
    const testEmail = 'latifrajabov@gmail.com';
    const testName = 'Test User';
    const verificationToken = 'test-token-123';
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    console.log('📧 Testing email verification...');
    console.log(`   To: ${testEmail}`);
    console.log(`   Name: ${testName}`);
    console.log(`   Link: ${verificationLink}`);

    const emailSent = await sendEmail(
      testEmail,
      'Verify Your Email - Vazifa',
      testName,
      'Welcome to Vazifa! Please verify your email address to complete your registration.',
      'Verify Email',
      verificationLink
    );

    if (emailSent) {
      console.log('✅ Email verification test successful!');
      console.log('📬 Check your inbox for the verification email.');
    } else {
      console.log('❌ Email verification test failed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

console.log('🚀 Email Verification Test');
console.log('===========================');
testEmailVerification();
