const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');
const { initializeFirebase } = require('./config/firebase');
const doorsService = require('./services/doors.service');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize Firebase Admin SDK
    logger.info('Initializing Firebase Admin SDK...');
    initializeFirebase();

    // Ensure default door exists
    await doorsService.ensureDefaultDoor();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`
========================================
  NFC Access Control Backend
========================================
  Environment: ${NODE_ENV}
  Port: ${PORT}
  URL: http://localhost:${PORT}
  API: http://localhost:${PORT}/api
  Health: http://localhost:${PORT}/health
========================================
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
