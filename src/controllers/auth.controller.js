const authService = require('../services/auth.service');
const { success, successMessage, error } = require('../utils/response');

/**
 * Authentication controller
 */

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    const result = await authService.register(email, password, displayName);

    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token);

    return successMessage(res, 'Đăng xuất thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res, next) => {
  try {
    const user = await authService.getUserByUid(req.user.uid);

    return success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  logout,
  me
};
