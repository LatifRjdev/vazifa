import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const createTestUser = async () => {
  try {
    await connectDB();

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "testuser@example.com" });
    
    if (existingUser) {
      console.log("Test user already exists");
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    // Create test user
    const testUser = await User.create({
      email: "testuser@example.com",
      password: hashedPassword,
      name: "Test User",
      isEmailVerified: true, // Set as verified so we can login
    });

    console.log("Test user created successfully:", testUser.email);
    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
};

createTestUser();
