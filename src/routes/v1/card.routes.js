const express = require('express');
const router = express.Router();
const cardController = require('../../controllers/card.controller');
const { deviceAuthMiddleware, optionalDeviceAuth } = require('../../middleware/deviceAuth');
const { authMiddleware } = require('../../middleware/auth');
const { deviceLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validation');
const {
  cardCreateSchema,
  cardUpdateSchema,
  cardAssignSchema
} = require('../../utils/validators');

/**
 * Card Routes
 * Base path: /api/v1/cards
 */

// POST /cards - Create card from blank NFC (ESP32 calls this)
router.post(
  '/',
  deviceLimiter,
  optionalDeviceAuth,
  validate(cardCreateSchema),
  cardController.createCard
);

/**
 * Admin routes for card management
 */

// GET /cards - List all cards (Admin)
router.get(
  '/',
  authMiddleware,
  cardController.listCards
);

// GET /cards/:cardId - Get card details (Admin)
router.get(
  '/:cardId',
  authMiddleware,
  cardController.getCard
);

// PUT /cards/:cardId - Update card (Admin)
router.put(
  '/:cardId',
  authMiddleware,
  validate(cardUpdateSchema),
  cardController.updateCard
);

// POST /cards/:cardId/assign - Assign user to card (Admin)
router.post(
  '/:cardId/assign',
  authMiddleware,
  validate(cardAssignSchema),
  cardController.assignUser
);

// POST /cards/:cardId/revoke - Revoke card (Admin)
router.post(
  '/:cardId/revoke',
  authMiddleware,
  cardController.revokeCard
);

// DELETE /cards/:cardId - Delete card (Admin)
router.delete(
  '/:cardId',
  authMiddleware,
  cardController.deleteCard
);

module.exports = router;
