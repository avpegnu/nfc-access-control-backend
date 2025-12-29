const express = require('express');
const router = express.Router();

const doorsController = require('../controllers/doors.controller');
const { authMiddleware } = require('../middleware/auth');
const { deviceAuthMiddleware } = require('../middleware/deviceAuth');
const { validateBody } = require('../middleware/validation');
const { deviceLimiter } = require('../middleware/rateLimiter');
const { doorCommandSchema, doorStatusSchema } = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Doors
 *   description: Quản lý cửa và điều khiển từ xa
 */

/**
 * @swagger
 * /api/doors:
 *   get:
 *     summary: Lấy danh sách tất cả cửa
 *     tags: [Doors]
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
 *                     $ref: '#/components/schemas/Door'
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  '/',
  authMiddleware,
  doorsController.getAll
);

/**
 * @swagger
 * /api/doors/{id}:
 *   get:
 *     summary: Lấy thông tin cửa theo ID
 *     tags: [Doors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cửa
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
 *                   $ref: '#/components/schemas/Door'
 *       404:
 *         description: Không tìm thấy cửa
 */
router.get(
  '/:id',
  authMiddleware,
  doorsController.getById
);

/**
 * @swagger
 * /api/doors/{id}/command:
 *   post:
 *     summary: Gửi lệnh điều khiển cửa
 *     description: Gửi lệnh mở/khóa cửa từ frontend
 *     tags: [Doors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *                 enum: [UNLOCK, LOCK]
 *                 example: UNLOCK
 *     responses:
 *       200:
 *         description: Lệnh đã được gửi
 *       400:
 *         description: Lệnh không hợp lệ
 *       404:
 *         description: Không tìm thấy cửa
 */
router.post(
  '/:id/command',
  authMiddleware,
  validateBody(doorCommandSchema),
  doorsController.sendCommand
);

/**
 * @swagger
 * /api/doors/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái cửa (ESP32)
 *     description: ESP32 gửi trạng thái cửa hiện tại lên server
 *     tags: [Doors]
 *     security:
 *       - DeviceToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isOpen:
 *                 type: boolean
 *                 example: true
 *               isOnline:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Token thiết bị không hợp lệ
 */
router.put(
  '/:id/status',
  deviceLimiter,
  deviceAuthMiddleware,
  validateBody(doorStatusSchema),
  doorsController.updateStatus
);

/**
 * @swagger
 * /api/doors/{id}/command:
 *   get:
 *     summary: Lấy lệnh đang chờ (ESP32 polling)
 *     description: ESP32 poll endpoint này để kiểm tra lệnh mới từ server
 *     tags: [Doors]
 *     security:
 *       - DeviceToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cửa
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
 *                   type: object
 *                   properties:
 *                     command:
 *                       type: string
 *                       enum: [UNLOCK, LOCK, null]
 *       401:
 *         description: Token thiết bị không hợp lệ
 */
router.get(
  '/:id/command',
  deviceLimiter,
  deviceAuthMiddleware,
  doorsController.getCommand
);

/**
 * @swagger
 * /api/doors/{id}/command/ack:
 *   post:
 *     summary: Xác nhận đã thực hiện lệnh (ESP32)
 *     description: ESP32 xác nhận đã thực hiện lệnh từ server
 *     tags: [Doors]
 *     security:
 *       - DeviceToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cửa
 *     responses:
 *       200:
 *         description: Xác nhận thành công
 *       401:
 *         description: Token thiết bị không hợp lệ
 */
router.post(
  '/:id/command/ack',
  deviceLimiter,
  deviceAuthMiddleware,
  doorsController.acknowledgeCommand
);

module.exports = router;
