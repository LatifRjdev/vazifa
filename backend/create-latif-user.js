import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

async function createLatifUser() {
  try {
    // Подключиться к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n" + "=".repeat(80));
    console.log("👤 СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ: Латиф Рачабов");
    console.log("=".repeat(80));

    // Проверить, существует ли пользователь
    const existingUser = await User.findOne({ phoneNumber: "+992557777509" });
    
    if (existingUser) {
      console.log("\n⚠️  Пользователь с номером +992557777509 уже существует:");
      console.log("   Имя:", existingUser.name);
      console.log("   Email:", existingUser.email || "не указан");
      console.log("   Роль:", existingUser.role);
      console.log("   Телефон верифицирован:", existingUser.isPhoneVerified);
      console.log("   SMS уведомления:", existingUser.settings.smsNotifications);
      
      console.log("\n🔧 Обновляю настройки существующего пользователя...");
      
      // Обновить настройки
      existingUser.isPhoneVerified = true;
      existingUser.settings.smsNotifications = true;
      existingUser.settings.smsNotificationTypes = [
        'verification',
        'otp',
        'password_reset',
        'task_notification',
        'workspace_invite',
        'general_notification',
      ];
      
      await existingUser.save();
      
      console.log("✅ Настройки обновлены!");
      console.log("\n📊 ОБНОВЛЕННЫЙ ПРОФИЛЬ:");
      console.log("   Имя:", existingUser.name);
      console.log("   Телефон:", existingUser.phoneNumber);
      console.log("   Телефон верифицирован: ✅ ДА");
      console.log("   SMS уведомления: ✅ ВКЛЮЧЕНЫ");
      console.log("   Типов уведомлений:", existingUser.settings.smsNotificationTypes.length);
      
      return existingUser;
    }

    // Создать нового пользователя
    console.log("\n📝 Создаю нового пользователя...");
    
    const newUser = await User.create({
      name: "Латиф Рачабов",
      phoneNumber: "+992557777509",
      isPhoneVerified: true,
      isEmailVerified: false,
      preferredAuthMethod: "phone",
      role: "member",
      settings: {
        emailNotifications: false,
        smsNotifications: true,
        smsNotificationTypes: [
          'verification',
          'otp',
          'password_reset',
          'task_notification',
          'workspace_invite',
          'general_notification',
        ],
      },
    });

    console.log("✅ Пользователь успешно создан!");
    
    console.log("\n📊 НОВЫЙ ПРОФИЛЬ:");
    console.log("   ID:", newUser._id);
    console.log("   Имя:", newUser.name);
    console.log("   Телефон:", newUser.phoneNumber);
    console.log("   Email:", newUser.email || "не указан (только телефон)");
    console.log("   Роль:", newUser.role);
    console.log("   Телефон верифицирован: ✅ ДА");
    console.log("   SMS уведомления: ✅ ВКЛЮЧЕНЫ");
    console.log("   Email уведомления:", newUser.settings.emailNotifications ? "✅" : "❌");
    console.log("   Типов SMS уведомлений:", newUser.settings.smsNotificationTypes.length);
    
    console.log("\n📋 ТИПЫ SMS УВЕДОМЛЕНИЙ:");
    newUser.settings.smsNotificationTypes.forEach(type => {
      console.log(`   ✅ ${type}`);
    });
    
    // Проверка методов
    const canReceive = newUser.canReceiveSMS();
    const canReceiveTask = newUser.isSMSNotificationEnabled('task_notification');
    
    console.log("\n🔔 ПРОВЕРКА ВОЗМОЖНОСТЕЙ:");
    console.log(`   Может получать SMS: ${canReceive ? "✅ ДА" : "❌ НЕТ"}`);
    console.log(`   Может получать уведомления о задачах: ${canReceiveTask ? "✅ ДА" : "❌ НЕТ"}`);
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ ПОЛЬЗОВАТЕЛЬ ГОТОВ К ПОЛУЧЕНИЮ SMS!");
    console.log("=".repeat(80));
    console.log("\n💡 Следующие шаги:");
    console.log("   1. Запустите: node backend/test-latif-sms.js");
    console.log("   2. Создайте задачу и назначьте Латифа Рачабова");
    console.log("   3. Проверьте получение SMS на +992557777509");
    console.log("\n" + "=".repeat(80) + "\n");

    return newUser;

  } catch (error) {
    console.error("\n❌ Ошибка:", error);
    if (error.name === 'ValidationError') {
      console.error("\n📋 Детали ошибки валидации:");
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

createLatifUser();
