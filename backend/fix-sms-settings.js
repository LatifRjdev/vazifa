import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

async function fixSMSSettings() {
  try {
    // Подключиться к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n" + "=".repeat(80));
    console.log("🔧 ИСПРАВЛЕНИЕ SMS НАСТРОЕК ПОЛЬЗОВАТЕЛЕЙ");
    console.log("=".repeat(80));

    // Найти пользователей по телефону или имени
    const latif = await User.findOne({ phoneNumber: "+992557777509" });
    const rashid = await User.findOne({ name: /Rashid.*Khan/i });

    const users = [
      { name: "Латиф Рачабов", user: latif, phone: "+992557777509" },
      { name: "Rashid Khan", user: rashid, phone: rashid?.phoneNumber }
    ];

    for (const { name, user, phone } of users) {
      console.log("\n" + "-".repeat(80));
      console.log(`👤 Обработка: ${name} (${phone || "телефон неизвестен"})`);
      console.log("-".repeat(80));

      if (!user) {
        console.log("❌ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН В БАЗЕ ДАННЫХ");
        console.log("⚠️  Пожалуйста, проверьте имя пользователя или создайте аккаунт");
        continue;
      }

      let updated = false;

      // 1. Верифицировать телефон
      if (!user.isPhoneVerified) {
        console.log("📱 Верифицирую телефон...");
        user.isPhoneVerified = true;
        updated = true;
        console.log("   ✅ Телефон верифицирован");
      } else {
        console.log("   ✓ Телефон уже верифицирован");
      }

      // 2. Включить SMS уведомления
      if (!user.settings.smsNotifications) {
        console.log("🔔 Включаю SMS уведомления...");
        user.settings.smsNotifications = true;
        updated = true;
        console.log("   ✅ SMS уведомления включены");
      } else {
        console.log("   ✓ SMS уведомления уже включены");
      }

      // 3. Включить все типы SMS уведомлений
      const allTypes = [
        'verification',
        'otp',
        'password_reset',
        'task_notification',
        'workspace_invite',
        'general_notification',
      ];

      const currentTypes = user.settings.smsNotificationTypes || [];
      const missingTypes = allTypes.filter(type => !currentTypes.includes(type));

      if (missingTypes.length > 0) {
        console.log("📋 Добавляю недостающие типы уведомлений...");
        user.settings.smsNotificationTypes = allTypes;
        updated = true;
        console.log(`   ✅ Добавлено ${missingTypes.length} типов: ${missingTypes.join(', ')}`);
      } else {
        console.log("   ✓ Все типы уведомлений уже включены");
      }

      // 4. Включить email уведомления (если отключены)
      if (!user.settings.emailNotifications) {
        console.log("📧 Включаю Email уведомления...");
        user.settings.emailNotifications = true;
        updated = true;
        console.log("   ✅ Email уведомления включены");
      } else {
        console.log("   ✓ Email уведомления уже включены");
      }

      // Сохранить изменения
      if (updated) {
        await user.save();
        console.log("\n💾 Изменения сохранены в базе данных");
      } else {
        console.log("\n✅ Все настройки уже были правильными, изменений не требуется");
      }

      // Проверка результата
      console.log("\n📊 ТЕКУЩИЙ СТАТУС:");
      console.log(`   ✓ Телефон верифицирован: ${user.isPhoneVerified ? "✅" : "❌"}`);
      console.log(`   ✓ SMS уведомления: ${user.settings.smsNotifications ? "✅" : "❌"}`);
      console.log(`   ✓ Email уведомления: ${user.settings.emailNotifications ? "✅" : "❌"}`);
      console.log(`   ✓ Типов SMS уведомлений: ${user.settings.smsNotificationTypes?.length || 0}/6`);
      
      const canReceive = user.canReceiveSMS();
      const canReceiveTask = user.isSMSNotificationEnabled('task_notification');
      
      console.log(`\n🔔 Может получать SMS: ${canReceive ? "✅ ДА" : "❌ НЕТ"}`);
      console.log(`🔔 Может получать уведомления о задачах: ${canReceiveTask ? "✅ ДА" : "❌ НЕТ"}`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО");
    console.log("=".repeat(80));
    console.log("\n💡 Теперь можно протестировать отправку SMS:");
    console.log("   node backend/test-task-notification-sms.js");
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

fixSMSSettings();
