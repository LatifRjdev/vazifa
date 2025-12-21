import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendSMS } from './libs/send-sms-bullmq.js';
import User from './models/users.js';
import SMSLog from './models/sms-logs.js';

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phone1 = '+992557777509';
    const phone2 = '+992985343331';

    console.log('=' + '='.repeat(79));
    console.log('📱 CHECKING USERS WITH THESE PHONE NUMBERS');
    console.log('=' + '='.repeat(79));

    const user1 = await User.findOne({ phoneNumber: phone1 });
    const user2 = await User.findOne({ phoneNumber: phone2 });

    console.log(`\nPhone: ${phone1}`);
    if (user1) {
      console.log(`  ✅ User found: ${user1.name}`);
      console.log(`  Email: ${user1.email || 'Not set'}`);
      console.log(`  SMS Notifications: ${user1.smsNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`  Email Notifications: ${user1.emailNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
    } else {
      console.log('  ❌ No user found with this phone number');
    }

    console.log(`\nPhone: ${phone2}`);
    if (user2) {
      console.log(`  ✅ User found: ${user2.name}`);
      console.log(`  Email: ${user2.email || 'Not set'}`);
      console.log(`  SMS Notifications: ${user2.smsNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`  Email Notifications: ${user2.emailNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
    } else {
      console.log('  ❌ No user found with this phone number');
    }
    console.log();

    // Check recent SMS logs for these numbers
    console.log('=' + '='.repeat(79));
    console.log('📊 RECENT SMS LOGS FOR THESE NUMBERS (Last 5 each)');
    console.log('=' + '='.repeat(79));

    const logs1 = await SMSLog.find({ recipient: phone1 }).sort({ sentAt: -1 }).limit(5);
    const logs2 = await SMSLog.find({ recipient: phone2 }).sort({ sentAt: -1 }).limit(5);

    console.log(`\nSMS Logs for ${phone1}:`);
    if (logs1.length === 0) {
      console.log('  ❌ No SMS logs found');
    } else {
      logs1.forEach(log => {
        console.log(`  ${log.sentAt.toISOString()} - Status: ${log.status}`);
        if (log.error) console.log(`    Error: ${log.error}`);
      });
    }

    console.log(`\nSMS Logs for ${phone2}:`);
    if (logs2.length === 0) {
      console.log('  ❌ No SMS logs found');
    } else {
      logs2.forEach(log => {
        console.log(`  ${log.sentAt.toISOString()} - Status: ${log.status}`);
        if (log.error) console.log(`    Error: ${log.error}`);
      });
    }
    console.log();

    // Send test SMS to both numbers
    console.log('=' + '='.repeat(79));
    console.log('📤 SENDING TEST SMS');
    console.log('=' + '='.repeat(79));

    console.log(`\n🧪 Test SMS #1 to ${phone1}...`);
    try {
      const result1 = await sendSMS(
        phone1,
        'Тест SMS от Vazifa! Если вы получили это сообщение - система SMS работает! ✅'
      );
      console.log('Result:', result1.success ? '✅ SUCCESS' : '❌ FAILED');
      if (result1.queued) console.log('📬 SMS queued for delivery');
      if (result1.messageId) console.log('📝 Message ID:', result1.messageId);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Wait a bit before sending second SMS
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n🧪 Test SMS #2 to ${phone2}...`);
    try {
      const result2 = await sendSMS(
        phone2,
        'Тест SMS от Vazifa! Если вы получили это сообщение - система SMS работает! ✅'
      );
      console.log('Result:', result2.success ? '✅ SUCCESS' : '❌ FAILED');
      if (result2.queued) console.log('📬 SMS queued for delivery');
      if (result2.messageId) console.log('📝 Message ID:', result2.messageId);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log();
    console.log('=' + '='.repeat(79));
    console.log('✅ TEST COMPLETE');
    console.log('=' + '='.repeat(79));
    console.log('\n⏳ Wait 1-2 minutes for SMS delivery...');
    console.log('📱 Check both phones for test messages\n');

    // Wait for SMS to be processed
    console.log('⏳ Waiting 10 seconds for SMS queue to process...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
