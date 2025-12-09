const express = require('express');
const router = express.Router();

const doorsController = require('../controllers/doors.controller');
const { authMiddleware } = require('../middleware/auth');
const { deviceAuthMiddleware } = require('../middleware/deviceAuth');
const { validateBody } = require('../middleware/validation');
const { deviceLimiter } = require('../middleware/rateLimiter');
const { doorCommandSchema, doorStatusSchema } = require('../utils/validators');

/**
 * @route   GET /api/doors
 * @desc    Get all doors
 * @access  Private (Frontend)
 */
router.get(
  '/',
  authMiddleware,
  doorsController.getAll
);

/**
 * @route   GET /api/doors/:id
 * @desc    Get door by ID
 * @access  Private (Frontend)
 */
router.get(
  '/:id',
  authMiddleware,
  doorsController.getById
);

/**
 * @route   POST /api/doors/:id/command
 * @desc    Send command to door (Frontend)
 * @access  Private (Frontend)
 */
router.post(
  '/:id/command',
  authMiddleware,
  validateBody(doorCommandSchema),
  doorsController.sendCommand
);

/**
 * @route   PUT /api/doors/:id/status
 * @desc    Update door status (ESP32)
 * @access  Device
 */
router.put(
  '/:id/status',
  deviceLimiter,
  deviceAuthMiddleware,
  validateBody(doorStatusSchema),
  doorsController.updateStatus
);

/**
 * @route   GET /api/doors/:id/command
 * @desc    Get pending command for door (ESP32 polling)
 * @access  Device
 */
router.get(
  '/:id/command',
  deviceLimiter,
  deviceAuthMiddleware,
  doorsController.getCommand
);

/**
 * @route   POST /api/doors/:id/command/ack
 * @desc    Acknowledge command execution (ESP32)
 * @access  Device
 */
router.post(
  '/:id/command/ack',
  deviceLimiter,
  deviceAuthMiddleware,
  doorsController.acknowledgeCommand
);

module.exports = router;
