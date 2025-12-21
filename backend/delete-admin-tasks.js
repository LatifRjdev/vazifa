/**
 * Delete All Tasks Created by admin@vazifa2.com
 * Удаление всех задач, созданных пользователем admin@vazifa2.com
 * 
 * Использование:
 * node delete-admin-tasks.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import models
import Task from './models/tasks.js';
import User from './models/users.js';
import Comment from './models/comments.js';
import Response from './models/responses.js';
import ActivityLog from './models/activity-logs.js';

const ADMIN_EMAIL = 'admin@vazifa2.com';

// Подключение к MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  }
}

// Главная функция удаления задач
async function deleteAdminTasks() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     🗑️  Удаление задач пользователя admin@vazifa2.com    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Найти пользователя admin@vazifa2.com
    console.log(`🔍 Поиск пользователя ${ADMIN_EMAIL}...`);
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
      console.log(`❌ Пользователь ${ADMIN_EMAIL} не найден в базе данных`);
      return;
    }

    console.log(`✅ Пользователь найден:`);
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Имя: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Роль: ${adminUser.role}`);

    // 2. Найти все задачи, созданные этим пользователем
    console.log(`\n🔍 Поиск задач, созданных пользователем ${ADMIN_EMAIL}...`);
    const tasks = await Task.find({ createdBy: adminUser._id }).sort({ createdAt: -1 });

    if (tasks.length === 0) {
      console.log(`✅ Задачи не найдены. База данных уже чистая.`);
      return;
    }

    console.log(`\n📊 Найдено задач: ${tasks.length}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3. Показать первые 10 задач для примера
    console.log('📋 Примеры задач для удаления (первые 10):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const displayTasks = tasks.slice(0, 10);
    displayTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}"`);
      console.log(`   ID: ${task._id}`);
      console.log(`   Статус: ${task.status}`);
      console.log(`   Приоритет: ${task.priority}`);
      console.log(`   Создана: ${task.createdAt.toLocaleString('ru-RU')}`);
      console.log(`   Комментарии: ${task.comments.length}`);
      console.log(`   Ответы: ${task.responses.length}`);
      console.log(`   Подзадачи: ${task.subtasks.length}`);
      console.log('');
    });

    if (tasks.length > 10) {
      console.log(`   ... и еще ${tasks.length - 10} задач(и)\n`);
    }

    // 4. Подсчитать связанные записи
    console.log('📊 Статистика связанных данных:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const taskIds = tasks.map(task => task._id);
    
    const commentsCount = await Comment.countDocuments({ task: { $in: taskIds } });
    const responsesCount = await Response.countDocuments({ task: { $in: taskIds } });
    const activityLogsCount = await ActivityLog.countDocuments({ resourceId: { $in: taskIds } });

    console.log(`   Задач для удаления:        ${tasks.length}`);
    console.log(`   Комментарии:               ${commentsCount}`);
    console.log(`   Ответы:                    ${responsesCount}`);
    console.log(`   Логи активности:           ${activityLogsCount}`);
    console.log('');

    const totalRecords = tasks.length + commentsCount + responsesCount + activityLogsCount;
    console.log(`   📦 Всего записей:          ${totalRecords}`);

    // 5. Начать удаление
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  Начинаем удаление...\n');

    let deletedTasks = 0;
    let deletedComments = 0;
    let deletedResponses = 0;
    let deletedLogs = 0;

    // Удаляем каждую задачу по отдельности, чтобы сработали pre-hooks
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Показываем прогресс каждые 10 задач
      if ((i + 1) % 10 === 0 || i === 0) {
        console.log(`   Удаление задачи ${i + 1}/${tasks.length}...`);
      }

      // Подсчитываем что будет удалено
      const taskComments = await Comment.countDocuments({ task: task._id });
      const taskResponses = await Response.countDocuments({ task: task._id });
      const taskLogs = await ActivityLog.countDocuments({ resourceId: task._id });

      // Удаляем задачу (pre-hook удалит связанные данные)
      await task.deleteOne();

      deletedTasks++;
      deletedComments += taskComments;
      deletedResponses += taskResponses;
      deletedLogs += taskLogs;
    }

    // 6. Итоговая статистика
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Удаление завершено успешно!\n');
    console.log('📊 Итоговая статистика:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   ✓ Удалено задач:           ${deletedTasks}`);
    console.log(`   ✓ Удалено комментариев:    ${deletedComments}`);
    console.log(`   ✓ Удалено ответов:         ${deletedResponses}`);
    console.log(`   ✓ Удалено логов:           ${deletedLogs}`);
    console.log('');
    console.log(`   🎯 Всего удалено записей:  ${deletedTasks + deletedComments + deletedResponses + deletedLogs}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Ошибка при удалении задач:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Запуск скрипта
async function main() {
  try {
    await connectDB();
    await deleteAdminTasks();
    
    await mongoose.connection.close();
    console.log('👋 Отключено от MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
