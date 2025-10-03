import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable compression
app.use(compression());

// Serve static files from build/client
app.use(express.static(join(__dirname, "build/client"), {
  maxAge: "1y",
  immutable: true,
}));

// Proxy API requests to backend
app.use('/api-v1', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request:', req.method, req.url, '-> http://localhost:5001' + req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response:', proxyRes.statusCode, req.url);
  }
}));

// For React Router v7, we need to handle SSR differently
// Import the server build
const build = await import("./build/server/index.js");

// Create request handler - use express middleware instead of app.all
app.use(async (req, res, next) => {
  try {
    // Use the default export from the server build
    const handler = build.default;

    if (typeof handler === 'function') {
      // Call the handler with the request
      return handler(req, res, next);
    } else {
      // Fallback: serve index.html for client-side routing
      res.sendFile(join(__dirname, "build/client/index.html"));
    }
  } catch (error) {
    console.error('Request handler error:', error);
    next(error);
  }
});

const port = process.env.PORT || 3001;
const host = "0.0.0.0"; // Bind to all interfaces

app.listen(port, host, () => {
  console.log(`React Router SSR server running on http://${host}:${port}`);
  console.log(`API requests will be proxied to http://localhost:5001`);
});
