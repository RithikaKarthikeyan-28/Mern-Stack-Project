const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle user registration.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle user login and JWT issuance.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to return the currently authenticated user's profile.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function getMe(req, res, next) {
  try {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Current user profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe
};
