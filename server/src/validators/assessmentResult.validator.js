const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates a MongoDB ObjectId.
 *
 * @param {string} id - The ID to validate
 * @param {string} fieldName - The human-readable name of the ID field
 * @throws {AppError} If the ID is invalid
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates that an attempt payload contains no unauthorized server-controlled result fields.
 *
 * @param {object} data - Payload to inspect
 * @throws {AppError} If client tries to directly set score, totalMarks, obtainedMarks, percentage, result, or evaluatedAt
 */
function validateNoResultInjection(data) {
  if (!data || typeof data !== 'object') return;

  const forbiddenFields = [
    'totalMarks',
    'obtainedMarks',
    'percentage',
    'result',
    'evaluatedAt',
    'score'
  ];

  const errors = [];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client injection of ${field} is not allowed`);
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

module.exports = {
  validateObjectId,
  validateNoResultInjection
};
