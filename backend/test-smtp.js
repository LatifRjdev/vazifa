import { sendEmail } from './libs/send-emails.js';
import dotenv from 'dotenv';

dotenv.config();

const testSMTP = async () => {
  console.log('🧪 Testing SMTP Email Configuration...\n');
  
  // Display configuration (without sensitive data)
  console.log('📧 SMTP Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   Secure: ${process.env.SMTP_SECURE}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   From: ${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>\n`);

  // Test email details
  const testEmail = process.env.SMTP_FROM_EMAIL; // Send to self for testing
  const testName = 'Test User';
  const testSubject = 'SMTP Test Email - Vazifa System';
  const testMessage = `
    <h2>🎉 SMTP Configuration Test</h2>
    <p>Hello ${testName},</p>
    <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
    <p><strong>Configuration Details:</strong></p>
    <ul>
      <li>SMTP Host: ${process.env.SMTP_HOST}</li>
      <li>SMTP Port: ${process.env.SMTP_PORT}</li>
      <li>From Email: ${process.env.SMTP_FROM_EMAIL}</li>
    </ul>
    <p>If you received this email, your SMTP setup is working perfectly! ✅</p>
    <p>Best regards,<br>Vazifa System</p>
  `;
  const testButtonText = 'Visit Dashboard';
  const testButtonLink = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    console.log('📤 Sending test email...');
    console.log(`   To: ${testEmail}`);
    console.log(`   Subject: ${testSubject}\n`);

    const result = await sendEmail(
      testEmail,
      testSubject,
      testName,
      testMessage,
      testButtonText,
      testButtonLink
    );

    if (result) {
      console.log('✅ SUCCESS: Test email sent successfully!');
      console.log('📬 Please check your email inbox to confirm delivery.');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Check your email inbox');
      console.log('   2. Verify the email formatting looks correct');
      console.log('   3. Test other email functions (auth, notifications, etc.)');
    } else {
      console.log('❌ FAILED: Test email could not be sent.');
      console.log('🔍 Please check the error messages above for troubleshooting.');
    }

  } catch (error) {
    console.error('💥 ERROR: Exception occurred during test:', error.message);
    console.log('\n🛠️  Troubleshooting Tips:');
    console.log('   1. Verify SMTP server credentials are correct');
    console.log('   2. Check if SMTP server allows connections from your IP');
    console.log('   3. Ensure firewall/network allows SMTP traffic');
    console.log('   4. Try different port (587 vs 465) if connection fails');
  }

  console.log('\n📋 Test completed.');
};

// Run the test
testSMTP();
