const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const { authMiddleware } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, paginationSchema } = require('../utils/validators');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private
 */
router.get(
  '/',
  validateQuery(paginationSchema),
  usersController.getAll
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  usersController.getById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private
 */
router.post(
  '/',
  validateBody(createUserSchema),
  usersController.create
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put(
  '/:id',
  validateBody(updateUserSchema),
  usersController.update
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private
 */
router.delete(
  '/:id',
  usersController.remove
);

/**
 * @route   PATCH /api/users/:id/toggle
 * @desc    Toggle user active status
 * @access  Private
 */
router.patch(
  '/:id/toggle',
  usersController.toggleActive
);

module.exports = router;
