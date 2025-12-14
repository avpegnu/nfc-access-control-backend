const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Crypto configuration for EdDSA/ES256 credential signing
 * Used for NFC card credentials that can be verified offline
 */

const KEYS_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

let privateKey = null;
let publicKey = null;
let keyId = null;

/**
 * Initialize or load EdDSA key pair
 */
const initializeKeys = () => {
  // Check environment variables first
  if (process.env.CREDENTIAL_PRIVATE_KEY && process.env.CREDENTIAL_PUBLIC_KEY) {
    privateKey = process.env.CREDENTIAL_PRIVATE_KEY.replace(/\\n/g, '\n');
    publicKey = process.env.CREDENTIAL_PUBLIC_KEY.replace(/\\n/g, '\n');
    keyId = process.env.CREDENTIAL_KEY_ID || 'env-key-01';
    console.log('Loaded credential keys from environment variables');
    return;
  }

  // Try to load from files
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    keyId = process.env.CREDENTIAL_KEY_ID || 'file-key-01';
    console.log('Loaded credential keys from files');
    return;
  }

  // Generate new key pair (Ed25519)
  console.log('Generating new Ed25519 key pair for credentials...');

  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const keyPair = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;
  keyId = `generated-${Date.now()}`;

  // Save to files
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);

  console.log('Generated and saved new credential keys');
  console.log(`Key ID: ${keyId}`);
};

/**
 * Get public key in PEM format (for ESP32 offline verification)
 */
const getPublicKeyPem = () => {
  if (!publicKey) {
    initializeKeys();
  }
  return publicKey;
};

/**
 * Get private key for signing
 */
const getPrivateKey = () => {
  if (!privateKey) {
    initializeKeys();
  }
  return privateKey;
};

/**
 * Get current key ID
 */
const getKeyId = () => {
  if (!keyId) {
    initializeKeys();
  }
  return keyId;
};

/**
 * Sign data with EdDSA (Ed25519)
 */
const signEdDSA = (data) => {
  const key = crypto.createPrivateKey(getPrivateKey());
  const signature = crypto.sign(null, Buffer.from(data), key);
  return signature.toString('base64url');
};

/**
 * Verify EdDSA signature
 */
const verifyEdDSA = (data, signature) => {
  const key = crypto.createPublicKey(getPublicKeyPem());
  const signatureBuffer = Buffer.from(signature, 'base64url');
  return crypto.verify(null, Buffer.from(data), key, signatureBuffer);
};

/**
 * Create JWT-like credential for NFC card
 * Format: header.payload.signature (base64url encoded)
 */
const createCardCredential = (payload) => {
  const header = {
    alg: 'EdDSA',
    typ: 'JWT',
    kid: getKeyId()
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const dataToSign = `${headerB64}.${payloadB64}`;
  const signature = signEdDSA(dataToSign);

  return `${dataToSign}.${signature}`;
};

/**
 * Verify and decode card credential
 */
const verifyCardCredential = (credential) => {
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid credential format' };
    }

    const [headerB64, payloadB64, signature] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    // Verify signature
    if (!verifyEdDSA(dataToVerify, signature)) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Credential expired', payload };
    }

    return { valid: true, header, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Get JWT verification config for ESP32
 */
const getJwtVerificationConfig = () => {
  return {
    alg: 'EdDSA',
    public_key_pem: getPublicKeyPem(),
    kid: getKeyId()
  };
};

// Initialize keys on module load
initializeKeys();

module.exports = {
  getPublicKeyPem,
  getPrivateKey,
  getKeyId,
  signEdDSA,
  verifyEdDSA,
  createCardCredential,
  verifyCardCredential,
  getJwtVerificationConfig
};
