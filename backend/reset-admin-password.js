const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isEmailVerified: Boolean,
});

const User = mongoose.model("User", userSchema);

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB");

    const email = "admin@vazifa2.com";
    const newPassword = "Admin123!";

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    const result = await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Пароль успешно изменен!");
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Новый пароль: ${newPassword}`);
      console.log("\n⚠️  ВАЖНО: Сохраните этот пароль в надежном месте!");
    } else {
      console.log("❌ Пользователь не найден или пароль уже такой же");
    }

    await mongoose.connection.close();
    console.log("\n✅ Готово!");
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

resetPassword();
