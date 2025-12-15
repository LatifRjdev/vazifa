import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

dotenv.config();

console.log("================================================================================");
console.log("🔍 ДИАГНОСТИКА SMS УВЕДОМЛЕНИЙ ДЛЯ ЗАДАЧ");
console.log("================================================================================");

async function diagnoseTaskSMS() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Get all users with phone numbers
    const usersWithPhones = await User.find({
      phoneNumber: { $exists: true, $ne: null, $ne: "" }
    }).select('name email phoneNumber isPhoneVerified settings role');

    console.log(`📱 Всего пользователей с телефонами: ${usersWithPhones.length}\n`);

    if (usersWithPhones.length === 0) {
      console.log("⚠️  Нет пользователей с номерами телефонов\n");
      await mongoose.disconnect();
      return;
    }

    let verifiedCount = 0;
    let smsEnabledCount = 0;
    let taskNotificationEnabledCount = 0;
    let fullyConfiguredCount = 0;

    console.log("=" .repeat(80));
    console.log("📊 ДЕТАЛЬНЫЙ ОТЧЕТ ПО ПОЛЬЗОВАТЕЛЯМ");
    console.log("=".repeat(80));

    usersWithPhones.forEach((user, index) => {
      const isVerified = user.isPhoneVerified;
      const smsEnabled = user.settings?.smsNotifications;
      const taskNotificationEnabled = user.settings?.smsNotificationTypes?.includes('task_notification');
      const fullyConfigured = isVerified && smsEnabled && taskNotificationEnabled;

      if (isVerified) verifiedCount++;
      if (smsEnabled) smsEnabledCount++;
      if (taskNotificationEnabled) taskNotificationEnabledCount++;
      if (fullyConfigured) fullyConfiguredCount++;

      const status = fullyConfigured ? "✅" : "❌";
      
      console.log(`\n${index + 1}. ${status} ${user.name}`);
      console.log(`   Email: ${user.email || 'не указан'}`);
      console.log(`   Телефон: ${user.phoneNumber}`);
      console.log(`   Роль: ${user.role}`);
      console.log(`   Верифицирован: ${isVerified ? '✅ Да' : '❌ Нет'}`);
      console.log(`   SMS включены: ${smsEnabled ? '✅ Да' : '❌ Нет'}`);
      console.log(`   Уведомления о задачах: ${taskNotificationEnabled ? '✅ Да' : '❌ Нет'}`);
      
      if (user.settings?.smsNotificationTypes) {
        console.log(`   Типы SMS: ${user.settings.smsNotificationTypes.join(', ')}`);
      } else {
        console.log(`   Типы SMS: не настроены`);
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("📈 СТАТИСТИКА");
    console.log("=".repeat(80));
    console.log(`Всего пользователей с телефонами: ${usersWithPhones.length}`);
    console.log(`Телефоны верифицированы: ${verifiedCount} (${Math.round(verifiedCount/usersWithPhones.length*100)}%)`);
    console.log(`SMS уведомления включены: ${smsEnabledCount} (${Math.round(smsEnabledCount/usersWithPhones.length*100)}%)`);
    console.log(`Уведомления о задачах включены: ${taskNotificationEnabledCount} (${Math.round(taskNotificationEnabledCount/usersWithPhones.length*100)}%)`);
    console.log(`Полностью настроены: ${fullyConfiguredCount} (${Math.round(fullyConfiguredCount/usersWithPhones.length*100)}%)`);

    const needsFix = usersWithPhones.length - fullyConfiguredCount;
    
    console.log("\n" + "=".repeat(80));
    if (needsFix > 0) {
      console.log("⚠️  ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ");
      console.log("=".repeat(80));
      console.log(`${needsFix} пользователей нуждаются в настройке для получения SMS о задачах`);
      console.log("\n💡 Запустите скрипт исправления:");
      console.log("   node fix-task-sms-settings.js");
    } else {
      console.log("✅ ВСЕ ПОЛЬЗОВАТЕЛИ НАСТРОЕНЫ ПРАВИЛЬНО");
      console.log("=".repeat(80));
      console.log("Все пользователи с телефонами готовы получать SMS о задачах");
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔍 ПРОВЕРКА МЕТОДОВ User");
    console.log("=".repeat(80));
    
    // Test with first user
    if (usersWithPhones.length > 0) {
      const testUser = usersWithPhones[0];
      console.log(`\nТестирование с пользователем: ${testUser.name}`);
      console.log(`canReceiveSMS(): ${testUser.canReceiveSMS()}`);
      console.log(`isSMSNotificationEnabled('task_notification'): ${testUser.isSMSNotificationEnabled('task_notification')}`);
      
      if (!testUser.canReceiveSMS()) {
        console.log("\n❌ Пользователь НЕ МОЖЕТ получать SMS:");
        if (!testUser.phoneNumber) console.log("   - Нет номера телефона");
        if (!testUser.isPhoneVerified) console.log("   - Телефон не верифицирован");
        if (!testUser.settings?.smsNotifications) console.log("   - SMS уведомления выключены");
      }
      
      if (!testUser.isSMSNotificationEnabled('task_notification')) {
        console.log("\n❌ Уведомления о задачах НЕ ВКЛЮЧЕНЫ:");
        console.log(`   Доступные типы: ${testUser.settings?.smsNotificationTypes?.join(', ') || 'нет'}`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n");

    await mongoose.disconnect();
    console.log("👋 Отключено от MongoDB\n");

  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

diagnoseTaskSMS();
