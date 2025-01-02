import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for development only
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${path} ${res.statusCode} ${duration}ms`;

    // Log all requests in development, only API requests in production
    if (process.env.NODE_ENV !== "production" || path.startsWith("/api")) {
      log(`${logLine}${capturedJsonResponse ? ` :: ${JSON.stringify(capturedJsonResponse)}` : ''}`);
    }
  });

  next();
});

(async () => {
  // Register API routes first
  const server = registerRoutes(app);

  // Error handling middleware with environment-specific responses
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    const isProd = process.env.NODE_ENV === "production";
    const status = err.status || err.statusCode || 500;
    const message = isProd ? "Internal Server Error" : (err.message || "Internal Server Error");

    if (!res.headersSent) {
      if (_req.path.startsWith("/api")) {
        return res.status(status).json({ message });
      }
      res.status(status).send(message);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Development: Use Vite's dev server
    log("Starting development server with Vite...");
    await setupVite(app, server);
  } else {
    // Production: Serve static files
    log("Starting production server...");
    const staticPath = path.join(__dirname, "public");
    log(`Serving static files from: ${staticPath}`);

    // Serve static files with caching headers
    app.use(express.static(staticPath, {
      maxAge: '1y',
      etag: true
    }));

    // Serve assets specifically
    app.use('/assets', express.static(path.join(staticPath, 'assets')));

    // For all other routes, serve index.html
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
})();