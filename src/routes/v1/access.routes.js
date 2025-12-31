const express = require("express");
const router = express.Router();
const accessController = require("../../controllers/access.controller");
const { deviceAuthMiddleware } = require("../../middleware/deviceAuth");
const { authMiddleware } = require("../../middleware/auth");
const { deviceLimiter } = require("../../middleware/rateLimiter");
const { validate } = require("../../middleware/validation");
const { accessCheckSchema, logBatchSchema } = require("../../utils/validators");

/**
 * @swagger
 * tags:
 *   name: Access V1
 *   description: API kiểm tra quyền truy cập (V1)
 */

/**
 * @swagger
 * /api/v1/access/check:
 *   post:
 *     summary: Kiểm tra quyền truy cập thẻ (ESP32)
 *     description: ESP32 gửi UID thẻ để kiểm tra quyền truy cập
 *     tags: [Access V1]
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
 *                 description: UID của thẻ NFC
 *               doorId:
 *                 type: string
 *                 example: "door_main"
 *                 description: ID cửa đang kiểm tra
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra
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
  "/check",
  deviceAuthMiddleware,
  deviceLimiter,
  validate(accessCheckSchema),
  accessController.check
);

/**
 * @swagger
 * /api/v1/access/log-batch:
 *   post:
 *     summary: Đồng bộ log offline (ESP32)
 *     description: ESP32 gửi batch log khi offline về server
 *     tags: [Access V1]
 *     security:
 *       - DeviceToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logs
 *             properties:
 *               logs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cardUid:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [granted, denied]
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 *       401:
 *         description: Token thiết bị không hợp lệ
 */
router.post(
  "/log-batch",
  deviceAuthMiddleware,
  validate(logBatchSchema),
  accessController.logBatch
);

/**
 * Admin routes for access management
 */

/**
 * @swagger
 * /api/v1/access/logs:
 *   get:
 *     summary: Lấy lịch sử truy cập
 *     tags: [Access V1]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/logs", authMiddleware, accessController.getLogs);

/**
 * @swagger
 * /api/v1/access/stats:
 *   get:
 *     summary: Lấy thống kê truy cập
 *     tags: [Access V1]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/stats", authMiddleware, accessController.getStats);

/**
 * @swagger
 * /api/v1/access/recent:
 *   get:
 *     summary: Lấy các truy cập gần đây
 *     tags: [Access V1]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/recent", authMiddleware, accessController.getRecent);

module.exports = router;
