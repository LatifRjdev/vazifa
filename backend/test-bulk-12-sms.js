import { sendSMS } from './libs/send-sms.js';

const phoneNumbers = [
  '+992557777509',
  '+992985343331',
  '+992905504866',
  '+992999090090',
  '+992918610553'
];

const messages = ['Тест1', 'Тест2', 'Тест3'];

console.log('='.repeat(80));
console.log('📱 BULK SMS TEST: 15 Messages');
console.log('='.repeat(80));
console.log(`Sending ${messages.length} messages to ${phoneNumbers.length} numbers = ${messages.length * phoneNumbers.length} SMS total`);
console.log('='.repeat(80));
console.log();

async function sendBulkSMS() {
  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const message of messages) {
    for (const phoneNumber of phoneNumbers) {
      try {
        console.log(`📤 Sending "${message}" to ${phoneNumber}...`);
        const result = await sendSMS(phoneNumber, message, 'high');
        
        results.push({
          phoneNumber,
          message,
          success: true,
          jobId: result.jobId,
          messageId: result.messageId
        });
        
        successCount++;
        console.log(`✅ Queued successfully! Job ID: ${result.jobId}`);
      } catch (error) {
        results.push({
          phoneNumber,
          message,
          success: false,
          error: error.message
        });
        
        failCount++;
        console.log(`❌ Failed: ${error.message}`);
      }
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log();
  }

  console.log('='.repeat(80));
  console.log('📊 RESULTS:');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${successCount}/${messages.length * phoneNumbers.length}`);
  console.log(`❌ Failed: ${failCount}/${messages.length * phoneNumbers.length}`);
  console.log('='.repeat(80));
  console.log();
  
  console.log('📋 Detailed Results:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.phoneNumber} - "${result.message}"`);
    if (result.success) {
      console.log(`   ✅ Job ID: ${result.jobId}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });
  
  console.log();
  console.log('🎉 Bulk SMS test completed!');
  
  // Keep process alive for 30 seconds to allow SMPP to send
  console.log('⏳ Waiting 30 seconds for SMPP to process queue...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  process.exit(0);
}

sendBulkSMS().catch(error => {
  console.error('❌ Bulk SMS test failed:', error);
  process.exit(1);
});
