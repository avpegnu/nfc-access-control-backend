const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const realtimeService = require('../services/realtime.service');
const { verifyToken, isTokenBlacklisted } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * @route   GET /api/realtime/events
 * @desc    Server-Sent Events endpoint for realtime updates
 * @access  Private (token in query param)
 */
router.get('/events', (req, res) => {
  // Get token from query param (SSE can't use headers easily)
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_NO_TOKEN',
        message: 'Token không được cung cấp'
      }
    });
  }

  // Verify token
  try {
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_REVOKED',
          message: 'Token đã bị thu hồi'
        }
      });
    }

    verifyToken(token);
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: 'Token không hợp lệ'
      }
    });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  });

  // Generate unique client ID
  const clientId = uuidv4();

  // Send initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

  // Add client to realtime service
  realtimeService.addClient(clientId, res);

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    realtimeService.removeClient(clientId);
    logger.info(`SSE client closed: ${clientId}`);
  });
});

/**
 * @route   GET /api/realtime/status
 * @desc    Get realtime service status
 * @access  Private
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      connectedClients: realtimeService.getClientCount()
    }
  });
});

module.exports = router;
