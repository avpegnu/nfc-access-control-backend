const firebaseService = require('./firebase.service');
const logger = require('../utils/logger');

/**
 * User management service
 * Manages NFC card users (not admin users)
 */
class UsersService {
  /**
   * Get all users
   */
  async getAll() {
    const usersData = await firebaseService.get('users');

    if (!usersData) {
      return [];
    }

    // Convert object to array with id
    return Object.entries(usersData).map(([id, user]) => ({
      id,
      ...user
    }));
  }

  /**
   * Get user by ID
   */
  async getById(userId) {
    const user = await firebaseService.get(`users/${userId}`);

    if (!user) {
      return null;
    }

    return { id: userId, ...user };
  }

  /**
   * Get user by card UID
   */
  async getByCardUid(cardUid) {
    // Use cardIndex for fast lookup
    const userId = await firebaseService.get(`cardIndex/${cardUid}`);

    if (!userId) {
      return null;
    }

    return this.getById(userId);
  }

  /**
   * Check if card UID exists
   */
  async cardExists(cardUid) {
    return firebaseService.exists(`cardIndex/${cardUid}`);
  }

  /**
   * Create new user
   * Note: cardUid is now optional - cards are managed separately via /cards endpoints
   */
  async create(userData) {
    const { name, email, cardUid, role = 'user' } = userData;

    // Check if card UID already exists (only if cardUid is provided)
    if (cardUid) {
      const cardExists = await this.cardExists(cardUid);
      if (cardExists) {
        const error = new Error('Card UID đã được sử dụng');
        error.code = 'CARD_ALREADY_EXISTS';
        error.statusCode = 400;
        throw error;
      }
    }

    const timestamp = Date.now();
    const newUser = {
      name,
      email: email || '',
      role,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Add cardUid if provided (legacy support)
    if (cardUid) {
      newUser.cardUid = cardUid;
    }

    // Create user
    const result = await firebaseService.push('users', newUser);

    // Add to cardIndex for fast lookup (only if cardUid is provided)
    if (cardUid) {
      await firebaseService.set(`cardIndex/${cardUid}`, result.id);
    }

    logger.info(`User created: ${name} (${result.id})`);

    return result;
  }

  /**
   * Update user
   */
  async update(userId, userData) {
    const existingUser = await this.getById(userId);

    if (!existingUser) {
      const error = new Error('Người dùng không tồn tại');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // If cardUid is being changed, check if new one exists
    if (userData.cardUid && userData.cardUid !== existingUser.cardUid) {
      const cardExists = await this.cardExists(userData.cardUid);
      if (cardExists) {
        const error = new Error('Card UID đã được sử dụng');
        error.code = 'CARD_ALREADY_EXISTS';
        error.statusCode = 400;
        throw error;
      }

      // Remove old cardIndex entry
      await firebaseService.remove(`cardIndex/${existingUser.cardUid}`);

      // Add new cardIndex entry
      await firebaseService.set(`cardIndex/${userData.cardUid}`, userId);
    }

    const updatedData = {
      ...userData,
      updatedAt: Date.now()
    };

    await firebaseService.update(`users/${userId}`, updatedData);

    logger.info(`User updated: ${userId}`);

    return this.getById(userId);
  }

  /**
   * Delete user
   */
  async delete(userId) {
    const user = await this.getById(userId);

    if (!user) {
      const error = new Error('Người dùng không tồn tại');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // Remove from cardIndex
    if (user.cardUid) {
      await firebaseService.remove(`cardIndex/${user.cardUid}`);
    }

    // Remove user
    await firebaseService.remove(`users/${userId}`);

    logger.info(`User deleted: ${userId}`);

    return true;
  }

  /**
   * Toggle user active status
   */
  async toggleActive(userId) {
    const user = await this.getById(userId);

    if (!user) {
      const error = new Error('Người dùng không tồn tại');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const newStatus = !user.isActive;

    await firebaseService.update(`users/${userId}`, {
      isActive: newStatus,
      updatedAt: Date.now()
    });

    logger.info(`User ${userId} active status: ${newStatus}`);

    return { id: userId, isActive: newStatus };
  }

  /**
   * Get users count
   */
  async getCount() {
    const users = await this.getAll();
    return users.length;
  }

  /**
   * Get active users count
   */
  async getActiveCount() {
    const users = await this.getAll();
    return users.filter(u => u.isActive).length;
  }
}

module.exports = new UsersService();
