import jwt from "jsonwebtoken";
import User from "../models/users.js";
import { verifyJWT } from "../libs/jwt-verify.js";

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: "Authentication required", isValid: false });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === 'null' || token === 'undefined') {
      return res
        .status(401)
        .json({ message: "Invalid token format", isValid: false });
    }

    const decoded = verifyJWT(token);

    if (!decoded.isValid) {
      // Reduce log spam - only log unique error types
      if (decoded.message !== 'jwt malformed') {
        console.error("Token verification failed:", decoded.message);
      }
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
    // Reduce log spam for malformed JWT
    if (!error.message?.includes('jwt malformed')) {
      console.error("Auth error:", error.message);
    }
    res.status(401).json({ message: "Invalid token", isValid: false });
  }
};

export { authenticateUser };
