const express = require('express');
const router = express.Router();
const deviceController = require('../../controllers/device.controller');
const { deviceAuthMiddleware } = require('../../middleware/deviceAuth');
const { authMiddleware } = require('../../middleware/auth');
const { deviceLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validation');
const {
  deviceRegisterSchema,
  deviceHeartbeatSchema,
  deviceConfigUpdateSchema
} = require('../../utils/validators');

/**
 * Device Routes (ESP32)
 * Base path: /api/v1/device
 */

// POST /device/register - Register device (no auth required, uses secret)
router.post(
  '/register',
  deviceLimiter,
  validate(deviceRegisterSchema),
  deviceController.register
);

// GET /device/config - Get device config (requires device token)
router.get(
  '/config',
  deviceAuthMiddleware,
  deviceController.getConfig
);

// POST /device/heartbeat - Send heartbeat (requires device token)
router.post(
  '/heartbeat',
  deviceAuthMiddleware,
  validate(deviceHeartbeatSchema),
  deviceController.heartbeat
);

/**
 * Admin routes for device management
 */

// GET /device/list - List all devices (Admin)
router.get(
  '/list',
  authMiddleware,
  deviceController.listDevices
);

// GET /device/:deviceId - Get device details (Admin)
router.get(
  '/:deviceId',
  authMiddleware,
  deviceController.getDevice
);

// PUT /device/:deviceId/config - Update device config (Admin)
router.put(
  '/:deviceId/config',
  authMiddleware,
  validate(deviceConfigUpdateSchema),
  deviceController.updateConfig
);

module.exports = router;
