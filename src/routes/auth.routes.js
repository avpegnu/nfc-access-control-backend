const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { loginSchema, registerSchema } = require('../utils/validators');

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new admin user
 * @access  Public (can be protected if needed)
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get(
  '/me',
  authMiddleware,
  authController.me
);

module.exports = router;
