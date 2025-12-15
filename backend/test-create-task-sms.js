import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";
import Task from "./models/tasks.js";
import { sendNotification } from "./libs/send-notification.js";

dotenv.config();

console.log("================================================================================");
console.log("🧪 ТЕСТ СОЗДАНИЯ ЗАДАЧИ С ОТПРАВКОЙ SMS");
console.log("================================================================================");

async function testCreateTaskSMS() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Find test users with verified phones and SMS enabled
    const testUsers = await User.find({
      phoneNumber: { $exists: true, $ne: null, $ne: "" },
      isPhoneVerified: true,
      'settings.smsNotifications': true
    }).limit(2);

    if (testUsers.length === 0) {
      console.log("❌ Нет пользователей с настроенными SMS для теста");
      console.log("\n💡 Запустите сначала:");
      console.log("   node fix-task-sms-settings.js\n");
      await mongoose.disconnect();
      return;
    }

    console.log(`📱 Найдено ${testUsers.length} пользователей для теста:\n`);
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Телефон: ${user.phoneNumber}`);
      console.log(`   canReceiveSMS(): ${user.canReceiveSMS()}`);
      console.log(`   task_notification enabled: ${user.isSMSNotificationEnabled('task_notification')}`);
      console.log();
    });

    // Get the first user as creator (должен быть админ или менеджер)
    let creator = testUsers.find(u => ['admin', 'super_admin', 'manager'].includes(u.role));
    
    if (!creator) {
      // If no admin/manager found, temporarily promote first user
      creator = testUsers[0];
      console.log(`⚠️  Нет админа/менеджера, временно повышаем права ${creator.name}\n`);
      creator.role = 'manager';
      await creator.save();
    }

    // Get assignee (other user or same user)
    const assignee = testUsers.length > 1 ? testUsers[1] : testUsers[0];

    console.log("=".repeat(80));
    console.log("📋 СОЗДАНИЕ ТЕСТОВОЙ ЗАДАЧИ");
    console.log("=".repeat(80));
    console.log(`Создатель: ${creator.name} (${creator.role})`);
    console.log(`Исполнитель: ${assignee.name}`);
    console.log(`Телефон исполнителя: ${assignee.phoneNumber}\n`);

    // Create test task
    const testTaskTitle = `Тестовая задача SMS ${new Date().toLocaleTimeString('ru-RU')}`;
    const testTask = await Task.create({
      title: testTaskTitle,
      description: "Это тестовая задача для проверки SMS уведомлений при создании задачи",
      status: "To Do",
      priority: "High",
      assignees: [assignee._id],
      createdBy: creator._id,
      createdAt: new Date(),
    });

    console.log(`✅ Задача создана: ${testTask.title}`);
    console.log(`   ID: ${testTask._id}\n`);

    // Send notification (как в реальном createTask controller)
    if (assignee._id.toString() !== creator._id.toString()) {
      console.log("=".repeat(80));
      console.log("📤 ОТПРАВКА УВЕДОМЛЕНИЯ");
      console.log("=".repeat(80));
      console.log(`Получатель: ${assignee.name}`);
      console.log(`Телефон: ${assignee.phoneNumber}`);
      console.log(`Email: ${assignee.email || 'не указан'}\n`);

      const result = await sendNotification({
        recipientId: assignee._id,
        type: "task_assigned",
        title: "Вам назначена новая задача",
        message: `${creator.name} назначил вам задачу: ${testTaskTitle}`,
        relatedData: {
          taskId: testTask._id,
          actorId: creator._id,
        },
      });

      console.log("📊 Результат отправки:");
      console.log(`   In-app notification: ${result.results.notification ? '✅' : '❌'}`);
      console.log(`   Email: ${result.results.email ? '✅' : '❌'}`);
      console.log(`   SMS: ${result.results.sms ? '✅' : '❌'}`);

      if (result.results.sms) {
        console.log("\n✅ SMS УВЕДОМЛЕНИЕ ОТПРАВЛЕНО УСПЕШНО!");
        console.log(`📱 Проверьте телефон ${assignee.phoneNumber}`);
        console.log(`   Ожидается сообщение: "📋 Новая задача: ${creator.name} назначил вам задачу: ${testTaskTitle}"`);
      } else {
        console.log("\n❌ SMS НЕ ОТПРАВЛЕНО");
        console.log("\n🔍 Возможные причины:");
        console.log(`   - canReceiveSMS(): ${assignee.canReceiveSMS()}`);
        console.log(`   - isPhoneVerified: ${assignee.isPhoneVerified}`);
        console.log(`   - smsNotifications: ${assignee.settings.smsNotifications}`);
        console.log(`   - task_notification enabled: ${assignee.isSMSNotificationEnabled('task_notification')}`);
      }
    } else {
      console.log("ℹ️  Создатель и исполнитель - один и тот же пользователь");
      console.log("   Уведомление не отправляется");
    }

    console.log("\n" + "=".repeat(80));
    console.log("🧹 ОЧИСТКА");
    console.log("=".repeat(80));
    
    // Clean up - delete test task
    await Task.findByIdAndDelete(testTask._id);
    console.log("✅ Тестовая задача удалена");

    console.log("\n" + "=".repeat(80));
    console.log("✅ ТЕСТ ЗАВЕРШЕН");
    console.log("=".repeat(80));
    console.log("\n");

    await mongoose.disconnect();
    console.log("👋 Отключено от MongoDB\n");

  } catch (error) {
    console.error("\n❌ Ошибка при тестировании:", error);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testCreateTaskSMS();
