/**
 * Utility functions for uniform API responses across the application.
 */

/**
 * Send a standardized success response.
 * @param {object} res - Express response object
 * @param {object} options
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} options.message - Success message
 * @param {any} [options.data] - Optional payload data
 */
const sendSuccess = (res, { statusCode = 200, message, data = undefined } = {}) => {
  const responsePayload = {
    success: true,
    message
  };

  if (data !== undefined) {
    responsePayload.data = data;
  }

  return res.status(statusCode).json(responsePayload);
};

/**
 * Send a standardized error response.
 * @param {object} res - Express response object
 * @param {object} options
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} options.message - Error message
 * @param {Array} [options.errors] - Optional error details
 * @param {string} [options.stack] - Optional stack trace for development
 */
const sendError = (res, { statusCode = 500, message, errors = undefined, stack = undefined, data = undefined } = {}) => {
  const responsePayload = {
    success: false,
    message: message || 'An unexpected error occurred'
  };

  if (Array.isArray(errors) && errors.length > 0) {
    responsePayload.errors = errors;
  }

  if (data !== undefined) {
    responsePayload.data = data;
  }

  if (stack) {
    responsePayload.stack = stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  sendSuccess,
  sendError
};
