/**
 * SMS Task Notification Test Script
 *
 * This script tests the complete SMS notification flow:
 * 1. Finds users by phone number (Admin User and Rashid Khan)
 * 2. Creates a task with these users as assignees
 * 3. Verifies SMS notifications are sent
 * 4. Checks SMS logs for delivery status
 *
 * Usage: node test-sms-task-notification.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './models/users.js';
import Task from './models/tasks.js';
import Notification from './models/notifications.js';
import SMSLog from './models/sms-logs.js';

// Import notification function
import { sendNotification } from './libs/send-notification.js';
import { sendSMS, getSMPPService } from './libs/send-sms-bullmq.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vazifa';

// Test phone numbers
const TEST_PHONES = {
  adminUser: '+992985343331',
  rashidKhan: '+992989328080',
};

// Logging with timestamps
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    sms: '📱',
  }[type] || '📝';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

// Main test function
async function runSMSTest() {
  console.log('\n' + '='.repeat(80));
  console.log('SMS TASK NOTIFICATION TEST');
  console.log('='.repeat(80));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Connect to MongoDB
    log('Connecting to MongoDB...', 'info');
    await mongoose.connect(MONGODB_URI);
    log(`Connected to: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`, 'success');

    // Step 2: Find test users
    log('\n--- STEP 1: Finding Test Users ---', 'info');

    const adminUser = await User.findOne({ phoneNumber: TEST_PHONES.adminUser });
    const rashidKhan = await User.findOne({ phoneNumber: TEST_PHONES.rashidKhan });

    console.log('\nAdmin User (+992985343331):');
    if (adminUser) {
      console.log(`  ✅ Found: ${adminUser.name}`);
      console.log(`  📧 Email: ${adminUser.email || 'N/A'}`);
      console.log(`  📱 Phone: ${adminUser.phoneNumber}`);
      console.log(`  👤 Role: ${adminUser.role}`);
      console.log(`  📬 SMS Enabled: ${adminUser.settings?.smsNotifications || false}`);
      console.log(`  📋 SMS Types: ${adminUser.settings?.smsNotificationTypes?.join(', ') || 'N/A'}`);
      console.log(`  🔔 canReceiveSMS(): ${adminUser.canReceiveSMS()}`);
    } else {
      console.log('  ❌ NOT FOUND');
      log('Creating Admin User...', 'warning');
      // Create user if not exists
      const newAdminUser = await User.create({
        name: 'Admin User',
        phoneNumber: TEST_PHONES.adminUser,
        email: 'admin-test@vazifa.tj',
        role: 'admin',
        preferredAuthMethod: 'phone',
        settings: {
          smsNotifications: true,
          smsNotificationTypes: ['task_notification', 'general_notification'],
        },
      });
      log(`Created Admin User: ${newAdminUser._id}`, 'success');
    }

    console.log('\nRashid Khan (+992989328080):');
    if (rashidKhan) {
      console.log(`  ✅ Found: ${rashidKhan.name}`);
      console.log(`  📧 Email: ${rashidKhan.email || 'N/A'}`);
      console.log(`  📱 Phone: ${rashidKhan.phoneNumber}`);
      console.log(`  👤 Role: ${rashidKhan.role}`);
      console.log(`  📬 SMS Enabled: ${rashidKhan.settings?.smsNotifications || false}`);
      console.log(`  📋 SMS Types: ${rashidKhan.settings?.smsNotificationTypes?.join(', ') || 'N/A'}`);
      console.log(`  🔔 canReceiveSMS(): ${rashidKhan.canReceiveSMS()}`);
    } else {
      console.log('  ❌ NOT FOUND');
      log('Creating Rashid Khan...', 'warning');
      const newRashidKhan = await User.create({
        name: 'Rashid Khan',
        phoneNumber: TEST_PHONES.rashidKhan,
        email: 'rashid-test@vazifa.tj',
        role: 'member',
        preferredAuthMethod: 'phone',
        settings: {
          smsNotifications: true,
          smsNotificationTypes: ['task_notification', 'general_notification'],
        },
      });
      log(`Created Rashid Khan: ${newRashidKhan._id}`, 'success');
    }

    // Re-fetch users after potential creation
    const user1 = await User.findOne({ phoneNumber: TEST_PHONES.adminUser });
    const user2 = await User.findOne({ phoneNumber: TEST_PHONES.rashidKhan });

    if (!user1 || !user2) {
      throw new Error('Could not find or create test users');
    }

    // Step 3: Check SMPP Connection Status
    log('\n--- STEP 2: Checking SMPP Connection ---', 'info');
    const smppService = getSMPPService();
    const smppStatus = smppService.getStatus();
    console.log('SMPP Status:');
    console.log(`  🔌 Connected: ${smppStatus.connected ? '✅ YES' : '❌ NO'}`);
    console.log(`  🔄 Connecting: ${smppStatus.connecting}`);
    console.log(`  📊 Reconnect Attempts: ${smppStatus.reconnectAttempts}`);
    console.log(`  ⚙️  Config:`);
    console.log(`     Host: ${smppStatus.config.host}:${smppStatus.config.port}`);
    console.log(`     System ID: ${smppStatus.config.system_id}`);
    console.log(`     Source: ${smppStatus.config.source_addr}`);

    // Step 4: Find or create a creator user (admin/manager who creates tasks)
    log('\n--- STEP 3: Finding Task Creator ---', 'info');
    let creator = await User.findOne({
      role: { $in: ['admin', 'super_admin', 'manager'] }
    });

    if (!creator) {
      log('No admin/manager found, using first user as creator', 'warning');
      creator = user1.role === 'admin' || user1.role === 'manager' ? user1 : user2;
    }
    console.log(`Task Creator: ${creator.name} (${creator.role})`);

    // Step 5: Create Test Task
    log('\n--- STEP 4: Creating Test Task ---', 'info');
    const taskTitle = `SMS Test Task - ${new Date().toLocaleString('ru-RU')}`;
    const taskDescription = 'This is a test task to verify SMS notifications are working correctly.';

    const assigneeIds = [user1._id, user2._id].filter(id =>
      id.toString() !== creator._id.toString()
    );

    console.log(`Creating task with ${assigneeIds.length} assignee(s)...`);

    const newTask = await Task.create({
      title: taskTitle,
      description: taskDescription,
      status: 'To Do',
      priority: 'High',
      assignees: assigneeIds,
      createdBy: creator._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
    });

    log(`Task created: ${newTask._id}`, 'success');
    console.log(`  📋 Title: ${taskTitle}`);
    console.log(`  📝 Description: ${taskDescription}`);
    console.log(`  📊 Status: ${newTask.status}`);
    console.log(`  🔥 Priority: ${newTask.priority}`);
    console.log(`  👥 Assignees: ${assigneeIds.length}`);

    // Step 6: Send Notifications (simulating what createTask does)
    log('\n--- STEP 5: Sending Notifications ---', 'info');

    const notificationResults = [];

    for (const userId of assigneeIds) {
      const assignee = await User.findById(userId);
      console.log(`\nSending notification to: ${assignee.name} (${assignee.phoneNumber})`);

      try {
        const result = await sendNotification({
          recipientId: userId,
          type: 'task_assigned',
          title: 'Вам назначена новая задача',
          message: `${creator.name} назначил вам задачу: ${taskTitle}`,
          relatedData: {
            taskId: newTask._id,
            actorId: creator._id
          },
          sendEmail: false, // Only test SMS
          sendSMS: true,
        });

        notificationResults.push({
          user: assignee.name,
          phone: assignee.phoneNumber,
          success: true,
          result,
        });

        log(`Notification sent to ${assignee.name}`, 'success');
        console.log(`  📧 Email: ${result.email?.success || 'skipped'}`);
        console.log(`  📱 SMS: ${result.sms?.success || false}`);
        if (result.sms?.messageId) {
          console.log(`  🆔 Message ID: ${result.sms.messageId}`);
        }
        if (result.sms?.error) {
          console.log(`  ❌ SMS Error: ${result.sms.error}`);
        }
      } catch (error) {
        notificationResults.push({
          user: assignee.name,
          phone: assignee.phoneNumber,
          success: false,
          error: error.message,
        });
        log(`Failed to notify ${assignee.name}: ${error.message}`, 'error');
      }
    }

    // Step 7: Direct SMS Test (bypass notification system)
    log('\n--- STEP 6: Direct SMS Test ---', 'info');
    console.log('Sending direct SMS to test SMPP connection...');

    const testMessage = `🧪 Тест SMS\n\nЭто тестовое сообщение от системы Vazifa.\nВремя: ${new Date().toLocaleString('ru-RU')}`;

    for (const phone of Object.values(TEST_PHONES)) {
      console.log(`\nSending to ${phone}...`);
      try {
        const smsResult = await sendSMS(phone, testMessage, 'high');
        console.log(`  ✅ Result:`, JSON.stringify(smsResult, null, 2));
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // Step 8: Check SMS Logs
    log('\n--- STEP 7: Checking SMS Logs ---', 'info');

    const recentLogs = await SMSLog.find({
      phoneNumber: { $in: Object.values(TEST_PHONES) },
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`\nRecent SMS Logs (last hour): ${recentLogs.length} entries`);

    for (const log of recentLogs) {
      console.log(`\n  📱 ${log.phoneNumber}`);
      console.log(`     Type: ${log.type}`);
      console.log(`     Status: ${log.status}`);
      console.log(`     Message: ${log.message?.substring(0, 50)}...`);
      console.log(`     Time: ${log.createdAt.toISOString()}`);
      if (log.errorMessage) {
        console.log(`     Error: ${log.errorMessage}`);
      }
    }

    // Step 9: Check Notifications Created
    log('\n--- STEP 8: Checking Notifications in DB ---', 'info');

    const recentNotifications = await Notification.find({
      recipient: { $in: assigneeIds },
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    }).populate('recipient', 'name phoneNumber').sort({ createdAt: -1 });

    console.log(`\nRecent Notifications: ${recentNotifications.length} entries`);

    for (const notif of recentNotifications) {
      console.log(`\n  👤 ${notif.recipient?.name || 'Unknown'}`);
      console.log(`     Type: ${notif.type}`);
      console.log(`     Title: ${notif.title}`);
      console.log(`     Message: ${notif.message?.substring(0, 50)}...`);
      console.log(`     Read: ${notif.isRead}`);
      console.log(`     Time: ${notif.createdAt.toISOString()}`);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n📊 Results:`);
    console.log(`   Task Created: ✅ ${newTask._id}`);
    console.log(`   Assignees: ${assigneeIds.length}`);
    console.log(`   Notifications Sent: ${notificationResults.filter(r => r.success).length}/${notificationResults.length}`);
    console.log(`   SMS Logs Found: ${recentLogs.length}`);
    console.log(`   DB Notifications: ${recentNotifications.length}`);

    const successfulSMS = notificationResults.filter(r => r.success && r.result?.sms?.success);
    console.log(`   Successful SMS: ${successfulSMS.length}`);

    if (successfulSMS.length === 0) {
      console.log('\n⚠️  WARNING: No SMS were successfully sent!');
      console.log('   Possible causes:');
      console.log('   1. SMPP connection not established');
      console.log('   2. Users have SMS notifications disabled');
      console.log('   3. Phone number format issues');
      console.log('   4. SMS queue processing delayed');
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Completed: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');

    // Cleanup: Delete test task (optional)
    // await Task.findByIdAndDelete(newTask._id);
    // log('Test task cleaned up', 'info');

  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    log('Disconnected from MongoDB', 'info');
    process.exit(0);
  }
}

// Run the test
runSMSTest();
