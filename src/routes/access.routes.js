const express = require('express');
const router = express.Router();

const accessController = require('../controllers/access.controller');
const { authMiddleware } = require('../middleware/auth');
const { deviceAuthMiddleware } = require('../middleware/deviceAuth');
const { validateBody, validateQuery } = require('../middleware/validation');
const { deviceLimiter } = require('../middleware/rateLimiter');
const { verifyAccessSchema, accessLogsQuerySchema } = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Access
 *   description: Xác thực NFC và lịch sử truy cập
 */

/**
 * @swagger
 * /api/access/verify:
 *   post:
 *     summary: Xác thực thẻ NFC (ESP32)
 *     description: ESP32 gửi UID thẻ NFC để xác thực quyền truy cập
 *     tags: [Access]
 *     security:
 *       - DeviceToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardUid
 *               - doorId
 *             properties:
 *               cardUid:
 *                 type: string
 *                 example: "04:A1:B2:C3:D4:E5:F6"
 *               doorId:
 *                 type: string
 *                 example: "main-door"
 *     responses:
 *       200:
 *         description: Kết quả xác thực
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
 *                     allowed:
 *                       type: boolean
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Token thiết bị không hợp lệ
 */
router.post(
  '/verify',
  deviceLimiter,
  deviceAuthMiddleware,
  validateBody(verifyAccessSchema),
  accessController.verify
);

/**
 * @swagger
 * /api/access/logs:
 *   get:
 *     summary: Lấy lịch sử truy cập
 *     description: Trả về danh sách lịch sử truy cập với phân trang
 *     tags: [Access]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [granted, denied]
 *         description: Lọc theo trạng thái
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
 *                     $ref: '#/components/schemas/AccessLog'
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  '/logs',
  authMiddleware,
  validateQuery(accessLogsQuerySchema),
  accessController.getLogs
);

/**
 * @swagger
 * /api/access/stats:
 *   get:
 *     summary: Lấy thống kê truy cập
 *     description: Trả về thống kê tổng quan về hoạt động truy cập
 *     tags: [Access]
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
 *                   type: object
 *                   properties:
 *                     totalToday:
 *                       type: integer
 *                     granted:
 *                       type: integer
 *                     denied:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  '/stats',
  authMiddleware,
  accessController.getStats
);

/**
 * @swagger
 * /api/access/recent:
 *   get:
 *     summary: Lấy các truy cập gần đây
 *     description: Trả về danh sách các lượt truy cập mới nhất
 *     tags: [Access]
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
 *                     $ref: '#/components/schemas/AccessLog'
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  '/recent',
  authMiddleware,
  accessController.getRecent
);

module.exports = router;
