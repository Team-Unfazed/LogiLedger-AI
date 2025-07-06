import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/docs': 'http://localhost:3000',
    },
  },
  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
  },
});
