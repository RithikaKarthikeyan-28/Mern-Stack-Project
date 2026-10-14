const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Middleware to authenticate incoming requests via JWT in the Authorization header.
 * Attaches sanitized user profile to `req.user`.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Reject missing header
    if (!authHeader) {
      return next(new AppError('Authorization header is missing', 401));
    }

    // Reject malformed header (must be 'Bearer <token>')
    if (!authHeader.startsWith('Bearer ')) {
      return next(new AppError('Invalid authorization format. Expected: Bearer <token>', 401));
    }

    const token = authHeader.substring(7).trim();

    // Reject empty token
    if (!token) {
      return next(new AppError('Authentication token is missing', 401));
    }

    // Verify token with configured secret and enforce HS256 algorithm
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch (err) {
      return next(new AppError('Invalid or expired authentication token', 401));
    }

    const userId = decoded && (decoded.userId || decoded.id);
    if (!decoded || !userId) {
      return next(new AppError('Invalid token payload', 401));
    }

    // Lookup user by ID from decoded token
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account is inactive', 401));
    }

    // Attach safe user representation to the request
    req.user = user.toSafeObject();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
