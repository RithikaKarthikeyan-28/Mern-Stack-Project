const AppError = require('../utils/AppError');

/**
 * Catch-all middleware for handling undefined routes.
 * Emits a 404 AppError to be handled by the centralized error middleware.
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFoundHandler;
