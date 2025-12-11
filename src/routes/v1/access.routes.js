const express = require('express');
const router = express.Router();
const accessController = require('../../controllers/access.controller');
const { deviceAuthMiddleware } = require('../../middleware/deviceAuth');
const { authMiddleware } = require('../../middleware/auth');
const { deviceLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validation');
const {
  accessCheckSchema,
  logBatchSchema
} = require('../../utils/validators');

/**
 * Access Routes (ESP32 & Admin)
 * Base path: /api/v1/access
 */

// POST /access/check - Check card access (ESP32)
router.post(
  '/check',
  deviceAuthMiddleware,
  deviceLimiter,
  validate(accessCheckSchema),
  accessController.check
);

// POST /access/log-batch - Sync offline logs (ESP32)
router.post(
  '/log-batch',
  deviceAuthMiddleware,
  validate(logBatchSchema),
  accessController.logBatch
);

/**
 * Admin routes for access management
 */

// GET /access/logs - Get access logs (Admin)
router.get(
  '/logs',
  authMiddleware,
  accessController.getLogs
);

// GET /access/stats - Get access statistics (Admin)
router.get(
  '/stats',
  authMiddleware,
  accessController.getStats
);

// GET /access/recent - Get recent access logs (Admin)
router.get(
  '/recent',
  authMiddleware,
  accessController.getRecent
);

module.exports = router;
