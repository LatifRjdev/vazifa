import mongoose from "mongoose";
import dotenv from "dotenv";
import SMSLog from "./models/sms-logs.js";

dotenv.config();

async function checkSMSLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");
    
    // Последний час
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    const logs = await SMSLog.find({
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 }).limit(20);
    
    console.log(`📱 SMS логи за последний час: ${logs.length}\n`);
    console.log("=".repeat(80));
    
    if (logs.length === 0) {
      console.log("\n⚠️  НЕТ SMS ЛОГОВ ЗА ПОСЛЕДНИЙ ЧАС!");
      console.log("\nЭто означает что:");
      console.log("  1. SMS не отправлялись вообще");
      console.log("  2. Или логирование не работает");
      console.log("  3. Или SMPP подключение не активно\n");
    } else {
      logs.forEach((log, i) => {
        const status = log.status === 'sent' ? '✅' : log.status === 'failed' ? '❌' : '⏳';
        console.log(`\n${i+1}. ${status} ${log.to}`);
        console.log(`   Время: ${log.createdAt.toLocaleString('ru-RU')}`);
        console.log(`   Статус: ${log.status}`);
        console.log(`   Сообщение: ${log.message?.substring(0, 60)}${log.message?.length > 60 ? '...' : ''}`);
        if (log.error) {
          console.log(`   ❌ Ошибка: ${log.error}`);
        }
        if (log.messageId) {
          console.log(`   ID: ${log.messageId}`);
        }
      });
    }
    
    console.log("\n" + "=".repeat(80));
    
    // Статистика
    const sent = logs.filter(l => l.status === 'sent').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const pending = logs.filter(l => l.status === 'pending').length;
    
    console.log("\n📊 СТАТИСТИКА:");
    console.log(`   Отправлено: ${sent}`);
    console.log(`   Ошибка: ${failed}`);
    console.log(`   В очереди: ${pending}`);
    console.log(`   Всего: ${logs.length}\n`);
    
    await mongoose.disconnect();
    console.log("👋 Отключено от MongoDB\n");
    
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

checkSMSLogs();
