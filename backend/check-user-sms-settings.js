import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/users.js';

dotenv.config();

async function checkSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phones = ['+992557777509', '+992985343331'];

    for (const phone of phones) {
      console.log('='.repeat(80));
      console.log(`📱 Checking: ${phone}`);
      console.log('='.repeat(80));

      const user = await User.findOne({ phoneNumber: phone });
      
      if (!user) {
        console.log('❌ User NOT found\n');
        continue;
      }

      console.log(`✅ User found: ${user.name}`);
      console.log(`📧 Email: ${user.email || 'Not set'}`);
      console.log(`🆔 User ID: ${user._id}`);
      console.log('\n📊 NOTIFICATION SETTINGS:');
      console.log('-------------------------');
      
      // Top-level fields
      console.log(`emailNotifications (top-level): ${user.emailNotifications}`);
      console.log(`smsNotifications (top-level): ${user.smsNotifications}`);
      
      // Settings object
      console.log('\nSettings object:', user.settings ? 'EXISTS' : 'MISSING');
      if (user.settings) {
        console.log(`  emailNotifications: ${user.settings.emailNotifications}`);
        console.log(`  smsNotifications: ${user.settings.smsNotifications}`);
        console.log(`  smsNotificationTypes: ${user.settings.smsNotificationTypes ? user.settings.smsNotificationTypes.join(', ') : 'MISSING'}`);
      }
      
      // Test methods
      console.log('\n🔧 METHOD RESULTS:');
      console.log(`canReceiveSMS(): ${user.canReceiveSMS()}`);
      console.log(`isSMSNotificationEnabled('task_notification'): ${user.isSMSNotificationEnabled('task_notification')}`);
      
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSettings();
