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

// Parse device secrets for registration
let deviceSecrets = [];
try {
  if (process.env.DEVICE_SECRETS) {
    deviceSecrets = JSON.parse(process.env.DEVICE_SECRETS);
  }
} catch (error) {
  console.error('Invalid DEVICE_SECRETS format. Must be valid JSON array.');
  process.exit(1);
}

// Parse allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// Always allow Swagger UI functioning on the same port
const port = parseInt(process.env.PORT, 10) || 3001;
const localOrigin = `http://localhost:${port}`;
if (!allowedOrigins.includes(localOrigin)) {
  allowedOrigins.push(localOrigin);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,

  // JWT for Frontend Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // JWT for Device Auth (separate secret for security)
  DEVICE_JWT_SECRET: process.env.DEVICE_JWT_SECRET || process.env.JWT_SECRET,
  DEVICE_JWT_EXPIRES_IN: process.env.DEVICE_JWT_EXPIRES_IN || '365d',

  // Credential (card JWT) settings
  CREDENTIAL_EXPIRES_IN: parseInt(process.env.CREDENTIAL_EXPIRES_IN, 10) || 86400 * 30, // 30 days default
  CREDENTIAL_KEY_ID: process.env.CREDENTIAL_KEY_ID || null,

  // Firebase
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
  FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY,

  // Device Secrets (for device registration)
  DEVICE_SECRETS: deviceSecrets,

  // CORS
  ALLOWED_ORIGINS: allowedOrigins,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10
};
