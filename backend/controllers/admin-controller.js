import User from "../models/users.js";
import { hasPermission } from "../middleware/role-middleware.js";

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -twoFAOtp -twoFAOtpExpires')
      .sort({ createdAt: -1 });

    res.status(200).json({
      users,
      total: users.length,
      roles: {
        super_admin: users.filter(u => u.role === 'super_admin').length,
        admin: users.filter(u => u.role === 'admin').length,
        manager: users.filter(u => u.role === 'manager').length,
        member: users.filter(u => u.role === 'member').length
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user role (super admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['super_admin', 'admin', 'manager', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent self-demotion from super_admin
    if (req.user._id.toString() === userId && req.user.role === 'super_admin' && role !== 'super_admin') {
      return res.status(400).json({ message: "Cannot demote yourself from super admin" });
    }

    // Only super admin can create other super admins
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "Only super admin can create other super admins" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: "User role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (super admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deletion of other super admins unless you're also super admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "Cannot delete super admin" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user statistics (admin only)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const unverifiedUsers = totalUsers - verifiedUsers;
    
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const recentUsers = await User.find({})
      .select('-password -twoFAOtp -twoFAOtpExpires')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      roleStats,
      recentUsers
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats
};
