const {
  createCardCredential,
  verifyCardCredential,
  getKeyId,
} = require("../config/crypto");
const { CREDENTIAL_EXPIRES_IN } = require("../config/env");

/**
 * Generate a new credential JWT for NFC card
 *
 * Credential payload contains ONLY immutable fields to prevent token invalidation:
 * - card_id: Internal card ID (immutable)
 * - card_uid: Hardware UID (immutable)
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp
 *
 * Dynamic fields (user_id, policy, etc.) are validated from database in real-time
 * This ensures token remains valid even when user/policy changes
 */
const generateCredential = (card, user, options = {}) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || CREDENTIAL_EXPIRES_IN || 86400 * 30; // Default 30 days

  const payload = {
    // ONLY immutable card identifiers
    card_id: card.card_id,
    card_uid: card.card_uid,

    // Timestamps
    iat: now,
    exp: now + expiresIn,
  };

  const raw = createCardCredential(payload);

  return {
    format: "jwt",
    alg: "EdDSA",
    raw,
    exp: new Date((now + expiresIn) * 1000).toISOString(),
  };
};

/**
 * Verify credential from NFC card
 *
 * Returns:
 * - valid: boolean
 * - payload: decoded payload if valid
 * - error: error message if invalid
 */
const verifyCredential = (credentialRaw, cardUid = null) => {
  const result = verifyCardCredential(credentialRaw);

  if (!result.valid) {
    return result;
  }

  // Verify card_uid matches if provided
  if (cardUid && result.payload.card_uid !== cardUid) {
    return {
      valid: false,
      error: "Card UID mismatch",
      payload: result.payload,
    };
  }

  return result;
};

/**
 * Check if credential should be rotated
 * Rotate if:
 * - Credential is older than rotation threshold
 * - Less than 25% of validity period remaining
 */
const shouldRotateCredential = (payload) => {
  const now = Math.floor(Date.now() / 1000);
  const totalValidity = payload.exp - payload.iat;
  const remaining = payload.exp - now;

  // Rotate if less than 25% remaining
  if (remaining < totalValidity * 0.25) {
    return true;
  }

  // Rotate if older than 7 days
  const ageSeconds = now - payload.iat;
  if (ageSeconds > 7 * 24 * 60 * 60) {
    return true;
  }

  return false;
};

/**
 * Parse credential without verification (for debugging/logging)
 */
const parseCredential = (credentialRaw) => {
  try {
    const parts = credentialRaw.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    return { header, payload };
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateCredential,
  verifyCredential,
  shouldRotateCredential,
  parseCredential,
};
