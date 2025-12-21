/**
 * Bulk User Deletion Script
 * Массовое удаление пользователей по списку email или телефонов
 * 
 * Использование:
 * node delete-multiple-users.js user1@mail.com +992901234567 user2@mail.com
 * node delete-multiple-users.js --file users.txt
 * node delete-multiple-users.js user1@mail.com user2@mail.com --yes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import models
import './models/users.js';
import './models/tasks.js';
import './models/comments.js';
import './models/notifications.js';
import './models/activity-logs.js';
import './models/responses.js';

const User = mongoose.model('User');
const Task = mongoose.model('Task');
const Comment = mongoose.model('Comment');
const Notification = mongoose.model('Notification');
const ActivityLog = mongoose.model('ActivityLog');
const Response = mongoose.model('Response');

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

// Функция для запроса подтверждения
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'да');
    });
  });
}

// Поиск пользователя по email или телефону
async function findUser(identifier) {
  let user;
  
  // Проверяем, это email или телефон
  if (identifier.includes('@')) {
    user = await User.findOne({ email: identifier.toLowerCase() });
  } else {
    user = await User.findOne({ phoneNumber: identifier });
  }
  
  return user;
}

// Подсчет связанных данных для одного пользователя
async function countRelatedData(userId) {
  const [
    createdTasks,
    assignedTasks,
    comments,
    notifications,
    activityLogs,
    responses
  ] = await Promise.all([
    Task.countDocuments({ createdBy: userId }),
    Task.countDocuments({ assignedTo: userId }),
    Comment.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId }),
    ActivityLog.countDocuments({ user: userId }),
    Response.countDocuments({ submittedBy: userId })
  ]);

  return {
    createdTasks,
    assignedTasks,
    comments,
    notifications,
    activityLogs,
    responses
  };
}

// Удаление одного пользователя (без вывода - тихое удаление)
async function deleteUserSilent(user) {
  const stats = {
    user: {
      name: user.name,
      email: user.email || '',
      phone: user.phoneNumber || '',
      role: user.role
    },
    deleted: {
      createdTasks: 0,
      assignedTasksUpdated: 0,
      comments: 0,
      notifications: 0,
      activityLogs: 0,
      responses: 0
    }
  };
  
  try {
    // Удалить созданные задачи
    const createdTasksResult = await Task.deleteMany({ createdBy: user._id });
    stats.deleted.createdTasks = createdTasksResult.deletedCount;
    
    // Убрать из назначенных задач
    const assignedTasksResult = await Task.updateMany(
      { assignedTo: user._id },
      { $unset: { assignedTo: 1 } }
    );
    stats.deleted.assignedTasksUpdated = assignedTasksResult.modifiedCount;
    
    // Удалить комментарии
    const commentsResult = await Comment.deleteMany({ user: user._id });
    stats.deleted.comments = commentsResult.deletedCount;
    
    // Удалить уведомления
    const notificationsResult = await Notification.deleteMany({ user: user._id });
    stats.deleted.notifications = notificationsResult.deletedCount;
    
    // Удалить логи активности
    const activityLogsResult = await ActivityLog.deleteMany({ user: user._id });
    stats.deleted.activityLogs = activityLogsResult.deletedCount;
    
    // Удалить ответы на задачи
    const responsesResult = await Response.deleteMany({ submittedBy: user._id });
    stats.deleted.responses = responsesResult.deletedCount;
    
    // Удалить самого пользователя
    await User.deleteOne({ _id: user._id });
    
    stats.success = true;
    return stats;
    
  } catch (error) {
    stats.success = false;
    stats.error = error.message;
    return stats;
  }
}

// Загрузить идентификаторы из файла
function loadFromFile(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf-8');
    const identifiers = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Игнорируем пустые строки и комментарии
    
    return identifiers;
  } catch (error) {
    console.error(`❌ Ошибка чтения файла ${filename}:`, error.message);
    process.exit(1);
  }
}

// Показать help
function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       🗑️  Bulk User Deletion Script                     ║
║       Массовое удаление пользователей                    ║
╚══════════════════════════════════════════════════════════╝

📋 ИСПОЛЬЗОВАНИЕ:

  # Удалить список пользователей
  node delete-multiple-users.js <email1|тел1> <email2|тел2> ... [--yes]
  
  # Удалить из файла
  node delete-multiple-users.js --file <filename> [--yes]

🎯 ПРИМЕРЫ:

  # Удалить нескольких пользователей (с подтверждением)
  node delete-multiple-users.js user1@mail.com +992901234567 user2@mail.com
  
  # Удалить из файла (с подтверждением)
  node delete-multiple-users.js --file users.txt
  
  # Удалить без подтверждения
  node delete-multiple-users.js user1@mail.com user2@mail.com --yes
  
  # Показать помощь
  node delete-multiple-users.js --help

📄 ФОРМАТ ФАЙЛА (users.txt):

  user1@mail.com
  +992901234567
  user2@mail.com
  # Это комментарий - игнорируется
  +992907654321

⚠️  ЧТО БУДЕТ УДАЛЕНО (для каждого пользователя):

  ✓ Сам пользователь
  ✓ Все созданные задачи
  ✓ Привязка к назначенным задачам
  ✓ Все комментарии
  ✓ Все уведомления
  ✓ Логи активности
  ✓ Ответы на задачи

💡 ВАЖНО:

  • Действие необратимо!
  • Скрипт сначала найдет всех пользователей
  • Покажет список найденных пользователей
  • Запросит подтверждение (если не указан --yes)
  • Удалит всех пользователей из списка
  • Покажет общую статистику

`);
}

// Главная функция массового удаления
async function deleteMultipleUsers(identifiers, skipConfirmation = false) {
  console.log(`\n🔍 Поиск ${identifiers.length} пользователей...\n`);
  
  // 1. Найти всех пользователей
  const foundUsers = [];
  const notFoundIdentifiers = [];
  
  for (const identifier of identifiers) {
    const user = await findUser(identifier);
    if (user) {
      const relatedData = await countRelatedData(user._id);
      foundUsers.push({ user, relatedData, identifier });
    } else {
      notFoundIdentifiers.push(identifier);
    }
  }
  
  // 2. Показать результаты поиска
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Найдено пользователей: ${foundUsers.length}`);
  console.log(`❌ Не найдено: ${notFoundIdentifiers.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (notFoundIdentifiers.length > 0) {
    console.log('❌ Не найдены следующие пользователи:');
    notFoundIdentifiers.forEach(id => console.log(`   • ${id}`));
    console.log('');
  }
  
  if (foundUsers.length === 0) {
    console.log('❌ Нет пользователей для удаления');
    return;
  }
  
  // 3. Показать список найденных пользователей
  console.log('📋 Список пользователей для удаления:\n');
  
  let totalData = {
    createdTasks: 0,
    assignedTasks: 0,
    comments: 0,
    notifications: 0,
    activityLogs: 0,
    responses: 0
  };
  
  foundUsers.forEach((item, index) => {
    const { user, relatedData } = item;
    console.log(`${index + 1}. ${user.name} (${user.role})`);
    console.log(`   📧 Email: ${user.email || 'не указан'}`);
    console.log(`   📱 Телефон: ${user.phoneNumber || 'не указан'}`);
    console.log(`   📊 Данные: ${relatedData.createdTasks} задач, ${relatedData.comments} комментариев`);
    console.log('');
    
    totalData.createdTasks += relatedData.createdTasks;
    totalData.assignedTasks += relatedData.assignedTasks;
    totalData.comments += relatedData.comments;
    totalData.notifications += relatedData.notifications;
    totalData.activityLogs += relatedData.activityLogs;
    totalData.responses += relatedData.responses;
  });
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 ОБЩАЯ СТАТИСТИКА:');
  console.log(`   • Пользователей: ${foundUsers.length}`);
  console.log(`   • Созданных задач: ${totalData.createdTasks}`);
  console.log(`   • Назначенных задач: ${totalData.assignedTasks}`);
  console.log(`   • Комментариев: ${totalData.comments}`);
  console.log(`   • Уведомлений: ${totalData.notifications}`);
  console.log(`   • Логов активности: ${totalData.activityLogs}`);
  console.log(`   • Ответов на задачи: ${totalData.responses}`);
  
  const totalRecords = 
    totalData.createdTasks +
    totalData.comments +
    totalData.notifications +
    totalData.activityLogs +
    totalData.responses;
  
  console.log(`   • Всего записей: ${totalRecords}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // 4. Запрос подтверждения
  if (!skipConfirmation) {
    console.log('⚠️  ВНИМАНИЕ: Это действие необратимо!');
    console.log('   Все данные будут удалены безвозвратно.\n');
    
    const confirmed = await askConfirmation(`Вы уверены, что хотите удалить ${foundUsers.length} пользователей? (y/n): `);
    
    if (!confirmed) {
      console.log('\n❌ Удаление отменено');
      return;
    }
  }
  
  // 5. Удаление пользователей
  console.log('\n🗑️  Удаление пользователей...\n');
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < foundUsers.length; i++) {
    const { user, identifier } = foundUsers[i];
    process.stdout.write(`[${i + 1}/${foundUsers.length}] ${user.name}... `);
    
    const result = await deleteUserSilent(user);
    results.push(result);
    
    if (result.success) {
      console.log('✓');
      successCount++;
    } else {
      console.log(`✗ (${result.error})`);
      failCount++;
    }
  }
  
  // 6. Финальная статистика
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ УДАЛЕНИЕ ЗАВЕРШЕНО');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Результаты:`);
  console.log(`   ✅ Успешно удалено: ${successCount}`);
  if (failCount > 0) {
    console.log(`   ❌ Ошибок: ${failCount}`);
  }
  console.log('');
  
  // Подсчет общей статистики удаления
  const totalStats = {
    createdTasks: 0,
    assignedTasksUpdated: 0,
    comments: 0,
    notifications: 0,
    activityLogs: 0,
    responses: 0
  };
  
  results.forEach(result => {
    if (result.success) {
      totalStats.createdTasks += result.deleted.createdTasks;
      totalStats.assignedTasksUpdated += result.deleted.assignedTasksUpdated;
      totalStats.comments += result.deleted.comments;
      totalStats.notifications += result.deleted.notifications;
      totalStats.activityLogs += result.deleted.activityLogs;
      totalStats.responses += result.deleted.responses;
    }
  });
  
  console.log('📈 Удалено данных:');
  console.log(`   • Созданных задач: ${totalStats.createdTasks}`);
  console.log(`   • Назначенных задач: ${totalStats.assignedTasksUpdated} (обновлено)`);
  console.log(`   • Комментариев: ${totalStats.comments}`);
  console.log(`   • Уведомлений: ${totalStats.notifications}`);
  console.log(`   • Логов активности: ${totalStats.activityLogs}`);
  console.log(`   • Ответов на задачи: ${totalStats.responses}`);
  
  const totalDeleted = 
    totalStats.createdTasks +
    totalStats.comments +
    totalStats.notifications +
    totalStats.activityLogs +
    totalStats.responses;
  
  console.log(`\n🔢 Всего удалено записей: ${totalDeleted}`);
  console.log(`👥 Всего удалено пользователей: ${successCount}`);
  console.log('');
}

// Main функция
async function main() {
  const args = process.argv.slice(2);
  
  // Показать help
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  let identifiers = [];
  let skipConfirmation = args.includes('--yes') || args.includes('-y');
  
  // Загрузка из файла
  if (args[0] === '--file' || args[0] === '-f') {
    if (!args[1]) {
      console.error('❌ Ошибка: не указан файл');
      console.log('Использование: node delete-multiple-users.js --file users.txt');
      process.exit(1);
    }
    
    identifiers = loadFromFile(args[1]);
    console.log(`📄 Загружено ${identifiers.length} идентификаторов из файла ${args[1]}`);
  } else {
    // Загрузка из аргументов командной строки
    identifiers = args.filter(arg => !arg.startsWith('--') && arg !== '-y');
    
    if (identifiers.length === 0) {
      console.error('❌ Ошибка: не указаны пользователи для удаления');
      console.log('Использование: node delete-multiple-users.js user1@mail.com user2@mail.com');
      console.log('Или: node delete-multiple-users.js --file users.txt');
      process.exit(1);
    }
  }
  
  await connectDB();
  
  await deleteMultipleUsers(identifiers, skipConfirmation);
  
  await mongoose.connection.close();
  console.log('👋 Отключено от MongoDB\n');
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
