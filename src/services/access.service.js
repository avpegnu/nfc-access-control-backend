const firebaseService = require('./firebase.service');
const cardService = require('./card.service');
const credentialService = require('./credential.service');
const logger = require('../utils/logger');

const ACCESS_LOGS_PATH = 'access_logs';

/**
 * Access control service
 * Handles NFC card verification, credential management, and access logging
 */
class AccessService {
  /**
   * Check access - main entry point for ESP32
   *
   * Handles multiple scenarios:
   * 1. New card with card_id but no credential (second tap after enrollment)
   * 2. Existing card with credential (normal access)
   */
  async checkAccess(data) {
    const { device_id, door_id, card_id, card_uid, credential, timestamp } = data;

    // Track access attempt
    let result = 'DENY';
    let reason = 'UNKNOWN';
    let user = null;
    let policy = null;
    let newCredential = null;
    let card = null;
    let relayOpenMs = 3000;

    try {
      // Get card by card_id or card_uid
      if (card_id) {
        card = await cardService.getCardById(card_id).catch(() => null);
      }

      if (!card && card_uid) {
        card = await cardService.getCardByUid(card_uid);
      }

      // Scenario 1: Card not found
      if (!card) {
        result = 'DENY';
        reason = 'CARD_NOT_FOUND';
        await this.logAccess({ door_id, card_id, card_uid, result, reason, device_id });
        return { result, reason };
      }

      // Scenario 2: Card revoked or inactive
      if (card.status !== 'active') {
        result = 'DENY';
        reason = 'CARD_REVOKED';
        await this.logAccess({ door_id, card_id: card.card_id, card_uid, result, reason, device_id });
        return { result, reason };
      }

      // Get user if assigned
      if (card.user_id) {
        user = await firebaseService.getById('users', card.user_id).catch(() => null);

        if (user && !user.isActive) {
          result = 'DENY';
          reason = 'USER_INACTIVE';
          await this.logAccess({ door_id, card_id: card.card_id, card_uid, result, reason, user_id: card.user_id, user_name: user?.name || user?.displayName || null, device_id });
          return { result, reason };
        }
      }

      // Get policy from card
      policy = card.policy || { access_level: 'staff' };

      // Check policy validity
      if (policy.valid_until) {
        const validUntil = new Date(policy.valid_until).getTime();
        if (Date.now() > validUntil) {
          result = 'DENY';
          reason = 'POLICY_EXPIRED';
          await this.logAccess({ door_id, card_id: card.card_id, card_uid, result, reason, user_id: card.user_id, user_name: user?.name || user?.displayName || null, device_id });
          return { result, reason };
        }
      }

      // Check door access
      if (policy.allowed_doors && !policy.allowed_doors.includes('*') && !policy.allowed_doors.includes(door_id)) {
        result = 'DENY';
        reason = 'DOOR_NOT_ALLOWED';
        await this.logAccess({ door_id, card_id: card.card_id, card_uid, result, reason, user_id: card.user_id, user_name: user?.name || user?.displayName || null, device_id });
        return { result, reason };
      }

      // Scenario 3: New card in enroll_mode (second tap, no credential yet)
      if (card.enroll_mode && !credential) {
        // Card is in enroll mode but user not assigned yet
        if (!card.user_id) {
          result = 'DENY';
          reason = 'CARD_NOT_ASSIGNED';
          await this.logAccess({ door_id, card_id: card.card_id, card_uid, result, reason, device_id });
          return { result, reason };
        }

        // User assigned, issue first credential
        result = 'ALLOW';
        reason = 'FIRST_CREDENTIAL_ISSUED';
        newCredential = credentialService.generateCredential(card, user);

        // Turn off enroll_mode
        await cardService.updateCard(card.card_id, { enroll_mode: false });

        await this.logAccess({
          door_id,
          card_id: card.card_id,
          card_uid,
          result,
          reason,
          user_id: card.user_id,
          user_name: user?.name || user?.displayName || null,
          device_id,
          credential_issued: true
        });

        return {
          result,
          reason,
          relay_open_ms: relayOpenMs,
          user: user ? { user_id: user.id, name: user.name || user.displayName } : null,
          policy: { access_level: policy.access_level, valid_until: policy.valid_until || null },
          credential: newCredential
        };
      }

      // Scenario 4: Existing card with credential
      if (credential && credential.raw) {
        const verifyResult = credentialService.verifyCredential(credential.raw, card_uid);

        if (!verifyResult.valid) {
          result = 'DENY';
          reason = 'INVALID_CREDENTIAL';
          await this.logAccess({
            door_id,
            card_id: card.card_id,
            card_uid,
            result,
            reason,
            user_id: card.user_id,
            user_name: user?.name || user?.displayName || null,
            device_id,
            error: verifyResult.error
          });
          return { result, reason: verifyResult.error };
        }

        // Credential valid - allow access and rotate credential
        result = 'ALLOW';
        reason = 'ACCESS_GRANTED';
        newCredential = credentialService.generateCredential(card, user);

        await this.logAccess({
          door_id,
          card_id: card.card_id,
          card_uid,
          result,
          reason,
          user_id: card.user_id,
          user_name: user?.name || user?.displayName || null,
          device_id,
          credential_rotated: true
        });

        return {
          result,
          reason,
          relay_open_ms: relayOpenMs,
          user: user ? { user_id: user.id, name: user.name || user.displayName } : null,
          policy: { access_level: policy.access_level, valid_until: policy.valid_until || null },
          credential: newCredential
        };
      }

      // Scenario 5: Card exists but no credential provided (shouldn't happen normally)
      // Allow with new credential if card is properly set up
      if (card.user_id && !card.enroll_mode) {
        result = 'ALLOW';
        reason = 'CREDENTIAL_MISSING_REISSUED';
        newCredential = credentialService.generateCredential(card, user);

        await this.logAccess({
          door_id,
          card_id: card.card_id,
          card_uid,
          result,
          reason,
          user_id: card.user_id,
          user_name: user?.name || user?.displayName || null,
          device_id,
          credential_issued: true
        });

        return {
          result,
          reason,
          relay_open_ms: relayOpenMs,
          user: user ? { user_id: user.id, name: user.name || user.displayName } : null,
          policy: { access_level: policy.access_level, valid_until: policy.valid_until || null },
          credential: newCredential
        };
      }

      // Default deny
      result = 'DENY';
      reason = 'CARD_NOT_CONFIGURED';
      await this.logAccess({ door_id, card_id: card.card_id, card_uid, result, reason, device_id });
      return { result, reason };

    } catch (error) {
      logger.error('Access check error:', error);
      await this.logAccess({
        door_id,
        card_id,
        card_uid,
        result: 'DENY',
        reason: 'SYSTEM_ERROR',
        device_id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Log access attempt
   */
  async logAccess(data) {
    const logEntry = {
      ts: new Date().toISOString(),
      door_id: data.door_id,
      card_id: data.card_id || null,
      card_uid: data.card_uid || null,
      user_id: data.user_id || null,
      user_name: data.user_name || null,
      device_id: data.device_id || null,
      decision: data.result,
      reason: data.reason,
      ...data.credential_issued && { credential_issued: true },
      ...data.credential_rotated && { credential_rotated: true },
      ...data.error && { error: data.error }
    };

    try {
      await firebaseService.push(ACCESS_LOGS_PATH, logEntry);
      logger.info(`Access ${data.result}: card=${data.card_id || data.card_uid}, door=${data.door_id}, reason=${data.reason}`);
    } catch (error) {
      logger.error('Failed to log access:', error);
    }
  }

  /**
   * Process batch logs from offline mode
   */
  async logBatch(deviceId, logs) {
    let accepted = 0;

    for (const log of logs) {
      try {
        const logEntry = {
          ...log,
          device_id: deviceId,
          offline_sync: true,
          synced_at: new Date().toISOString()
        };
        await firebaseService.push(ACCESS_LOGS_PATH, logEntry);
        accepted++;
      } catch (error) {
        logger.error('Failed to sync offline log:', error);
      }
    }

    return { status: 'OK', accepted };
  }

  /**
   * Get timestamp from log (supports multiple formats)
   */
  getLogTimestamp(log) {
    if (log.ts) return new Date(log.ts).getTime();
    if (log.timestamp) return typeof log.timestamp === 'number' ? log.timestamp : new Date(log.timestamp).getTime();
    return 0;
  }

  /**
   * Get result from log (normalize to granted/denied for frontend)
   */
  getLogResult(log) {
    if (log.decision === 'ALLOW') return 'granted';
    if (log.decision === 'DENY') return 'denied';
    if (log.action === 'access_granted') return 'granted';
    if (log.action === 'access_denied') return 'denied';
    return log.result || 'denied';
  }

  /**
   * Transform log to frontend format
   */
  transformLog(log) {
    return {
      id: log.id,
      timestamp: this.getLogTimestamp(log),
      cardUid: log.card_uid || log.cardUid || '',
      userId: log.user_id || log.userId || null,
      userName: log.user_name || log.userName || null,
      result: this.getLogResult(log),
      action: log.action_type || 'entry',
      doorId: log.door_id || log.doorId || 'door_main',
      doorName: log.door_name || log.doorName || 'Cửa chính',
      reason: log.reason || null,
      deviceId: log.device_id || log.deviceId || null,
      method: log.method || 'online'
    };
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

    let logsData = await firebaseService.get(ACCESS_LOGS_PATH);

    if (!logsData) {
      return { logs: [], total: 0 };
    }

    let logs = Object.entries(logsData).map(([id, log]) => ({
      id,
      ...log
    }));

    // Apply filters
    if (startDate) {
      const startTs = new Date(startDate).getTime();
      logs = logs.filter(log => this.getLogTimestamp(log) >= startTs);
    }

    if (endDate) {
      const endTs = new Date(endDate).getTime();
      logs = logs.filter(log => this.getLogTimestamp(log) <= endTs);
    }

    if (result) {
      logs = logs.filter(log => {
        const logResult = this.getLogResult(log);
        return (result === 'ALLOW' && logResult === 'granted') ||
               (result === 'DENY' && logResult === 'denied') ||
               logResult === result;
      });
    }

    if (doorId) {
      logs = logs.filter(log => (log.door_id || log.doorId) === doorId);
    }

    if (userId) {
      logs = logs.filter(log => (log.user_id || log.userId) === userId);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => this.getLogTimestamp(b) - this.getLogTimestamp(a));

    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return {
      logs: paginatedLogs.map(log => this.transformLog(log)),
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

    const { logs } = await this.getLogs({ startDate: new Date(startDate), limit: 10000 });

    const totalAccess = logs.length;
    // logs are already transformed, use frontend field names
    const granted = logs.filter(l => l.result === 'granted').length;
    const denied = logs.filter(l => l.result === 'denied').length;

    const uniqueUserIds = new Set(logs.filter(l => l.userId).map(l => l.userId));
    const uniqueUsers = uniqueUserIds.size;

    const hourlyDistribution = [];
    if (period === 'today') {
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date().setHours(hour, 0, 0, 0);
        const hourEnd = new Date().setHours(hour, 59, 59, 999);
        const count = logs.filter(l => {
          return l.timestamp >= hourStart && l.timestamp <= hourEnd;
        }).length;
        hourlyDistribution.push({ hour, count });
      }
    }

    const recentActivity = logs.slice(0, 10).map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userName: log.userName || 'Không xác định',
      result: log.result,
      doorId: log.doorId
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
   * Get recent logs
   */
  async getRecent(limit = 10) {
    const { logs } = await this.getLogs({ limit });
    return logs;
  }
}

module.exports = new AccessService();
