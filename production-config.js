// Production Configuration for Vazifa Project
// Domain: https://vazifa.online

const productionConfig = {
  // Frontend Configuration
  frontend: {
    domain: "https://vazifa.online",
    buildCommand: "npm run build",
    outputDir: "dist",
    environmentVariables: {
      VITE_API_URL: "https://api.vazifa.online/api-v1",
      VITE_PRODUCTION_API_URL: "https://api.vazifa.online/api-v1",
      VITE_DOMAIN: "https://vazifa.online",
      VITE_APP_CLOUDINARY_CLOUD_NAME: "dlvubqfkj",
      VITE_APP_CLOUDINARY_UPLOAD_PRESET: "da121806-44c2-4a62-8ca1-5af331bc8d38"
    }
  },

  // Backend Configuration
  backend: {
    domain: "https://api.vazifa.online",
    port: process.env.PORT || 5001,
    environmentVariables: {
      NODE_ENV: "production",
      FRONTEND_URL: "https://vazifa.online",
      PRODUCTION_FRONTEND_URL: "https://vazifa.online",
      BACKEND_URL: "https://api.vazifa.online",
      PRODUCTION_BACKEND_URL: "https://api.vazifa.online",
      // Database and other sensitive configs should be set in production environment
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      ARCJET_KEY: process.env.ARCJET_KEY,
      ARCJET_ENV: "production"
    }
  },

  // CORS Configuration
  cors: {
    allowedOrigins: [
      "https://vazifa.online",
      "https://www.vazifa.online",
      "https://vazifa.online/",
      "https://www.vazifa.online/"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },

  // File Upload Configuration
  uploads: {
    maxFileSize: "10MB",
    allowedTypes: ["image/*", "application/pdf", "text/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    uploadPath: "/uploads",
    staticFileServing: {
      cacheControl: "public, max-age=31536000",
      corsHeaders: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    }
  },

  // Security Configuration
  security: {
    trustProxy: true,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  },

  // Deployment Notes
  deployment: {
    notes: [
      "1. Set NODE_ENV=production in production environment",
      "2. Configure SSL certificates for HTTPS",
      "3. Set up reverse proxy (nginx) if needed",
      "4. Configure environment variables in production",
      "5. Set up MongoDB connection for production",
      "6. Configure SendGrid for email functionality",
      "7. Set up file upload directory with proper permissions",
      "8. Configure Arcjet for production security",
      "9. Test CORS configuration with production domain",
      "10. Set up monitoring and logging for production"
    ]
  }
};

export default productionConfig;
