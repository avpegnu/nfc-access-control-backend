const express = require("express");
const router = express.Router();
const deviceController = require("../../controllers/device.controller");
const { deviceAuthMiddleware } = require("../../middleware/deviceAuth");
const { authMiddleware } = require("../../middleware/auth");
const { deviceLimiter } = require("../../middleware/rateLimiter");
const { validate } = require("../../middleware/validation");
const {
  deviceRegisterSchema,
  deviceHeartbeatSchema,
  deviceConfigUpdateSchema,
} = require("../../utils/validators");

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Quản lý thiết bị ESP32
 */

/**
 * @swagger
 * /api/v1/device/register:
 *   post:
 *     summary: Đăng ký thiết bị mới
 *     description: ESP32 đăng ký lần đầu với server sử dụng secret key
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - secret
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: "reader-lobby-01"
 *                 description: ID thiết bị (phải khớp với DEVICE_SECRETS)
 *               secret:
 *                 type: string
 *                 example: "secret_lobby_2024"
 *                 description: Secret key của thiết bị (phải khớp với DEVICE_SECRETS)
 *     responses:
 *       200:
 *         description: Đăng ký thành công
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
 *                     token:
 *                       type: string
 *                     device:
 *                       $ref: '#/components/schemas/Device'
 *       401:
 *         description: Secret key không hợp lệ
 */
router.post(
  "/register",
  deviceLimiter,
  validate(deviceRegisterSchema),
  deviceController.register
);

/**
 * @swagger
 * /api/v1/device/config:
 *   get:
 *     summary: Lấy cấu hình thiết bị
 *     description: ESP32 lấy cấu hình từ server
 *     tags: [Devices]
 *     security:
 *       - DeviceToken: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Token không hợp lệ
 */
router.get("/config", deviceAuthMiddleware, deviceController.getConfig);

/**
 * @swagger
 * /api/v1/device/heartbeat:
 *   post:
 *     summary: Gửi heartbeat
 *     description: ESP32 gửi tín hiệu heartbeat để duy trì kết nối
 *     tags: [Devices]
 *     security:
 *       - DeviceToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               freeHeap:
 *                 type: integer
 *               uptime:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Token không hợp lệ
 */
router.post(
  "/heartbeat",
  deviceAuthMiddleware,
  validate(deviceHeartbeatSchema),
  deviceController.heartbeat
);

/**
 * Admin routes for device management
 */

/**
 * @swagger
 * /api/v1/device/list:
 *   get:
 *     summary: Lấy danh sách thiết bị
 *     description: Admin lấy danh sách tất cả thiết bị đã đăng ký
 *     tags: [Devices]
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
 *                     $ref: '#/components/schemas/Device'
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/list", authMiddleware, deviceController.listDevices);

/**
 * @swagger
 * /api/v1/device/{deviceId}:
 *   get:
 *     summary: Lấy thông tin thiết bị
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thiết bị
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy thiết bị
 */
router.get("/:deviceId", authMiddleware, deviceController.getDevice);

/**
 * @swagger
 * /api/v1/device/{deviceId}/config:
 *   put:
 *     summary: Cập nhật cấu hình thiết bị
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thiết bị
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy thiết bị
 */
router.put(
  "/:deviceId/config",
  authMiddleware,
  validate(deviceConfigUpdateSchema),
  deviceController.updateConfig
);

module.exports = router;
