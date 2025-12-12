const express = require('express');

// Import legacy routes (for Frontend)
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const doorsRoutes = require('./doors.routes');
const accessRoutes = require('./access.routes');
const realtimeRoutes = require('./realtime.routes');

// Import API v1 routes (for ESP32)
const v1Routes = require('./v1');

const router = express.Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime()
    }
  });
});

// =====================
// API v1 routes (ESP32)
// =====================
router.use('/v1', v1Routes);

// =====================
// Legacy API routes (Frontend)
// =====================
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/doors', doorsRoutes);
router.use('/access', accessRoutes);
router.use('/realtime', realtimeRoutes);

// Root endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'NFC Access Control API',
      version: '1.4.0',
      endpoints: {
        v1: '/api/v1 (ESP32)',
        legacy: '/api (Frontend)'
      },
      documentation: '/api/v1/health'
    }
  });
});

module.exports = router;
