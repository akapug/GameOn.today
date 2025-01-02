import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./services/database";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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

// Health check endpoint that doesn't require database
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Handle cleanup on process termination
function cleanup() {
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

(async () => {
  try {
    // First, create the HTTP server
    const server = registerRoutes(app);

    // Initialize database connection in background
    initializeDatabase()
      .then(() => {
        log("Database connection established");
      })
      .catch((error) => {
        log(`Warning: Database initialization failed: ${error.message}`);
        log("Server will continue running, but database operations may fail");
      });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      if (!res.headersSent) {
        if (_req.path.startsWith("/api")) {
          return res.status(status).json({ message });
        }
        res.status(status).send(message);
      }
    });

    // Setup Vite for development or static files for production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${PORT} is already in use. Please make sure no other instances are running.`);
        process.exit(1);
      } else {
        throw error;
      }
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();