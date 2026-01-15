import bcrypt from "bcrypt";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import User from "../models/users.js";
import Task from "../models/tasks.js";
import ActivityLog from "../models/activity-logs.js";
import { sendEmail } from "../libs/send-emails.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarsDir = path.join(__dirname, "../uploads/avatars");

// Создаем папку для аватаров если не существует
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

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
      
      // Enable SMS notifications when phone is added
      user.phoneNumber = cleanPhone;
      user.settings.smsNotifications = true;
    } else if (phoneNumber !== undefined) {
      user.phoneNumber = "";
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

// Get user profile by ID (for managers/admins to view member details)
const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permissions - only managers and admins can view other users
    if (!["admin", "super_admin", "chief_manager", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    const user = await User.findById(userId).select("-password -twoFAOtp -twoFAOtpExpires");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Get task statistics for this user
    const assignedTasks = await Task.find({ assignees: userId });
    const createdTasks = await Task.find({ createdBy: userId });

    const taskStats = {
      assigned: {
        total: assignedTasks.length,
        completed: assignedTasks.filter(t => t.status === "Done").length,
        inProgress: assignedTasks.filter(t => t.status === "In Progress").length,
        todo: assignedTasks.filter(t => t.status === "To Do").length,
      },
      created: createdTasks.length,
    };

    // Get viewed tasks for this user
    const viewedTaskIds = await ActivityLog.distinct("resourceId", {
      user: userId,
      action: "viewed_task",
      resourceType: "Task"
    });

    // Calculate unviewed assigned tasks
    const unviewedTasks = assignedTasks.filter(
      task => !viewedTaskIds.some(id => id.toString() === task._id.toString())
    );

    res.status(200).json({
      user,
      taskStats,
      viewedTasksCount: viewedTaskIds.length,
      unviewedTasksCount: unviewedTasks.length,
    });
  } catch (error) {
    console.error("Error fetching user profile by ID:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Get user activity history
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, action } = req.query;

    // Check permissions
    if (!["admin", "super_admin", "chief_manager", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    const query = { user: userId };
    if (action) {
      query.action = action;
    }

    const activities = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("resourceId", "title name");

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Get user login history
const getUserLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check permissions
    if (!["admin", "super_admin", "chief_manager", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    const loginHistory = await ActivityLog.find({
      user: userId,
      action: "logged_in",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments({
      user: userId,
      action: "logged_in",
    });

    res.status(200).json({
      logins: loginHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Get tasks that user viewed or not viewed
const getUserTaskViews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter = "all" } = req.query; // all, viewed, unviewed

    // Check permissions
    if (!["admin", "super_admin", "chief_manager", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    // Get all tasks assigned to user
    const assignedTasks = await Task.find({ assignees: userId })
      .populate("createdBy", "name email")
      .populate("responsibleManager", "name email")
      .sort({ createdAt: -1 });

    // Get viewed task IDs
    const viewedTaskLogs = await ActivityLog.find({
      user: userId,
      action: "viewed_task",
      resourceType: "Task"
    }).sort({ createdAt: -1 });

    const viewedTaskIds = new Set(viewedTaskLogs.map(log => log.resourceId.toString()));
    const viewedTaskTimestamps = {};
    viewedTaskLogs.forEach(log => {
      const taskId = log.resourceId.toString();
      if (!viewedTaskTimestamps[taskId]) {
        viewedTaskTimestamps[taskId] = log.createdAt;
      }
    });

    // Categorize tasks
    const tasksWithViewStatus = assignedTasks.map(task => ({
      ...task.toObject(),
      viewed: viewedTaskIds.has(task._id.toString()),
      lastViewedAt: viewedTaskTimestamps[task._id.toString()] || null,
    }));

    let filteredTasks = tasksWithViewStatus;
    if (filter === "viewed") {
      filteredTasks = tasksWithViewStatus.filter(t => t.viewed);
    } else if (filter === "unviewed") {
      filteredTasks = tasksWithViewStatus.filter(t => !t.viewed);
    }

    res.status(200).json({
      tasks: filteredTasks,
      summary: {
        total: assignedTasks.length,
        viewed: tasksWithViewStatus.filter(t => t.viewed).length,
        unviewed: tasksWithViewStatus.filter(t => !t.viewed).length,
      },
    });
  } catch (error) {
    console.error("Error fetching user task views:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    // Проверка наличия файла
    if (!req.file) {
      return res.status(400).json({ message: "Файл не загружен" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `avatar-${req.user._id}-${uniqueSuffix}.webp`;
    const filepath = path.join(avatarsDir, filename);

    // Обработка изображения с Sharp
    // - Resize до 200x200
    // - Конвертация в WebP для оптимизации размера
    // - Качество 80%
    await sharp(req.file.buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Удаление старого аватара если он был локальным
    if (user.profilePicture) {
      const oldAvatarUrl = user.profilePicture;
      // Проверяем что это локальный файл (не Cloudinary URL)
      if (oldAvatarUrl.includes('/uploads/avatars/')) {
        const oldFilename = oldAvatarUrl.split('/').pop();
        const oldFilepath = path.join(avatarsDir, oldFilename);

        // Удаляем старый файл если существует
        if (fs.existsSync(oldFilepath)) {
          fs.unlinkSync(oldFilepath);
        }
      }
    }

    // Формируем URL для нового аватара
    const backendUrl = process.env.NODE_ENV === 'production'
      ? process.env.PRODUCTION_BACKEND_URL || process.env.BACKEND_URL
      : process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;

    const avatarUrl = `${backendUrl}/uploads/avatars/${filename}`;

    // Обновляем профиль пользователя
    user.profilePicture = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Аватар успешно загружен",
      data: {
        profilePicture: avatarUrl,
      },
    });

  } catch (error) {
    console.error("Ошибка загрузки аватара:", error);

    // Обработка ошибок Multer
    if (error.message && error.message.includes('Разрешены только изображения')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Ошибка загрузки аватара" });
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
  uploadAvatar,
  get2FAStatus,
  enable2FA,
  verify2FA,
  disable2FA,
  getAllUsers,
  deleteUser,
  getUserProfileById,
  getUserActivity,
  getUserLoginHistory,
  getUserTaskViews,
};
