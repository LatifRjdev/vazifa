import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendEmail } from './libs/send-emails.js';
import { sendNotification } from './libs/send-notification.js';
import User from './models/users.js';
import Task from './models/tasks.js';

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@vazifa2.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('=' + '='.repeat(79));
    console.log('🧪 TEST 1: Email (Forgot Password)');
    console.log('=' + '='.repeat(79));
    console.log('Sending test reset password email to:', admin.email);
    
    try {
      const emailResult = await sendEmail(
        admin.email,
        'Тест: Сброс пароля',
        admin.name,
        'Это тестовое письмо для проверки функции "Забыли пароль".',
        'Сбросить пароль',
        'https://protocol.oci.tj/reset-password?tk=test123'
      );
      console.log('Email result:', emailResult ? '✅ SUCCESS' : '❌ FAILED');
    } catch (error) {
      console.log('❌ Email error:', error.message);
    }
    console.log();

    // Test task notification
    console.log('=' + '='.repeat(79));
    console.log('🧪 TEST 2: Task Notification (Email + SMS)');
    console.log('=' + '='.repeat(79));
    console.log('Creating test task and sending notification...');
    
    const testTask = await Task.create({
      title: 'ТЕСТ: Уведомления работают!',
      description: 'Это тестовая задача для проверки уведомлений',
      status: 'To Do',
      priority: 'High',
      assignees: [admin._id],
      createdBy: admin._id,
    });

    console.log('✅ Test task created:', testTask._id);
    console.log('Sending notification to:', admin.name);
    
    try {
      await sendNotification({
        recipientId: admin._id,
        type: 'task_assigned',
        title: 'Тест уведомлений',
        message: `Вам назначена тестовая задача: ${testTask.title}`,
        relatedData: {
          taskId: testTask._id,
          actorId: admin._id,
        },
      });
      console.log('✅ Notification sent successfully');
      console.log('Check:');
      console.log('  - Email:', admin.email);
      console.log('  - Phone:', admin.phoneNumber);
    } catch (error) {
      console.log('❌ Notification error:', error.message);
    }
    console.log();

    // Cleanup
    console.log('Cleaning up test task...');
    await Task.findByIdAndDelete(testTask._id);
    console.log('✅ Test task deleted');
    console.log();

    console.log('=' + '='.repeat(79));
    console.log('✅ ALL TESTS COMPLETE');
    console.log('=' + '='.repeat(79));
    console.log('\n📧 Check email:', admin.email);
    console.log('📱 Check SMS:', admin.phoneNumber);
    console.log('\nIf you received both - everything is working! 🎉\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
