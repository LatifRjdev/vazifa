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

const updateTestUser = async () => {
  try {
    await connectDB();

    // Find and update the test user
    const updatedUser = await User.findOneAndUpdate(
      { email: "testuser@example.com" },
      { isEmailVerified: true },
      { new: true }
    );

    if (updatedUser) {
      console.log("Test user updated successfully:", updatedUser.email);
      console.log("isEmailVerified:", updatedUser.isEmailVerified);
    } else {
      console.log("Test user not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating test user:", error);
    process.exit(1);
  }
};

updateTestUser();
