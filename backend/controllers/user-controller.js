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
    const { name, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name;
    user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);

    res.status(500).json({ message: "Server error" });
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
      user.name,
      "Your 2FA Verification Code",
      `Your verification code is: <b>${otp}</b>
      <br>
      <br>
      This code will expire in 10 minutes.
      </p>`,
      "2FA Code",
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

export {
  changePassword,
  getUserProfile,
  updateUserProfile,
  get2FAStatus,
  enable2FA,
  verify2FA,
  disable2FA,
};
