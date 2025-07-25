import jwt from "jsonwebtoken";

export const verifyJWT = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      // Handle expired token
      console.log("Token has expired");
      return {
        isValid: false,
        message: "Token has expired",
      };
    } else if (error.name === "JsonWebTokenError") {
      // Handle invalid token
      console.log("Token is invalid");
      return {
        isValid: false,
        message: "Token is invalid",
      };
    } else {
      //Handle other errors
      console.log("Other error:", error.message);
      return {
        // isValid: false,
        message: "Something went wrong",
      };
    }
  }
};
