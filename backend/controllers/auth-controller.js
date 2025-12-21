import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import aj from "../libs/arcjet.js";
import User from "../models/users.js";
import Workspace from "../models/workspace.js";
import ActivityLog from "../models/activity-logs.js";
import { sendEmail } from "../libs/send-emails.js";
import { sendSMS } from "../libs/send-sms-bullmq.js";
import { verifyJWT } from "../libs/jwt-verify.js";

// Helper function to record login activity
const recordLoginActivity = async (userId, details = {}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action: "logged_in",
      resourceType: "User",
      resourceId: userId,
      details: {
        ...details,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error recording login activity:", error);
  }
};

const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if email is valid
    const decision = await aj.protect(req, {
      email,
    });

    console.log("Arcjet decision", decision.isDenied());

    if (decision.isDenied()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Forbidden" }));
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email address already in use." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user (no verification needed)
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    // Add user to default workspace
    try {
      const defaultWorkspace = await Workspace.findOne({
        name: 'Рабочее пространство'
      });

      if (defaultWorkspace) {
        const isMember = defaultWorkspace.members.some(
          member => member.user.toString() === newUser._id.toString()
        );

        if (!isMember) {
          defaultWorkspace.members.push({
            user: newUser._id,
            role: 'member',
            joinedAt: new Date(),
          });
          await defaultWorkspace.save();
          console.log(`✅ Added ${newUser.name} to default workspace`);
        }
      }
    } catch (error) {
      console.error('Error adding user to default workspace:', error);
    }

    // Generate JWT token for immediate login
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data
    const userData = newUser.toObject();
    delete userData.password;

    console.log("✅ User registered successfully:", email);

    res.status(201).json({
      message: "Регистрация успешна!",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found:", user.email);

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      console.log("OAuth user trying to login with password:", email);
      return res.status(400).json({
        message: "This account was created with social login. Please use Google or Apple to sign in."
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password verified for:", email);

    // 2FA check
    if (user.is2FAEnabled) {
      // Generate/send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);
      user.twoFAOtp = hashedOtp;
      user.twoFAOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min
      await user.save();

      return res
        .status(200)
        .json({ twoFARequired: true, message: "2FA required", email });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Record login activity
    await recordLoginActivity(user._id, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      method: 'email',
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data without password
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ user: userData, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2FA: Verify login OTP
const verify2FALogin = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select(
      "+twoFAOtp +twoFAOtpExpires +is2FAEnabled"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.is2FAEnabled)
      return res.status(400).json({ message: "2FA not enabled" });

    if (!user.twoFAOtp || !user.twoFAOtpExpires)
      return res.status(400).json({ message: "No OTP requested" });

    if (user.twoFAOtpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const isMatch = await bcrypt.compare(code, user.twoFAOtp);
    if (!isMatch) return res.status(400).json({ message: "Invalid code" });

    // Clear OTP
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Record login activity
    await recordLoginActivity(user._id, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      method: '2fa',
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Return user data without password
    const userData = user.toObject();
    delete userData.password;
    res.status(200).json({ user: userData, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    // Determine if it's email or phone
    const isPhone = emailOrPhone.startsWith('+992');

    // Check if user exists (by email or phone)
    let user;
    if (isPhone) {
      user = await User.findOne({ phoneNumber: emailOrPhone });
    } else {
      user = await User.findOne({ email: emailOrPhone });
    }

    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    // Generate reset token (stateless JWT with 15 min expiry)
    const resetToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Send reset token to user email or phone
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    const resetUrl = `${frontendUrl}/reset-password?tk=${resetToken}`;

    console.log("=".repeat(80));
    console.log("🔐 PASSWORD RESET LINK FOR:", emailOrPhone);
    console.log("🔗 RESET URL:", resetUrl);
    console.log("=".repeat(80));

    if (isPhone) {
      // Generate 6-digit reset code for SMS (70 chars limit)
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await bcrypt.hash(resetCode, 10);
      
      // Save reset code to user
      user.resetPasswordCode = hashedCode;
      user.resetPasswordCodeExpires = Date.now() + 15 * 60 * 1000; // 15 min
      await user.save();
      
      // Send short SMS (max 70 chars for Cyrillic)
      try {
        const smsMessage = `Vazifa: Код сброса пароля: ${resetCode}`;
        await sendSMS(emailOrPhone, smsMessage);
        console.log("✅ Reset code SMS sent to:", emailOrPhone);
        res.status(200).json({
          message: "Код сброса пароля отправлен на ваш номер",
          method: "phone",
          requiresCode: true,
          phoneNumber: emailOrPhone
        });
      } catch (error) {
        console.log("⚠️ SMS error:", error.message);
        console.log("🔑 Reset code:", resetCode);
        res.status(200).json({
          message: "Код сброса пароля: " + resetCode,
          method: "phone",
          requiresCode: true,
          phoneNumber: emailOrPhone
        });
      }
    } else {
      // Send email with reset link
      try {
        const isEmailSent = await sendEmail(
          emailOrPhone,
          "Сброс пароля",
          user.name,
          "Нажмите на ссылку ниже, чтобы сбросить пароль.",
          "Сбросить пароль",
          resetUrl
        );

        if (isEmailSent) {
          console.log("✅ Reset email sent successfully to:", emailOrPhone);
          res.status(200).json({
            message: "Ссылка для сброса пароля отправлена на вашу почту",
            method: "email"
          });
        } else {
          console.log("⚠️ Reset email sending failed, but reset link is available above");
          res.status(200).json({
            message: "Запрос обработан. Проверьте консоль сервера для получения ссылки.",
            resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
            method: "email"
          });
        }
      } catch (error) {
        console.log("⚠️ Email service error:", error.message);
        res.status(200).json({
          message: "Запрос обработан. Проверьте консоль сервера для получения ссылки.",
          resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
          method: "email"
        });
      }
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const verifyResetTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Verify JWT token (stateless)
    const payload = verifyJWT(token);

    if (!payload.isValid) {
      return res.status(400).json({ message: payload.message || "Invalid token" });
    }

    if (payload.purpose !== "reset-password") {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Check if user exists
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if new password and confirm password are the same
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify reset code (for phone SMS reset)
const verifyResetCodeAndResetPassword = async (req, res) => {
  try {
    const { phoneNumber, code, newPassword, confirmPassword } = req.body;

    if (!phoneNumber || !code || !newPassword) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }

    // Find user by phone
    const user = await User.findOne({ phoneNumber }).select("+resetPasswordCode +resetPasswordCodeExpires");
    
    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    // Check code expiry
    if (!user.resetPasswordCode || !user.resetPasswordCodeExpires) {
      return res.status(400).json({ message: "Код не запрошен" });
    }

    if (user.resetPasswordCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Код истёк" });
    }

    // Verify code
    const isMatch = await bcrypt.compare(code, user.resetPasswordCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный код" });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Пароли не совпадают" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Пароль успешно изменён" });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// OAuth handlers
const googleAuth = async (req, res) => {
  try {
    // Redirect to Google OAuth
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.BACKEND_URL}/api-v1/auth/google/callback&` +
      `response_type=code&` +
      `scope=email profile&` +
      `access_type=offline`;
    
    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
      return res.redirect(`${frontendUrl}/sign-in?error=oauth_error`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BACKEND_URL}/api-v1/auth/google/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
      return res.redirect(`${frontendUrl}/sign-in?error=oauth_error`);
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    
    if (!googleUser.email) {
      const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
      return res.redirect(`${frontendUrl}/sign-in?error=oauth_error`);
    }

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });
    
    if (!user) {
      // Create new user
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        profilePicture: googleUser.picture,
        authProvider: 'google',
        googleId: googleUser.id,
      });

      // Add user to default workspace
      try {
        const defaultWorkspace = await Workspace.findOne({ 
          name: 'Рабочее пространство' 
        });

        if (defaultWorkspace) {
          defaultWorkspace.members.push({
            user: user._id,
            role: 'member',
            joinedAt: new Date(),
          });
          await defaultWorkspace.save();
        }
      } catch (error) {
        console.error('Error adding user to default workspace:', error);
      }
    } else {
      // Update existing user with Google info if not set
      if (!user.googleId) {
        user.googleId = googleUser.id;
        user.authProvider = 'google';
        if (!user.profilePicture && googleUser.picture) {
          user.profilePicture = googleUser.picture;
        }
        await user.save();
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Record login activity
    await recordLoginActivity(user._id, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      method: 'google',
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to frontend with token - use production URL in production environment
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    res.redirect(`${frontendUrl}/sign-in?error=oauth_error`);
  }
};

const appleAuth = async (req, res) => {
  try {
    // For now, redirect with a message that Apple auth is coming soon
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    res.redirect(`${frontendUrl}/sign-in?message=apple_coming_soon`);
  } catch (error) {
    console.error("Apple auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const appleCallback = async (req, res) => {
  try {
    // Apple OAuth implementation would go here
    // For now, redirect with a message
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    res.redirect(`${frontendUrl}/sign-in?message=apple_coming_soon`);
  } catch (error) {
    console.error("Apple callback error:", error);
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    res.redirect(`${frontendUrl}/sign-in?error=oauth_error`);
  }
};

// NEW: Register user with phone (SMS verification)
const registerUserWithPhone = async (req, res) => {
  try {
    const { name, phoneNumber, email, password } = req.body;

    console.log("📱 Phone registration attempt:", { name, phoneNumber, email });

    // Validate name format (Имя Фамилия)
    const words = name.trim().split(/\s+/);
    if (words.length < 2) {
      return res.status(400).json({ 
        message: "Полное имя должно содержать минимум Имя и Фамилию через пробел" 
      });
    }

    // Validate phone format +992XXXXXXXXX
    if (!phoneNumber || !/^\+992\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        message: "Номер телефона должен быть в формате +992XXXXXXXXX" 
      });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ message: "Этот номер телефона уже зарегистрирован" });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Этот email уже зарегистрирован" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (no verification required)
    const newUser = await User.create({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      preferredAuthMethod: 'phone',
    });

    console.log("✅ User created and auto-verified:", phoneNumber);

    // Add to default workspace
    try {
      const defaultWorkspace = await Workspace.findOne({ 
        name: 'Рабочее пространство' 
      });

      if (defaultWorkspace) {
        const isMember = defaultWorkspace.members.some(
          member => member.user.toString() === newUser._id.toString()
        );

        if (!isMember) {
          defaultWorkspace.members.push({
            user: newUser._id,
            role: 'member',
            joinedAt: new Date(),
          });
          await defaultWorkspace.save();
          console.log(`✅ Added ${newUser.name} to default workspace`);
        }
      }
    } catch (error) {
      console.error('Error adding user to workspace:', error);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data
    const userData = newUser.toObject();
    delete userData.password;

    res.status(201).json({
      message: "Регистрация завершена успешно!",
      user: userData,
      token,
      requiresVerification: false, // No verification needed
    });
  } catch (error) {
    console.error("Phone registration error:", error);
    res.status(500).json({ message: error.message || "Ошибка сервера" });
  }
};

// Login with email OR phone
const loginWithEmailOrPhone = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    console.log("🔐 Login attempt:", emailOrPhone);

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }

    // Determine if it's email or phone
    const isPhone = emailOrPhone.startsWith('+992');
    
    // Find user by email or phone
    const user = await User.findOne(
      isPhone 
        ? { phoneNumber: emailOrPhone }
        : { email: emailOrPhone }
    ).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Неверные учетные данные" });
    }

    // Check if user has a password
    if (!user.password) {
      return res.status(400).json({ 
        message: "Этот аккаунт создан через социальную сеть. Используйте Google для входа." 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверные учетные данные" });
    }

    // NO VERIFICATION CHECK - Allow all users to login

    // 2FA check
    if (user.is2FAEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);
      user.twoFAOtp = hashedOtp;
      user.twoFAOtpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      return res.status(200).json({ 
        twoFARequired: true, 
        message: "Требуется 2FA",
        email: user.email || user.phoneNumber
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Record login activity
    await recordLoginActivity(user._id, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      method: emailOrPhone.includes('@') ? 'email' : 'phone',
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data
    const userData = user.toObject();
    delete userData.password;

    console.log("✅ Login successful for:", emailOrPhone);

    res.status(200).json({ user: userData, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  registerUser,
  loginUser,
  resetPasswordRequest,
  verifyResetTokenAndResetPassword,
  verifyResetCodeAndResetPassword,
  verify2FALogin,
  googleAuth,
  googleCallback,
  appleAuth,
  appleCallback,
  registerUserWithPhone,
  loginWithEmailOrPhone,
};
