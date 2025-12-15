/**
 * Password Reset Script
 * Скрипт для сброса пароля пользователя
 * 
 * Использование:
 * node reset-user-password.js <email> <new_password>
 * 
 * Пример:
 * node reset-user-password.js mahmasharif.jalilov@bgroup.tj xzibit2000
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import User model
import './models/users.js';
const User = mongoose.model('User');

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

// Сброс пароля пользователя
async function resetUserPassword(email, newPassword) {
  try {
    console.log(`\n🔍 Поиск пользователя с email: ${email}...`);
    
    // Найти пользователя
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      console.log(`   Email "${email}" не существует в базе данных`);
      return false;
    }
    
    console.log('\n📋 Найден пользователь:');
    console.log(`   Имя: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Телефон: ${user.phoneNumber || 'не указан'}`);
    console.log(`   Роль: ${user.role}`);
    console.log(`   Создан: ${user.createdAt.toLocaleString('ru-RU')}`);
    
    console.log(`\n🔐 Хеширование нового пароля...`);
    
    // Хеширование нового пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('✅ Пароль захеширован');
    
    // Обновление пароля напрямую (без валидации)
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('\n✅ ПАРОЛЬ УСПЕШНО ИЗМЕНЕН!');
    console.log('════════════════════════════════════════');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Новый пароль: ${newPassword}`);
    console.log('════════════════════════════════════════');
    console.log('\n💡 Пользователь может войти с новым паролем');
    
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка при сбросе пароля:', error.message);
    return false;
  }
}

// Показать help
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🔐 Password Reset Script                         ║
║           Скрипт сброса пароля                             ║
╚════════════════════════════════════════════════════════════╝

📋 ИСПОЛЬЗОВАНИЕ:

  node reset-user-password.js <email> <new_password>

📝 ПРИМЕРЫ:

  # Сброс пароля для пользователя
  node reset-user-password.js user@example.com newPassword123
  
  # Сброс пароля с кириллицей
  node reset-user-password.js admin@site.tj Пароль2024

⚠️  ВАЖНО:
  - Email должен существовать в базе данных
  - Пароль будет захеширован с bcrypt
  - Пользователь сможет войти сразу после смены пароля

`);
}

// Main функция
async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    showHelp();
    console.error('❌ Ошибка: Не указаны обязательные параметры\n');
    console.log('💡 Используйте: node reset-user-password.js <email> <new_password>\n');
    process.exit(1);
  }
  
  console.log('═'.repeat(60));
  console.log('🔐 Password Reset Script');
  console.log('═'.repeat(60));
  
  await connectDB();
  
  const success = await resetUserPassword(email, newPassword);
  
  await mongoose.connection.close();
  console.log('\n👋 Отключено от MongoDB\n');
  
  process.exit(success ? 0 : 1);
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
