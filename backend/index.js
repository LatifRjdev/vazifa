import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import aj from "./libs/arcjet.js";
import routes from "./routes/index.js";
import { getSMPPService } from "./libs/send-sms-bullmq.js";

// Configuration
dotenv.config();
const app = express();

// Trust proxy for production (important for Hostinger)
app.set('trust proxy', 1);

// CORS configuration - must be before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    const productionFrontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
    const allowedOrigins = [
      productionFrontendUrl,
      "http://localhost:5173",
      "http://localhost:5174",
      "https://vazifa.online",
      "https://www.vazifa.online",
      "https://protocol.oci.tj",
      "https://www.protocol.oci.tj",
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:8081", // Expo web server
      "http://localhost:19006", // Alternative Expo port
      "exp://localhost:8081", // Expo development server
      "exp://192.168.1.78:8081" // Expo LAN development server (adjust IP as needed)
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
  .then(() => {
    console.log("Connected to MongoDB");
    
    // Initialize SMPP service for SMS notifications
    try {
      getSMPPService();
      console.log("✅ SMPP Service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize SMPP service:", error.message);
    }
  })
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
  const frontendUrl = process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://protocol.oci.tj';
  const backendUrl = process.env.PRODUCTION_BACKEND_URL || process.env.BACKEND_URL || 'https://ptapi.oci.tj';
    
  res.status(200).json({
    message:
      "Welcome to the API of Vazifa Pro Management System. Please refer to the documentation for more information.",
    live: frontendUrl,
    documentation: `${frontendUrl}/docs`,
    domain: frontendUrl,
    api: backendUrl,
  });
});

app.use("/api-v1", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error with more context
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({ 
    message,
    path: req.path 
  });
});

// Not found middleware
app.use((req, res, next) => {
  res.status(404).json({ 
    message: "Not found",
    path: req.path 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Signal PM2 that app is ready
  if (process.send) {
    process.send('ready');
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  // Don't exit immediately, let PM2 handle restart
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', {
    reason,
    timestamp: new Date().toISOString()
  });
  // Don't exit immediately, let PM2 handle restart
});
