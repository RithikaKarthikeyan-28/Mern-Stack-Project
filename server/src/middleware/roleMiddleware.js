const AppError = require('../utils/AppError');

const VALID_ROLES = ['admin', 'trainer', 'employee'];

/**
 * Creates an authorization middleware that restricts access to users with specified roles.
 *
 * @param {...string} allowedRoles - List of permitted roles
 * @returns {Function} Express middleware function
 * @throws {Error} If no roles or invalid roles are provided during configuration
 */
function authorizeRoles(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error('authorizeRoles requires at least one role to be specified');
  }

  // Validate developer-configured roles during route setup (fail fast)
  for (const role of allowedRoles) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(
        `Invalid role "${role}" configured for authorization. Allowed roles are: ${VALID_ROLES.join(', ')}`
      );
    }
  }

  return (req, res, next) => {
    // 1. Confirm authentication has already occurred
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // 2. Check if the authenticated user's role is permitted
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    // 3. Authorized
    next();
  };
}

module.exports = {
  authorizeRoles,
  VALID_ROLES
};
