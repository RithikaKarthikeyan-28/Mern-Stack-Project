const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { NOTIFICATION_TYPES } = require('../models/Notification');

/**
 * Validates a MongoDB ObjectId format.
 *
 * @param {string} id - The ID to validate
 * @param {string} fieldName - Human-readable name of the ID field
 * @throws {AppError} If format is invalid
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates notification query parameters.
 * Strictly prevents client injection of server-controlled fields.
 *
 * @param {object} query - Query parameters from request
 * @throws {AppError} When validation fails
 */
function validateNotificationQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  // Anti-injection: Client cannot supply server-controlled fields in query
  const forbiddenFields = [
    'recipient',
    'readAt',
    'isActive',
    'createdAt',
    'updatedAt',
    'eventKey',
    'title',
    'message',
    'relatedCertificate',
    'relatedCourse'
  ];

  for (const field of forbiddenFields) {
    if (query[field] !== undefined) {
      errors.push(`Client specification of '${field}' is not allowed`);
    }
  }

  // Validate pagination: page
  if (query.page !== undefined) {
    const pageNum = Number(query.page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer greater than or equal to 1');
    }
  }

  // Validate pagination: limit
  if (query.limit !== undefined) {
    const limitNum = Number(query.limit);
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer greater than or equal to 1');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed maximum of 100');
    }
  }

  // Validate isRead filter
  if (query.isRead !== undefined) {
    if (query.isRead !== 'true' && query.isRead !== 'false' && typeof query.isRead !== 'boolean') {
      errors.push('isRead filter must be a boolean (true or false)');
    }
  }

  // Validate type filter
  if (query.type !== undefined) {
    if (!NOTIFICATION_TYPES.includes(query.type)) {
      errors.push(
        `Invalid notification type: '${query.type}'. Supported types: ${NOTIFICATION_TYPES.join(', ')}`
      );
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates request to mark a notification as read.
 * Strictly prevents client injection of readAt, isRead, recipient, etc.
 *
 * @param {object} params - Route params (:id)
 * @param {object} body - Request body
 * @throws {AppError} When validation fails
 */
function validateMarkRead(params = {}, body = {}) {
  validateObjectId(params.id, 'Notification ID');

  if (body && typeof body === 'object') {
    const forbiddenFields = [
      'readAt',
      'isRead',
      'recipient',
      'type',
      'title',
      'message',
      'relatedCertificate',
      'relatedCourse',
      'eventKey',
      'isActive',
      'createdAt',
      'updatedAt'
    ];

    const errors = [];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        errors.push(`Client injection of '${field}' is not allowed`);
      }
    }

    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
    }
  }
}

/**
 * Validates route params containing notification ID.
 *
 * @param {object} params - Route parameters
 */
function validateNotificationId(params = {}) {
  validateObjectId(params.id, 'Notification ID');
}

module.exports = {
  validateObjectId,
  validateNotificationQuery,
  validateMarkRead,
  validateNotificationId
};
