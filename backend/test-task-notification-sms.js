import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";
import { sendNotification } from "./libs/send-notification.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

async function testTaskNotificationSMS() {
  try {
    // Подключиться к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n" + "=".repeat(80));
    console.log("📱 ТЕСТИРОВАНИЕ SMS УВЕДОМЛЕНИЙ О ЗАДАЧАХ");
    console.log("=".repeat(80));

    // Найти пользователей
    const latif = await User.findOne({ phoneNumber: "+992557777509" });
    const rashid = await User.findOne({ name: /Rashid.*Khan/i });

    const users = [
      { name: "Латиф Рачабов", user: latif },
      { name: "Rashid Khan", user: rashid }
    ];

    for (const { name, user } of users) {
      console.log("\n" + "-".repeat(80));
      console.log(`👤 Тестирование для: ${name}`);
      console.log("-".repeat(80));

      if (!user) {
        console.log("❌ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН");
        continue;
      }

      console.log(`📱 Телефон: ${user.phoneNumber}`);
      console.log(`📧 Email: ${user.email || "не указан"}`);

      // Проверить настройки
      const canReceive = user.canReceiveSMS();
      const canReceiveTask = user.isSMSNotificationEnabled('task_notification');

      console.log(`\n🔔 Может получать SMS: ${canReceive ? "✅ ДА" : "❌ НЕТ"}`);
      console.log(`🔔 Может получать уведомления о задачах: ${canReceiveTask ? "✅ ДА" : "❌ НЕТ"}`);

      if (!canReceive || !canReceiveTask) {
        console.log("\n⚠️  SMS не будет отправлено из-за настроек пользователя");
        console.log("   Запустите: node backend/fix-sms-settings.js");
        continue;
      }

      // Отправить тестовое уведомление
      console.log("\n📤 Отправка тестового уведомления...");
      
      try {
        const result = await sendNotification({
          recipientId: user._id,
          type: "task_assigned",
          title: "🧪 Тестовая задача",
          message: "Это тестовое уведомление для проверки SMS системы. Вам назначена задача: Тестирование SMS уведомлений",
          relatedData: {
            taskId: "test-task-id-" + Date.now(),
            actorId: user._id,
          },
          sendEmail: true,
          sendSMS: true,
        });

        console.log("\n📊 РЕЗУЛЬТАТ ОТПРАВКИ:");
        console.log("   In-app уведомление:", result.results?.notification ? "✅" : "❌");
        console.log("   Email:", result.results?.email ? "✅" : "❌");
        console.log("   SMS:", result.results?.sms ? "✅" : "❌");

        if (result.results?.sms) {
          console.log("\n✅ SMS УСПЕШНО ОТПРАВЛЕНО!");
        } else {
          console.log("\n⚠️  SMS НЕ БЫЛО ОТПРАВЛЕНО");
          console.log("   Проверьте логи сервера для деталей");
        }

      } catch (error) {
        console.error("\n❌ ОШИБКА при отправке уведомления:", error.message);
        console.error("   Детали:", error);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО");
    console.log("=".repeat(80));
    console.log("\n💡 Проверьте телефоны на получение SMS");
    console.log("   Если SMS не пришли, проверьте:");
    console.log("   1. Логи backend сервера на наличие ошибок SMPP");
    console.log("   2. Подключение к SMPP серверу (10.241.60.10:2775)");
    console.log("   3. SMS логи в базе данных: db.smslogs.find()");
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    // Даем время для отправки SMS перед отключением
    console.log("\n⏳ Ожидание завершения отправки SMS (5 секунд)...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    
    // Принудительно завершить процесс (чтобы закрыть SMPP соединение)
    process.exit(0);
  }
}

testTaskNotificationSMS();
