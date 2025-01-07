import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './client/src/test/setup.ts',
  },
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
      host: '0.0.0.0',
      hmr: {
        clientPort: 443,
        protocol: 'wss',
        host: `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
        timeout: 15000,
        overlay: false,
        reconnect: true,
        maxRetries: 5
      },
      watch: {
        usePolling: true,
        interval: 2000,
        followSymlinks: false
      }
    },
});