const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('./env');

// In-memory token blacklist (use Redis in production for scalability)
// Using Map to store token with expiry time for efficient cleanup
const tokenBlacklist = new Map();

// Maximum blacklist size to prevent memory issues
const MAX_BLACKLIST_SIZE = 10000;

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Add token to blacklist (for logout)
 */
const blacklistToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    const exp = decoded?.exp || (Math.floor(Date.now() / 1000) + 86400); // Default 24h if no exp
    
    // Clean up if blacklist is too large
    if (tokenBlacklist.size >= MAX_BLACKLIST_SIZE) {
      cleanupBlacklist();
    }
    
    tokenBlacklist.set(token, exp);
  } catch (error) {
    // If decode fails, add with default expiry
    tokenBlacklist.set(token, Math.floor(Date.now() / 1000) + 86400);
  }
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Clean up expired tokens from blacklist (run periodically)
 */
const cleanupBlacklist = () => {
  const now = Math.floor(Date.now() / 1000);
  let cleanedCount = 0;

  tokenBlacklist.forEach((exp, token) => {
    if (exp < now) {
      tokenBlacklist.delete(token);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`Cleaned ${cleanedCount} expired tokens from blacklist. Remaining: ${tokenBlacklist.size}`);
  }
};

// Run cleanup every hour
setInterval(cleanupBlacklist, 60 * 60 * 1000);

module.exports = {
  generateToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted
};
