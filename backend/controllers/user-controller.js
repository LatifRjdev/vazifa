import bcrypt from "bcrypt";

import User from "../models/users.js";
import { sendEmail } from "../libs/send-emails.js";

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    delete user.password;

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);

    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, lastName, phoneNumber, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If phone number is being updated, check if it already exists
    if (phoneNumber !== undefined && phoneNumber && phoneNumber.trim() !== "") {
      const cleanPhone = phoneNumber.replace(/\s+/g, '');
      
      // Validate phone number format
      if (!/^[\+]?[0-9\-\(\)\s]+$/.test(cleanPhone)) {
        return res.status(400).json({ message: "Неверный формат номера телефона" });
      }
      
      // Check if phone number is already used by another user
      const existingUser = await User.findOne({ 
        phoneNumber: cleanPhone,
        _id: { $ne: user._id } // Exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Этот номер телефона уже используется другим пользователем" 
        });
      }
      
      // Auto-verify phone and enable SMS notifications when phone is added
      user.phoneNumber = cleanPhone;
      user.isPhoneVerified = true;
      user.settings.smsNotifications = true;
    } else if (phoneNumber !== undefined) {
      user.phoneNumber = "";
      user.isPhoneVerified = false;
    }

    user.name = name;
    if (lastName !== undefined) {
      user.lastName = lastName;
    }
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.phoneNumber) {
        return res.status(400).json({ 
          message: "Этот номер телефона уже используется другим пользователем" 
        });
      }
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ 
          message: "Этот email уже используется другим пользователем" 
        });
      }
      return res.status(400).json({ message: "Дублирующееся значение" });
    }

    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(403).json({ message: "Invalid old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);

    res.status(500).json({ message: "Server error" });
  }
};

// 2FA: Get status
const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ enabled: !!user.is2FAEnabled });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 2FA: Enable (send OTP)
const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is2FAEnabled)
      return res.status(400).json({ message: "2FA already enabled" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.twoFAOtp = hashedOtp;
    user.twoFAOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // Send OTP to email
    await sendEmail(
      user.email,
      "Код подтверждения 2FA",
      user.name,
      `Ваш код подтверждения: <b>${otp}</b>
      <br>
      <br>
      Этот код истечет через 10 минут.
      </p>`,
      "Код 2FA",
      "#"
    );

    res.json({
      message: "Verification code sent to your email.",
      isOTPSent: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 2FA: Verify OTP and enable
const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select(
      "twoFAOtp twoFAOtpExpires is2FAEnabled"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.is2FAEnabled)
      return res.status(400).json({ message: "2FA already enabled" });
    if (!user.twoFAOtp || !user.twoFAOtpExpires)
      return res.status(400).json({ message: "No OTP requested" });
    if (user.twoFAOtpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });
    const isMatch = await bcrypt.compare(code, user.twoFAOtp);
    if (!isMatch) return res.status(400).json({ message: "Invalid code" });
    user.is2FAEnabled = true;
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    await user.save();
    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 2FA: Disable
const disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.is2FAEnabled = false;
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    await user.save();
    res.json({ message: "2FA disabled" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (for task assignment)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name lastName email role profilePicture').sort({ name: 1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы могут удалять пользователей." });
    }

    // Prevent self-deletion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Нельзя удалить самого себя." });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    // Prevent deletion of super admin by regular admin
    if (userToDelete.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Только супер админ может удалить супер админа." });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Пользователь успешно удален." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  changePassword,
  getUserProfile,
  updateUserProfile,
  get2FAStatus,
  enable2FA,
  verify2FA,
  disable2FA,
  getAllUsers,
  deleteUser,
};
