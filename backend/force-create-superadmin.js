import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/users.js";

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Use the exact same connection string as the main server
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB with URI:", process.env.MONGODB_URI);

    // First, let's check if any users exist
    const allUsers = await User.find({});
    console.log("Total users in database:", allUsers.length);
    
    if (allUsers.length > 0) {
      console.log("Existing users:");
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
    }

    // Delete existing superadmin if exists
    const existingSuperAdmin = await User.findOneAndDelete({ email: "superadmin@vazifa.com" });
    if (existingSuperAdmin) {
      console.log("Deleted existing superadmin");
    }

    // Create new superadmin
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 10);
    
    const superAdmin = new User({
      email: "superadmin@vazifa.com",
      password: hashedPassword,
      name: "Super Admin",
      lastName: "System",
      role: "super_admin",
      isEmailVerified: true,
      authProvider: "local"
    });

    const savedUser = await superAdmin.save();
    console.log("✅ Super admin created successfully!");
    console.log("User ID:", savedUser._id);
    console.log("Email: superadmin@vazifa.com");
    console.log("Password: SuperAdmin123!");
    console.log("Role: super_admin");
    console.log("Verified: true");

    // Verify the user was created
    const verifyUser = await User.findOne({ email: "superadmin@vazifa.com" });
    if (verifyUser) {
      console.log("✅ Verification successful - user found in database");
    } else {
      console.log("❌ Verification failed - user not found");
    }

  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

createSuperAdmin();
