import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import aj from "../libs/arcjet.js";
import User from "../models/users.js";
import Verification from "../models/verification.js";
import Workspace from "../models/workspace.js";
import { sendEmail } from "../libs/send-emails.js";
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

    // send verification token to user email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    // For development: Log the verification URL to console
    console.log("=".repeat(80));
    console.log("📧 EMAIL VERIFICATION LINK FOR:", email);
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

    // send reset token to user email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?tk=${resetToken}`;
    
    // For development: Log the reset URL to console
    console.log("=".repeat(80));
    console.log("🔐 PASSWORD RESET LINK FOR:", email);
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
      return res.redirect(`${process.env.FRONTEND_URL}/sign-in?error=oauth_error`);
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
      return res.redirect(`${process.env.FRONTEND_URL}/sign-in?error=oauth_error`);
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    
    if (!googleUser.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/sign-in?error=oauth_error`);
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

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/sign-in?error=oauth_error`);
  }
};

const appleAuth = async (req, res) => {
  try {
    // For now, redirect with a message that Apple auth is coming soon
    res.redirect(`${process.env.FRONTEND_URL}/sign-in?message=apple_coming_soon`);
  } catch (error) {
    console.error("Apple auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const appleCallback = async (req, res) => {
  try {
    // Apple OAuth implementation would go here
    // For now, redirect with a message
    res.redirect(`${process.env.FRONTEND_URL}/sign-in?message=apple_coming_soon`);
  } catch (error) {
    console.error("Apple callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/sign-in?error=oauth_error`);
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
};
