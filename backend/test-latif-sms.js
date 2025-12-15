import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";
import { sendSMS } from "./libs/send-sms-bullmq.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

async function testLatifSMS() {
  try {
    // Подключиться к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n" + "=".repeat(80));
    console.log("📱 ТЕСТИРОВАНИЕ SMS ДЛЯ ЛАТИФ РАЧАБОВ");
    console.log("=".repeat(80));

    // Найти пользователя
    const user = await User.findOne({ phoneNumber: "+992557777509" });
    
    if (!user) {
      console.log("\n❌ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН!");
      console.log("   Телефон: +992557777509");
      console.log("\n💡 Создайте пользователя:");
      console.log("   node backend/create-latif-user.js");
      return;
    }

    console.log("\n👤 НАЙДЕН ПОЛЬЗОВАТЕЛЬ:");
    console.log(`   Имя: ${user.name}`);
    console.log(`   Телефон: ${user.phoneNumber}`);
    console.log(`   Email: ${user.email || "не указан"}`);
    console.log(`   Роль: ${user.role}`);
    
    // Проверить настройки
    console.log("\n📊 ПРОВЕРКА НАСТРОЕК:");
    console.log(`   Телефон верифицирован: ${user.isPhoneVerified ? "✅ ДА" : "❌ НЕТ"}`);
    console.log(`   SMS уведомления: ${user.settings.smsNotifications ? "✅ ВКЛЮЧЕНЫ" : "❌ ОТКЛЮЧЕНЫ"}`);
    console.log(`   Типов SMS: ${user.settings.smsNotificationTypes?.length || 0}`);
    
    const canReceive = user.canReceiveSMS();
    const canReceiveTask = user.isSMSNotificationEnabled('task_notification');
    
    console.log(`   Может получать SMS: ${canReceive ? "✅ ДА" : "❌ НЕТ"}`);
    console.log(`   Может получать уведомления о задачах: ${canReceiveTask ? "✅ ДА" : "❌ НЕТ"}`);
    
    if (!canReceive || !canReceiveTask) {
      console.log("\n⚠️  ВНИМАНИЕ: SMS не может быть отправлено!");
      console.log("   Пользователь не настроен для получения SMS");
      console.log("\n💡 Исправьте настройки:");
      console.log("   node backend/fix-sms-settings.js");
      return;
    }

    // Отправить тестовое SMS
    console.log("\n📤 ОТПРАВКА ТЕСТОВОГО SMS...");
    console.log("   Номер:", user.phoneNumber);
    
    const testMessage = `🎉 Тест BullMQ SMS системы!\n\nПривет, ${user.name}!\n\nЭто тестовое сообщение с новой очередью BullMQ.\n\nВремя: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}\n\nСистема готова к работе! ✅`;
    
    console.log("   Сообщение:");
    console.log("   " + "-".repeat(60));
    console.log("   " + testMessage.split('\n').join('\n   '));
    console.log("   " + "-".repeat(60));
    
    try {
      const result = await sendSMS(user.phoneNumber, testMessage, "high");
      
      console.log("\n📊 РЕЗУЛЬТАТ ОТПРАВКИ:");
      console.log(`   Успех: ${result.success ? "✅ ДА" : "❌ НЕТ"}`);
      console.log(`   Job ID: ${result.jobId || result.messageId || "N/A"}`);
      console.log(`   Queued: ${result.queued ? "✅ ДА (будет отправлено)" : "❌ НЕТ (отправлено сразу)"}`);
      console.log(`   Parts: ${result.parts || 1}`);
      
      if (result.success) {
        console.log("\n✅ SMS УСПЕШНО ОТПРАВЛЕНО!");
        
        if (result.queued) {
          console.log("\n📬 SMS в очереди:");
          console.log("   Будет отправлено когда SMPP подключится");
          console.log("   Проверьте логи: pm2 logs backend");
        } else {
          console.log("\n📨 SMS отправлено напрямую через SMPP");
        }
      } else {
        console.log("\n❌ ОШИБКА ОТПРАВКИ SMS");
        console.log("   Проверьте SMPP подключение");
      }
      
    } catch (smsError) {
      console.error("\n❌ ОШИБКА ПРИ ОТПРАВКЕ SMS:", smsError.message);
      console.error("   Детали:", smsError);
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО");
    console.log("=".repeat(80));
    console.log("\n💡 СЛЕДУЮЩИЕ ШАГИ:");
    console.log("   1. Проверьте телефон +992557777509 на получение SMS");
    console.log("   2. Если SMS не пришло, проверьте:");
    console.log("      - pm2 logs backend (проверить SMPP статус)");
    console.log("      - node backend/clear-sms-queue-bullmq.js (очистить очередь)");
    console.log("      - Убедитесь что Redis запущен: redis-cli ping");
    console.log("   3. Создайте задачу через веб-интерфейс:");
    console.log("      - Назначьте Латифа Рачабова");
    console.log("      - Проверьте что SMS приходит автоматически");
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Ошибка:", error);
    console.error("   Детали:", error.message);
  } finally {
    // Даем время для отправки SMS
    console.log("\n⏳ Ожидание 3 секунды перед закрытием...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    
    // Принудительный выход
    process.exit(0);
  }
}

testLatifSMS();
