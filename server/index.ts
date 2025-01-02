import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { isDatabaseConnected, getDb } from "./services/database";

const app = express();
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

// Check database connection for API routes only
app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
  if (!isDatabaseConnected()) {
    try {
      // Attempt to initialize database connection without running migrations
      getDb();
      next();
    } catch (error) {
      return res.status(503).json({ 
        message: "Database connection not available",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    next();
  }
});

(async () => {
  try {
    const server = registerRoutes(app);

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
      await setupVite(app, server);
    } else {
      log("Starting production server...");
      serveStatic(app);
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();