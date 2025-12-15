/**
 * User Management Script
 * Управление пользователями через командную строку
 * 
 * Использование:
 * node manage-users.js delete +992557777509
 * node manage-users.js list-unverified
 * node manage-users.js reset-verification +992557777509
 * node manage-users.js info +992557777509
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
import './models/users.js';
import './models/phone-verification.js';

const User = mongoose.model('User');
const PhoneVerification = mongoose.model('PhoneVerification');

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

// Удаление пользователя по номеру телефона
async function deleteUserByPhone(phoneNumber) {
  try {
    console.log(`\n🔍 Поиск пользователя с номером ${phoneNumber}...`);
    
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('\n📋 Найден пользователь:');
    console.log(`   Имя: ${user.name}`);
    console.log(`   Email: ${user.email || 'не указан'}`);
    console.log(`   Телефон: ${user.phoneNumber}`);
    console.log(`   Верифицирован: ${user.phoneVerified ? 'Да' : 'Нет'}`);
    console.log(`   Роль: ${user.role}`);
    console.log(`   Создан: ${user.createdAt}`);
    
    // Удаление записей верификации
    const verificationCount = await PhoneVerification.countDocuments({ phoneNumber });
    if (verificationCount > 0) {
      await PhoneVerification.deleteMany({ phoneNumber });
      console.log(`\n🗑️  Удалено ${verificationCount} записей верификации`);
    }
    
    // Удаление пользователя
    await User.deleteOne({ _id: user._id });
    
    console.log('\n✅ Пользователь успешно удален');
    console.log(`   Теперь номер ${phoneNumber} можно использовать для новой регистрации`);
    
  } catch (error) {
    console.error('❌ Ошибка при удалении:', error.message);
  }
}

// Список неверифицированных пользователей
async function listUnverifiedUsers() {
  try {
    console.log('\n🔍 Поиск неверифицированных пользователей...\n');
    
    const users = await User.find({ phoneVerified: false }).sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('✅ Неверифицированных пользователей не найдено');
      return;
    }
    
    console.log(`📋 Найдено ${users.length} неверифицированных пользователей:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Телефон: ${user.phoneNumber}`);
      console.log(`   Email: ${user.email || 'не указан'}`);
      console.log(`   Создан: ${user.createdAt.toLocaleString('ru-RU')}`);
      console.log('');
    });
    
    console.log(`\n💡 Для удаления используйте:\n   node manage-users.js delete <номер_телефона>`);
    
  } catch (error) {
    console.error('❌ Ошибка при получении списка:', error.message);
  }
}

// Сброс верификации (для повторной отправки SMS)
async function resetVerification(phoneNumber) {
  try {
    console.log(`\n🔍 Поиск пользователя с номером ${phoneNumber}...`);
    
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    // Удаление старых записей верификации
    await PhoneVerification.deleteMany({ phoneNumber });
    
    // Сброс статуса верификации
    user.phoneVerified = false;
    await user.save();
    
    console.log('\n✅ Верификация сброшена');
    console.log(`   Пользователь может запросить новый код`);
    
  } catch (error) {
    console.error('❌ Ошибка при сбросе:', error.message);
  }
}

// Информация о пользователе
async function getUserInfo(phoneNumber) {
  try {
    console.log(`\n🔍 Поиск пользователя с номером ${phoneNumber}...`);
    
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('\n📋 Информация о пользователе:');
    console.log('════════════════════════════════');
    console.log(`Имя:           ${user.name}`);
    console.log(`Email:         ${user.email || 'не указан'}`);
    console.log(`Телефон:       ${user.phoneNumber}`);
    console.log(`Верифицирован: ${user.phoneVerified ? '✅ Да' : '❌ Нет'}`);
    console.log(`Роль:          ${user.role}`);
    console.log(`2FA:           ${user.twoFactorEnabled ? '✅ Включен' : 'Отключен'}`);
    console.log(`Создан:        ${user.createdAt.toLocaleString('ru-RU')}`);
    console.log(`Обновлен:      ${user.updatedAt.toLocaleString('ru-RU')}`);
    
    // Проверка записей верификации
    const verifications = await PhoneVerification.find({ phoneNumber }).sort({ createdAt: -1 });
    
    if (verifications.length > 0) {
      console.log(`\n📨 Записи верификации (${verifications.length}):`);
      verifications.forEach((v, i) => {
        console.log(`   ${i + 1}. Код: ${v.verificationCode}, Expires: ${v.expiresAt.toLocaleString('ru-RU')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при получении информации:', error.message);
  }
}

// Показать help
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🛠️  User Management Script                      ║
║           Управление пользователями                        ║
╚════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

  delete <телефон>              Удалить пользователя
  ────────────────────────────────────────────────────────
  node manage-users.js delete +992557777509
  
  list-unverified               Список неверифицированных
  ────────────────────────────────────────────────────────
  node manage-users.js list-unverified
  
  reset-verification <телефон>  Сбросить верификацию
  ────────────────────────────────────────────────────────
  node manage-users.js reset-verification +992557777509
  
  info <телефон>                Информация о пользователе
  ────────────────────────────────────────────────────────
  node manage-users.js info +992557777509

  help                          Показать это сообщение
  ────────────────────────────────────────────────────────
  node manage-users.js help

💡 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:

  # Удалить тестового пользователя
  node manage-users.js delete +992557777509
  
  # Посмотреть всех неверифицированных
  node manage-users.js list-unverified
  
  # Сбросить верификацию для повторной отправки SMS
  node manage-users.js reset-verification +992985343331

`);
}

// Main функция
async function main() {
  const command = process.argv[2];
  const phoneNumber = process.argv[3];
  
  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }
  
  await connectDB();
  
  switch (command) {
    case 'delete':
      if (!phoneNumber) {
        console.error('❌ Укажите номер телефона');
        console.log('   Пример: node manage-users.js delete +992557777509');
        process.exit(1);
      }
      await deleteUserByPhone(phoneNumber);
      break;
      
    case 'list-unverified':
      await listUnverifiedUsers();
      break;
      
    case 'reset-verification':
      if (!phoneNumber) {
        console.error('❌ Укажите номер телефона');
        console.log('   Пример: node manage-users.js reset-verification +992557777509');
        process.exit(1);
      }
      await resetVerification(phoneNumber);
      break;
      
    case 'info':
      if (!phoneNumber) {
        console.error('❌ Укажите номер телефона');
        console.log('   Пример: node manage-users.js info +992557777509');
        process.exit(1);
      }
      await getUserInfo(phoneNumber);
      break;
      
    default:
      console.error(`❌ Неизвестная команда: ${command}`);
      console.log('\n💡 Используйте: node manage-users.js help');
      process.exit(1);
  }
  
  await mongoose.connection.close();
  console.log('\n👋 Отключено от MongoDB');
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
