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

// Enhanced logging middleware for debugging static asset serving
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Debug logging for static asset requests in production
  if (process.env.NODE_ENV === 'production') {
    log(`Incoming request: ${req.method} ${path}`);
    log(`Headers: ${JSON.stringify(req.headers)}`);
  }

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "production" || path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} ${duration}ms${
        capturedJsonResponse ? ` :: ${JSON.stringify(capturedJsonResponse)}` : ''
      }`);
    }

    // Debug logging for responses in production
    if (process.env.NODE_ENV === 'production') {
      log(`Response sent: ${res.statusCode} for ${path} in ${duration}ms`);
      log(`Response headers: ${JSON.stringify(res.getHeaders())}`);
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
    log("Starting development server with Vite...");
    await setupVite(app, server);
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

  const tryPort = async (port: number): Promise<number> => {
    try {
      await new Promise((resolve, reject) => {
        const testServer = server.listen(port, "0.0.0.0", () => {
          testServer.close();
          resolve(port);
        });
        testServer.on('error', reject);
      });
      return port;
    } catch {
      return tryPort(port + 1);
    }
  };

  const PORT = await tryPort(process.env.PORT ? parseInt(process.env.PORT) : 5000);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
})();