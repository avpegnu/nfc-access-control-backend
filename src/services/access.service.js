const firebaseService = require('./firebase.service');
const usersService = require('./users.service');
const logger = require('../utils/logger');

/**
 * Access control service
 * Handles NFC card verification and access logging
 */
class AccessService {
  /**
   * Verify card access (called by ESP32)
   */
  async verifyAccess(cardUid, doorId = 'door_main', action = 'entry') {
    const timestamp = Date.now();

    // Get user by card UID
    const user = await usersService.getByCardUid(cardUid);

    // Get door info
    const door = await firebaseService.get(`doors/${doorId}`);
    const doorName = door?.name || doorId;

    let result;
    let reason = null;

    if (!user) {
      // Card not registered
      result = 'denied';
      reason = 'card_not_found';
    } else if (!user.isActive) {
      // User is disabled
      result = 'denied';
      reason = 'user_inactive';
    } else {
      // Access granted
      result = 'granted';
    }

    // Log the access attempt
    const logData = {
      timestamp,
      userId: user?.id || null,
      userName: user?.name || null,
      cardUid,
      doorId,
      doorName,
      action,
      result,
      reason
    };

    await firebaseService.push('accessLogs', logData);

    logger.info(`Access ${result}: cardUid=${cardUid}, user=${user?.name || 'unknown'}, door=${doorId}`);

    return {
      access: result,
      userId: user?.id || null,
      userName: user?.name || null,
      reason,
      message: this.getAccessMessage(result, reason)
    };
  }

  /**
   * Get user-friendly access message
   */
  getAccessMessage(result, reason) {
    if (result === 'granted') {
      return 'Cho phép truy cập';
    }

    const messages = {
      'card_not_found': 'Thẻ không được đăng ký',
      'user_inactive': 'Tài khoản đã bị vô hiệu hóa',
      'user_not_found': 'Người dùng không tồn tại'
    };

    return messages[reason] || 'Từ chối truy cập';
  }

  /**
   * Get access logs with pagination and filters
   */
  async getLogs(options = {}) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      result,
      doorId,
      userId
    } = options;

    // Get all logs (Firebase doesn't support complex queries well)
    let logsData = await firebaseService.get('accessLogs');

    if (!logsData) {
      return { logs: [], total: 0 };
    }

    // Convert to array
    let logs = Object.entries(logsData).map(([id, log]) => ({
      id,
      ...log
    }));

    // Apply filters
    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }

    if (result) {
      logs = logs.filter(log => log.result === result);
    }

    if (doorId) {
      logs = logs.filter(log => log.doorId === doorId);
    }

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Get total before pagination
    const total = logs.length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return {
      logs: paginatedLogs,
      total
    };
  }

  /**
   * Get access statistics
   */
  async getStats(period = 'today') {
    const now = Date.now();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date().setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date().setHours(0, 0, 0, 0);
    }

    const { logs } = await this.getLogs({ startDate, limit: 10000 });

    // Calculate stats
    const totalAccess = logs.length;
    const granted = logs.filter(l => l.result === 'granted').length;
    const denied = logs.filter(l => l.result === 'denied').length;

    // Unique users
    const uniqueUserIds = new Set(logs.filter(l => l.userId).map(l => l.userId));
    const uniqueUsers = uniqueUserIds.size;

    // Hourly distribution (for today)
    const hourlyDistribution = [];
    if (period === 'today') {
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date().setHours(hour, 0, 0, 0);
        const hourEnd = new Date().setHours(hour, 59, 59, 999);
        const count = logs.filter(l => l.timestamp >= hourStart && l.timestamp <= hourEnd).length;
        hourlyDistribution.push({ hour, count });
      }
    }

    // Recent activity (last 10)
    const recentActivity = logs.slice(0, 10).map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userName: log.userName || 'Không xác định',
      result: log.result,
      doorName: log.doorName
    }));

    return {
      totalAccess,
      granted,
      denied,
      uniqueUsers,
      hourlyDistribution,
      recentActivity
    };
  }

  /**
   * Get recent logs (for dashboard)
   */
  async getRecent(limit = 10) {
    const { logs } = await this.getLogs({ limit });
    return logs;
  }
}

module.exports = new AccessService();
