import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

dotenv.config();

console.log("================================================================================");
console.log("🔧 ИСПРАВЛЕНИЕ SMS НАСТРОЕК ДЛЯ УВЕДОМЛЕНИЙ О ЗАДАЧАХ");
console.log("================================================================================");

async function fixTaskSMSSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Get all users with phone numbers
    const usersWithPhones = await User.find({
      phoneNumber: { $exists: true, $ne: null, $ne: "" }
    });

    console.log(`📱 Найдено пользователей с телефонами: ${usersWithPhones.length}\n`);

    if (usersWithPhones.length === 0) {
      console.log("⚠️  Нет пользователей с номерами телефонов для исправления\n");
      await mongoose.disconnect();
      return;
    }

    let fixedCount = 0;
    let alreadyConfiguredCount = 0;
    const fixedUsers = [];

    console.log("=".repeat(80));
    console.log("🔄 ИСПРАВЛЕНИЕ НАСТРОЕК");
    console.log("=".repeat(80));

    for (const user of usersWithPhones) {
      try {
        let needsFix = false;
        const changes = [];

        // Check if phone is verified
        if (!user.isPhoneVerified) {
          user.isPhoneVerified = true;
          needsFix = true;
          changes.push("✅ Верифицирован телефон");
        }

        // Check if SMS notifications are enabled
        if (!user.settings.smsNotifications) {
          user.settings.smsNotifications = true;
          needsFix = true;
          changes.push("✅ Включены SMS уведомления");
        }

        // Check if task_notification type is enabled
        if (!user.settings.smsNotificationTypes.includes('task_notification')) {
          // Ensure smsNotificationTypes is an array
          if (!Array.isArray(user.settings.smsNotificationTypes)) {
            user.settings.smsNotificationTypes = [];
          }
          
          // Add task_notification if not present
          user.settings.smsNotificationTypes.push('task_notification');
          needsFix = true;
          changes.push("✅ Добавлен тип 'task_notification'");
        }

        // Ensure all required notification types are present
        const requiredTypes = [
          'verification',
          'otp',
          'password_reset',
          'task_notification',
          'workspace_invite',
          'general_notification'
        ];

        requiredTypes.forEach(type => {
          if (!user.settings.smsNotificationTypes.includes(type)) {
            user.settings.smsNotificationTypes.push(type);
            needsFix = true;
            changes.push(`✅ Добавлен тип '${type}'`);
          }
        });

        if (needsFix) {
          await user.save({ validateBeforeSave: false }); // Skip validation for incorrect phone numbers
          fixedCount++;
          fixedUsers.push({
            name: user.name,
            phoneNumber: user.phoneNumber,
            changes
          });
          
          console.log(`\n${fixedCount}. 🔧 ${user.name}`);
          console.log(`   Телефон: ${user.phoneNumber}`);
          changes.forEach(change => console.log(`   ${change}`));
        } else {
          alreadyConfiguredCount++;
        }
      } catch (error) {
        console.log(`\n⚠️  Пропущен ${user.name} (${user.phoneNumber}): ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 РЕЗУЛЬТАТЫ");
    console.log("=".repeat(80));
    console.log(`Всего пользователей с телефонами: ${usersWithPhones.length}`);
    console.log(`Исправлено: ${fixedCount}`);
    console.log(`Уже настроены: ${alreadyConfiguredCount}`);

    if (fixedCount > 0) {
      console.log("\n" + "=".repeat(80));
      console.log("✅ ИСПРАВЛЕННЫЕ ПОЛЬЗОВАТЕЛИ");
      console.log("=".repeat(80));
      
      fixedUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.phoneNumber})`);
        user.changes.forEach(change => console.log(`   ${change}`));
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО");
    console.log("=".repeat(80));
    console.log("\n💡 Все пользователи теперь могут получать SMS уведомления о задачах!");
    console.log("\n🧪 Для проверки запустите:");
    console.log("   node test-create-task-sms.js");
    console.log("\n");

    await mongoose.disconnect();
    console.log("👋 Отключено от MongoDB\n");

  } catch (error) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixTaskSMSSettings();
