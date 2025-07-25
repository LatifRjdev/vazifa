import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticateUser } from "../middleware/auth-middleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

// Upload endpoint
router.post("/", authenticateUser, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create file URL for local storage - files are served from backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_BACKEND_URL || 'https://api.vazifa.online'
      : process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        secure_url: fileUrl,
        public_id: req.file.filename,
        resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw',
        format: path.extname(req.file.originalname).slice(1),
        bytes: req.file.size,
        original_filename: req.file.originalname,
        // Add the actual MIME type for proper file handling
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
});

export default router;
