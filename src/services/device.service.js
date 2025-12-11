const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const firebaseService = require('./firebase.service');
const { getJwtVerificationConfig } = require('../config/crypto');
const { DEVICE_JWT_SECRET, DEVICE_JWT_EXPIRES_IN, DEVICE_SECRETS } = require('../config/env');

const DEVICES_PATH = 'devices';

/**
 * Register a new device or re-register existing device
 */
const registerDevice = async (data) => {
  const { device_id, secret, hardware_type, firmware_version, door_id } = data;

  // Validate device secret
  const validSecret = DEVICE_SECRETS.find(s => s.device_id === device_id && s.secret === secret);
  if (!validSecret) {
    throw { code: 'INVALID_SECRET', message: 'Device ID hoặc secret không hợp lệ', status: 401 };
  }

  // Check if device exists
  let device = await firebaseService.getById(DEVICES_PATH, device_id);

  if (device) {
    // Update existing device
    device = await firebaseService.update(DEVICES_PATH, device_id, {
      hardware_type,
      firmware_version,
      door_id,
      last_registered_at: new Date().toISOString(),
      status: 'active'
    });
  } else {
    // Create new device
    device = await firebaseService.createWithId(DEVICES_PATH, device_id, {
      device_id,
      hardware_type,
      firmware_version,
      door_id,
      status: 'active',
      created_at: new Date().toISOString(),
      last_registered_at: new Date().toISOString(),
      config: {
        relay_open_ms: 3000,
        offline_mode: {
          enabled: true,
          cache_ttl_sec: 86400
        }
      }
    });
  }

  // Generate device JWT token
  const deviceToken = jwt.sign(
    {
      type: 'device',
      device_id,
      door_id,
      hardware_type
    },
    DEVICE_JWT_SECRET,
    { expiresIn: DEVICE_JWT_EXPIRES_IN }
  );

  return {
    device_token: deviceToken,
    config: device.config || {
      relay_open_ms: 3000,
      offline_mode: {
        enabled: true,
        cache_ttl_sec: 86400
      }
    }
  };
};

/**
 * Get device configuration including offline whitelist and JWT verification config
 */
const getDeviceConfig = async (deviceId) => {
  const device = await firebaseService.getById(DEVICES_PATH, deviceId);

  if (!device) {
    throw { code: 'DEVICE_NOT_FOUND', message: 'Thiết bị không tồn tại', status: 404 };
  }

  // Get offline whitelist (cards that can be verified offline)
  const cards = await firebaseService.query('cards', [
    { field: 'offline_enabled', operator: '==', value: true },
    { field: 'status', operator: '==', value: 'active' }
  ]);

  const offlineWhitelist = cards.map(card => ({
    card_id: card.card_id,
    user_id: card.user_id,
    valid_until: card.valid_until || null
  }));

  // Calculate cache expiration
  const cacheTtl = device.config?.offline_mode?.cache_ttl_sec || 86400;
  const cacheExpireAt = new Date(Date.now() + cacheTtl * 1000).toISOString();

  return {
    device_id: deviceId,
    relay_open_ms: device.config?.relay_open_ms || 3000,
    offline_mode: {
      enabled: device.config?.offline_mode?.enabled || false,
      cache_expire_at: cacheExpireAt
    },
    offline_whitelist: offlineWhitelist,
    jwt_verification: getJwtVerificationConfig()
  };
};

/**
 * Process device heartbeat
 */
const processHeartbeat = async (deviceId, data) => {
  const { timestamp, status } = data;

  const device = await firebaseService.getById(DEVICES_PATH, deviceId);

  if (!device) {
    throw { code: 'DEVICE_NOT_FOUND', message: 'Thiết bị không tồn tại', status: 404 };
  }

  // Update device status
  await firebaseService.update(DEVICES_PATH, deviceId, {
    last_heartbeat_at: timestamp,
    last_status: status,
    online: true
  });

  return { status: 'OK' };
};

/**
 * Get device by ID
 */
const getDevice = async (deviceId) => {
  const device = await firebaseService.getById(DEVICES_PATH, deviceId);

  if (!device) {
    throw { code: 'DEVICE_NOT_FOUND', message: 'Thiết bị không tồn tại', status: 404 };
  }

  return device;
};

/**
 * Update device config
 */
const updateDeviceConfig = async (deviceId, config) => {
  const device = await firebaseService.getById(DEVICES_PATH, deviceId);

  if (!device) {
    throw { code: 'DEVICE_NOT_FOUND', message: 'Thiết bị không tồn tại', status: 404 };
  }

  const updatedConfig = {
    ...device.config,
    ...config
  };

  await firebaseService.update(DEVICES_PATH, deviceId, { config: updatedConfig });

  return updatedConfig;
};

/**
 * List all devices
 */
const listDevices = async () => {
  return firebaseService.getAll(DEVICES_PATH);
};

module.exports = {
  registerDevice,
  getDeviceConfig,
  processHeartbeat,
  getDevice,
  updateDeviceConfig,
  listDevices
};
