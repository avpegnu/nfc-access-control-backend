const firebaseService = require('./firebase.service');
const logger = require('../utils/logger');

/**
 * Door control service
 */
class DoorsService {
  /**
   * Get all doors
   */
  async getAll() {
    const doorsData = await firebaseService.get('doors');

    if (!doorsData) {
      return [];
    }

    return Object.entries(doorsData).map(([id, door]) => ({
      id,
      name: door.name,
      location: door.location,
      status: door.status || { isOpen: false, isOnline: false, lastUpdated: null }
    }));
  }

  /**
   * Get door by ID with full details
   */
  async getById(doorId) {
    const door = await firebaseService.get(`doors/${doorId}`);

    if (!door) {
      return null;
    }

    return {
      id: doorId,
      name: door.name,
      location: door.location,
      status: door.status || { isOpen: false, isOnline: false, lastUpdated: null },
      command: door.command || null,
      config: door.config || {}
    };
  }

  /**
   * Get door status only
   */
  async getStatus(doorId) {
    const status = await firebaseService.get(`doors/${doorId}/status`);
    return status || { isOpen: false, isOnline: false, lastUpdated: null };
  }

  /**
   * Update door status (called by ESP32)
   */
  async updateStatus(doorId, statusData) {
    const { isOpen, isOnline = true } = statusData;

    const status = {
      isOpen,
      isOnline,
      lastUpdated: Date.now()
    };

    await firebaseService.set(`doors/${doorId}/status`, status);

    logger.info(`Door ${doorId} status updated: isOpen=${isOpen}, isOnline=${isOnline}`);

    // Check if there's a pending command to return
    const command = await this.getPendingCommand(doorId);

    return { status, pendingCommand: command };
  }

  /**
   * Send command to door (called by Frontend)
   */
  async sendCommand(doorId, action, requestedBy) {
    const command = {
      action, // 'lock' or 'unlock'
      timestamp: Date.now(),
      requestedBy: requestedBy || 'web_admin',
      processed: false
    };

    await firebaseService.set(`doors/${doorId}/command`, command);

    logger.info(`Door ${doorId} command sent: ${action} by ${requestedBy}`);

    return {
      doorId,
      action,
      timestamp: command.timestamp,
      status: 'pending'
    };
  }

  /**
   * Get pending command for door (called by ESP32)
   */
  async getPendingCommand(doorId) {
    const command = await firebaseService.get(`doors/${doorId}/command`);

    if (!command || command.processed) {
      return null;
    }

    return command;
  }

  /**
   * Acknowledge command execution (called by ESP32)
   */
  async acknowledgeCommand(doorId, success = true) {
    const command = await firebaseService.get(`doors/${doorId}/command`);

    if (!command) {
      return { acknowledged: false, message: 'No command found' };
    }

    await firebaseService.update(`doors/${doorId}/command`, {
      processed: true,
      processedAt: Date.now(),
      success
    });

    logger.info(`Door ${doorId} command acknowledged: success=${success}`);

    return { acknowledged: true };
  }

  /**
   * Create default door if not exists
   */
  async ensureDefaultDoor() {
    const exists = await firebaseService.exists('doors/door_main');

    if (!exists) {
      await firebaseService.set('doors/door_main', {
        name: 'Cửa chính',
        location: 'Tầng 1',
        status: {
          isOpen: false,
          isOnline: false,
          lastUpdated: Date.now()
        },
        config: {
          autoLockDelay: 5000
        }
      });

      logger.info('Default door created: door_main');
    }
  }

  /**
   * Set door offline (when ESP32 disconnects)
   */
  async setOffline(doorId) {
    await firebaseService.update(`doors/${doorId}/status`, {
      isOnline: false,
      lastUpdated: Date.now()
    });

    logger.info(`Door ${doorId} set to offline`);
  }
}

module.exports = new DoorsService();
