const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('./env');

// In-memory token blacklist (use Redis in production for scalability)
const tokenBlacklist = new Set();

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
  tokenBlacklist.add(token);
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

  tokenBlacklist.forEach((token) => {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp && decoded.exp < now) {
        tokenBlacklist.delete(token);
      }
    } catch (error) {
      // Invalid token, remove it
      tokenBlacklist.delete(token);
    }
  });
};

// Run cleanup every hour
setInterval(cleanupBlacklist, 60 * 60 * 1000);

module.exports = {
  generateToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted
};
