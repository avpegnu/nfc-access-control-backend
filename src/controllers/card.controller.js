const cardService = require('../services/card.service');
const { success, error } = require('../utils/response');

/**
 * POST /cards
 * Create card from blank NFC card (ESP32 calls this)
 */
const createCard = async (req, res) => {
  try {
    const card = await cardService.createCard(req.body);
    return success(res, card, 'Tạo thẻ thành công', 201);
  } catch (err) {
    return error(res, err.code || 'CREATE_CARD_ERROR', err.message, err.status || 500);
  }
};

/**
 * GET /cards/:cardId
 * Get card details
 */
const getCard = async (req, res) => {
  try {
    const card = await cardService.getCardById(req.params.cardId);
    return success(res, card);
  } catch (err) {
    return error(res, err.code || 'GET_CARD_ERROR', err.message, err.status || 500);
  }
};

/**
 * GET /cards
 * List all cards with optional filters (Admin)
 */
const listCards = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      enroll_mode: req.query.enroll_mode === 'true' ? true : req.query.enroll_mode === 'false' ? false : undefined,
      user_id: req.query.user_id
    };

    const cards = await cardService.listCards(filters);
    return success(res, cards);
  } catch (err) {
    return error(res, err.code || 'LIST_CARDS_ERROR', err.message, err.status || 500);
  }
};

/**
 * PUT /cards/:cardId
 * Update card (Admin)
 */
const updateCard = async (req, res) => {
  try {
    const card = await cardService.updateCard(req.params.cardId, req.body);
    return success(res, card, 'Cập nhật thẻ thành công');
  } catch (err) {
    return error(res, err.code || 'UPDATE_CARD_ERROR', err.message, err.status || 500);
  }
};

/**
 * POST /cards/:cardId/assign
 * Assign user to card (Admin)
 */
const assignUser = async (req, res) => {
  try {
    const { user_id, policy } = req.body;
    const card = await cardService.assignUserToCard(req.params.cardId, user_id, policy);
    return success(res, card, 'Gán người dùng cho thẻ thành công');
  } catch (err) {
    return error(res, err.code || 'ASSIGN_USER_ERROR', err.message, err.status || 500);
  }
};

/**
 * POST /cards/:cardId/revoke
 * Revoke card (Admin)
 */
const revokeCard = async (req, res) => {
  try {
    const { reason } = req.body;
    const card = await cardService.revokeCard(req.params.cardId, reason);
    return success(res, card, 'Thu hồi thẻ thành công');
  } catch (err) {
    return error(res, err.code || 'REVOKE_CARD_ERROR', err.message, err.status || 500);
  }
};

/**
 * POST /cards/:cardId/reactivate
 * Reactivate a revoked card (Admin)
 */
const reactivateCard = async (req, res) => {
  try {
    const card = await cardService.reactivateCard(req.params.cardId);
    return success(res, card, 'Kích hoạt lại thẻ thành công');
  } catch (err) {
    return error(res, err.code || 'REACTIVATE_CARD_ERROR', err.message, err.status || 500);
  }
};

/**
 * DELETE /cards/:cardId
 * Delete card (Admin)
 */
const deleteCard = async (req, res) => {
  try {
    const result = await cardService.deleteCard(req.params.cardId);
    return success(res, result, 'Xóa thẻ thành công');
  } catch (err) {
    return error(res, err.code || 'DELETE_CARD_ERROR', err.message, err.status || 500);
  }
};

module.exports = {
  createCard,
  getCard,
  listCards,
  updateCard,
  assignUser,
  revokeCard,
  reactivateCard,
  deleteCard
};
