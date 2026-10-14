const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { validateObjectId } = require('./department.validator');

/**
 * Validates payload for creating a new Module.
 *
 * @param {object} data - Module creation data
 * @throws {AppError} When validation fails
 */
function validateCreateModule(data) {
  const errors = [];
  const { course, title, description, order } = data || {};

  // Validate course reference
  if (!course) {
    errors.push('Course ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(course)) {
    errors.push('Invalid Course ID format');
  }

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Module title is required');
  } else if (title.trim().length < 3) {
    errors.push('Module title must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Module title cannot exceed 200 characters');
  }

  // Validate description
  if (description !== undefined && typeof description === 'string' && description.length > 2000) {
    errors.push('Module description cannot exceed 2000 characters');
  }

  // Validate order
  if (order === undefined || order === null) {
    errors.push('Module order is required');
  } else if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
    errors.push('Module order must be an integer of at least 1');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating an existing Module.
 *
 * @param {object} data - Module update data
 * @throws {AppError} When validation fails
 */
function validateUpdateModule(data) {
  const errors = [];
  const { course, title, description, order, isActive } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  // Immutable course reference
  if (course !== undefined) {
    errors.push('Cannot change course reference of a module');
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Module title cannot be empty');
    } else if (title.trim().length < 3) {
      errors.push('Module title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      errors.push('Module title cannot exceed 200 characters');
    }
  }

  if (description !== undefined && typeof description === 'string' && description.length > 2000) {
    errors.push('Module description cannot exceed 2000 characters');
  }

  if (order !== undefined) {
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
      errors.push('Module order must be an integer of at least 1');
    }
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

module.exports = {
  validateObjectId,
  validateCreateModule,
  validateUpdateModule
};
