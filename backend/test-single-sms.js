import dotenv from 'dotenv';
import { sendSMS } from './libs/send-sms.js';

dotenv.config();

async function testSingleSMS() {
  console.log('\n' + '='.repeat(80));
  console.log('📱 SINGLE SMS TEST');
  console.log('='.repeat(80));
  console.log('📞 Number: +992905504866');
  console.log('💬 Message: Привет Тест');
  console.log('='.repeat(80) + '\n');

  try {
    console.log('🚀 Sending SMS...\n');
    
    const result = await sendSMS('+992905504866', 'Привет Тест', 'high');
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULT:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(80) + '\n');
    
    if (result.success) {
      if (result.queued) {
        console.log('✅ SMS queued successfully!');
        console.log('   Job ID:', result.jobId);
        console.log('   ⚠️  Will be sent when SMPP connects');
      } else {
        console.log('✅ SMS sent successfully!');
        console.log('   Message ID:', result.messageId);
      }
    } else {
      console.log('❌ SMS failed:', result.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Give SMPP time to try connecting
setTimeout(() => {
  testSingleSMS();
}, 3000);

console.log('⏳ Waiting for SMPP initialization...');
