require('dotenv').config();

const requiredEnvVars = [
  'JWT_SECRET',
  'FIREBASE_DATABASE_URL'
];

// Validate required environment variables
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Parse device API keys
let deviceApiKeys = [];
try {
  if (process.env.DEVICE_API_KEYS) {
    deviceApiKeys = JSON.parse(process.env.DEVICE_API_KEYS);
  }
} catch (error) {
  console.error('Invalid DEVICE_API_KEYS format. Must be valid JSON array.');
  process.exit(1);
}

// Parse allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Firebase
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,

  // Device API Keys
  DEVICE_API_KEYS: deviceApiKeys,

  // CORS
  ALLOWED_ORIGINS: allowedOrigins,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10
};
