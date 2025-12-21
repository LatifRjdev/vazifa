import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";
import SMSLog from "./models/sms-logs.js";

dotenv.config();

const PHONE_NUMBER = "+992557777509";

async function diagnoseUserSMS() {
  try {
    console.log("🔍 ДИАГНОСТИКА SMS ПРОБЛЕМЫ");
    console.log("=" .repeat(80));
    console.log(`📱 Номер телефона: ${PHONE_NUMBER}`);
    console.log("=" .repeat(80) + "\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Find user by phone number
    const user = await User.findOne({ phoneNumber: PHONE_NUMBER });

    if (!user) {
      console.log("❌ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН!");
      console.log(`   Номер ${PHONE_NUMBER} не зарегистрирован в системе.\n`);
      process.exit(1);
    }

    console.log("✅ ПОЛЬЗОВАТЕЛЬ НАЙДЕН");
    console.log("=" .repeat(80));
    console.log("📋 Основная информация:");
    console.log(`   ID: ${user._id}`);
    console.log(`   Имя: ${user.name}`);
    console.log(`   Email: ${user.email || "(не указан)"}`);
    console.log(`   Телефон: ${user.phoneNumber}`);
    console.log(`   Роль: ${user.role}`);
    console.log();

    // Check SMS requirements
    console.log("🔍 ПРОВЕРКА ТРЕБОВАНИЙ ДЛЯ SMS");
    console.log("=" .repeat(80));
    
    const hasPhone = !!user.phoneNumber;
    const isPhoneVerified = user.isPhoneVerified;
    const smsEnabled = user.settings?.smsNotifications;
    const smsTypes = user.settings?.smsNotificationTypes || [];

    console.log(`1. Номер телефона указан: ${hasPhone ? "✅ Да" : "❌ Нет"}`);
    console.log(`   Значение: ${user.phoneNumber || "(отсутствует)"}`);
    console.log();

    console.log(`2. Телефон верифицирован: ${isPhoneVerified ? "✅ Да" : "❌ НЕТ"}`);
    console.log(`   Значение: isPhoneVerified = ${isPhoneVerified}`);
    if (!isPhoneVerified) {
      console.log("   ⚠️  ПРОБЛЕМА: Телефон не верифицирован!");
      console.log("   💡 Решение: Нужно установить isPhoneVerified = true");
    }
    console.log();

    console.log(`3. SMS уведомления включены: ${smsEnabled ? "✅ Да" : "❌ НЕТ"}`);
    console.log(`   Значение: settings.smsNotifications = ${smsEnabled}`);
    if (!smsEnabled) {
      console.log("   ⚠️  ПРОБЛЕМА: SMS уведомления отключены!");
      console.log("   💡 Решение: Нужно установить settings.smsNotifications = true");
    }
    console.log();

    console.log(`4. Типы SMS уведомлений:`);
    console.log(`   Всего включено: ${smsTypes.length} типов`);
    console.log(`   Список: ${smsTypes.length > 0 ? smsTypes.join(", ") : "(пусто)"}`);
    
    const hasTaskNotification = smsTypes.includes("task_notification");
    console.log(`   task_notification включен: ${hasTaskNotification ? "✅ Да" : "❌ НЕТ"}`);
    if (!hasTaskNotification) {
      console.log("   ⚠️  ПРОБЛЕМА: Тип 'task_notification' отсутствует!");
      console.log("   💡 Решение: Нужно добавить 'task_notification' в массив");
    }
    console.log();

    // Check canReceiveSMS method
    const canReceive = user.canReceiveSMS();
    console.log("=" .repeat(80));
    console.log(`📊 ИТОГОВАЯ ПРОВЕРКА: user.canReceiveSMS()`);
    console.log(`   Результат: ${canReceive ? "✅ МОЖЕТ получать SMS" : "❌ НЕ МОЖЕТ получать SMS"}`);
    console.log();

    if (!canReceive) {
      console.log("🔧 ПРИЧИНЫ БЛОКИРОВКИ SMS:");
      if (!hasPhone) console.log("   ❌ Отсутствует номер телефона");
      if (!isPhoneVerified) console.log("   ❌ Телефон не верифицирован");
      if (!smsEnabled) console.log("   ❌ SMS уведомления отключены");
      console.log();
    }

    // Check recent SMS logs
    console.log("=" .repeat(80));
    console.log("📝 ПОСЛЕДНИЕ SMS ЛОГИ (за последние 7 дней)");
    console.log("=" .repeat(80));
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const smsLogs = await SMSLog.find({
      phoneNumber: PHONE_NUMBER,
      createdAt: { $gte: sevenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    if (smsLogs.length === 0) {
      console.log("   📭 Нет SMS логов за последние 7 дней");
    } else {
      console.log(`   📬 Найдено ${smsLogs.length} SMS лог(ов):\n`);
      
      smsLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.createdAt.toLocaleString("ru-RU")}`);
        console.log(`      Статус: ${log.status === "sent" ? "✅ Отправлено" : "❌ Ошибка"}`);
        console.log(`      Тип: ${log.type}`);
        console.log(`      Сообщение: ${log.message.substring(0, 50)}...`);
        if (log.status !== "sent" && log.errorMessage) {
          console.log(`      Ошибка: ${log.errorMessage}`);
        }
        console.log();
      });
    }

    // Summary
    console.log("=" .repeat(80));
    console.log("📊 РЕЗЮМЕ");
    console.log("=" .repeat(80));
    
    if (canReceive && hasTaskNotification) {
      console.log("✅ Пользователь ДОЛЖЕН получать SMS уведомления о задачах");
      console.log("   Все настройки в порядке!");
      console.log("\n💡 Если SMS все равно не приходят:");
      console.log("   1. Проверьте SMPP соединение (pm2 logs vazifa-backend)");
      console.log("   2. Проверьте логи при создании задачи");
      console.log("   3. Проверьте что пользователь действительно назначен на задачу");
    } else {
      console.log("❌ Пользователь НЕ МОЖЕТ получать SMS уведомления");
      console.log("\n🔧 ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ:");
      
      const fixes = [];
      if (!isPhoneVerified) fixes.push("• Верифицировать телефон (isPhoneVerified = true)");
      if (!smsEnabled) fixes.push("• Включить SMS уведомления (smsNotifications = true)");
      if (!hasTaskNotification) fixes.push("• Добавить 'task_notification' в разрешенные типы");
      
      fixes.forEach(fix => console.log(`   ${fix}`));
      
      console.log("\n💡 Запустите скрипт fix-user-sms.js для автоматического исправления");
    }

    console.log("=" .repeat(80) + "\n");

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Отключено от MongoDB");
  }
}

diagnoseUserSMS();
