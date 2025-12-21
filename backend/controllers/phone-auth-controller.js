import { sendSMS } from "../libs/send-sms-bullmq.js";
import User from "../models/users.js";

/**
 * Login with phone number
 */
const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Validate inputs
    if (!phoneNumber || !password) {
      return res.status(400).json({
        message: "Номер телефона и пароль обязательны",
      });
    }

    // Validate phone number
    const phoneRegex = /^\+992\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Неверный формат номера телефона",
      });
    }

    // Find user
    const user = await User.findOne({ phoneNumber }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Неверные учетные данные",
      });
    }

    // Verify password
    const bcrypt = (await import("bcrypt")).default;
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Неверные учетные данные",
      });
    }

    // Check 2FA
    if (user.is2FAEnabled) {
      // Generate OTP and send via SMS
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      user.twoFAOtp = hashedOtp;
      user.twoFAOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min
      await user.save();

      // Send OTP via SMS (max 70 chars for Cyrillic)
      try {
        await sendSMS(
          phoneNumber,
          `Протокол: Код входа: ${otp}`,
          "high"
        );
      } catch (error) {
        console.error("Failed to send 2FA SMS:", error);
      }

      return res.status(200).json({
        twoFARequired: true,
        message: "Требуется двухфакторная аутентификация",
        phoneNumber,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login with phone error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

/**
 * Reset password with phone number
 */
const resetPasswordWithPhone = async (req, res) => {
  try {
    const { phoneNumber, newPassword } = req.body;

    // Validate inputs
    if (!phoneNumber || !newPassword) {
      return res.status(400).json({
        message: "Все поля обязательны",
      });
    }

    // Validate phone number
    const phoneRegex = /^\+992\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Неверный формат номера телефона",
      });
    }

    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({
        message: "Пользователь не найден",
      });
    }

    // Hash new password
    const bcrypt = (await import("bcrypt")).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    console.error("Reset password with phone error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  loginWithPhone,
  resetPasswordWithPhone,
};
