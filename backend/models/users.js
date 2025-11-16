import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: false, // Made optional for phone-only users
      unique: true,
      sparse: true, // Allow null values with unique constraint
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: false, select: false }, // Not required for OAuth users
    name: { type: String, required: true, trim: true },
    lastName: { type: String, required: false, trim: true },
    phoneNumber: { 
      type: String, 
      required: false, // Will validate that either email or phone exists
      unique: true,
      sparse: true, // Allow null values with unique constraint
      trim: true 
    },
    profilePicture: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    preferredAuthMethod: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email',
    },
    lastLogin: { type: Date },
    // OAuth fields
    authProvider: { 
      type: String, 
      enum: ['local', 'google', 'apple'], 
      default: 'local' 
    },
    googleId: { type: String },
    appleId: { type: String },
    // Global role system
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'manager', 'member'],
      default: 'member'
    },
    notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
    settings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      smsNotificationTypes: {
        type: [String],
        default: ['verification', 'otp', 'password_reset'], // Only critical by default
        enum: [
          'verification',
          'otp',
          'password_reset',
          'task_notification',
          'workspace_invite',
          'general_notification',
        ],
      },
    },
    is2FAEnabled: { type: Boolean, default: false },
    twoFAOtp: { type: String, select: false },
    twoFAOtpExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Pre-save validation: Ensure either email or phone number exists
userSchema.pre('save', function(next) {
  if (!this.email && !this.phoneNumber) {
    next(new Error('User must have either an email or phone number'));
  } else {
    next();
  }
});

// Instance method to check if user can receive SMS
userSchema.methods.canReceiveSMS = function() {
  return (
    this.phoneNumber &&
    this.isPhoneVerified &&
    this.settings.smsNotifications
  );
};

// Instance method to check if notification type is enabled for SMS
userSchema.methods.isSMSNotificationEnabled = function(notificationType) {
  return (
    this.canReceiveSMS() &&
    this.settings.smsNotificationTypes.includes(notificationType)
  );
};

const User = mongoose.model("User", userSchema);

export default User;
