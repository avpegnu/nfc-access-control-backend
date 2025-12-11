const express = require('express');
const router = express.Router();

const deviceRoutes = require('./device.routes');
const cardRoutes = require('./card.routes');
const accessRoutes = require('./access.routes');

/**
 * API v1 Routes
 * Base path: /api/v1
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      version: '1.4.0',
      timestamp: new Date().toISOString()
    }
  });
});

// Mount routes
router.use('/device', deviceRoutes);
router.use('/cards', cardRoutes);
router.use('/access', accessRoutes);

module.exports = router;
