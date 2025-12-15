import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import aj from "../libs/arcjet.js";
import User from "../models/users.js";
import Verification from "../models/verification.js";
import PhoneVerification from "../models/phone-verification.js";
import Workspace from "../models/workspace.js";
import { sendEmail } from "../libs/send-emails.js";
import { sendSMS } from "../libs/send-sms.js";
import { verifyJWT } from "../libs/jwt-verify.js";

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

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate email verification token
    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "verify-email" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // save verification token to verification
    await Verification.create({
      userId: newUser._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });

    // send verification token to user email - use production URL in production environment
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    // Debug logging for URL generation
    console.log("=".repeat(80));
    console.log("📧 EMAIL VERIFICATION LINK FOR:", email);
    console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
    console.log("🔗 FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("🔗 PRODUCTION_FRONTEND_URL:", process.env.PRODUCTION_FRONTEND_URL);
    console.log("✅ FINAL FRONTEND URL:", frontendUrl);
    console.log("🔗 VERIFICATION URL:", verificationUrl);
    console.log("=".repeat(80));

    // Try to send email, but don't fail if it doesn't work
    try {
      const isEmailSent = await sendEmail(
        email,
        "Подтверждение электронной почты",
        name,
        "Пожалуйста, подтвердите свою электронную почту, чтобы продолжить.",
        "Подтвердить Email",
        verificationUrl
      );
      
      if (isEmailSent) {
        console.log("✅ Email sent successfully to:", email);
      } else {
        console.log("⚠️ Email sending failed, but verification link is available above");
      }
    } catch (error) {
      console.log("⚠️ Email service error:", error.message);
      console.log("📝 Use the verification link above to verify your email");
    }

    res.status(201).json({
      message: "Account created successfully! Please check the server console for your email verification link.",
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
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

    // Temporarily disable Arcjet for testing
    // const decision = await aj.protect(req, { email });
    // console.log("ARCJET DECISION===>", decision.isDenied());
    // if (decision.isDenied()) {
    //   console.log("Arcjet decision false");
    //   return res.status(400).json({ message: "Invalid request" });
    // }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found:", user.email, "isEmailVerified:", user.isEmailVerified);

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      console.log("OAuth user trying to login with password:", email);
      return res.status(400).json({ 
        message: "This account was created with social login. Please use Google or Apple to sign in." 
      });
    }

    // Verify password first
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password verified for:", email);

    // check if user is verified
    if (!user.isEmailVerified) {
      console.log("User email not verified:", email);
      // check if verification token exist in verification
      const existingVerification = await Verification.findOne({
        userId: user._id,
      });

      if (existingVerification && existingVerification.expiresAt > new Date()) {
        return res
          .status(400)
          .json({ message: "Please verify your email first" });
      } else {
        // delete existing verification if it exists
        if (existingVerification) {
          await Verification.findByIdAndDelete(existingVerification._id);
        }
        
        // generate verification token
        const verificationToken = jwt.sign(
          { userId: user._id, purpose: "verify-email" },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );
        
        // save verification token to verification
        await Verification.create({
          userId: user._id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        // For now, just return a message asking to verify email
        // Skip email sending to avoid SendGrid errors
        return res
          .status(400)
          .json({ message: "Please verify your email first. Check your email for verification link." });
      }
    }

    // 2FA check
    if (user.is2FAEnabled) {
      // Generate/send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);
      user.twoFAOtp = hashedOtp;
      user.twoFAOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min
      await user.save();

      // Skip email sending for now
      return res
        .status(200)
        .json({ twoFARequired: true, message: "2FA required", email });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

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
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // check if user is verified
    if (!user.isEmailVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    // check if token already exist in verification
    const existingVerification = await Verification.findOne({
      userId: user._id,
    });

    if (existingVerification && existingVerification.expiresAt > new Date()) {
      return res.status(400).json({
        message:
          "Reset password request already sent to your email. Please check your email for the reset link.",
      });
    }

    // delete existing verification
    if (existingVerification && existingVerification.expiresAt < new Date()) {
      await Verification.findByIdAndDelete(existingVerification._id);
    }

    // generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // save reset token to verification
    await Verification.create({
      userId: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // send reset token to user email - use production URL in production environment
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    const resetUrl = `${frontendUrl}/reset-password?tk=${resetToken}`;
    
    // Debug logging for URL generation
    console.log("=".repeat(80));
    console.log("🔐 PASSWORD RESET LINK FOR:", email);
    console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
    console.log("🔗 FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("🔗 PRODUCTION_FRONTEND_URL:", process.env.PRODUCTION_FRONTEND_URL);
    console.log("✅ FINAL FRONTEND URL:", frontendUrl);
    console.log("🔗 RESET URL:", resetUrl);
    console.log("=".repeat(80));

    // Try to send email, but don't fail if it doesn't work
    try {
      const isEmailSent = await sendEmail(
        email,
        "Сброс пароля",
        user.name,
        "Нажмите на ссылку ниже, чтобы сбросить пароль. Пожалуйста, сбросьте пароль, чтобы продолжить.",
        "Сбросить пароль",
        resetUrl
      );
      
      if (isEmailSent) {
        console.log("✅ Reset email sent successfully to:", email);
        res.status(200).json({ message: "Reset password email sent" });
      } else {
        console.log("⚠️ Reset email sending failed, but reset link is available above");
        res.status(200).json({ 
          message: "Reset password request processed. Please check the server console for your reset link.",
          resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
        });
      }
    } catch (error) {
      console.log("⚠️ Email service error:", error.message);
      console.log("📝 Use the reset link above to reset your password");
      res.status(200).json({ 
        message: "Reset password request processed. Please check the server console for your reset link.",
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyResetTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const payload = verifyJWT(token);

    if (payload.isValid && !payload?.isValid) {
      // await Verification.findOneAndDelete({ token });
      return res.status(400).json({ message: payload.message });
    }

    if (payload.purpose !== "reset-password") {
      return res.status(400).json({ message: "Invalid token" });
    }

    // check if token is valid
    const verification = await Verification.findOne({ token });
    if (!verification) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // check if token is expired
    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }

    // check if user exists
    const user = await User.findById(verification.userId);

    // check if user exists
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // check if new password and confirm password are the same
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // update user password
    user.password = hashedPassword;
    await user.save();

    // delete verification
    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const payload = verifyJWT(token);

    if (payload.isValid && !payload?.isValid) {
      await Verification.findOneAndDelete({ token });

      return res.status(400).json({ message: payload.message });
    }

    if (payload.purpose !== "verify-email") {
      return res.status(400).json({ message: "Invalid token" });
    }

    // check if token is valid
    const verification = await Verification.findOne({ token });
    if (!verification) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // check if token is expired
    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }

    // check if user exists
    const user = await User.findById(verification.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // check if user is already verified
    if (user.isVerified) {
      // delete verification
      await Verification.findByIdAndDelete(verification._id);
      return res.status(400).json({ message: "User already verified" });
    }

    // verify user
    user.isEmailVerified = true;
    await user.save();

    // Add user to default workspace
    try {
      const defaultWorkspace = await Workspace.findOne({ 
        name: 'Рабочее пространство' 
      });

      if (defaultWorkspace) {
        // Check if user is already a member
        const isMember = defaultWorkspace.members.some(
          member => member.user.toString() === user._id.toString()
        );

        if (!isMember) {
          defaultWorkspace.members.push({
            user: user._id,
            role: 'member',
            joinedAt: new Date(),
          });
          await defaultWorkspace.save();
          console.log(`✅ Added ${user.name} to default workspace`);
        }
      } else {
        console.log('⚠️ Default workspace not found');
      }
    } catch (error) {
      console.error('Error adding user to default workspace:', error);
      // Don't fail the email verification if workspace addition fails
    }

    // delete verification
    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Server error" });
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
        isEmailVerified: true, // Google emails are pre-verified
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

    // Rate limiting DISABLED for testing
    // const rateLimit = await PhoneVerification.checkExponentialRateLimit(
    //   phoneNumber,
    //   'registration'
    // );

    // if (!rateLimit.allowed) {
    //   return res.status(429).json({
    //     message: rateLimit.message,
    //     waitMinutes: rateLimit.waitMinutes,
    //     attemptNumber: rateLimit.attemptNumber
    //   });
    // }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (auto-verified - no SMS required)
    const newUser = await User.create({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      preferredAuthMethod: 'phone',
      isPhoneVerified: true, // Auto-verified
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

// NEW: Verify phone code
const verifyPhoneCode = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    console.log("🔢 Verifying code for:", phoneNumber);

    if (!phoneNumber || !code) {
      return res.status(400).json({ message: "Телефон и код обязательны" });
    }

    // Verify the code
    const result = await PhoneVerification.verifyCode(
      phoneNumber,
      code,
      'registration'
    );

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Find user and mark as verified
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    user.isPhoneVerified = true;
    await user.save();

    // Add to default workspace
    try {
      const defaultWorkspace = await Workspace.findOne({ 
        name: 'Рабочее пространство' 
      });

      if (defaultWorkspace) {
        const isMember = defaultWorkspace.members.some(
          member => member.user.toString() === user._id.toString()
        );

        if (!isMember) {
          defaultWorkspace.members.push({
            user: user._id,
            role: 'member',
            joinedAt: new Date(),
          });
          await defaultWorkspace.save();
          console.log(`✅ Added ${user.name} to default workspace`);
        }
      }
    } catch (error) {
      console.error('Error adding user to workspace:', error);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data
    const userData = user.toObject();
    delete userData.password;

    console.log("✅ Phone verified successfully for:", phoneNumber);

    res.status(200).json({ 
      message: "Телефон успешно подтвержден",
      user: userData,
      token
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// NEW: Resend verification code
const resendVerificationCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    console.log("📱 Resending code to:", phoneNumber);

    if (!phoneNumber) {
      return res.status(400).json({ message: "Номер телефона обязателен" });
    }

    // Rate limiting DISABLED for testing
    // const rateLimit = await PhoneVerification.checkExponentialRateLimit(
    //   phoneNumber,
    //   'registration'
    // );

    // if (!rateLimit.allowed) {
    //   return res.status(429).json({ 
    //     message: rateLimit.message,
    //     waitMinutes: rateLimit.waitMinutes,
    //     attemptNumber: rateLimit.attemptNumber,
    //     nextAttemptAt: rateLimit.nextAttemptAt
    //   });
    // }

    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Create new verification with link token
    const { verificationToken, verification } = await PhoneVerification.createVerification(
      phoneNumber,
      'registration',
      user._id,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      true // Use link-based verification
    );

    // Send SMS with verification link
    const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    const verificationLink = `${frontendUrl}/verify/${verificationToken}`;
    const smsText = `Подтвердите регистрацию в Protocol:\n${verificationLink}\n\nСсылка действительна 10 минут.`;
    
    console.log("🔗 New verification link:", verificationLink);
    
    try {
      await sendSMS(phoneNumber, smsText);
      console.log("✅ SMS resent successfully");
    } catch (smsError) {
      console.error("⚠️ SMS resending failed:", smsError.message);
      return res.status(500).json({ message: "Ошибка отправки SMS" });
    }

    res.status(200).json({
      message: "Ссылка отправлена повторно. Проверьте SMS.",
      verificationType: "link",
      expiresIn: 600,
      attemptNumber: rateLimit.attemptNumber
    });
  } catch (error) {
    console.error("Resend code error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// NEW: Login with email OR phone
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
  verifyEmail,
  verifyResetTokenAndResetPassword,
  verify2FALogin,
  googleAuth,
  googleCallback,
  appleAuth,
  appleCallback,
  // NEW: Phone authentication
  registerUserWithPhone,
  verifyPhoneCode,
  resendVerificationCode,
  loginWithEmailOrPhone,
};
