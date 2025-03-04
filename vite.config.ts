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
    port: 5000,
    hmr: {
      clientPort: process.env.DOCKER ? 5000 : 443,
      protocol: process.env.DOCKER ? 'ws' : 'wss',
      path: '/ws',
      timeout: 5000,
      secure: !process.env.DOCKER,
      host: process.env.REPL_ID 
        ? `${process.env.REPL_ID}-00-3rcdlm792p3bi.picard.replit.dev` 
        : process.env.DOCKER ? 'localhost' : '0.0.0.0'
    }
  },
});
