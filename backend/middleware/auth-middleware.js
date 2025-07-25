import jwt from "jsonwebtoken";
import User from "../models/users.js";
import { verifyJWT } from "../libs/jwt-verify.js";

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication required", isValid: false });
    }

    const decoded = verifyJWT(token);

    if (decoded.isValid && !decoded.isValid) {
      return res.status(401).json({ message: decoded.message, isValid: false });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found", isValid: false });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Invalid token", isValid: false });
  }
};

export { authenticateUser };
