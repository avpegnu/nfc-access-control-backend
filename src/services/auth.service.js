const { getFirebaseAuth } = require('../config/firebase');
const { generateToken, blacklistToken } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * Authentication service
 */
class AuthService {
  /**
   * Login with email and password
   * Note: Firebase Admin SDK cannot verify passwords directly
   * We need to use Firebase REST API for this
   */
  async login(email, password) {
    try {
      // Use Firebase REST API to verify email/password
      const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY;

      if (!FIREBASE_API_KEY) {
        throw new Error('FIREBASE_WEB_API_KEY is required for login');
      }

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.error?.message || 'UNKNOWN_ERROR';
        const error = new Error(errorCode);
        error.code = `auth/${errorCode.toLowerCase().replace(/_/g, '-')}`;
        throw error;
      }

      // Get user details from Admin SDK
      const userRecord = await getFirebaseAuth().getUser(data.localId);

      // Generate JWT token
      const token = generateToken({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || email.split('@')[0],
        role: 'admin' // All logged-in users are admins
      });

      logger.info(`User logged in: ${email}`);

      return {
        token,
        expiresIn: 86400, // 24 hours in seconds
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || email.split('@')[0],
          role: 'admin'
        }
      };
    } catch (error) {
      logger.error(`Login failed for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Register new admin user
   */
  async register(email, password, displayName) {
    try {
      const userRecord = await getFirebaseAuth().createUser({
        email,
        password,
        displayName,
        emailVerified: false
      });

      logger.info(`New user registered: ${email}`);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      };
    } catch (error) {
      logger.error(`Registration failed for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Logout - blacklist current token
   */
  async logout(token) {
    blacklistToken(token);
    logger.info('User logged out');
    return true;
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid) {
    try {
      const userRecord = await getFirebaseAuth().getUser(uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        role: 'admin'
      };
    } catch (error) {
      logger.error(`Get user failed for ${uid}:`, error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(uid, updates) {
    try {
      const userRecord = await getFirebaseAuth().updateUser(uid, updates);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      };
    } catch (error) {
      logger.error(`Update user failed for ${uid}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid) {
    try {
      await getFirebaseAuth().deleteUser(uid);
      logger.info(`User deleted: ${uid}`);
      return true;
    } catch (error) {
      logger.error(`Delete user failed for ${uid}:`, error.message);
      throw error;
    }
  }
}

module.exports = new AuthService();
