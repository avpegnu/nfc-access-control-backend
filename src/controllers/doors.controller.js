const doorsService = require('../services/doors.service');
const { success, successMessage } = require('../utils/response');

/**
 * Doors controller
 */

/**
 * GET /api/doors
 */
const getAll = async (req, res, next) => {
  try {
    const doors = await doorsService.getAll();

    return success(res, { doors });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/doors/:id
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const door = await doorsService.getById(id);

    if (!door) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOOR_NOT_FOUND',
          message: 'Cửa không tồn tại'
        }
      });
    }

    return success(res, door);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/doors/:id/command
 * Frontend sends lock/unlock command
 */
const sendCommand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const requestedBy = req.user?.email || 'web_admin';

    const result = await doorsService.sendCommand(id, action, requestedBy);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/doors/:id/status
 * ESP32 updates door status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isOpen, isOnline } = req.body;

    const result = await doorsService.updateStatus(id, { isOpen, isOnline });

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/doors/:id/command
 * ESP32 polls for pending commands
 */
const getCommand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const command = await doorsService.getPendingCommand(id);

    return success(res, {
      hasCommand: !!command,
      command
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/doors/:id/command/ack
 * ESP32 acknowledges command execution
 */
const acknowledgeCommand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success: execSuccess = true } = req.body;

    const result = await doorsService.acknowledgeCommand(id, execSuccess);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  sendCommand,
  updateStatus,
  getCommand,
  acknowledgeCommand
};
