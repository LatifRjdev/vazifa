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
    fileSize: 50 * 1024 * 1024, // 50MB limit
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

// Serve uploaded files with proper content types
router.get("/:filename", authenticateUser, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();

    // Set appropriate content type based on file extension
    let contentType = 'application/octet-stream';
    
    // Image types
    if (['.jpg', '.jpeg'].includes(fileExtension)) {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else if (fileExtension === '.gif') {
      contentType = 'image/gif';
    } else if (fileExtension === '.webp') {
      contentType = 'image/webp';
    } else if (fileExtension === '.svg') {
      contentType = 'image/svg+xml';
    }
    // Video types
    else if (fileExtension === '.mp4') {
      contentType = 'video/mp4';
    } else if (fileExtension === '.webm') {
      contentType = 'video/webm';
    } else if (fileExtension === '.ogg') {
      contentType = 'video/ogg';
    } else if (fileExtension === '.avi') {
      contentType = 'video/x-msvideo';
    } else if (fileExtension === '.mov') {
      contentType = 'video/quicktime';
    }
    // Document types
    else if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.doc', '.docx'].includes(fileExtension)) {
      contentType = 'application/msword';
    } else if (['.xls', '.xlsx'].includes(fileExtension)) {
      contentType = 'application/vnd.ms-excel';
    } else if (['.ppt', '.pptx'].includes(fileExtension)) {
      contentType = 'application/vnd.ms-powerpoint';
    }
    // Text types
    else if (fileExtension === '.txt') {
      contentType = 'text/plain';
    } else if (fileExtension === '.json') {
      contentType = 'application/json';
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    
    // For images, videos, and PDFs, allow inline viewing
    if (contentType.startsWith('image/') || contentType.startsWith('video/') || contentType === 'application/pdf') {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      // For other files, force download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    // Enable caching for static files
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({
      message: "Error serving file",
      error: error.message,
    });
  }
});

// Preview endpoint for files (returns file info without downloading)
router.get("/:filename/info", authenticateUser, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();

    // Determine file type
    let fileType = 'other';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileExtension)) {
      fileType = 'image';
    } else if (['.mp4', '.webm', '.ogg', '.avi', '.mov'].includes(fileExtension)) {
      fileType = 'video';
    } else if (fileExtension === '.pdf') {
      fileType = 'pdf';
    } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExtension)) {
      fileType = 'document';
    }

    res.json({
      filename,
      size: stats.size,
      extension: fileExtension,
      fileType,
      uploadDate: stats.birthtime,
      modifiedDate: stats.mtime,
      canPreview: ['image', 'video', 'pdf'].includes(fileType)
    });

  } catch (error) {
    console.error("File info error:", error);
    res.status(500).json({
      message: "Error getting file info",
      error: error.message,
    });
  }
});

export default router;
