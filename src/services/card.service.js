const { v4: uuidv4 } = require('uuid');
const firebaseService = require('./firebase.service');

const CARDS_PATH = 'cards';

/**
 * Create a new card from blank NFC card (first tap)
 * Card will be in enroll_mode until admin assigns user/policy
 */
const createCard = async (data) => {
  const { device_id, card_uid } = data;

  // Check if card_uid already exists
  const existingCards = await firebaseService.query(CARDS_PATH, [
    { field: 'card_uid', operator: '==', value: card_uid }
  ]);

  if (existingCards.length > 0) {
    throw {
      code: 'CARD_EXISTS',
      message: 'Card UID đã tồn tại trong hệ thống',
      status: 409,
      existing_card: existingCards[0]
    };
  }

  // Generate card_id
  const cardId = `c_${uuidv4().substring(0, 8)}`;

  const card = {
    card_id: cardId,
    card_uid,
    user_id: null,
    scope: [],
    status: 'active',
    enroll_mode: true,
    enrolled_by_device: device_id,
    offline_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await firebaseService.createWithId(CARDS_PATH, cardId, card);

  return card;
};

/**
 * Get card by card_id
 */
const getCardById = async (cardId) => {
  const card = await firebaseService.getById(CARDS_PATH, cardId);

  if (!card) {
    throw { code: 'CARD_NOT_FOUND', message: 'Thẻ không tồn tại', status: 404 };
  }

  return card;
};

/**
 * Get card by card_uid
 */
const getCardByUid = async (cardUid) => {
  const cards = await firebaseService.query(CARDS_PATH, [
    { field: 'card_uid', operator: '==', value: cardUid }
  ]);

  if (cards.length === 0) {
    return null;
  }

  return cards[0];
};

/**
 * Update card (assign user, policy, etc.) - Admin only
 */
const updateCard = async (cardId, data) => {
  const card = await firebaseService.getById(CARDS_PATH, cardId);

  if (!card) {
    throw { code: 'CARD_NOT_FOUND', message: 'Thẻ không tồn tại', status: 404 };
  }

  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };

  // If user is assigned, turn off enroll_mode
  if (data.user_id && card.enroll_mode) {
    updateData.enroll_mode = false;
  }

  const updatedCard = await firebaseService.update(CARDS_PATH, cardId, updateData);

  return updatedCard;
};

/**
 * Assign user to card - Admin only
 */
const assignUserToCard = async (cardId, userId, policy = {}) => {
  const card = await firebaseService.getById(CARDS_PATH, cardId);

  if (!card) {
    throw { code: 'CARD_NOT_FOUND', message: 'Thẻ không tồn tại', status: 404 };
  }

  // Verify user exists
  const user = await firebaseService.getById('users', userId);
  if (!user) {
    throw { code: 'USER_NOT_FOUND', message: 'Người dùng không tồn tại', status: 404 };
  }

  const updateData = {
    user_id: userId,
    enroll_mode: false,
    policy: {
      access_level: policy.access_level || 'staff',
      valid_until: policy.valid_until || null,
      allowed_doors: policy.allowed_doors || ['*'],
      ...policy
    },
    assigned_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const updatedCard = await firebaseService.update(CARDS_PATH, cardId, updateData);

  return updatedCard;
};

/**
 * Revoke card - Admin only
 */
const revokeCard = async (cardId, reason = 'revoked') => {
  const card = await firebaseService.getById(CARDS_PATH, cardId);

  if (!card) {
    throw { code: 'CARD_NOT_FOUND', message: 'Thẻ không tồn tại', status: 404 };
  }

  const updateData = {
    status: 'revoked',
    revoked_at: new Date().toISOString(),
    revoke_reason: reason,
    updated_at: new Date().toISOString()
  };

  const updatedCard = await firebaseService.update(CARDS_PATH, cardId, updateData);

  return updatedCard;
};

/**
 * List all cards with optional filters
 */
const listCards = async (filters = {}) => {
  let queryConditions = [];

  if (filters.status) {
    queryConditions.push({ field: 'status', operator: '==', value: filters.status });
  }

  if (filters.enroll_mode !== undefined) {
    queryConditions.push({ field: 'enroll_mode', operator: '==', value: filters.enroll_mode });
  }

  if (filters.user_id) {
    queryConditions.push({ field: 'user_id', operator: '==', value: filters.user_id });
  }

  if (queryConditions.length > 0) {
    return firebaseService.query(CARDS_PATH, queryConditions);
  }

  return firebaseService.getAll(CARDS_PATH);
};

/**
 * Delete card - Admin only
 */
const deleteCard = async (cardId) => {
  const card = await firebaseService.getById(CARDS_PATH, cardId);

  if (!card) {
    throw { code: 'CARD_NOT_FOUND', message: 'Thẻ không tồn tại', status: 404 };
  }

  await firebaseService.delete(CARDS_PATH, cardId);

  return { deleted: true, card_id: cardId };
};

module.exports = {
  createCard,
  getCardById,
  getCardByUid,
  updateCard,
  assignUserToCard,
  revokeCard,
  listCards,
  deleteCard
};
