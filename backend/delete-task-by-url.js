/**
 * Delete Task by URL or ID
 * Удаление задачи по URL или ID
 * 
 * Использование:
 * node delete-task-by-url.js /dashboard/task/507f1f77bcf86cd799439011
 * node delete-task-by-url.js 507f1f77bcf86cd799439011
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

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

// Функция для создания интерфейса readline
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Функция для получения подтверждения от пользователя
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'да');
    });
  });
}

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

// Извлечь ID задачи из URL или использовать прямой ID
function extractTaskId(input) {
  if (!input) {
    return null;
  }

  // Если это URL, извлечь ID
  const urlPattern = /\/dashboard\/task\/([a-f0-9]{24})/i;
  const urlMatch = input.match(urlPattern);
  
  if (urlMatch) {
    return urlMatch[1];
  }

  // Если это просто ID (24 символа hex)
  const idPattern = /^[a-f0-9]{24}$/i;
  if (idPattern.test(input)) {
    return input;
  }

  return null;
}

// Проверить, является ли строка валидным MongoDB ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Главная функция удаления задачи
async function deleteTaskByUrl() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          🗑️  Удаление задачи по URL или ID                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Получить аргумент командной строки
    const input = process.argv[2];

    if (!input) {
      console.log('❌ Ошибка: Не указан URL или ID задачи\n');
      console.log('Использование:');
      console.log('  node delete-task-by-url.js /dashboard/task/507f1f77bcf86cd799439011');
      console.log('  node delete-task-by-url.js 507f1f77bcf86cd799439011\n');
      process.exit(1);
    }

    // Извлечь ID задачи
    const taskId = extractTaskId(input);

    if (!taskId) {
      console.log('❌ Ошибка: Не удалось извлечь ID задачи из входных данных\n');
      console.log('Входные данные должны быть в формате:');
      console.log('  - URL: /dashboard/task/507f1f77bcf86cd799439011');
      console.log('  - ID: 507f1f77bcf86cd799439011\n');
      process.exit(1);
    }

    // Проверить валидность ObjectId
    if (!isValidObjectId(taskId)) {
      console.log(`❌ Ошибка: "${taskId}" не является валидным MongoDB ObjectId\n`);
      process.exit(1);
    }

    console.log(`🔍 Извлечен ID задачи: ${taskId}\n`);

    // 1. Найти задачу
    console.log('🔍 Поиск задачи в базе данных...');
    const task = await Task.findById(taskId)
      .populate('createdBy', 'name email role')
      .populate('assignees', 'name email')
      .populate('responsibleManager', 'name email');

    if (!task) {
      console.log(`\n❌ Задача с ID "${taskId}" не найдена в базе данных\n`);
      process.exit(1);
    }

    console.log('✅ Задача найдена!\n');

    // 2. Показать информацию о задаче
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ИНФОРМАЦИЯ О ЗАДАЧЕ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📌 Название:           ${task.title}`);
    console.log(`📝 Описание:           ${task.description ? task.description.substring(0, 100) + (task.description.length > 100 ? '...' : '') : 'Нет описания'}`);
    console.log(`📊 Статус:             ${task.status}`);
    console.log(`⚡ Приоритет:          ${task.priority}`);
    console.log(`🏷️  Архивирована:      ${task.isArchived ? 'Да' : 'Нет'}`);
    console.log(`⭐ Важная:             ${task.isImportant ? 'Да' : 'Нет'}`);
    
    if (task.createdBy) {
      console.log(`\n👤 Создатель:`);
      console.log(`   Имя:                ${task.createdBy.name}`);
      console.log(`   Email:              ${task.createdBy.email}`);
      console.log(`   Роль:               ${task.createdBy.role}`);
    }

    if (task.assignees && task.assignees.length > 0) {
      console.log(`\n👥 Исполнители (${task.assignees.length}):`);
      task.assignees.forEach((assignee, index) => {
        console.log(`   ${index + 1}. ${assignee.name} (${assignee.email})`);
      });
    } else {
      console.log(`\n👥 Исполнители:        Не назначены`);
    }

    if (task.responsibleManager) {
      console.log(`\n👔 Ответственный менеджер:`);
      console.log(`   Имя:                ${task.responsibleManager.name}`);
      console.log(`   Email:              ${task.responsibleManager.email}`);
    }

    console.log(`\n📅 Создана:            ${task.createdAt.toLocaleString('ru-RU')}`);
    console.log(`📅 Обновлена:          ${task.updatedAt.toLocaleString('ru-RU')}`);
    
    if (task.dueDate) {
      console.log(`📅 Срок выполнения:    ${new Date(task.dueDate).toLocaleString('ru-RU')}`);
    }
    
    if (task.completedAt) {
      console.log(`✅ Завершена:          ${task.completedAt.toLocaleString('ru-RU')}`);
    }

    // 3. Подсчитать связанные записи
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 СВЯЗАННЫЕ ДАННЫЕ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const commentsCount = await Comment.countDocuments({ task: taskId });
    const responsesCount = await Response.countDocuments({ task: taskId });
    const activityLogsCount = await ActivityLog.countDocuments({ resourceId: taskId });
    const subtasksCount = task.subtasks ? task.subtasks.length : 0;
    const attachmentsCount = task.attachments ? task.attachments.length : 0;

    console.log(`💬 Комментарии:        ${commentsCount}`);
    console.log(`📨 Ответы:             ${responsesCount}`);
    console.log(`📝 Логи активности:    ${activityLogsCount}`);
    console.log(`✓  Подзадачи:          ${subtasksCount}`);
    console.log(`📎 Вложения:           ${attachmentsCount}`);

    const totalRecords = 1 + commentsCount + responsesCount + activityLogsCount;
    console.log(`\n📦 ВСЕГО записей:      ${totalRecords}`);

    // 4. Запросить подтверждение
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  ПРЕДУПРЕЖДЕНИЕ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`❗ Эта операция удалит задачу и ВСЕ связанные данные!`);
    console.log(`❗ Это действие НЕОБРАТИМО!\n`);

    const confirmed = await askConfirmation('Вы уверены, что хотите удалить эту задачу? (y/N): ');

    if (!confirmed) {
      console.log('\n❌ Отменено пользователем. Задача НЕ была удалена.\n');
      process.exit(0);
    }

    // 5. Начать удаление
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  УДАЛЕНИЕ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Удаление задачи и связанных данных...\n');

    // Удаляем задачу (pre-hook автоматически удалит связанные данные)
    await task.deleteOne();

    // 6. Итоговая статистика
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ УДАЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Итоговая статистика:\n');
    console.log(`   ✓ Удалена задача:          1`);
    console.log(`   ✓ Удалено комментариев:    ${commentsCount}`);
    console.log(`   ✓ Удалено ответов:         ${responsesCount}`);
    console.log(`   ✓ Удалено логов:           ${activityLogsCount}`);
    console.log('');
    console.log(`   🎯 Всего удалено записей:  ${totalRecords}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Ошибка при удалении задачи:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Запуск скрипта
async function main() {
  try {
    await connectDB();
    await deleteTaskByUrl();
    
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
