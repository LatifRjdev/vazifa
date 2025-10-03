import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import { createRequestHandler } from "@react-router/express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable compression
app.use(compression());

// Proxy API requests to backend FIRST (before static files)
app.use('/api-v1', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  secure: false,
  logLevel: 'silent',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Serve static files from build/client
app.use(express.static(join(__dirname, "build/client"), {
  maxAge: "1y",
  immutable: true,
}));

// React Router request handler
app.all("*", createRequestHandler({
  build: await import("./build/server/index.js")
}));

const port = process.env.PORT || 3001;
const host = "0.0.0.0"; // Bind to all interfaces

app.listen(port, host, () => {
  console.log(`React Router SSR server running on http://${host}:${port}`);
  console.log(`API requests will be proxied to http://localhost:5001`);
});
