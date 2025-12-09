const rateLimit = require('express-rate-limit');
const {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  AUTH_RATE_LIMIT_MAX
} = require('../config/env');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Stricter rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Device API rate limiter (higher limit for ESP32)
 */
const deviceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req) => req.headers['x-device-id'] || req.ip,
  message: {
    success: false,
    error: {
      code: 'DEVICE_RATE_LIMIT',
      message: 'Device rate limit exceeded'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  deviceLimiter
};
