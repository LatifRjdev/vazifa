#!/bin/bash
echo "=========================================="
echo "📱 Отправка тестовых SMS"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'
cd /var/www/vazifa/backend

echo "📤 Отправка SMS #1 на +992557777509..."
node -e "
const sendSMS = require('./libs/send-sms-bullmq');

async function sendTest() {
  try {
    const result1 = await sendSMS('+992557777509', 'Тест');
    console.log('✅ SMS #1 отправлено:', result1);
    
    console.log('⏳ Ожидание 30 секунд...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('📤 Отправка SMS #2 на +992985343331...');
    const result2 = await sendSMS('+992985343331', 'Тест');
    console.log('✅ SMS #2 отправлено:', result2);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

sendTest();
"

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
