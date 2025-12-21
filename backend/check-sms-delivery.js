/**
 * Check SMS delivery details
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkDelivery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB подключен\n");

    const SMSLog = (await import("./models/sms-logs.js")).default;
    const User = (await import("./models/users.js")).default;

    // Get last 10 SMS logs with full details
    console.log("=".repeat(60));
    console.log("📱 ПОСЛЕДНИЕ 10 SMS ЛОГОВ (ПОЛНЫЕ ДАННЫЕ)");
    console.log("=".repeat(60));

    const logs = await SMSLog.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    for (const log of logs) {
      console.log(`\n📱 Номер: ${log.phoneNumber}`);
      console.log(`   Статус: ${log.status}`);
      console.log(`   Тип: ${log.type}`);
      console.log(`   Message ID: ${log.messageId || 'N/A'}`);
      console.log(`   Время: ${log.createdAt.toISOString()}`);
      console.log(`   Сообщение: ${log.message?.substring(0, 80)}...`);
      if (log.errorMessage) {
        console.log(`   ❌ Ошибка: ${log.errorMessage}`);
      }

      // Find user by phone
      const user = await User.findOne({ phoneNumber: log.phoneNumber });
      if (user) {
        console.log(`   👤 Пользователь: ${user.name} (${user.role})`);
      }
    }

    // Check which phone numbers are in the system
    console.log("\n" + "=".repeat(60));
    console.log("👥 ВСЕ ПОЛЬЗОВАТЕЛИ С ТЕЛЕФОНАМИ");
    console.log("=".repeat(60));

    const usersWithPhones = await User.find({
      phoneNumber: { $exists: true, $ne: null, $ne: "" }
    }).select("name phoneNumber role email");

    for (const user of usersWithPhones) {
      console.log(`\n   ${user.name}`);
      console.log(`   📱 ${user.phoneNumber}`);
      console.log(`   📧 ${user.email || 'N/A'}`);
      console.log(`   👤 ${user.role}`);
    }

    // Check the specific task assignees
    console.log("\n" + "=".repeat(60));
    console.log("📋 ПОСЛЕДНЯЯ ЗАДАЧА И ЕЁ ПОЛУЧАТЕЛИ");
    console.log("=".repeat(60));

    const Task = (await import("./models/tasks.js")).default;
    const lastTask = await Task.findOne({})
      .sort({ createdAt: -1 })
      .populate("assignees", "name phoneNumber email")
      .populate("createdBy", "name phoneNumber email")
      .populate("responsibleManager", "name phoneNumber email");

    if (lastTask) {
      console.log(`\n📋 Задача: ${lastTask.title}`);
      console.log(`   Создана: ${lastTask.createdAt.toISOString()}`);
      console.log(`\n   Создатель: ${lastTask.createdBy?.name}`);
      console.log(`   📱 ${lastTask.createdBy?.phoneNumber || 'Нет телефона'}`);

      console.log(`\n   Исполнители:`);
      for (const assignee of lastTask.assignees) {
        const isSameAsCreator = assignee._id.toString() === lastTask.createdBy?._id?.toString();
        console.log(`   - ${assignee.name} ${isSameAsCreator ? '(создатель - НЕ уведомляется)' : ''}`);
        console.log(`     📱 ${assignee.phoneNumber || 'Нет телефона'}`);
      }

      if (lastTask.responsibleManager) {
        console.log(`\n   Ответственный менеджер: ${lastTask.responsibleManager.name}`);
        console.log(`   📱 ${lastTask.responsibleManager.phoneNumber || 'Нет телефона'}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("❓ ВОПРОСЫ ДЛЯ ДИАГНОСТИКИ:");
    console.log("=".repeat(60));
    console.log(`
1. Какой у вас номер телефона?
2. Вы были в списке исполнителей задачи?
3. Через какой скрипт отправляли SMS, и на какой номер?
4. Тот SMS дошёл?
`);

  } catch (err) {
    console.error("❌ Ошибка:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkDelivery();
