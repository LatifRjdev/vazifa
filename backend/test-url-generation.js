import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("=".repeat(80));
console.log("🔍 ENVIRONMENT VARIABLE DEBUG SCRIPT");
console.log("=".repeat(80));

console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
console.log("🔗 FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("🔗 PRODUCTION_FRONTEND_URL:", process.env.PRODUCTION_FRONTEND_URL);
console.log("🔗 BACKEND_URL:", process.env.BACKEND_URL);
console.log("🔗 PRODUCTION_BACKEND_URL:", process.env.PRODUCTION_BACKEND_URL);

console.log("\n" + "=".repeat(80));
console.log("🧪 URL GENERATION TESTS");
console.log("=".repeat(80));

// Test the old logic (problematic)
const oldLogicUrl = process.env.NODE_ENV === 'production' 
  ? process.env.PRODUCTION_FRONTEND_URL 
  : process.env.FRONTEND_URL;

console.log("❌ OLD LOGIC RESULT:", oldLogicUrl);

// Test the new logic (fixed)
const newLogicUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';

console.log("✅ NEW LOGIC RESULT:", newLogicUrl);

// Test verification URL generation
const mockToken = "test-token-123";
const verificationUrl = `${newLogicUrl}/verify-email?token=${mockToken}`;
const resetUrl = `${newLogicUrl}/reset-password?tk=${mockToken}`;
const oauthCallbackUrl = `${newLogicUrl}/auth/callback?token=${mockToken}`;

console.log("\n" + "=".repeat(80));
console.log("🔗 GENERATED URLS");
console.log("=".repeat(80));
console.log("📧 Verification URL:", verificationUrl);
console.log("🔐 Reset URL:", resetUrl);
console.log("🔑 OAuth Callback URL:", oauthCallbackUrl);

console.log("\n" + "=".repeat(80));
console.log("✅ URL GENERATION TEST COMPLETE");
console.log("=".repeat(80));

// Check if URLs contain localhost (which would be the problem)
if (verificationUrl.includes('localhost')) {
  console.log("⚠️  WARNING: Verification URL still contains localhost!");
} else {
  console.log("✅ SUCCESS: Verification URL uses production domain");
}

if (resetUrl.includes('localhost')) {
  console.log("⚠️  WARNING: Reset URL still contains localhost!");
} else {
  console.log("✅ SUCCESS: Reset URL uses production domain");
}

if (oauthCallbackUrl.includes('localhost')) {
  console.log("⚠️  WARNING: OAuth callback URL still contains localhost!");
} else {
  console.log("✅ SUCCESS: OAuth callback URL uses production domain");
}
