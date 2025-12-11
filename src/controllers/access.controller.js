const accessService = require('../services/access.service');
const { success, paginated, error } = require('../utils/response');

/**
 * Access controller - handles NFC access verification and logging
 */

/**
 * POST /api/v1/access/check
 * ESP32 sends card info for access check
 * Returns access decision and new credential
 */
const check = async (req, res, next) => {
  try {
    const result = await accessService.checkAccess(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/access/log-batch
 * ESP32 sends batch of offline logs for sync
 */
const logBatch = async (req, res, next) => {
  try {
    const { device_id, logs } = req.body;
    const result = await accessService.logBatch(device_id, logs);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/access/logs
 * Get access history with pagination and filters (Admin)
 */
const getLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      result,
      doorId,
      userId
    } = req.query;

    const { logs, total } = await accessService.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      result,
      doorId,
      userId
    });

    return paginated(res, logs, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/access/stats
 * Get access statistics for dashboard (Admin)
 */
const getStats = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;
    const stats = await accessService.getStats(period);
    return success(res, stats);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/access/recent
 * Get recent access logs for dashboard widget (Admin)
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const logs = await accessService.getRecent(parseInt(limit));
    return success(res, { logs });
  } catch (err) {
    next(err);
  }
};

// Legacy endpoint for backward compatibility
const verify = async (req, res, next) => {
  try {
    const { cardUid, doorId, action } = req.body;

    // Convert to new format
    const result = await accessService.checkAccess({
      device_id: req.device?.id || 'legacy',
      door_id: doorId || 'door_main',
      card_uid: cardUid,
      timestamp: new Date().toISOString()
    });

    // Convert response to old format
    return success(res, {
      access: result.result === 'ALLOW' ? 'granted' : 'denied',
      userId: result.user?.user_id || null,
      userName: result.user?.name || null,
      reason: result.reason,
      message: result.result === 'ALLOW' ? 'Cho phép truy cập' : 'Từ chối truy cập'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  check,
  logBatch,
  getLogs,
  getStats,
  getRecent,
  verify // Legacy
};
