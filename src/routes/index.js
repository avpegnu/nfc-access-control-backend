const express = require("express");

// Import API v1 routes
const v1Routes = require("./v1");

const router = express.Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: Date.now(),
      uptime: process.uptime(),
    },
  });
});

// =====================
// API v1 routes
// =====================
router.use("/v1", v1Routes);

// Root endpoint
router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "NFC Access Control API",
      version: "1.4.0",
      endpoints: {
        v1: "/api/v1",
      },
      documentation: "/api/v1/health",
    },
  });
});

module.exports = router;
