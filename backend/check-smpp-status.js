/**
 * Check SMPP status on running server
 * This script checks if the existing SMPP service is connected
 * WITHOUT creating a new connection
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("\n" + "=".repeat(60));
console.log("🔍 ПРОВЕРКА СТАТУСА SMPP НА СЕРВЕРЕ");
console.log("=".repeat(60));

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB подключен\n");

    // Check SMS logs from the last hour
    const SMSLog = (await import("./models/sms-logs.js")).default;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSent = await SMSLog.countDocuments({
      status: "sent",
      createdAt: { $gte: oneHourAgo }
    });

    const recentFailed = await SMSLog.countDocuments({
      status: "failed",
      createdAt: { $gte: oneHourAgo }
    });

    console.log("📊 SMS за последний час:");
    console.log(`   ✅ Отправлено: ${recentSent}`);
    console.log(`   ❌ Ошибки: ${recentFailed}`);

    // Check last 5 SMS
    const lastSMS = await SMSLog.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    console.log("\n📱 Последние 5 SMS:");
    for (const sms of lastSMS) {
      const status = sms.status === 'sent' ? '✅' : '❌';
      const time = sms.createdAt.toISOString();
      console.log(`   ${status} ${sms.phoneNumber} - ${sms.type} - ${time}`);
    }

    // Check if server's SMPP service is working
    // by looking at recent successful sends
    const lastSuccessfulSMS = await SMSLog.findOne({ status: "sent" }).sort({ createdAt: -1 });

    if (lastSuccessfulSMS) {
      const timeSinceLastSuccess = Date.now() - lastSuccessfulSMS.createdAt.getTime();
      const minutesAgo = Math.round(timeSinceLastSuccess / 60000);

      console.log(`\n⏱️ Последняя успешная отправка: ${minutesAgo} минут назад`);

      if (minutesAgo < 10) {
        console.log("✅ SMPP сервис работает! (отправка была недавно)");
      } else if (minutesAgo < 60) {
        console.log("⚠️ SMPP возможно работает (проверьте создание задачи)");
      } else {
        console.log("❌ SMPP возможно не работает (давно не было отправок)");
      }
    }

    // Check Redis queue for pending SMS
    try {
      const { createClient } = await import("redis");
      const client = createClient({
        socket: { host: process.env.REDIS_HOST || "127.0.0.1", port: 6379 }
      });
      await client.connect();

      const waitingJobs = await client.lLen("bull:sms-queue:wait");
      const activeJobs = await client.lLen("bull:sms-queue:active");
      const failedJobs = await client.zCard("bull:sms-queue:failed");

      console.log("\n📬 Очередь Redis:");
      console.log(`   Ожидают: ${waitingJobs}`);
      console.log(`   Активные: ${activeJobs}`);
      console.log(`   Неудачные: ${failedJobs}`);

      await client.disconnect();
    } catch (err) {
      console.log("\n⚠️ Не удалось проверить Redis:", err.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("💡 ВЫВОД:");
    console.log("=".repeat(60));
    console.log(`
Если последняя успешная отправка была недавно -
SMPP работает на основном сервере.

Проблема может быть в том, что:
1. Диагностический скрипт создаёт НОВОЕ подключение
2. Megafon разрешает только 1 сессию
3. Основной сервер уже использует эту сессию

Попробуйте:
1. Перезапустить backend сервер: pm2 restart vazifa-backend
2. Создать тестовую задачу через UI
3. Проверить логи: pm2 logs vazifa-backend --lines 100
`);

  } catch (err) {
    console.error("❌ Ошибка:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkStatus();
