/**
 * Mock Firebase for local testing without real Firebase
 */

// In-memory database
const mockDb = {
  users: {
    'user_001': {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@test.com',
      role: 'admin',
      isActive: true,
      created_at: new Date().toISOString()
    },
    'user_002': {
      name: 'Trần Thị B',
      email: 'tranthib@test.com',
      role: 'user',
      isActive: true,
      created_at: new Date().toISOString()
    }
  },
  cards: {
    'c_test001': {
      card_id: 'c_test001',
      card_uid: 'AABBCCDD',
      user_id: 'user_001',
      user_name: 'Nguyễn Văn A',
      status: 'active',
      enroll_mode: false,
      policy: {
        access_level: 'admin',
        allowed_doors: ['*']
      },
      created_at: new Date().toISOString()
    }
  },
  doors: {
    'door_main': {
      name: 'Cửa chính',
      location: 'Tầng 1 - Sảnh',
      status: {
        isOpen: false,
        isOnline: true,
        lastUpdated: Date.now()
      }
    }
  },
  devices: {},
  access_logs: {}
};

// Mock database reference
class MockRef {
  constructor(path) {
    this.path = path;
  }

  async once(eventType) {
    const data = this._getData();
    return {
      val: () => data,
      exists: () => data !== null,
      key: this.path.split('/').pop()
    };
  }

  async set(data) {
    this._setData(data);
    return data;
  }

  async update(data) {
    const current = this._getData() || {};
    this._setData({ ...current, ...data });
    return data;
  }

  async push(data) {
    const key = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const parts = this.path.split('/').filter(Boolean);
    let ref = mockDb;
    for (const part of parts) {
      if (!ref[part]) ref[part] = {};
      ref = ref[part];
    }
    ref[key] = data;
    return { key };
  }

  async remove() {
    const parts = this.path.split('/').filter(Boolean);
    if (parts.length === 0) return;
    
    let ref = mockDb;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!ref[parts[i]]) return;
      ref = ref[parts[i]];
    }
    delete ref[parts[parts.length - 1]];
  }

  async transaction(updateFn) {
    const current = this._getData();
    const newValue = updateFn(current);
    if (newValue !== undefined) {
      this._setData(newValue);
    }
    return { snapshot: { val: () => newValue } };
  }

  on(eventType, callback) {
    // Return mock listener
    setTimeout(() => callback({ val: () => this._getData(), key: this.path.split('/').pop() }), 0);
    return () => {};
  }

  off() {}

  orderByChild(child) { return this; }
  orderByKey() { return this; }
  equalTo(value) { return this; }
  startAt(value) { return this; }
  endAt(value) { return this; }
  limitToLast(num) { return this; }
  limitToFirst(num) { return this; }

  _getData() {
    const parts = this.path.split('/').filter(Boolean);
    let ref = mockDb;
    for (const part of parts) {
      if (ref === null || ref === undefined) return null;
      ref = ref[part];
    }
    return ref !== undefined ? ref : null;
  }

  _setData(data) {
    const parts = this.path.split('/').filter(Boolean);
    if (parts.length === 0) return;

    let ref = mockDb;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!ref[parts[i]]) ref[parts[i]] = {};
      ref = ref[parts[i]];
    }
    ref[parts[parts.length - 1]] = data;
  }
}

// Mock database
const mockDatabase = {
  ref: (path = '') => new MockRef(path)
};

// Mock auth
const mockAuth = {
  async getUser(uid) {
    const user = mockDb.users[uid];
    if (!user) {
      const error = new Error('User not found');
      error.code = 'auth/user-not-found';
      throw error;
    }
    return {
      uid,
      email: user.email,
      displayName: user.name,
      emailVerified: true,
      disabled: false
    };
  },
  async createUser(data) {
    const uid = 'user_' + Date.now();
    mockDb.users[uid] = {
      name: data.displayName,
      email: data.email,
      role: 'user',
      isActive: true,
      created_at: new Date().toISOString()
    };
    return { uid, email: data.email, displayName: data.displayName };
  },
  async updateUser(uid, data) {
    if (mockDb.users[uid]) {
      mockDb.users[uid] = { ...mockDb.users[uid], ...data };
    }
    return { uid, ...data };
  },
  async deleteUser(uid) {
    delete mockDb.users[uid];
  }
};

let firebaseApp = { name: 'mock-app' };

const initializeFirebase = () => {
  console.log('🔶 MOCK MODE: Firebase initialized with in-memory database');
  console.log('🔶 Test users: user_001 (admin), user_002 (user)');
  console.log('🔶 Test card UID: AABBCCDD');
  return firebaseApp;
};

const getFirebaseAuth = () => mockAuth;
const getFirebaseDatabase = () => mockDatabase;

module.exports = {
  initializeFirebase,
  getFirebaseAuth,
  getFirebaseDatabase
};
