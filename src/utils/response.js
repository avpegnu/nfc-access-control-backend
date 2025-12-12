/**
 * Standardized API response helpers
 */

/**
 * Success response
 */
const success = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response with message
 */
const successMessage = (res, message, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message
  });
};

/**
 * Error response
 */
const error = (res, code, message, statusCode = 400, details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Pagination response
 */
const paginated = (res, items, pagination) => {
  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    }
  });
};

module.exports = {
  success,
  successMessage,
  error,
  paginated
};
