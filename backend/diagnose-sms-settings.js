import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

async function diagnoseSMSSettings() {
  try {
    // Подключиться к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Телефоны для проверки
    const phoneNumbers = ["+992557777509", "+992XXXXXXXXX"]; // Rashid Khan's phone unknown

    console.log("\n" + "=".repeat(80));
    console.log("📊 ДИАГНОСТИКА SMS НАСТРОЕК ПОЛЬЗОВАТЕЛЕЙ");
    console.log("=".repeat(80));

    // Найти пользователей по телефону или имени
    const latif = await User.findOne({ phoneNumber: "+992557777509" });
    const rashid = await User.findOne({ name: /Rashid.*Khan/i });

    const users = [
      { name: "Латиф Рачабов", user: latif, phone: "+992557777509" },
      { name: "Rashid Khan", user: rashid, phone: rashid?.phoneNumber || "неизвестно" }
    ];

    for (const { name, user, phone } of users) {
      console.log("\n" + "-".repeat(80));
      console.log(`👤 Пользователь: ${name} (${phone})`);
      console.log("-".repeat(80));

      if (!user) {
        console.log("❌ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН В БАЗЕ ДАННЫХ");
        continue;
      }

      console.log(`📧 Email: ${user.email || "не указан"}`);
      console.log(`📱 Телефон: ${user.phoneNumber || "не указан"}`);
      console.log(`🔐 Роль: ${user.role}`);
      console.log(`📅 Зарегистрирован: ${user.createdAt}`);

      console.log("\n📊 SMS СТАТУС:");
      console.log(`   ✓ Телефон верифицирован: ${user.isPhoneVerified ? "✅ ДА" : "❌ НЕТ"}`);
      console.log(`   ✓ SMS уведомления: ${user.settings.smsNotifications ? "✅ ВКЛЮЧЕНЫ" : "❌ ОТКЛЮЧЕНЫ"}`);
      console.log(`   ✓ Email уведомления: ${user.settings.emailNotifications ? "✅ ВКЛЮЧЕНЫ" : "❌ ОТКЛЮЧЕНЫ"}`);

      console.log("\n📋 ТИПЫ SMS УВЕДОМЛЕНИЙ:");
      const allTypes = [
        'verification',
        'otp',
        'password_reset',
        'task_notification',
        'workspace_invite',
        'general_notification',
      ];

      allTypes.forEach(type => {
        const enabled = user.settings.smsNotificationTypes?.includes(type);
        console.log(`   ${enabled ? "✅" : "❌"} ${type}`);
      });

      // Проверка canReceiveSMS()
      const canReceive = user.canReceiveSMS();
      console.log(`\n🔔 Может получать SMS: ${canReceive ? "✅ ДА" : "❌ НЕТ"}`);
      
      if (!canReceive) {
        console.log("\n⚠️  ПРОБЛЕМЫ:");
        if (!user.phoneNumber) console.log("   • Отсутствует номер телефона");
        if (!user.isPhoneVerified) console.log("   • Телефон не верифицирован");
        if (!user.settings.smsNotifications) console.log("   • SMS уведомления отключены");
      }

      // Проверка task_notification
      const canReceiveTaskNotif = user.isSMSNotificationEnabled('task_notification');
      console.log(`🔔 Может получать уведомления о задачах: ${canReceiveTaskNotif ? "✅ ДА" : "❌ НЕТ"}`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("📝 РЕКОМЕНДАЦИИ:");
    console.log("=".repeat(80));

    let hasIssues = false;

    for (const { name, user } of users) {
      if (!user) continue;

      if (!user.isPhoneVerified || !user.settings.smsNotifications || 
          !user.settings.smsNotificationTypes?.includes('task_notification')) {
        hasIssues = true;
        console.log(`\n❌ ${name}:`);
        
        if (!user.isPhoneVerified) {
          console.log("   → Необходимо верифицировать телефон");
        }
        if (!user.settings.smsNotifications) {
          console.log("   → Необходимо включить SMS уведомления");
        }
        if (!user.settings.smsNotificationTypes?.includes('task_notification')) {
          console.log("   → Необходимо включить уведомления о задачах");
        }
      } else {
        console.log(`\n✅ ${name}: Все настройки в порядке`);
      }
    }

    if (hasIssues) {
      console.log("\n💡 Запустите скрипт 'fix-sms-settings.js' для исправления проблем");
    }

    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

diagnoseSMSSettings();
