import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import { setupVite, serveStatic } from "./vite";
import routes from "./routes";

const app = express();
const server = createServer(app);
app.use(express.json());

// API routes
app.use("/api", routes);

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    setupVite(app, server);
  });
}

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});