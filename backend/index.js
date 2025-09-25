import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import aj from "./libs/arcjet.js";
import routes from "./routes/index.js";

// Configuration
dotenv.config();
const app = express();

// Trust proxy for production (important for Hostinger)
app.set('trust proxy', 1);

// CORS configuration - must be before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "https://vazifa.online",
      "https://www.vazifa.online",
      "https://protocol.oci.tj",
      "https://www.protocol.oci.tj",
      "http://localhost:3000",
      "http://localhost:5000"
    ];
    
    console.log('CORS check - Origin:', origin);
    console.log('CORS check - Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Cache-Control", 
    "Pragma", 
    "Expires", 
    "X-Requested-With",
    "Accept",
    "Origin",
    "User-Agent",
    "DNT",
    "Keep-Alive",
    "X-Requested-With",
    "If-Modified-Since",
    "Cache-Control",
    "Content-Range",
    "Range"
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security headers - after CORS
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use appropriate logging for production
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    // Set proper MIME types and headers for file downloads
    res.set({
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
}));

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Temporarily disable global Arcjet middleware for testing
// app.use(async (req, res, next) => {
//   const decision = await aj.protect(req, {
//     requested: 5,
//   });

//   console.log("ARCJET DECISION===>", decision.isDenied());

//   if (decision.isDenied()) {
//     if (decision.reason.isRateLimit()) {
//       res.writeHead(429, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ error: "Too Many Requests" }));
//     } else if (decision.reason.isBot()) {
//       res.writeHead(403, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ error: "No bots allowed" }));
//     } else {
//       res.writeHead(403, { "Content-Type": "application/json" });
//       res.end(JSON.stringify({ error: "Forbidden" }));
//     }
//   } else {
//     next();
//   }
// });

// Routes
app.get("/", async (req, res) => {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_FRONTEND_URL || 'https://vazifa.online'
    : process.env.FRONTEND_URL || 'http://localhost:5173';
    
  res.status(200).json({
    message:
      "Welcome to the API of Vazifa Pro Management System. Please refer to the documentation for more information.",
    live: frontendUrl,
    documentation: `${frontendUrl}/docs`,
    domain: "https://vazifa.online",
    api: process.env.NODE_ENV === 'production' 
      ? 'https://api.vazifa.online' 
      : `http://localhost:${process.env.PORT || 5001}`,
  });
});

app.use("/api-v1", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Not found middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
