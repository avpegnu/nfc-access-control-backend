const { verifyToken, isTokenBlacklisted } = require('../config/jwt');
const { error } = require('../utils/response');

/**
 * JWT Authentication middleware for Frontend requests
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'AUTH_NO_TOKEN', 'Token xác thực không được cung cấp', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      return error(res, 'AUTH_TOKEN_REVOKED', 'Token đã bị thu hồi', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'AUTH_TOKEN_EXPIRED', 'Token đã hết hạn', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'AUTH_INVALID_TOKEN', 'Token không hợp lệ', 401);
    }
    return error(res, 'AUTH_ERROR', 'Lỗi xác thực', 401);
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (!isTokenBlacklisted(token)) {
        const decoded = verifyToken(token);
        req.user = decoded;
        req.token = token;
      }
    }

    next();
  } catch (err) {
    // Ignore errors for optional auth
    next();
  }
};

/**
 * Admin only middleware (use after authMiddleware)
 */
const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'AUTH_FORBIDDEN', 'Chỉ admin mới có quyền truy cập', 403);
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminOnlyMiddleware
};
