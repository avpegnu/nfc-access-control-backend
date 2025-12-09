const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.uid
  });

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    const message = getFirebaseAuthErrorMessage(err.code);
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message
      }
    });
  }

  // Validation errors (Joi)
  if (err.name === 'ValidationError' || err.isJoi) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        details: err.details?.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      }
    });
  }

  // Firebase Database errors
  if (err.code === 'PERMISSION_DENIED') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'DATABASE_PERMISSION_DENIED',
        message: 'Không có quyền truy cập database'
      }
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'Lỗi hệ thống' : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message
    }
  });
};

/**
 * Get user-friendly message for Firebase Auth errors
 */
function getFirebaseAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'Tài khoản không tồn tại',
    'auth/wrong-password': 'Mật khẩu không đúng',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
    'auth/email-already-in-use': 'Email đã được sử dụng',
    'auth/email-already-exists': 'Email đã được sử dụng',
    'auth/weak-password': 'Mật khẩu quá yếu',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa'
  };
  return messages[code] || 'Lỗi xác thực';
}

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} không tồn tại`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
