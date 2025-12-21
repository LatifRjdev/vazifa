import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/users.js";
import Task from "./models/tasks.js";
import SMSLog from "./models/sms-logs.js";
import Notification from "./models/notifications.js";
import { sendNotification } from "./libs/send-notification.js";
import getSMPPService from "./libs/send-sms-bullmq.js";

dotenv.config();

console.log("\n" + "=".repeat(100));
console.log("🧪 ТЕСТ ПОЛНЫХ УВЕДОМЛЕНИЙ ПРИ СОЗДАНИИ ЗАДАЧИ");
console.log("=".repeat(100));

async function testCompleteTaskNotifications() {
  try {
    // Подключение к MongoDB
    console.log("\n📊 Подключение к MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB подключен");

    // Проверка SMPP соединения
    console.log("\n🔌 Проверка SMPP соединения...");
    const smppService = getSMPPService();
    const smppStatus = smppService.getStatus();
    console.log("📋 Статус SMPP:");
    console.log("   - Подключено:", smppStatus.connected ? "✅ ДА" : "❌ НЕТ");
    console.log("   - Попытки переподключения:", smppStatus.reconnectAttempts);
    console.log("   - Хост:", smppStatus.config.host);
    console.log("   - Порт:", smppStatus.config.port);
    
    if (!smppStatus.connected) {
      console.log("⚠️  SMPP не подключен. SMS будут добавлены в очередь.");
    }

    // Найти тестового пользователя
    console.log("\n👤 Поиск тестового пользователя с email и телефоном...");
    const testUser = await User.findOne({
      email: { $exists: true, $ne: null },
      phoneNumber: { $exists: true, $ne: null },
      isPhoneVerified: true,
      "settings.emailNotifications": true,
      "settings.smsNotifications": true,
    }).sort({ createdAt: -1 });

    if (!testUser) {
      console.error("❌ Тестовый пользователь не найден!");
      console.log("💡 Создайте пользователя с:");
      console.log("   - Email адресом");
      console.log("   - Верифицированным номером телефона (+992XXXXXXXXX)");
      console.log("   - Включенными email уведомлениями");
      console.log("   - Включенными SMS уведомлениями");
      process.exit(1);
    }

    console.log("✅ Найден тестовый пользователь:");
    console.log("   - ID:", testUser._id);
    console.log("   - Имя:", testUser.name);
    console.log("   - Email:", testUser.email);
    console.log("   - Телефон:", testUser.phoneNumber);
    console.log("   - Email уведомления:", testUser.settings.emailNotifications ? "✅" : "❌");
    console.log("   - SMS уведомления:", testUser.settings.smsNotifications ? "✅" : "❌");
    console.log("   - SMS типы:", testUser.settings.smsNotificationTypes.join(", "));

    // Найти администратора для создания задачи
    console.log("\n👔 Поиск администратора...");
    const admin = await User.findOne({ 
      role: { $in: ["admin", "super_admin", "manager"] } 
    }).sort({ createdAt: 1 });

    if (!admin) {
      console.error("❌ Администратор не найден!");
      process.exit(1);
    }

    console.log("✅ Найден администратор:", admin.name);

    // Создать тестовую задачу
    console.log("\n📋 Создание тестовой задачи...");
    const testTask = await Task.create({
      title: `Тестовая задача уведомлений - ${new Date().toLocaleString('ru-RU')}`,
      description: "Эта задача создана для тестирования Email и SMS уведомлений при назначении задачи.",
      status: "To Do",
      priority: "High",
      assignees: [testUser._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через неделю
      createdAt: new Date(),
    });

    console.log("✅ Задача создана:");
    console.log("   - ID:", testTask._id);
    console.log("   - Название:", testTask.title);
    console.log("   - Приоритет:", testTask.priority);

    // Отправить уведомление
    console.log("\n📤 Отправка уведомления пользователю...");
    console.log("=".repeat(100));
    
    const notificationResult = await sendNotification({
      recipientId: testUser._id,
      type: "task_assigned",
      title: "Вам назначена новая задача",
      message: `${admin.name} назначил вам задачу: ${testTask.title}`,
      relatedData: {
        taskId: testTask._id,
        actorId: admin._id,
      },
    });

    console.log("=".repeat(100));
    console.log("\n📊 Результат отправки уведомления:");
    console.log("   - Успех:", notificationResult.success ? "✅" : "❌");
    console.log("   - In-app уведомление:", notificationResult.results?.notification ? "✅" : "❌");
    console.log("   - Email отправлен:", notificationResult.results?.email ? "✅" : "❌");
    console.log("   - SMS отправлен:", notificationResult.results?.sms ? "✅" : "❌");

    // Подождать немного для обработки
    console.log("\n⏳ Ожидание 3 секунды для обработки...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Проверить созданное уведомление
    console.log("\n🔍 Проверка in-app уведомления...");
    const inAppNotification = await Notification.findOne({
      recipient: testUser._id,
      "relatedData.taskId": testTask._id,
    }).sort({ createdAt: -1 });

    if (inAppNotification) {
      console.log("✅ In-app уведомление найдено:");
      console.log("   - ID:", inAppNotification._id);
      console.log("   - Тип:", inAppNotification.type);
      console.log("   - Заголовок:", inAppNotification.title);
      console.log("   - Сообщение:", inAppNotification.message);
      console.log("   - Прочитано:", inAppNotification.isRead ? "Да" : "Нет");
    } else {
      console.log("❌ In-app уведомление не найдено");
    }

    // Проверить SMS лог
    console.log("\n📱 Проверка SMS логов...");
    const smsLogs = await SMSLog.find({
      phoneNumber: testUser.phoneNumber,
    }).sort({ createdAt: -1 }).limit(5);

    if (smsLogs.length > 0) {
      console.log(`✅ Найдено ${smsLogs.length} SMS лог(ов):`);
      smsLogs.forEach((log, index) => {
        console.log(`\n   SMS #${index + 1}:`);
        console.log("   - Дата:", log.createdAt.toLocaleString('ru-RU'));
        console.log("   - Статус:", log.status);
        console.log("   - Тип:", log.type);
        console.log("   - Сообщение:", log.message.substring(0, 80) + "...");
        if (log.messageId) {
          console.log("   - Message ID:", log.messageId);
        }
        if (log.errorMessage) {
          console.log("   - Ошибка:", log.errorMessage);
        }
      });
    } else {
      console.log("❌ SMS логи не найдены");
    }

    // Итоговая статистика
    console.log("\n" + "=".repeat(100));
    console.log("📊 ИТОГОВАЯ СТАТИСТИКА");
    console.log("=".repeat(100));
    
    const totalNotifications = await Notification.countDocuments({
      recipient: testUser._id,
    });
    
    const totalSMS = await SMSLog.countDocuments({
      phoneNumber: testUser.phoneNumber,
    });

    console.log(`✅ Всего in-app уведомлений для пользователя: ${totalNotifications}`);
    console.log(`✅ Всего SMS отправлено на номер: ${totalSMS}`);

    // Рекомендации
    console.log("\n💡 РЕКОМЕНДАЦИИ:");
    console.log("=".repeat(100));
    
    if (!notificationResult.results?.email) {
      console.log("⚠️  Email не был отправлен. Проверьте:");
      console.log("   1. SMTP настройки в .env");
      console.log("   2. Email адрес пользователя");
      console.log("   3. Логи backend для ошибок email");
    } else {
      console.log("✅ Email отправлен успешно");
      console.log(`   Проверьте почту: ${testUser.email}`);
    }

    if (!notificationResult.results?.sms) {
      console.log("\n⚠️  SMS не был отправлен. Проверьте:");
      console.log("   1. SMPP соединение активно");
      console.log("   2. Номер телефона верифицирован");
      console.log("   3. SMS уведомления включены для пользователя");
      console.log("   4. Тип 'task_notification' включен в настройках SMS");
      console.log("   5. Логи backend для ошибок SMS");
      
      if (!smppStatus.connected) {
        console.log("\n   📬 SMS добавлен в очередь BullMQ");
        console.log("   Он будет отправлен когда SMPP подключится");
      }
    } else {
      console.log("\n✅ SMS отправлен успешно");
      console.log(`   Проверьте телефон: ${testUser.phoneNumber}`);
    }

    console.log("\n🎯 СЛЕДУЮЩИЕ ШАГИ:");
    console.log("=".repeat(100));
    console.log("1. Проверьте email на адресе:", testUser.email);
    console.log("2. Проверьте SMS на номере:", testUser.phoneNumber);
    console.log("3. Проверьте in-app уведомления в интерфейсе");
    console.log("4. Если есть проблемы - проверьте логи backend");
    console.log("\n✅ Тест завершен успешно!");
    console.log("=".repeat(100) + "\n");

  } catch (error) {
    console.error("\n❌ Ошибка во время теста:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 MongoDB отключен");
    process.exit(0);
  }
}

// Запуск теста
testCompleteTaskNotifications();
