const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const realtimeService = require("../../services/realtime.service");
const { verifyToken, isTokenBlacklisted } = require("../../config/jwt");
const logger = require("../../utils/logger");

/**
 * @swagger
 * tags:
 *   name: Realtime
 *   description: Server-Sent Events cho cập nhật thời gian thực
 */

/**
 * @swagger
 * /api/realtime/events:
 *   get:
 *     summary: Kết nối SSE realtime
 *     description: Endpoint Server-Sent Events để nhận cập nhật thời gian thực (trạng thái cửa, truy cập mới)
 *     tags: [Realtime]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT token để xác thực
 *     responses:
 *       200:
 *         description: Kết nối SSE thành công
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.get("/events", (req, res) => {
  // Get token from query param (SSE can't use headers easily)
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTH_NO_TOKEN",
        message: "Token không được cung cấp",
      },
    });
  }

  // Verify token
  try {
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_TOKEN_REVOKED",
          message: "Token đã bị thu hồi",
        },
      });
    }

    verifyToken(token);
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTH_INVALID_TOKEN",
        message: "Token không hợp lệ",
      },
    });
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Generate unique client ID
  const clientId = uuidv4();

  // Send initial connection message
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      clientId,
      timestamp: Date.now(),
    })}\n\n`
  );

  // Add client to realtime service
  realtimeService.addClient(clientId, res);

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    res.write(
      `event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`
    );
  }, 30000);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    realtimeService.removeClient(clientId);
    logger.info(`SSE client closed: ${clientId}`);
  });
});

/**
 * @swagger
 * /api/realtime/status:
 *   get:
 *     summary: Lấy trạng thái dịch vụ realtime
 *     description: Trả về số lượng client đang kết nối SSE
 *     tags: [Realtime]
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     connectedClients:
 *                       type: integer
 *                       example: 5
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    data: {
      connectedClients: realtimeService.getClientCount(),
    },
  });
});

module.exports = router;
