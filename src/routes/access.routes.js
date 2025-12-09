const express = require('express');
const router = express.Router();

const accessController = require('../controllers/access.controller');
const { authMiddleware } = require('../middleware/auth');
const { deviceAuthMiddleware } = require('../middleware/deviceAuth');
const { validateBody, validateQuery } = require('../middleware/validation');
const { deviceLimiter } = require('../middleware/rateLimiter');
const { verifyAccessSchema, accessLogsQuerySchema } = require('../utils/validators');

/**
 * @route   POST /api/access/verify
 * @desc    Verify NFC card access (ESP32)
 * @access  Device
 */
router.post(
  '/verify',
  deviceLimiter,
  deviceAuthMiddleware,
  validateBody(verifyAccessSchema),
  accessController.verify
);

/**
 * @route   GET /api/access/logs
 * @desc    Get access logs with pagination
 * @access  Private (Frontend)
 */
router.get(
  '/logs',
  authMiddleware,
  validateQuery(accessLogsQuerySchema),
  accessController.getLogs
);

/**
 * @route   GET /api/access/stats
 * @desc    Get access statistics
 * @access  Private (Frontend)
 */
router.get(
  '/stats',
  authMiddleware,
  accessController.getStats
);

/**
 * @route   GET /api/access/recent
 * @desc    Get recent access logs
 * @access  Private (Frontend)
 */
router.get(
  '/recent',
  authMiddleware,
  accessController.getRecent
);

module.exports = router;
