const usersService = require('../services/users.service');
const { success, successMessage, paginated } = require('../utils/response');

/**
 * Users controller
 */

/**
 * GET /api/users
 */
const getAll = async (req, res, next) => {
  try {
    const users = await usersService.getAll();

    // Simple pagination (can be enhanced)
    const { page = 1, limit = 20 } = req.query;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit));

    return paginated(res, paginatedUsers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: users.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersService.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Người dùng không tồn tại'
        }
      });
    }

    return success(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 */
const create = async (req, res, next) => {
  try {
    const user = await usersService.create(req.body);

    return success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersService.update(id, req.body);

    return success(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await usersService.delete(id);

    return successMessage(res, 'Xóa người dùng thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/toggle
 */
const toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await usersService.toggleActive(id);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  toggleActive
};
