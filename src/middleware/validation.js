const { error } = require('../utils/response');

/**
 * Create validation middleware from Joi schema
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query : req.body;

    const { error: validationError, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const details = validationError.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));

      return error(res, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', 400, details);
    }

    // Replace with validated & sanitized data
    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

module.exports = {
  validate,
  validateBody,
  validateQuery
};
