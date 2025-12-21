import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendEmail } from './libs/send-emails.js';
import { sendSMS } from './libs/send-sms-bullmq.js';
import User from './models/users.js';
import SMSLog from './models/sms-logs.js';
import EmailLog from './models/email-logs.js';

dotenv.config();

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check SMTP settings
    console.log('=' + '='.repeat(79));
    console.log('📧 EMAIL CONFIGURATION');
    console.log('=' + '='.repeat(79));
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
    console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
    console.log();

    // 2. Check SMS settings
    console.log('=' + '='.repeat(79));
    console.log('📱 SMS CONFIGURATION');
    console.log('=' + '='.repeat(79));
    console.log('SMPP_HOST:', process.env.SMPP_HOST || 'NOT SET');
    console.log('SMPP_PORT:', process.env.SMPP_PORT || 'NOT SET');
    console.log('SMPP_SYSTEM_ID:', process.env.SMPP_SYSTEM_ID || 'NOT SET');
    console.log('SMPP_PASSWORD:', process.env.SMPP_PASSWORD ? '***SET***' : 'NOT SET');
    console.log();

    // 3. Check user notification settings
    console.log('=' + '='.repeat(79));
    console.log('👥 USER NOTIFICATION SETTINGS');
    console.log('=' + '='.repeat(79));
    
    const users = await User.find({}).limit(5);
    for (const user of users) {
      console.log(`\nUser: ${user.name} (${user.email || user.phoneNumber})`);
      console.log('  Email Notifications:', user.emailNotifications !== false ? '✅ Enabled' : '❌ Disabled');
      console.log('  SMS Notifications:', user.smsNotifications !== false ? '✅ Enabled' : '❌ Disabled');
      console.log('  Phone Number:', user.phoneNumber || 'Not set');
      console.log('  Email:', user.email || 'Not set');
    }
    console.log();

    // 4. Check recent SMS logs
    console.log('=' + '='.repeat(79));
    console.log('📊 RECENT SMS LOGS (Last 5)');
    console.log('=' + '='.repeat(79));
    const smsLogs = await SMSLog.find({}).sort({ sentAt: -1 }).limit(5);
    if (smsLogs.length === 0) {
      console.log('❌ No SMS logs found');
    } else {
      for (const log of smsLogs) {
        console.log(`\n${log.sentAt.toISOString()}`);
        console.log(`  To: ${log.recipient}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  Message: ${log.message.substring(0, 50)}...`);
        if (log.error) console.log(`  Error: ${log.error}`);
      }
    }
    console.log();

    // 5. Check recent Email logs
    console.log('=' + '='.repeat(79));
    console.log('📧 RECENT EMAIL LOGS (Last 5)');
    console.log('=' + '='.repeat(79));
    const emailLogs = await EmailLog.find({}).sort({ sentAt: -1 }).limit(5);
    if (emailLogs.length === 0) {
      console.log('❌ No email logs found');
    } else {
      for (const log of emailLogs) {
        console.log(`\n${log.sentAt.toISOString()}`);
        console.log(`  To: ${log.recipient}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  Subject: ${log.subject}`);
        if (log.error) console.log(`  Error: ${log.error}`);
      }
    }
    console.log();

    // 6. Test email sending
    console.log('=' + '='.repeat(79));
    console.log('🧪 TESTING EMAIL SENDING');
    console.log('=' + '='.repeat(79));
    try {
      const testUser = users.find(u => u.email);
      if (testUser) {
        console.log(`Sending test email to: ${testUser.email}`);
        const result = await sendEmail(
          testUser.email,
          'Test Email - Vazifa Notification System',
          testUser.name,
          'This is a test email to verify notification system is working.',
          'View Dashboard',
          'https://protocol.oci.tj/dashboard'
        );
        console.log('Email send result:', result ? '✅ Success' : '❌ Failed');
      } else {
        console.log('❌ No user with email found for testing');
      }
    } catch (error) {
      console.log('❌ Email test failed:', error.message);
    }
    console.log();

    // 7. Test SMS sending
    console.log('=' + '='.repeat(79));
    console.log('🧪 TESTING SMS SENDING');
    console.log('=' + '='.repeat(79));
    try {
      const testUser = users.find(u => u.phoneNumber);
      if (testUser) {
        console.log(`Sending test SMS to: ${testUser.phoneNumber}`);
        const result = await sendSMS(
          testUser.phoneNumber,
          'Test SMS - Vazifa Notification System работает!'
        );
        console.log('SMS send result:', result.success ? '✅ Success' : '❌ Failed');
        if (result.queued) console.log('📬 SMS queued for delivery');
      } else {
        console.log('❌ No user with phone number found for testing');
      }
    } catch (error) {
      console.log('❌ SMS test failed:', error.message);
    }
    console.log();

    console.log('=' + '='.repeat(79));
    console.log('✅ DIAGNOSIS COMPLETE');
    console.log('=' + '='.repeat(79));

    process.exit(0);
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  }
}

diagnose();
