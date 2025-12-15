import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

dotenv.config();

async function createTechAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log("❌ Usage: node create-tech-admin.js <email>");
      console.log("\nExample:");
      console.log("  node create-tech-admin.js tech@example.com");
      await mongoose.disconnect();
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      console.log("\nPlease make sure the user exists in the database.");
      await mongoose.disconnect();
      process.exit(1);
    }

    // Check if already tech admin
    if (user.role === 'tech_admin') {
      console.log(`ℹ️  User ${user.name} (${user.email}) is already a tech admin`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Store old role for logging
    const oldRole = user.role;
    
    // Update to tech_admin
    user.role = 'tech_admin';
    await user.save();

    console.log("=" .repeat(80));
    console.log("✅ TECH ADMIN CREATED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("\n📋 User Details:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phoneNumber || 'Not set'}`);
    console.log(`   Previous Role: ${oldRole}`);
    console.log(`   New Role: tech_admin`);
    
    console.log("\n🔧 This user can now access:");
    console.log("   ✓ Tech Admin Dashboard");
    console.log("   ✓ System Health Monitoring");
    console.log("   ✓ SMS Logs & Analytics");
    console.log("   ✓ Database Statistics");
    console.log("   ✓ User Management (view/delete)");
    console.log("   ✓ Task Management (view/delete)");
    console.log("   ✓ Queue Management");
    
    console.log("\n🚫 This user CANNOT:");
    console.log("   ✗ Change user roles (only super_admin can)");
    console.log("   ✗ Access business operations");
    console.log("   ✗ Delete other admin accounts");
    
    console.log("\n🌐 Access the dashboard at:");
    console.log(`   ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tech-admin`);
    
    console.log("\n" + "=".repeat(80));
    console.log("Next steps:");
    console.log("1. Restart the backend server if it's running");
    console.log("2. Ask the user to log out and log back in");
    console.log("3. The tech admin menu should appear in the sidebar");
    console.log("=".repeat(80) + "\n");

    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTechAdmin();
