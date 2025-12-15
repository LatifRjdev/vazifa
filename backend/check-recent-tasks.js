import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "./models/tasks.js";
import User from "./models/users.js";

dotenv.config();

async function checkRecentTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");
    
    // Найти последние задачи
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name phoneNumber _id')
      .populate('assignees', 'name phoneNumber _id');
    
    console.log(`📋 Последние ${tasks.length} задач:\n`);
    console.log("=".repeat(80));
    
    tasks.forEach((task, i) => {
      console.log(`\n${i+1}. "${task.title}"`);
      console.log(`   Создана: ${task.createdAt.toLocaleString('ru-RU')}`);
      console.log(`   Создатель: ${task.createdBy?.name || 'unknown'} (${task.createdBy?.phoneNumber || 'нет телефона'})`);
      console.log(`   ID создателя: ${task.createdBy?._id}`);
      
      console.log(`   Исполнители (${task.assignees.length}):`);
      task.assignees.forEach((assignee, j) => {
        const isSameAsCreator = task.createdBy && assignee._id.toString() === task.createdBy._id.toString();
        const sameMarker = isSameAsCreator ? " ⚠️ СОЗДАТЕЛЬ = ИСПОЛНИТЕЛЬ" : "";
        console.log(`     ${j+1}. ${assignee.name} (${assignee.phoneNumber})${sameMarker}`);
        console.log(`        ID: ${assignee._id}`);
      });
      
      console.log("   " + "-".repeat(70));
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("\n💡 ВАЖНО: SMS уведомление НЕ отправляется если создатель = исполнитель!");
    console.log("   Это сделано чтобы не спамить самого себя.\n");
    
    await mongoose.disconnect();
    console.log("👋 Отключено от MongoDB\n");
    
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

checkRecentTasks();
