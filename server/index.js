import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/database.js";

// Import route handlers
import { handleDemo } from "./routes/demo.js";
import {
  handleRegister,
  handleLogin,
  handleVerifyToken,
  authenticateToken,
} from "./routes/auth.js";
import {
  handleCreateConsignment,
  handleGetMyConsignments,
  handleGetAvailableConsignments,
  handleGetPublicConsignments,
  handleGetConsignmentById,
  handleUpdateConsignmentStatus,
  handleSeedConsignments,
  handleGetLocationRecommendations,
} from "./routes/consignments.js";
import {
  handleCreateBid,
  handleGetMyBids,
  handleGetConsignmentBids,
  handleAwardBid,
  handleUpdateBidStatus,
} from "./routes/bids.js";
import {
  handleGetAwardedJobs,
  handleUpdateJobStatus,
  handleUploadInvoice,
  handleGetCompanyJobs,
} from "./routes/jobs.js";
import {
  handleTelegramWebhook,
  handleSendFinancialUpdate,
  handleGetBotStatus,
  handleProcessJobFinancials,
  handleLinkTelegramAccount,
} from "./routes/telegram.js";

export async function createServer() {
  // Connect to MongoDB
  await connectDB();
  
  const app = express();

  // Security middleware
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api/", limiter);

  // CORS configuration
  app.use(
    cors({
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:8080", "http://127.0.0.1:8080"],
      credentials: true,
    }),
  );

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "LogiLedger AI API is running!",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Demo endpoint (for testing)
  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/verify", handleVerifyToken);

  // Consignment routes
  app.post(
    "/api/consignments/create",
    authenticateToken,
    handleCreateConsignment,
  );
  app.get(
    "/api/consignments/my-consignments",
    authenticateToken,
    handleGetMyConsignments,
  );
  app.get(
    "/api/consignments/available",
    authenticateToken,
    handleGetAvailableConsignments,
  );
  app.get("/api/consignments/public", handleGetPublicConsignments);
  app.get("/api/consignments/:id", authenticateToken, handleGetConsignmentById);
  app.put(
    "/api/consignments/:id/status",
    authenticateToken,
    handleUpdateConsignmentStatus,
  );

  // Development-only: Seed consignments for current company user
  app.post(
    "/api/dev/seed-consignments",
    authenticateToken,
    handleSeedConsignments,
  );

  // Location-based recommendations for MSMEs
  app.get(
    "/api/consignments/location-recommendations",
    authenticateToken,
    handleGetLocationRecommendations,
  );

  // Bidding routes
  app.post("/api/bids/create", authenticateToken, handleCreateBid);
  app.get("/api/bids/my-bids", authenticateToken, handleGetMyBids);
  app.get(
    "/api/bids/consignment/:consignmentId",
    authenticateToken,
    handleGetConsignmentBids,
  );
  app.post("/api/bids/:bidId/award", authenticateToken, handleAwardBid);
  app.put("/api/bids/:bidId/status", authenticateToken, handleUpdateBidStatus);

  // Job management routes
  app.get("/api/jobs/awarded", authenticateToken, handleGetAwardedJobs);
  app.get("/api/jobs/company", authenticateToken, handleGetCompanyJobs);
  app.put("/api/jobs/:jobId/status", authenticateToken, handleUpdateJobStatus);
  app.post("/api/jobs/:jobId/invoice", authenticateToken, handleUploadInvoice);

  // Telegram bot integration routes
  app.post("/api/telegram/webhook", handleTelegramWebhook);
  app.post(
    "/api/telegram/financial-update",
    authenticateToken,
    handleSendFinancialUpdate,
  );
  app.get("/api/telegram/bot-status", authenticateToken, handleGetBotStatus);
  app.post(
    "/api/telegram/process-financials",
    authenticateToken,
    handleProcessJobFinancials,
  );
  app.post(
    "/api/telegram/link-account",
    authenticateToken,
    handleLinkTelegramAccount,
  );

  // OCR placeholder routes (for future implementation)
  app.post("/api/ocr/extract", authenticateToken, (req, res) => {
    res.json({
      success: true,
      message: "OCR integration coming soon",
      extractedData: {
        invoiceNumber: "INV-001",
        amount: 5000,
        date: new Date().toISOString(),
        vendor: "Sample Vendor",
        description: "Sample invoice",
        lineItems: [],
      },
    });
  });

  // AI Accounting placeholder routes (for future implementation)
  app.post("/api/ai/accounting", authenticateToken, (req, res) => {
    const { amount, type, description } = req.body;
    res.json({
      success: true,
      message: "AI accounting processed",
      processedData: {
        category: type === "income" ? "transportation_revenue" : "fuel_expense",
        amount: parseFloat(amount),
        type,
        gstAmount: parseFloat(amount) * 0.18,
        suggestions: [
          "Consider setting aside 18% for GST",
          "Track fuel receipts for tax deduction",
          "Maintain digital records for compliance",
        ],
      },
    });
  });

  // Analytics placeholder routes
  app.get("/api/analytics/dashboard", authenticateToken, (req, res) => {
    res.json({
      success: true,
      data: {
        totalConsignments: 15,
        totalBids: 45,
        totalEarnings: 125000,
        successRate: 78,
        pendingJobs: 3,
        completedJobs: 12,
        monthlyGrowth: 15.5,
        popularRoutes: [
          { route: "Mumbai → Delhi", count: 8 },
          { route: "Chennai → Bangalore", count: 6 },
          { route: "Kolkata → Hyderabad", count: 4 },
        ],
      },
    });
  });

  // Tally/Airtable sync placeholder
  app.post("/api/integrations/tally/sync", authenticateToken, (req, res) => {
    res.json({
      success: true,
      message: "Tally sync integration coming soon",
      data: {
        lastSync: new Date().toISOString(),
        recordsSynced: 0,
        status: "ready",
      },
    });
  });

  // UPI payment logs placeholder
  app.post("/api/payments/upi/log", authenticateToken, (req, res) => {
    const { amount, transactionId, description } = req.body;
    res.json({
      success: true,
      message: "UPI payment logged",
      data: {
        paymentId: Date.now().toString(),
        amount: parseFloat(amount),
        transactionId,
        description,
        status: "completed",
        timestamp: new Date().toISOString(),
      },
    });
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  });

  // Error handling middleware (must be last)
  app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  });

  return app;
}
