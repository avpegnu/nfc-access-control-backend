const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');
const { DEVICE_JWT_SECRET } = require('../config/env');

/**
 * Device (ESP32) Authentication middleware
 * Uses Bearer token (JWT) in Authorization header
 *
 * Token is issued via POST /device/register
 */
const deviceAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'DEVICE_NO_TOKEN', 'Device token không được cung cấp', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, DEVICE_JWT_SECRET);

      // Check token type
      if (decoded.type !== 'device') {
        return error(res, 'INVALID_TOKEN_TYPE', 'Token không phải device token', 401);
      }

      // Attach device info to request
      req.device = {
        id: decoded.device_id,
        door_id: decoded.door_id,
        hardware_type: decoded.hardware_type,
        registered_at: decoded.iat
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return error(res, 'DEVICE_TOKEN_EXPIRED', 'Device token đã hết hạn', 401);
      }
      return error(res, 'DEVICE_INVALID_TOKEN', 'Device token không hợp lệ', 401);
    }
  } catch (err) {
    console.error('Device auth error:', err);
    return error(res, 'DEVICE_AUTH_ERROR', 'Lỗi xác thực thiết bị', 500);
  }
};

/**
 * Optional device auth - allows unauthenticated requests for registration
 */
const optionalDeviceAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.device = null;
    return next();
  }

  return deviceAuthMiddleware(req, res, next);
};

module.exports = {
  deviceAuthMiddleware,
  optionalDeviceAuth
};
