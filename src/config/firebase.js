const admin = require('firebase-admin');
const fs = require('fs');
const {
  FIREBASE_SERVICE_ACCOUNT,
  FIREBASE_SERVICE_ACCOUNT_PATH,
  FIREBASE_DATABASE_URL
} = require('./env');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    let serviceAccount;

    // Option 1: Load from environment variable (JSON string)
    if (FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    }
    // Option 2: Load from file path
    else if (FIREBASE_SERVICE_ACCOUNT_PATH) {
      const filePath = FIREBASE_SERVICE_ACCOUNT_PATH;
      if (!fs.existsSync(filePath)) {
        throw new Error(`Service account file not found: ${filePath}`);
      }
      serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    else {
      throw new Error('No Firebase service account provided. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DATABASE_URL
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    throw error;
  }
};

const getFirebaseAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

const getFirebaseDatabase = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.database();
};

module.exports = {
  initializeFirebase,
  getFirebaseAuth,
  getFirebaseDatabase
};
