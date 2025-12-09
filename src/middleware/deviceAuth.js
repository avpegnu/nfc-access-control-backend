const { DEVICE_API_KEYS } = require('../config/env');
const { error } = require('../utils/response');

/**
 * Device (ESP32) Authentication middleware
 * Uses API Key in X-API-Key header
 */
const deviceAuthMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const deviceId = req.headers['x-device-id'];

    if (!apiKey) {
      return error(res, 'DEVICE_NO_API_KEY', 'API key không được cung cấp', 401);
    }

    // Find device by API key
    const device = DEVICE_API_KEYS.find(d => d.apiKey === apiKey);

    if (!device) {
      return error(res, 'DEVICE_INVALID_KEY', 'API key không hợp lệ', 401);
    }

    // Optional: Verify device ID matches
    if (deviceId && device.deviceId !== deviceId) {
      return error(res, 'DEVICE_ID_MISMATCH', 'Device ID không khớp với API key', 401);
    }

    // Attach device info to request
    req.device = {
      id: device.deviceId,
      name: device.name
    };

    next();
  } catch (err) {
    return error(res, 'DEVICE_AUTH_ERROR', 'Lỗi xác thực thiết bị', 500);
  }
};

module.exports = {
  deviceAuthMiddleware
};
