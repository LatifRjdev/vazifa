// Production Configuration for Vazifa Application
module.exports = {
  // Domain Configuration
  domains: {
    frontend: 'https://protocol.oci.tj',
    backend: 'https://ptapi.oci.tj',
    api: 'https://ptapi.oci.tj/api-v1'
  },

  // Server Configuration
  server: {
    backend: {
      port: 5001,
      host: '0.0.0.0',
      cors: {
        origin: ['https://protocol.oci.tj'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      }
    },
    frontend: {
      port: 3000,
      host: '0.0.0.0'
    }
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://ptapi.oci.tj"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    }
  },

  // Database Configuration
  database: {
    mongodb: {
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      }
    }
  },

  // Logging Configuration
  logging: {
    level: 'info',
    format: 'combined',
    files: {
      error: '/var/log/vazifa/error.log',
      combined: '/var/log/vazifa/access.log'
    }
  },

  // Performance Configuration
  performance: {
    compression: true,
    cache: {
      maxAge: 86400000, // 1 day
      staticAssets: 31536000000 // 1 year
    }
  }
};
