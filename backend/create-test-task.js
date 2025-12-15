import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/users.js';
import Task from './models/tasks.js';
import { sendNotification } from './libs/send-notification.js';

dotenv.config();

async function createTestTask() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    // Find users by phone numbers
    console.log('👥 Finding users...');
    const users = await User.find({
      phoneNumber: { $in: ['+992557777509', '+992989328080'] }
    }).select('_id name phoneNumber email settings');

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`  - ${u.name}: ${u.phoneNumber} (${u.email || 'no email'})`);
      console.log(`    Email notifications: ${u.settings?.emailNotifications}`);
    });

    if (users.length !== 2) {
      console.error('❌ Expected 2 users, found:', users.length);
      process.exit(1);
    }

    const creator = users[1]; // Use Rashid as creator
    console.log(`\n📋 Creator: ${creator.name}`);

    // Create test task
    console.log('📝 Creating test task...');
    const task = await Task.create({
      title: 'Test Task - SMS & Email Notifications',
      description: 'This is a test task to verify that both email and SMS notifications are sent to all assignees.',
      assignees: users.map(u => u._id),
      responsibleManager: users[0]._id,
      status: 'To Do',
      priority: 'High',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: creator._id,
    });

    console.log(`✅ Task created: ${task._id}\n`);

    // Send notifications to all assignees
    console.log('📧 Sending notifications...\n');
    
    for (const user of users) {
      console.log(`📤 Sending to ${user.name} (${user.phoneNumber})...`);
      
      const result = await sendNotification({
        recipientId: user._id,
        type: 'task_assigned',
        title: 'Новая задача назначена',
        message: `Вам назначена задача: ${task.title}`,
        relatedData: {
          taskId: task._id,
        },
        sendEmail: true,
        sendSMS: true,
      });

      console.log(`  Results:`);
      console.log(`    - In-app: ${result.results.notification ? '✅' : '❌'}`);
      console.log(`    - Email: ${result.results.email ? '✅' : '❌'}`);
      console.log(`    - SMS: ${result.results.sms ? '✅' : '❌'}`);
      console.log();
    }

    console.log('✅ Test task created and notifications sent!');
    console.log(`\n📊 Task ID: ${task._id}`);
    console.log(`🔗 URL: https://protocol.oci.tj/task/${task._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestTask();
