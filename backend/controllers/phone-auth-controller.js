import { sendSMS } from "../libs/send-sms-bullmq.js";
import PhoneVerification from "../models/phone-verification.js";
import User from "../models/users.js";
import SMSLog from "../models/sms-logs.js";

/**
 * Send phone verification code
 */
const sendPhoneVerificationCode = async (req, res) => {
  try {
    const { phoneNumber, type = "registration" } = req.body;

    // Validate phone number format
    const phoneRegex = /^\+992\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Неверный формат номера телефона. Используйте формат: +992XXXXXXXXX",
      });
    }

    // Rate limiting DISABLED for testing
    // const rateLimitCheck = await PhoneVerification.checkRateLimit(
    //   phoneNumber,
    //   type,
    //   60, // 60 minutes
    //   3 // max 3 requests
    // );

    // if (!rateLimitCheck.allowed) {
    //   return res.status(429).json({
    //     message: rateLimitCheck.message,
    //     minutesUntilReset: rateLimitCheck.minutesUntilReset,
    //   });
    // }

    // For registration, check if phone already exists
    if (type === "registration") {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).json({
          message: "Этот номер телефона уже зарегистрирован",
        });
      }
    }

    // For login/password reset, check if phone exists
    if (type === "login" || type === "password_reset") {
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(400).json({
          message: "Пользователь с таким номером не найден",
        });
      }
    }

    // Create verification with link token
    const { verificationToken, verification } = await PhoneVerification.createVerification(
      phoneNumber,
      type,
      null,
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      true // Use link-based verification
    );

    // Format message with verification link
    const baseUrl = process.env.FRONTEND_URL || "https://protocol.oci.tj";
    const verificationLink = `${baseUrl}/verify/${verificationToken}`;
    
    let message;
    switch (type) {
      case "registration":
        message = `Подтвердите регистрацию в Protocol:\n${verificationLink}\n\nСсылка действительна 10 минут.`;
        break;
      case "login":
        message = `Подтвердите вход в Protocol:\n${verificationLink}\n\nСсылка действительна 10 минут.`;
        break;
      case "password_reset":
        message = `Сброс пароля Protocol:\n${verificationLink}\n\nСсылка действительна 10 минут.`;
        break;
      case "phone_update":
        message = `Подтвердите новый номер:\n${verificationLink}\n\nСсылка действительна 10 минут.`;
        break;
      default:
        message = `Подтверждение Protocol:\n${verificationLink}`;
    }

    // Send SMS
    try {
      const smsResult = await sendSMS(phoneNumber, message, "high");

      // Log SMS
      await SMSLog.logSMS({
        phoneNumber,
        message,
        messageId: smsResult.messageId,
        type: "verification",
        priority: "high",
        status: smsResult.queued ? "queued" : "sent",
        parts: smsResult.parts,
        queueJobId: smsResult.jobId,
      });

      console.log(`✅ Verification code sent to ${phoneNumber}`);

      res.status(200).json({
        message: "Код подтверждения отправлен на ваш номер телефона",
        expiresIn: 600, // 10 minutes in seconds
        attemptsRemaining: 3,
      });
    } catch (smsError) {
      console.error("SMS sending error:", smsError);

      // Log failed SMS
      await SMSLog.logSMS({
        phoneNumber,
        message,
        type: "verification",
        priority: "high",
        status: "failed",
        errorMessage: smsError.message,
      });

      // Even if SMS fails, we still created the verification
      // User might see it in logs if needed
      res.status(200).json({
        message: "Код подтверждения создан",
        expiresIn: 600,
        attemptsRemaining: 3,
        warning: "SMS может быть задержано",
      });
    }
  } catch (error) {
    console.error("Send phone verification error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

/**
 * Verify phone code
 */
const verifyPhoneCode = async (req, res) => {
  try {
    const { phoneNumber, code, type = "registration" } = req.body;

    // Validate phone number
    const phoneRegex = /^\+992\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Неверный формат номера телефона",
      });
    }

    // Validate code
    if (!code || code.length !== 6) {
      return res.status(400).json({
        message: "Код должен содержать 6 цифр",
      });
    }

    // Verify code
    const verificationResult = await PhoneVerification.verifyCode(
      phoneNumber,
      code,
      type
    );

    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.message,
        remainingAttempts: verificationResult.remainingAttempts,
      });
    }

    // Success
    res.status(200).json({
      message: verificationResult.message,
      verified: true,
    });
  } catch (error) {
    console.error("Verify phone code error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

/**
 * Register user with phone number
 */
const registerWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password, name, verificationCode } = req.body;

    // Validate required fields
    if (!phoneNumber || !password || !name || !verificationCode) {
      return res.status(400).json({
        message: "Все поля обязательны для заполнения",
      });
    }

    // Validate phone number
    const phoneRegex = /^\+992\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Неверный формат номера телефона",
      });
    }

    // Check if phone already registered
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        message: "Этот номер телефона уже зарегистрирован",
      });
    }

    // Verify code
    const verificationResult = await PhoneVerification.verifyCode(
      phoneNumber,
      verificationCode,
      "registration"
    );

    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.message,
        remainingAttempts: verificationResult.remainingAttempts,
      });
    }

    // Hash password
    const bcrypt = (await import("bcrypt")).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      phoneNumber,
      password: hashedPassword,
      name,
      isPhoneVerified: true,
      preferredAuthMethod: "phone",
    });

    // Add user to default workspace
    try {
      const Workspace = (await import("../models/workspace.js")). default;
      const defaultWorkspace = await Workspace.findOne({
        name: "Рабочее пространство",
      });

      if (defaultWorkspace) {
        const isMember = defaultWorkspace.members.some(
          (member) => member.user.toString() === newUser._id.toString()
        );

        if (!isMember) {
          defaultWorkspace.members.push({
            user: newUser._id,
            role: "member",
            joinedAt: new Date(),
          });
          await defaultWorkspace.save();
        }
      }
    } catch (error) {
      console.error("Error adding user to default workspace:", error);
    }

    // Generate JWT token
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data
    const userData = newUser.toObject();
    delete userData.password;

    res.status(201).json({
      message: "Регистрация успешна!",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Register with phone error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

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

    // Check if phone is verified
    if (!user.isPhoneVerified) {
      return res.status(400).json({
        message: "Пожалуйста, сначала подтвердите свой номер телефона",
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

      // Send OTP via SMS
      try {
        await sendSMS(
          phoneNumber,
          `Код двухфакторной аутентификации: ${otp}\nДействителен 10 минут.`,
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
    const { phoneNumber, verificationCode, newPassword } = req.body;

    // Validate inputs
    if (!phoneNumber || !verificationCode || !newPassword) {
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

    // Verify code
    const verificationResult = await PhoneVerification.verifyCode(
      phoneNumber,
      verificationCode,
      "password_reset"
    );

    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.message,
        remainingAttempts: verificationResult.remainingAttempts,
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

/**
 * Verify phone via link token
 */
const verifyPhoneViaLink = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Токен верификации не предоставлен",
      });
    }

    // Verify token
    const verificationResult = await PhoneVerification.verifyToken(token);

    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.message,
        expired: true,
      });
    }

    const { phoneNumber, type } = verificationResult;

    // For registration type, mark phone as verified in any pending user record
    if (type === "registration") {
      const user = await User.findOne({ phoneNumber });
      if (user && !user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }
    }

    res.status(200).json({
      message: verificationResult.message,
      verified: true,
      phoneNumber,
      type,
    });
  } catch (error) {
    console.error("Verify phone via link error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  sendPhoneVerificationCode,
  verifyPhoneCode,
  verifyPhoneViaLink,
  registerWithPhone,
  loginWithPhone,
  resetPasswordWithPhone,
};
