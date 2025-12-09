const accessService = require('../services/access.service');
const { success, paginated } = require('../utils/response');

/**
 * Access controller
 */

/**
 * POST /api/access/verify
 * ESP32 sends card UID for verification
 */
const verify = async (req, res, next) => {
  try {
    const { cardUid, doorId, action } = req.body;

    const result = await accessService.verifyAccess(cardUid, doorId, action);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/access/logs
 * Get access history with pagination and filters
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
      startDate: startDate ? parseInt(startDate) : undefined,
      endDate: endDate ? parseInt(endDate) : undefined,
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
 * GET /api/access/stats
 * Get access statistics for dashboard
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
 * GET /api/access/recent
 * Get recent access logs (for dashboard widget)
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

module.exports = {
  verify,
  getLogs,
  getStats,
  getRecent
};
