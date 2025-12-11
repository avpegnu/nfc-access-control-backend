const { getFirebaseDatabase } = require('../config/firebase');

/**
 * Firebase Realtime Database service
 * Provides abstraction layer for all database operations
 */
class FirebaseService {
  constructor() {
    this.db = null;
  }

  /**
   * Get database instance (lazy initialization)
   */
  getDb() {
    if (!this.db) {
      this.db = getFirebaseDatabase();
    }
    return this.db;
  }

  /**
   * Read data once from path
   */
  async get(path) {
    const snapshot = await this.getDb().ref(path).once('value');
    return snapshot.val();
  }

  /**
   * Write data (overwrite)
   */
  async set(path, data) {
    await this.getDb().ref(path).set(data);
    return data;
  }

  /**
   * Update data (merge)
   */
  async update(path, data) {
    await this.getDb().ref(path).update(data);
    return data;
  }

  /**
   * Push new data with auto-generated key
   */
  async push(path, data) {
    const newRef = await this.getDb().ref(path).push(data);
    return { id: newRef.key, ...data };
  }

  /**
   * Delete data
   */
  async remove(path) {
    await this.getDb().ref(path).remove();
    return true;
  }

  /**
   * Check if path exists
   */
  async exists(path) {
    const snapshot = await this.getDb().ref(path).once('value');
    return snapshot.exists();
  }

  /**
   * Get all items from a collection as array
   */
  async getAll(path) {
    const data = await this.get(path);
    if (!data) return [];
    return Object.entries(data).map(([id, item]) => ({
      id,
      ...item
    }));
  }

  /**
   * Get item by ID from a collection
   */
  async getById(path, id) {
    const data = await this.get(`${path}/${id}`);
    if (!data) return null;
    return { id, ...data };
  }

  /**
   * Create item with specific ID
   */
  async createWithId(path, id, data) {
    await this.set(`${path}/${id}`, data);
    return { id, ...data };
  }

  /**
   * Delete item by ID
   */
  async delete(path, id) {
    await this.remove(`${path}/${id}`);
    return true;
  }

  /**
   * Get data with ordering and limiting
   */
  async query(path, options = {}) {
    let query = this.getDb().ref(path);

    if (options.orderByChild) {
      query = query.orderByChild(options.orderByChild);
    }

    if (options.orderByKey) {
      query = query.orderByKey();
    }

    if (options.equalTo !== undefined) {
      query = query.equalTo(options.equalTo);
    }

    if (options.startAt !== undefined) {
      query = query.startAt(options.startAt);
    }

    if (options.endAt !== undefined) {
      query = query.endAt(options.endAt);
    }

    if (options.limitToLast) {
      query = query.limitToLast(options.limitToLast);
    }

    if (options.limitToFirst) {
      query = query.limitToFirst(options.limitToFirst);
    }

    const snapshot = await query.once('value');
    return snapshot.val();
  }

  /**
   * Subscribe to realtime updates (returns unsubscribe function)
   */
  subscribe(path, callback) {
    const ref = this.getDb().ref(path);
    const listener = ref.on('value', (snapshot) => {
      callback(snapshot.val(), snapshot.key);
    });

    // Return unsubscribe function
    return () => ref.off('value', listener);
  }

  /**
   * Subscribe to child events
   */
  subscribeChild(path, event, callback) {
    const ref = this.getDb().ref(path);
    const listener = ref.on(event, (snapshot) => {
      callback({ key: snapshot.key, ...snapshot.val() });
    });

    return () => ref.off(event, listener);
  }

  /**
   * Transaction - atomic read-modify-write
   */
  async transaction(path, updateFn) {
    const result = await this.getDb().ref(path).transaction(updateFn);
    return result.snapshot.val();
  }

  /**
   * Multi-path update (atomic update across multiple paths)
   */
  async multiUpdate(updates) {
    await this.getDb().ref().update(updates);
    return true;
  }
}

// Export singleton instance
module.exports = new FirebaseService();
