const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { ALLOWED_ORIGINS } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import legacy routes (for Frontend)
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const doorsRoutes = require('./routes/doors.routes');
const accessRoutes = require('./routes/access.routes');
const realtimeRoutes = require('./routes/realtime.routes');

// Import API v1 routes (for ESP32)
const v1Routes = require('./routes/v1');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, ESP32, etc.)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Device-ID']
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Rate limiting (apply to all API routes)
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
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
app.use('/api/v1', v1Routes);

// =====================
// Legacy API routes (Frontend)
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/doors', doorsRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/realtime', realtimeRoutes);

// Root endpoint
app.get('/', (req, res) => {
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

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
