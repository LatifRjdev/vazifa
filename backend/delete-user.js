/**
 * Universal User Deletion Script
 * Универсальное удаление пользователя по email или телефону
 * 
 * Использование:
 * node delete-user.js admin@vazifa2.com
 * node delete-user.js +992985343331
 * node delete-user.js admin@vazifa2.com --yes  (без подтверждения)
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
import './models/users.js';
import './models/tasks.js';
import './models/comments.js';
import './models/notifications.js';
import './models/phone-verification.js';
import './models/activity-logs.js';
import './models/workspace.js';
import './models/responses.js';

const User = mongoose.model('User');
const Task = mongoose.model('Task');
const Comment = mongoose.model('Comment');
const Notification = mongoose.model('Notification');
const PhoneVerification = mongoose.model('PhoneVerification');
const ActivityLog = mongoose.model('ActivityLog');
const Workspace = mongoose.model('Workspace');
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
    // Поиск по email
    user = await User.findOne({ email: identifier.toLowerCase() });
  } else {
    // Поиск по телефону
    user = await User.findOne({ phoneNumber: identifier });
  }
  
  return user;
}

// Подсчет связанных данных
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
    responses,
    total: createdTasks + assignedTasks + comments + notifications + activityLogs + responses
  };
}

// Удаление пользователя и всех связанных данных
async function deleteUser(identifier, skipConfirmation = false) {
  try {
    console.log(`\n🔍 Поиск пользователя: ${identifier}...`);
    
    const user = await findUser(identifier);
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    // Показать информацию о пользователе
    console.log('\n📋 Найден пользователь:');
    console.log('════════════════════════════════════════════════════');
    console.log(`👤 Имя:           ${user.name}`);
    console.log(`📧 Email:         ${user.email || 'не указан'}`);
    console.log(`📱 Телефон:       ${user.phoneNumber || 'не указан'}`);
    console.log(`🔐 Роль:          ${user.role}`);
    console.log(`✅ Верифицирован: ${user.isEmailVerified || user.isPhoneVerified ? 'Да' : 'Нет'}`);
    console.log(`📅 Создан:        ${user.createdAt.toLocaleString('ru-RU')}`);
    
    // Подсчитать связанные данные
    console.log('\n🔍 Подсчет связанных данных...');
    const relatedData = await countRelatedData(user._id);
    
    console.log('\n📊 Связанные данные:');
    console.log('════════════════════════════════════════════════════');
    console.log(`📝 Созданные задачи:      ${relatedData.createdTasks}`);
    console.log(`👷 Назначенные задачи:    ${relatedData.assignedTasks}`);
    console.log(`💬 Комментарии:           ${relatedData.comments}`);
    console.log(`🔔 Уведомления:           ${relatedData.notifications}`);
    console.log(`📋 Логи активности:       ${relatedData.activityLogs}`);
    console.log(`📄 Ответы на задачи:      ${relatedData.responses}`);
    console.log('────────────────────────────────────────────────────');
    console.log(`🔢 Всего записей:         ${relatedData.total}`);
    
    // Запрос подтверждения
    if (!skipConfirmation) {
      console.log('\n⚠️  ВНИМАНИЕ: Это действие необратимо!');
      console.log('   Все данные пользователя будут удалены безвозвратно.\n');
      
      const confirmed = await askConfirmation('Вы уверены, что хотите удалить этого пользователя? (y/n): ');
      
      if (!confirmed) {
        console.log('\n❌ Удаление отменено');
        return;
      }
    }
    
    // Удаление всех связанных данных
    console.log('\n🗑️  Удаление данных...\n');
    
    const deletionStats = {
      phoneVerifications: 0,
      createdTasks: 0,
      assignedTasksUpdated: 0,
      comments: 0,
      notifications: 0,
      activityLogs: 0,
      responses: 0,
      workspacesUpdated: 0
    };
    
    // 1. Удалить записи верификации
    if (user.phoneNumber) {
      const verificationResult = await PhoneVerification.deleteMany({ phoneNumber: user.phoneNumber });
      deletionStats.phoneVerifications = verificationResult.deletedCount;
      console.log(`✓ Удалено ${deletionStats.phoneVerifications} записей верификации`);
    }
    
    // 2. Удалить созданные задачи
    const createdTasksResult = await Task.deleteMany({ createdBy: user._id });
    deletionStats.createdTasks = createdTasksResult.deletedCount;
    console.log(`✓ Удалено ${deletionStats.createdTasks} созданных задач`);
    
    // 3. Убрать пользователя из назначенных задач
    const assignedTasksResult = await Task.updateMany(
      { assignedTo: user._id },
      { $unset: { assignedTo: 1 } }
    );
    deletionStats.assignedTasksUpdated = assignedTasksResult.modifiedCount;
    console.log(`✓ Обновлено ${deletionStats.assignedTasksUpdated} назначенных задач`);
    
    // 4. Удалить комментарии
    const commentsResult = await Comment.deleteMany({ user: user._id });
    deletionStats.comments = commentsResult.deletedCount;
    console.log(`✓ Удалено ${deletionStats.comments} комментариев`);
    
    // 5. Удалить уведомления
    const notificationsResult = await Notification.deleteMany({ user: user._id });
    deletionStats.notifications = notificationsResult.deletedCount;
    console.log(`✓ Удалено ${deletionStats.notifications} уведомлений`);
    
    // 6. Удалить логи активности
    const activityLogsResult = await ActivityLog.deleteMany({ user: user._id });
    deletionStats.activityLogs = activityLogsResult.deletedCount;
    console.log(`✓ Удалено ${deletionStats.activityLogs} логов активности`);
    
    // 7. Удалить ответы на задачи
    const responsesResult = await Response.deleteMany({ submittedBy: user._id });
    deletionStats.responses = responsesResult.deletedCount;
    console.log(`✓ Удалено ${deletionStats.responses} ответов на задачи`);
    
    // 8. Удалить из workspaces
    const workspacesResult = await Workspace.updateMany(
      { 
        $or: [
          { owner: user._id },
          { 'members.user': user._id }
        ]
      },
      { 
        $pull: { members: { user: user._id } } 
      }
    );
    deletionStats.workspacesUpdated = workspacesResult.modifiedCount;
    console.log(`✓ Обновлено ${deletionStats.workspacesUpdated} workspace`);
    
    // 9. Удалить самого пользователя
    await User.deleteOne({ _id: user._id });
    console.log('✓ Удален пользователь');
    
    // Итоги
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ ПОЛЬЗОВАТЕЛЬ УСПЕШНО УДАЛЕН');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📊 Статистика удаления:');
    console.log(`   • Записи верификации:     ${deletionStats.phoneVerifications}`);
    console.log(`   • Созданные задачи:       ${deletionStats.createdTasks}`);
    console.log(`   • Назначенные задачи:     ${deletionStats.assignedTasksUpdated} (обновлено)`);
    console.log(`   • Комментарии:            ${deletionStats.comments}`);
    console.log(`   • Уведомления:            ${deletionStats.notifications}`);
    console.log(`   • Логи активности:        ${deletionStats.activityLogs}`);
    console.log(`   • Ответы на задачи:       ${deletionStats.responses}`);
    console.log(`   • Workspace:              ${deletionStats.workspacesUpdated} (обновлено)`);
    
    const totalDeleted = 
      deletionStats.phoneVerifications +
      deletionStats.createdTasks +
      deletionStats.comments +
      deletionStats.notifications +
      deletionStats.activityLogs +
      deletionStats.responses;
    
    console.log(`\n🔢 Всего удалено записей:  ${totalDeleted}`);
    
    if (user.email) {
      console.log(`\n✉️  Email ${user.email} теперь доступен для регистрации`);
    }
    if (user.phoneNumber) {
      console.log(`📱 Телефон ${user.phoneNumber} теперь доступен для регистрации`);
    }
    
  } catch (error) {
    console.error('\n❌ Ошибка при удалении:', error.message);
    console.error(error.stack);
  }
}

// Показать help
function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       🗑️  Universal User Deletion Script                ║
║       Универсальное удаление пользователя                ║
╚══════════════════════════════════════════════════════════╝

📋 ИСПОЛЬЗОВАНИЕ:

  node delete-user.js <email|телефон> [--yes]

🎯 ПРИМЕРЫ:

  # Удаление по email (с подтверждением)
  node delete-user.js admin@vazifa2.com
  
  # Удаление по телефону (с подтверждением)
  node delete-user.js +992985343331
  
  # Удаление без подтверждения (автоматическое)
  node delete-user.js admin@vazifa2.com --yes
  
  # Показать помощь
  node delete-user.js --help

⚠️  ЧТО БУДЕТ УДАЛЕНО:

  ✓ Сам пользователь
  ✓ Все созданные им задачи
  ✓ Привязка к назначенным задачам (задачи остаются)
  ✓ Все комментарии пользователя
  ✓ Все уведомления пользователя
  ✓ Логи активности
  ✓ Ответы на задачи
  ✓ Записи верификации
  ✓ Membership в workspace

💡 ВАЖНО:

  • Действие необратимо!
  • Email/телефон станут доступны для новой регистрации
  • Задачи, назначенные пользователю, останутся без исполнителя
  • Используйте --yes только если уверены!

`);
}

// Функция для запроса email/телефона
function askUserIdentifier() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       🗑️  Удаление пользователя                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    rl.question('📧 Введите email или 📱 номер телефона пользователя: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main функция
async function main() {
  const args = process.argv.slice(2);
  
  // Показать help
  if (args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  let identifier;
  let skipConfirmation = args.includes('--yes') || args.includes('-y');
  
  // Если параметр не передан - спросить интерактивно
  if (args.length === 0 || args[0] === '--yes' || args[0] === '-y') {
    identifier = await askUserIdentifier();
    
    if (!identifier) {
      console.log('❌ Email или телефон не указан');
      process.exit(1);
    }
  } else {
    identifier = args[0];
  }
  
  await connectDB();
  
  await deleteUser(identifier, skipConfirmation);
  
  await mongoose.connection.close();
  console.log('\n👋 Отключено от MongoDB\n');
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
