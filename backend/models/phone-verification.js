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
      required: false, // Optional - for backward compatibility
      select: false, // Don't return code by default
    },
    verificationToken: {
      type: String,
      required: false, // For link-based verification
      unique: true,
      sparse: true,
      select: false,
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

// Static method to create verification with link token
phoneVerificationSchema.statics.createVerification = async function (
  phoneNumber,
  type,
  userId = null,
  metadata = {},
  useLinkVerification = true // New parameter for link-based verification
) {
  const bcrypt = (await import("bcrypt")).default;
  const crypto = (await import("crypto")).default;
  
  // Delete any existing unused verifications for this phone and type
  await this.deleteMany({
    phoneNumber,
    type,
    isUsed: false,
  });
  
  let code = null;
  let hashedCode = null;
  let verificationToken = null;
  
  if (useLinkVerification) {
    // Generate secure token for link-based verification
    verificationToken = crypto.randomBytes(32).toString('hex');
  } else {
    // Generate 6-digit code for backward compatibility
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    hashedCode = await bcrypt.hash(code, salt);
  }
  
  // Create new verification
  const verification = await this.create({
    phoneNumber,
    code: hashedCode,
    verificationToken,
    type,
    userId,
    metadata,
  });
  
  // Return code/token and verification document
  return { code, verificationToken, verification };
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

// Static method to verify token (for link-based verification)
phoneVerificationSchema.statics.verifyToken = async function (token) {
  // Find verification by token
  const verification = await this.findOne({
    verificationToken: token,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).select("+verificationToken");
  
  if (!verification) {
    return {
      success: false,
      message: "Ссылка недействительна или истек срок действия",
    };
  }
  
  // Mark as used
  verification.isUsed = true;
  await verification.save();
  
  return {
    success: true,
    message: "Телефон успешно подтвержден",
    verification,
    phoneNumber: verification.phoneNumber,
    type: verification.type,
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

// Exponential rate limiting: 1min → 10min → 30min → 60min
phoneVerificationSchema.statics.checkExponentialRateLimit = async function (
  phoneNumber,
  type
) {
  // Get all verifications for this phone in last 24 hours
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentVerifications = await this.find({
    phoneNumber,
    type,
    createdAt: { $gte: last24Hours },
  }).sort({ createdAt: -1 });
  
  if (recentVerifications.length === 0) {
    // First attempt - allow immediately
    return {
      allowed: true,
      attemptNumber: 1,
      waitMinutes: 0,
      message: 'Первая попытка'
    };
  }
  
  const attemptNumber = recentVerifications.length + 1;
  const lastAttempt = recentVerifications[0];
  
  // Exponential backoff: 1, 10, 30, 60, 120, 240 minutes
  const waitMinutes = attemptNumber === 1 ? 0 :
                     attemptNumber === 2 ? 1 :
                     attemptNumber === 3 ? 10 :
                     attemptNumber === 4 ? 30 :
                     attemptNumber === 5 ? 60 :
                     attemptNumber === 6 ? 120 :
                     240; // Max 4 hours
  
  const timeSinceLastAttempt = Date.now() - lastAttempt.createdAt.getTime();
  const requiredWaitTime = waitMinutes * 60 * 1000;
  
  if (timeSinceLastAttempt < requiredWaitTime) {
    const remainingMinutes = Math.ceil((requiredWaitTime - timeSinceLastAttempt) / 60000);
    
    return {
      allowed: false,
      attemptNumber,
      waitMinutes: remainingMinutes,
      message: `Попытка №${attemptNumber}. Следующая попытка через ${remainingMinutes} минут`,
      nextAttemptAt: new Date(lastAttempt.createdAt.getTime() + requiredWaitTime)
    };
  }
  
  // Enough time has passed
  return {
    allowed: true,
    attemptNumber,
    waitMinutes: 0,
    message: `Попытка №${attemptNumber} разрешена`
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
