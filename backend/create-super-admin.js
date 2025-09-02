import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/users.js";

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa");
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      console.log("Super admin already exists:", existingSuperAdmin.email);
      process.exit(0);
    }

    // Create super admin user
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
    console.log("Super admin created successfully!");
    console.log("Email: superadmin@vazifa.com");
    console.log("Password: SuperAdmin123!");
    console.log("Role: super_admin");

  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

createSuperAdmin();
