const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates a MongoDB ObjectId string.
 *
 * @param {string} id - Candidate ID string
 * @param {string} [fieldName='ID'] - Field name to include in error message
 * @throws {AppError} If ID format is invalid
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates input for creating a new Department.
 *
 * @param {object} data - Department payload
 * @throws {AppError} When validation fails
 */
function validateCreateDepartment(data) {
  const errors = [];
  const { name, description } = data || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Department name is required');
  } else if (name.trim().length < 2) {
    errors.push('Department name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Department name cannot exceed 100 characters');
  }

  if (description !== undefined && typeof description === 'string' && description.length > 500) {
    errors.push('Description cannot exceed 500 characters');
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

/**
 * Validates input for updating an existing Department.
 *
 * @param {object} data - Department update payload
 * @throws {AppError} When validation fails
 */
function validateUpdateDepartment(data) {
  const errors = [];
  const { name, description, isActive } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Department name cannot be empty');
    } else if (name.trim().length < 2) {
      errors.push('Department name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Department name cannot exceed 100 characters');
    }
  }

  if (description !== undefined && typeof description === 'string' && description.length > 500) {
    errors.push('Description cannot exceed 500 characters');
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

module.exports = {
  validateObjectId,
  validateCreateDepartment,
  validateUpdateDepartment
};
