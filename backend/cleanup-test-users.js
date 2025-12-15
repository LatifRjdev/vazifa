import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/users.js";
import PhoneVerification from "./models/phone-verification.js";

dotenv.config();

const testPhoneNumbers = [
  "+992557777509",
  "+992985343331",
  "+992989328080"
];

async function cleanupTestUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🧹 Cleaning up test users and verification records...\n");
    console.log("=" .repeat(70));

    for (const phoneNumber of testPhoneNumbers) {
      console.log(`\n📱 Processing: ${phoneNumber}`);
      
      // Find user
      const user = await User.findOne({ phoneNumber });
      if (user) {
        console.log(`   👤 Found user: ${user.name} (${user.email || 'no email'})`);
        await User.deleteOne({ phoneNumber });
        console.log(`   ✅ User deleted`);
      } else {
        console.log(`   ℹ️  No user found`);
      }

      // Find and delete phone verifications
      const verifications = await PhoneVerification.find({ phoneNumber });
      if (verifications.length > 0) {
        console.log(`   📋 Found ${verifications.length} verification record(s)`);
        await PhoneVerification.deleteMany({ phoneNumber });
        console.log(`   ✅ Verification records deleted`);
      } else {
        console.log(`   ℹ️  No verification records found`);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n✅ Cleanup completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Processed ${testPhoneNumbers.length} phone numbers`);
    console.log(`   Users can now register with these numbers\n`);

  } catch (error) {
    console.error("\n❌ Error during cleanup:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

cleanupTestUsers();
