const config = require('../config');
const { sendError } = require('../utils/response');

/**
 * Centralized error-handling middleware.
 * Ensures consistent JSON error responses across the entire application.
 *
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  let message = err.message || 'Internal Server Error';
  let errors = Array.isArray(err.errors) && err.errors.length > 0 ? err.errors : undefined;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => e.message);
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
    errors = [`Invalid value '${err.value}' for field '${err.path}'`];
  }

  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered`;
  }

  // Handle request body limit exceeded (Express entity.too.large)
  if (err.type === 'entity.too.large' || statusCode === 413) {
    statusCode = 413;
    message = 'Payload too large';
  }

  // In production, mask unexpected internal errors and scrub sensitive information
  if (config.isProduction) {
    if (statusCode >= 500) {
      message = 'Internal Server Error';
      errors = undefined;
    } else if (typeof message === 'string') {
      message = message
        .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[REDACTED_MONGO_URI]')
        .replace(/[A-Za-z]:\\[^\s]+/g, '[REDACTED_PATH]')
        .replace(/\/[a-zA-Z0-9_\-./]+\/[a-zA-Z0-9_\-.]+/g, '[REDACTED_PATH]');
    }
  }

  // Production-safe server logging for unexpected server errors (statusCode >= 500)
  if (statusCode >= 500 && !config.isTest) {
    const requestId = (req && (req.id || req.headers['x-request-id'])) || 'N/A';
    console.error(`[SkillTrack Error] [${requestId}] ${statusCode} - ${err.message || 'Internal Server Error'}`);
  }

  // Include stack trace only in development mode
  const stack = config.isDevelopment ? err.stack : undefined;

  return sendError(res, {
    statusCode,
    message,
    errors,
    stack
  });
};

module.exports = errorHandler;
