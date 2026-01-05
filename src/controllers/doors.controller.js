const doorsService = require("../services/doors.service");
const realtimeService = require("../services/realtime.service");
const { success, successMessage } = require("../utils/response");
const logger = require("../utils/logger");

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
          code: "DOOR_NOT_FOUND",
          message: "Cửa không tồn tại",
        },
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
    const requestedBy = req.user?.email || "web_admin";

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

    // Broadcast to all connected clients via SSE
    realtimeService.broadcast("door_status", {
      doorId: id,
      status: result.status,
    });

    logger.info(
      `Door ${id} status broadcasted: isOpen=${isOpen}, isOnline=${isOnline}`
    );

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
      command,
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

/**
 * GET /api/doors/:id/command/poll
 * ESP32 long polling - giữ connection cho đến khi có command hoặc timeout
 */
const pollCommand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timeout = 30000; // 30 giây
    const checkInterval = 500; // Check mỗi 500ms
    const startTime = Date.now();

    logger.info(`Long polling started for door ${id}`);

    // Hàm check command
    const checkForCommand = async () => {
      const command = await doorsService.getPendingCommand(id);
      const elapsed = Date.now() - startTime;

      // Nếu có command → trả về ngay
      if (command) {
        logger.info(
          `Long polling: Command found for door ${id} after ${elapsed}ms`
        );
        return success(res, {
          hasCommand: true,
          command,
          waitTime: elapsed,
        });
      }

      // Nếu timeout → trả về empty
      if (elapsed >= timeout) {
        logger.info(`Long polling: Timeout for door ${id} after ${elapsed}ms`);
        return success(res, {
          hasCommand: false,
          command: null,
          waitTime: elapsed,
        });
      }

      // Chưa có command và chưa timeout → check lại sau 500ms
      return null;
    };

    // Check ngay lần đầu
    const initialResult = await checkForCommand();
    if (initialResult) return;

    // Poll với interval
    const intervalId = setInterval(async () => {
      const result = await checkForCommand();
      if (result) {
        clearInterval(intervalId);
      }
    }, checkInterval);

    // Cleanup khi client disconnect
    req.on("close", () => {
      clearInterval(intervalId);
      logger.info(`Long polling: Client disconnected for door ${id}`);
    });
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
  acknowledgeCommand,
  pollCommand,
};
