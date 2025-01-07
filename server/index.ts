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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register API routes first
  const server = registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const startupTimeout = setTimeout(() => {
    console.error('Server startup timeout exceeded');
    process.exit(1);
  }, 30000);

  if (process.env.NODE_ENV !== "production") {
    log("Starting development server with Vite...");
    await setupVite(app, server);
    clearTimeout(startupTimeout);
  } else {
    // Production: Serve static files with enhanced error handling
    log("Starting production server...");
    const staticPath = path.join(__dirname, "..", "dist", "public");
    log(`Serving static files from: ${staticPath}`);

    // Verify static directory exists
    try {
      const fs = await import('fs');
      if (!fs.existsSync(staticPath)) {
        throw new Error(`Static directory not found: ${staticPath}`);
      }
      log(`Static directory exists and is accessible`);
    } catch (error) {
      console.error('Static directory verification failed:', error);
      process.exit(1);
    }

    // First, serve the assets directory with appropriate cache headers
    app.use('/assets', express.static(path.join(staticPath, 'assets'), {
      maxAge: '1y',
      etag: true,
      index: false,
      setHeaders: (res, path) => {
        // Set proper content types for common file types
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
          log(`Serving JavaScript file: ${path}`);
        } else if (path.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
          log(`Serving CSS file: ${path}`);
        }
      }
    }));

    // Then serve other static files
    app.use(express.static(staticPath, {
      maxAge: '1d',
      etag: true,
      index: false
    }));

    // Add specific error handling for static assets
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/assets/')) {
        log(`Static asset error: ${err.message} for ${req.path}`);
        return res.status(404).send('Asset not found');
      }
      next(err);
    });

    // Finally, handle all other routes
    app.get("*", (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith("/api")) return next();

      log(`Serving index.html for path: ${req.path}`);
      // Send index.html for all other routes (SPA fallback)
      res.sendFile(path.join(staticPath, "index.html"), {
        headers: {
          'Content-Type': 'text/html',
        }
      }, (err) => {
        if (err) {
          log(`Error serving index.html: ${err.message}`);
          next(err);
        }
      });
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Server URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  });
})();