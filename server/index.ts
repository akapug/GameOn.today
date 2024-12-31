import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Production configuration
if (process.env.NODE_ENV === "production") {
  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Serve static files from the dist/public directory with proper MIME types
  app.use(express.static(path.join(__dirname, "..", "public"), {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filepath) => {
      // Set proper MIME types for Vite assets
      if (filepath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filepath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  // Production error handler with improved static file handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);

    // Don't leak error details in production
    const isProd = process.env.NODE_ENV === "production";
    const status = err.status || err.statusCode || 500;
    const message = isProd ? "Internal Server Error" : (err.message || "Internal Server Error");

    if (res.headersSent) {
      return;
    }

    // Handle API errors
    if (_req.path.startsWith("/api")) {
      return res.status(status).json({ message });
    }

    // For non-API routes in production serve index.html
    if (isProd) {
      return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
    }

    res.status(status).send(message);
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Production static file serving - catch-all route for SPA
    app.get("*", (req, res, next) => {
      // Don't handle API routes here
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(__dirname, "..", "public", "index.html"));
    });
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
})();