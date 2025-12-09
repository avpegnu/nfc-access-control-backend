const Joi = require('joi');

/**
 * Validation schemas for request data
 */

// Auth schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc'
  })
});

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc'
  }),
  displayName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Tên hiển thị phải có ít nhất 2 ký tự',
    'string.max': 'Tên hiển thị không được quá 100 ký tự',
    'any.required': 'Tên hiển thị là bắt buộc'
  })
});

// User schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'string.max': 'Tên không được quá 100 ký tự',
    'any.required': 'Tên là bắt buộc'
  }),
  email: Joi.string().email().allow('').optional().messages({
    'string.email': 'Email không hợp lệ'
  }),
  cardUid: Joi.string().alphanum().min(4).max(20).required().messages({
    'string.alphanum': 'Card UID chỉ chứa chữ và số',
    'string.min': 'Card UID phải có ít nhất 4 ký tự',
    'string.max': 'Card UID không được quá 20 ký tự',
    'any.required': 'Card UID là bắt buộc'
  }),
  role: Joi.string().valid('user', 'admin').default('user').messages({
    'any.only': 'Role phải là user hoặc admin'
  })
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'string.max': 'Tên không được quá 100 ký tự'
  }),
  email: Joi.string().email().allow('').optional().messages({
    'string.email': 'Email không hợp lệ'
  }),
  cardUid: Joi.string().alphanum().min(4).max(20).optional().messages({
    'string.alphanum': 'Card UID chỉ chứa chữ và số',
    'string.min': 'Card UID phải có ít nhất 4 ký tự',
    'string.max': 'Card UID không được quá 20 ký tự'
  }),
  role: Joi.string().valid('user', 'admin').optional().messages({
    'any.only': 'Role phải là user hoặc admin'
  })
});

// Access schemas
const verifyAccessSchema = Joi.object({
  cardUid: Joi.string().alphanum().min(4).max(20).required().messages({
    'string.alphanum': 'Card UID chỉ chứa chữ và số',
    'string.min': 'Card UID phải có ít nhất 4 ký tự',
    'string.max': 'Card UID không được quá 20 ký tự',
    'any.required': 'Card UID là bắt buộc'
  }),
  doorId: Joi.string().default('door_main'),
  action: Joi.string().valid('entry', 'exit').default('entry')
});

// Door schemas
const doorCommandSchema = Joi.object({
  action: Joi.string().valid('lock', 'unlock').required().messages({
    'any.only': 'Action phải là lock hoặc unlock',
    'any.required': 'Action là bắt buộc'
  })
});

const doorStatusSchema = Joi.object({
  isOpen: Joi.boolean().required().messages({
    'any.required': 'isOpen là bắt buộc'
  }),
  isOnline: Joi.boolean().default(true)
});

// Query schemas - use string().allow('') for query params since they come as strings
const paginationSchema = Joi.object({
  page: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).empty('')
  ).default(1),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(1000),
    Joi.string().pattern(/^\d+$/).empty('')
  ).default(20)
});

const accessLogsQuerySchema = Joi.object({
  page: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).empty('')
  ).default(1),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(1000),
    Joi.string().pattern(/^\d+$/).empty('')
  ).default(20),
  startDate: Joi.alternatives().try(
    Joi.number(),
    Joi.string().pattern(/^\d+$/).empty('')
  ).optional(),
  endDate: Joi.alternatives().try(
    Joi.number(),
    Joi.string().pattern(/^\d+$/).empty('')
  ).optional(),
  result: Joi.string().valid('granted', 'denied').optional(),
  doorId: Joi.string().optional(),
  userId: Joi.string().optional()
});

module.exports = {
  loginSchema,
  registerSchema,
  createUserSchema,
  updateUserSchema,
  verifyAccessSchema,
  doorCommandSchema,
  doorStatusSchema,
  paginationSchema,
  accessLogsQuerySchema
};
