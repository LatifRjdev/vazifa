import dotenv from 'dotenv';
import { sendSMS } from './libs/send-sms-bullmq.js';

dotenv.config();

async function sendTests() {
  console.log('📤 Отправка тестовых SMS...\n');
  
  try {
    console.log('1️⃣ Отправка на +992557777509...');
    const r1 = await sendSMS('+992557777509', 'Тест SMS от Vazifa! Если получили - система работает! ✅');
    console.log('   Result:', r1.success ? '✅ SUCCESS' : '❌ FAILED\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2️⃣ Отправка на +992985343331...');
    const r2 = await sendSMS('+992985343331', 'Тест SMS от Vazifa! Если получили - система работает! ✅');
    console.log('   Result:', r2.success ? '✅ SUCCESS' : '❌ FAILED\n');
    
    console.log('✅ Отправка завершена! Проверьте телефоны через 1-2 минуты.\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendTests();
