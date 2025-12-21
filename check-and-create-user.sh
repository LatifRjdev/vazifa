#!/bin/bash
echo "=========================================="
echo "👥 Проверка пользователей и создание аккаунта"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'
cd /var/www/vazifa/backend

echo "📊 Текущие пользователи в БД:"
mongosh mongodb://vazifa:Asd123@localhost:27017/vazifa-production --eval "db.users.find({}, {email: 1, name: 1, phoneNumber: 1, role: 1}).limit(10)" --quiet

echo ""
echo "📝 Создание нового супер-админа..."
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  isEmailVerified: Boolean
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://vazifa:Asd123@localhost:27017/vazifa-production');
    
    const existingAdmin = await User.findOne({ email: 'admin@protocol.com' });
    if (existingAdmin) {
      console.log('✅ Админ уже существует: admin@protocol.com');
      console.log('Используйте: admin@protocol.com / Admin123!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin123!', salt);
      
      await User.create({
        email: 'admin@protocol.com',
        password: hashedPassword,
        name: 'System Admin',
        role: 'admin',
        isEmailVerified: true
      });
      
      console.log('✅ Супер-админ создан!');
      console.log('📧 Email: admin@protocol.com');
      console.log('🔐 Пароль: Admin123!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

createAdmin();
"

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
