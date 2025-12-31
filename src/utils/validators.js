const Joi = require("joi");

/**
 * Validation schemas for request data
 */

// =====================
// Auth schemas (Frontend)
// =====================
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  displayName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Tên hiển thị phải có ít nhất 2 ký tự",
    "string.max": "Tên hiển thị không được quá 100 ký tự",
    "any.required": "Tên hiển thị là bắt buộc",
  }),
});

// =====================
// User schemas (Admin)
// =====================
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Tên phải có ít nhất 2 ký tự",
    "string.max": "Tên không được quá 100 ký tự",
    "any.required": "Tên là bắt buộc",
  }),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "Email không hợp lệ",
  }),
  cardUid: Joi.string().alphanum().min(4).max(20).optional().messages({
    "string.alphanum": "Card UID chỉ chứa chữ và số",
    "string.min": "Card UID phải có ít nhất 4 ký tự",
    "string.max": "Card UID không được quá 20 ký tự",
  }),
  role: Joi.string().valid("user", "admin").default("user").messages({
    "any.only": "Role phải là user hoặc admin",
  }),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Tên phải có ít nhất 2 ký tự",
    "string.max": "Tên không được quá 100 ký tự",
  }),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "Email không hợp lệ",
  }),
  cardUid: Joi.string().alphanum().min(4).max(20).optional().messages({
    "string.alphanum": "Card UID chỉ chứa chữ và số",
    "string.min": "Card UID phải có ít nhất 4 ký tự",
    "string.max": "Card UID không được quá 20 ký tự",
  }),
  role: Joi.string().valid("user", "admin").optional().messages({
    "any.only": "Role phải là user hoặc admin",
  }),
});

// =====================
// Device schemas (ESP32)
// =====================
const deviceRegisterSchema = Joi.object({
  device_id: Joi.string().required().messages({
    "any.required": "Device ID là bắt buộc",
  }),
  secret: Joi.string().required().messages({
    "any.required": "Secret là bắt buộc",
  }),
});

const deviceHeartbeatSchema = Joi.object({
  device_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  status: Joi.object({
    uptime_sec: Joi.number().integer().optional(),
    rssi: Joi.number().integer().optional(),
    fw_version: Joi.string().optional(),
    last_access_ts: Joi.string().isoDate().optional(),
  }).optional(),
});

const deviceConfigUpdateSchema = Joi.object({
  relay_open_ms: Joi.number().integer().min(500).max(10000).optional(),
  offline_mode: Joi.object({
    enabled: Joi.boolean().optional(),
    cache_ttl_sec: Joi.number().integer().min(3600).max(604800).optional(),
  }).optional(),
});

// =====================
// Card schemas
// =====================
const cardCreateSchema = Joi.object({
  uid: Joi.string().required().messages({
    "any.required": "Card UID là bắt buộc",
  }),
  label: Joi.string().optional(),
});

const cardUpdateSchema = Joi.object({
  status: Joi.string().valid("active", "inactive", "revoked").optional(),
  enroll_mode: Joi.boolean().optional(),
  scope: Joi.array().items(Joi.string()).optional(),
  offline_enabled: Joi.boolean().optional(),
  policy: Joi.object({
    access_level: Joi.string()
      .valid("staff", "manager", "admin", "guest")
      .optional(),
    valid_until: Joi.string().isoDate().allow(null).optional(),
    allowed_doors: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const cardAssignSchema = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID là bắt buộc",
  }),
});

// =====================
// Access schemas (ESP32)
// =====================
const accessCheckSchema = Joi.object({
  cardUid: Joi.string().required().messages({
    "any.required": "Card UID là bắt buộc",
  }),
  doorId: Joi.string().required().messages({
    "any.required": "Door ID là bắt buộc",
  }),
});

const logEntrySchema = Joi.object({
  ts: Joi.string().isoDate().required(),
  door_id: Joi.string().required(),
  card_id: Joi.string().allow(null).optional(),
  card_uid: Joi.string().allow(null).optional(),
  decision: Joi.string().valid("ALLOW", "DENY").required(),
  reason: Joi.string().optional(),
});

const logBatchSchema = Joi.object({
  device_id: Joi.string().required().messages({
    "any.required": "Device ID là bắt buộc",
  }),
  logs: Joi.array().items(logEntrySchema).required().messages({
    "any.required": "Logs là bắt buộc",
  }),
});

// =====================
// Legacy schemas
// =====================
const verifyAccessSchema = Joi.object({
  cardUid: Joi.string().alphanum().min(4).max(20).required().messages({
    "string.alphanum": "Card UID chỉ chứa chữ và số",
    "string.min": "Card UID phải có ít nhất 4 ký tự",
    "string.max": "Card UID không được quá 20 ký tự",
    "any.required": "Card UID là bắt buộc",
  }),
  doorId: Joi.string().default("door_main"),
  action: Joi.string().valid("entry", "exit").default("entry"),
});

// Door schemas
const doorCommandSchema = Joi.object({
  action: Joi.string().valid("lock", "unlock").required().messages({
    "any.only": "Action phải là lock hoặc unlock",
    "any.required": "Action là bắt buộc",
  }),
});

const doorStatusSchema = Joi.object({
  isOpen: Joi.boolean().required().messages({
    "any.required": "isOpen là bắt buộc",
  }),
  isOnline: Joi.boolean().default(true),
});

// Query schemas
const paginationSchema = Joi.object({
  page: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).empty(""))
    .default(1),
  limit: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(1000),
      Joi.string().pattern(/^\d+$/).empty("")
    )
    .default(20),
});

const accessLogsQuerySchema = Joi.object({
  page: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).empty(""))
    .default(1),
  limit: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(1000),
      Joi.string().pattern(/^\d+$/).empty("")
    )
    .default(20),
  startDate: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d+$/).empty(""))
    .optional(),
  endDate: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d+$/).empty(""))
    .optional(),
  result: Joi.string().valid("granted", "denied", "ALLOW", "DENY").optional(),
  doorId: Joi.string().optional(),
  userId: Joi.string().optional(),
});

module.exports = {
  // Auth
  loginSchema,
  registerSchema,

  // User
  createUserSchema,
  updateUserSchema,

  // Device (ESP32)
  deviceRegisterSchema,
  deviceHeartbeatSchema,
  deviceConfigUpdateSchema,

  // Card
  cardCreateSchema,
  cardUpdateSchema,
  cardAssignSchema,

  // Access
  accessCheckSchema,
  logBatchSchema,
  verifyAccessSchema, // Legacy

  // Door
  doorCommandSchema,
  doorStatusSchema,

  // Query
  paginationSchema,
  accessLogsQuerySchema,
};
