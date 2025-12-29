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
 * @swagger
 * tags:
 *   name: Cards
 *   description: Quản lý thẻ NFC
 */

/**
 * @swagger
 * /api/v1/cards:
 *   post:
 *     summary: Tạo thẻ mới
 *     description: Tạo thẻ NFC mới từ ESP32 hoặc admin
 *     tags: [Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "04:A1:B2:C3:D4:E5:F6"
 *               label:
 *                 type: string
 *                 example: "Thẻ nhân viên 001"
 *     responses:
 *       201:
 *         description: Tạo thẻ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Card'
 *       409:
 *         description: Thẻ đã tồn tại
 */
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

/**
 * @swagger
 * /api/v1/cards:
 *   get:
 *     summary: Lấy danh sách thẻ
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Card'
 */
router.get(
  '/',
  authMiddleware,
  cardController.listCards
);

/**
 * @swagger
 * /api/v1/cards/{cardId}:
 *   get:
 *     summary: Lấy thông tin thẻ
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy thẻ
 */
router.get(
  '/:cardId',
  authMiddleware,
  cardController.getCard
);

/**
 * @swagger
 * /api/v1/cards/{cardId}:
 *   put:
 *     summary: Cập nhật thông tin thẻ
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy thẻ
 */
router.put(
  '/:cardId',
  authMiddleware,
  validate(cardUpdateSchema),
  cardController.updateCard
);

/**
 * @swagger
 * /api/v1/cards/{cardId}/assign:
 *   post:
 *     summary: Gán thẻ cho người dùng
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID người dùng
 *     responses:
 *       200:
 *         description: Gán thành công
 *       404:
 *         description: Không tìm thấy thẻ hoặc người dùng
 */
router.post(
  '/:cardId/assign',
  authMiddleware,
  validate(cardAssignSchema),
  cardController.assignUser
);

/**
 * @swagger
 * /api/v1/cards/{cardId}/revoke:
 *   post:
 *     summary: Thu hồi thẻ
 *     description: Vô hiệu hóa thẻ, ngăn truy cập
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 *       404:
 *         description: Không tìm thấy thẻ
 */
router.post(
  '/:cardId/revoke',
  authMiddleware,
  cardController.revokeCard
);

/**
 * @swagger
 * /api/v1/cards/{cardId}/reactivate:
 *   post:
 *     summary: Kích hoạt lại thẻ
 *     description: Kích hoạt lại thẻ đã bị thu hồi
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kích hoạt thành công
 *       404:
 *         description: Không tìm thấy thẻ
 */
router.post(
  '/:cardId/reactivate',
  authMiddleware,
  cardController.reactivateCard
);

/**
 * @swagger
 * /api/v1/cards/{cardId}:
 *   delete:
 *     summary: Xóa thẻ
 *     tags: [Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy thẻ
 */
router.delete(
  '/:cardId',
  authMiddleware,
  cardController.deleteCard
);

module.exports = router;
