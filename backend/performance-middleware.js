import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Compression middleware for response optimization
export const compressionMiddleware = compression({
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if the request includes a cache-control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
});

// Rate limiting for API protection and performance
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Слишком много запросов с этого IP, попробуйте позже.',
    retryAfter: '15 минут'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

// Strict rate limiting for auth endpoints
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Слишком много попыток входа, попробуйте позже.',
    retryAfter: '15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.vazifa.online", "https://ptapi.oci.tj"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for OAuth compatibility
});

// CORS optimization
export const corsMiddleware = cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://protocol.oci.tj',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://vazifa.online',
      'https://www.vazifa.online',
      'https://www.protocol.oci.tj',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8081',
      'http://localhost:19006',
      'exp://localhost:8081',
      'exp://192.168.1.78:8081'
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Доступ запрещен CORS политикой'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // Cache preflight response for 24 hours
});

// Response caching middleware
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Don't cache authenticated requests
    if (req.headers.authorization) {
      return next();
    }
    
    // Set cache headers
    res.set({
      'Cache-Control': `public, max-age=${duration}`,
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString(),
    });
    
    next();
  };
};

// Request logging middleware for performance monitoring
export const performanceLogMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow Request: ${method} ${url} - ${statusCode} - ${duration}ms`);
    }
    
    // Log error responses
    if (statusCode >= 400) {
      console.error(`❌ Error Response: ${method} ${url} - ${statusCode} - ${duration}ms`);
    }
    
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development' && statusCode < 400) {
      console.log(`✅ ${method} ${url} - ${statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitorMiddleware = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };
  
  // Warn if memory usage is high
  if (memUsageMB.heapUsed > 500) {
    console.warn(`⚠️ High Memory Usage: ${memUsageMB.heapUsed}MB heap used`);
  }
  
  // Add memory info to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.set('X-Memory-Usage', JSON.stringify(memUsageMB));
  }
  
  next();
};

// Error handling middleware
export const errorHandlingMiddleware = (err, req, res, next) => {
  const { method, url } = req;
  const timestamp = new Date().toISOString();
  
  console.error(`❌ Error [${timestamp}]: ${method} ${url}`, {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Внутренняя ошибка сервера' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: message,
    timestamp,
    path: url,
  });
};

// Health check endpoint
export const healthCheckEndpoint = (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    environment: process.env.NODE_ENV || 'development',
  });
};
