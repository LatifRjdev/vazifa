/**
 * Test Forgot Password Email Functionality
 * Тест отправки email для восстановления пароля
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendEmail } from './libs/send-emails.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function testForgotPasswordEmail() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     📧 Test Forgot Password Email                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Check SMTP settings
  console.log('📋 SMTP Configuration:');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Host:      ${process.env.SMTP_HOST || 'NOT SET'}`);
  console.log(`Port:      ${process.env.SMTP_PORT || 'NOT SET'}`);
  console.log(`Secure:    ${process.env.SMTP_SECURE || 'NOT SET'}`);
  console.log(`User:      ${process.env.SMTP_USER || 'NOT SET'}`);
  console.log(`From:      ${process.env.SMTP_FROM_EMAIL || 'NOT SET'}`);
  console.log(`From Name: ${process.env.SMTP_FROM_NAME || 'NOT SET'}`);
  console.log('');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('❌ SMTP settings are incomplete!');
    console.log('Please configure SMTP settings in .env file');
    process.exit(1);
  }

  // Test email address (from command line or default)
  const testEmail = process.argv[2] || 'latifrj78@gmail.com';
  
  console.log(`📧 Sending test email to: ${testEmail}\n`);

  try {
    // Simulate forgot password email
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    const resetUrl = `${frontendUrl}/reset-password?tk=test_token_123`;

    const result = await sendEmail(
      testEmail,
      'Сброс пароля - Тест',
      'Тестовый пользователь',
      'Это тестовое письмо для проверки функции восстановления пароля. Нажмите на кнопку ниже для сброса пароля.',
      'Сбросить пароль',
      resetUrl
    );

    if (result) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📧 Email sent to: ${testEmail}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
      console.log('\n💡 Check your inbox (and spam folder) for the email.\n');
    } else {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('❌ EMAIL SENDING FAILED');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Check the error messages above for details.');
      console.log('\nPossible issues:');
      console.log('  1. SMTP server is not reachable');
      console.log('  2. Invalid credentials');
      console.log('  3. Port/firewall blocking');
      console.log('  4. SMTP server requires different authentication\n');
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error('\nFull error:', error);
  }
}

// Show usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     📧 Test Forgot Password Email Script                ║
╚══════════════════════════════════════════════════════════╝

Usage:
  node test-forgot-password-email.js [email]

Examples:
  # Test with default email
  node test-forgot-password-email.js

  # Test with specific email
  node test-forgot-password-email.js user@example.com

This script will:
  1. Check SMTP configuration
  2. Send a test forgot password email
  3. Show detailed results

`);
  process.exit(0);
}

// Run test
testForgotPasswordEmail().catch((error) => {
  console.error('❌ Critical error:', error);
  process.exit(1);
});
