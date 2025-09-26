import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/users.js";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

console.log("Using MongoDB URI:", MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log

async function createVerifiedSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: "superadmin@vazifa.com" });
    
    if (existingSuperAdmin) {
      // Update existing user to be verified
      existingSuperAdmin.isEmailVerified = true;
      await existingSuperAdmin.save();
      console.log("Super admin updated to verified status!");
    } else {
      // Create new verified super admin
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

      await superAdmin.save();
      console.log("Verified super admin created successfully!");
    }

    console.log("Email: superadmin@vazifa.com");
    console.log("Password: SuperAdmin123!");
    console.log("Role: super_admin");
    console.log("Status: Verified");

  } catch (error) {
    console.error("Error creating verified super admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createVerifiedSuperAdmin();
