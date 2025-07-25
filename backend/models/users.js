import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    profilePicture: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    // Global role system
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'member'],
      default: 'member'
    },
    notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
    settings: {
      emailNotifications: { type: Boolean, default: true },
    },
    is2FAEnabled: { type: Boolean, default: false },
    twoFAOtp: { type: String, select: false },
    twoFAOtpExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
