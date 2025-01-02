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

// Cleanup function to be called on process termination
function cleanup() {
  log("Server shutting down...");
  process.exit(0);
}

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  cleanup();
});

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

    // Setup appropriate server mode
    if (process.env.NODE_ENV !== "production") {
      log("Starting development server with Vite...");
      // Setup Vite in middleware mode before starting the server
      await setupVite(app, server);
    } else {
      log("Starting production server...");
      serveStatic(app);
    }

    // Always use port 5000 as specified in the development guidelines
    const PORT = 5000;
    const MAX_RETRIES = 3;
    let currentTry = 0;

    const startServer = () => {
      // First check if the port is in use
      const net = require('net');
      const testServer = net.createServer()
        .once('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            log(`Port ${PORT} is already in use. Attempting to force close...`);
            // Try to force close the port
            testServer.once('close', () => {
              net.createConnection({ port: PORT })
                .on('error', () => {
                  // Port is actually free now, start server
                  startServerOnPort();
                })
                .on('connect', () => {
                  // Port is still in use
                  currentTry++;
                  if (currentTry < MAX_RETRIES) {
                    log(`Attempt ${currentTry + 1} to free port ${PORT}...`);
                    setTimeout(startServer, 1000);
                  } else {
                    log(`Failed to free port ${PORT} after ${MAX_RETRIES} attempts.`);
                    log("Please manually kill any process using port 5000 and try again.");
                    process.exit(1);
                  }
                });
            })
            .close();
          } else {
            console.error('Server error:', err);
            process.exit(1);
          }
        })
        .once('listening', () => {
          testServer.once('close', () => {
            startServerOnPort();
          }).close();
        })
        .listen(PORT);
    };

    const startServerOnPort = () => {
      server.listen(PORT, "0.0.0.0", () => {
        log(`Server running on port ${PORT}`);
        if (process.env.NODE_ENV !== "production") {
          log("Development server is ready and waiting for changes...");
        }
      }).on('error', (error: any) => {
        console.error("Failed to start server:", error);
        process.exit(1);
      });
    };

    // Before starting a new server instance, attempt to cleanup any existing one
    process.on('exit', () => {
      try {
        server.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
    });

    startServer();

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();