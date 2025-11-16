import mongoose from "mongoose";
const { Schema, model } = mongoose;

const phoneVerificationSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      select: false, // Don't return code by default
    },
    type: {
      type: String,
      enum: ["registration", "login", "password_reset", "phone_update"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // May not exist yet for registration
    },
    metadata: {
      ip: String,
      userAgent: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
phoneVerificationSchema.index({ phoneNumber: 1, type: 1, createdAt: -1 });
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired docs

// Static method to create verification code
phoneVerificationSchema.statics.createVerification = async function (
  phoneNumber,
  type,
  userId = null,
  metadata = {}
) {
  const bcrypt = (await import("bcrypt")).default;
  
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the code
  const salt = await bcrypt.genSalt(10);
  const hashedCode = await bcrypt.hash(code, salt);
  
  // Delete any existing unused verifications for this phone and type
  await this.deleteMany({
    phoneNumber,
    type,
    isUsed: false,
  });
  
  // Create new verification
  const verification = await this.create({
    phoneNumber,
    code: hashedCode,
    type,
    userId,
    metadata,
  });
  
  // Return plain code (to send via SMS) and verification document
  return { code, verification };
};

// Static method to verify code
phoneVerificationSchema.statics.verifyCode = async function (
  phoneNumber,
  code,
  type
) {
  const bcrypt = (await import("bcrypt")).default;
  
  // Find the most recent verification
  const verification = await this.findOne({
    phoneNumber,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select("+code");
  
  if (!verification) {
    return {
      success: false,
      message: "Код не найден или истек срок действия",
    };
  }
  
  // Check if max attempts reached
  if (verification.attempts >= verification.maxAttempts) {
    return {
      success: false,
      message: "Превышено максимальное количество попыток",
    };
  }
  
  // Increment attempts
  verification.attempts += 1;
  await verification.save();
  
  // Verify code
  const isValid = await bcrypt.compare(code, verification.code);
  
  if (!isValid) {
    const remainingAttempts = verification.maxAttempts - verification.attempts;
    return {
      success: false,
      message: `Неверный код. Осталось попыток: ${remainingAttempts}`,
      remainingAttempts,
    };
  }
  
  // Mark as used
  verification.isUsed = true;
  await verification.save();
  
  return {
    success: true,
    message: "Код подтвержден успешно",
    verification,
  };
};

// Static method to check rate limiting
phoneVerificationSchema.statics.checkRateLimit = async function (
  phoneNumber,
  type,
  timeWindowMinutes = 60,
  maxRequests = 3
) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const recentVerifications = await this.countDocuments({
    phoneNumber,
    type,
    createdAt: { $gte: timeWindow },
  });
  
  if (recentVerifications >= maxRequests) {
    const oldestRecent = await this.findOne({
      phoneNumber,
      type,
      createdAt: { $gte: timeWindow },
    }).sort({ createdAt: 1 });
    
    const minutesUntilReset = Math.ceil(
      (oldestRecent.createdAt.getTime() +
        timeWindowMinutes * 60 * 1000 -
        Date.now()) /
        60000
    );
    
    return {
      allowed: false,
      message: `Слишком много запросов. Попробуйте через ${minutesUntilReset} минут`,
      minutesUntilReset,
    };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - recentVerifications,
  };
};

// Static method to clean up old verifications
phoneVerificationSchema.statics.cleanupOld = async function (daysOld = 7) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
  });
  
  return {
    deleted: result.deletedCount,
    message: `Удалено ${result.deletedCount} старых верификаций`,
  };
};

const PhoneVerification = model("PhoneVerification", phoneVerificationSchema);

export default PhoneVerification;
