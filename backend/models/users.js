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
    name: { 
      type: String, 
      required: true, 
      trim: true,
      validate: {
        validator: function(v) {
          // Skip validation for existing users (only validate on registration)
          if (!this.isNew) return true;
          
          // Validate "Имя Фамилия" format for new users - at least 2 words separated by space
          const words = v.trim().split(/\s+/);
          return words.length >= 2;
        },
        message: 'Полное имя должно содержать минимум Имя и Фамилию через пробел'
      }
    },
    lastName: { type: String, required: false, trim: true },
    phoneNumber: { 
      type: String, 
      required: false, // Required for new users, but optional for legacy users
      unique: true,
      sparse: true, // Allow null values with unique constraint
      trim: true,
      validate: {
        validator: function(v) {
          // If phone is provided, validate +992 format (Tajikistan)
          if (!v) return true; // Allow empty for legacy users
          return /^\+992\d{9}$/.test(v);
        },
        message: 'Номер телефона должен быть в формате +992XXXXXXXXX (9 цифр после +992)'
      }
    },
    profilePicture: { type: String },
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
      enum: ['tech_admin', 'super_admin', 'admin', 'chief_manager', 'manager', 'member'],
      default: 'member'
    },
    notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
    settings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true }, // Enable SMS by default
      smsNotificationTypes: {
        type: [String],
        default: [
          'otp',
          'verification',
          'password_reset',
          'task_notification',
          'workspace_invite',
          'general_notification',
        ], // All notification types enabled by default
        enum: [
          'otp',
          'verification',
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
    // Admin management fields
    disabled: { type: Boolean, default: false },
    disabledAt: { type: Date },
    disabledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disabledReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // For admin-created users
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
    this.smsNotifications !== false
  );
};

// Instance method to check if notification type is enabled for SMS
userSchema.methods.isSMSNotificationEnabled = function(notificationType) {
  // If no settings object or smsNotificationTypes array, allow all notifications
  if (!this.settings || !this.settings.smsNotificationTypes) {
    return this.canReceiveSMS();
  }
  
  return (
    this.canReceiveSMS() &&
    this.settings.smsNotificationTypes.includes(notificationType)
  );
};

const User = mongoose.model("User", userSchema);

export default User;
