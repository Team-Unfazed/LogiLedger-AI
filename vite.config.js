import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import express from "express";
import cors from "cors";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "api-server",
      configureServer(server) {
        const app = express();
        app.use(cors());
        app.use(express.json());

        // Simple ping endpoint
        app.get("/api/ping", (req, res) => {
          res.json({
            message: "LogiLedger AI API is running!",
            timestamp: new Date().toISOString(),
          });
        });

        // Registration endpoint
        app.post("/api/auth/register", (req, res) => {
          console.log("Registration request:", req.body);
          const { name, email, userType } = req.body;

          if (!name || !email || !userType) {
            return res.status(400).json({
              success: false,
              message: "Name, email, and user type are required",
            });
          }

          // Mock successful registration
          res.json({
            success: true,
            token: "mock-jwt-token",
            user: {
              id: "mock-user-id",
              name,
              email,
              userType,
              companyName: req.body.companyName || "",
              createdAt: new Date().toISOString(),
            },
            message: "Registration successful",
          });
        });

        // Login endpoint
        app.post("/api/auth/login", (req, res) => {
          const { email, password } = req.body;

          if (!email || !password) {
            return res.status(400).json({
              success: false,
              message: "Email and password are required",
            });
          }

          // Mock successful login
          res.json({
            success: true,
            token: "mock-jwt-token",
            user: {
              id: "mock-user-id",
              name: "Test User",
              email,
              userType: "company",
              companyName: "Test Company",
              createdAt: new Date().toISOString(),
            },
            message: "Login successful",
          });
        });

        server.middlewares.use("/api", app);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
  },
});
