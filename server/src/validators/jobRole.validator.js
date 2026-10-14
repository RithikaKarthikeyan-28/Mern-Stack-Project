const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates a MongoDB ObjectId.
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates job role creation payload.
 */
function validateCreateJobRole(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  const forbiddenFields = ['isActive', 'createdAt', 'updatedAt', 'id', '_id'];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client injection of '${field}' is not allowed`);
    }
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Job Role name is required');
  } else {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) {
      errors.push('Job Role name must be at least 2 characters');
    } else if (trimmed.length > 150) {
      errors.push('Job Role name cannot exceed 150 characters');
    }
  }

  // Code validation
  if (!data.code || typeof data.code !== 'string') {
    errors.push('Job Role code is required');
  } else {
    const trimmedCode = data.code.trim();
    if (trimmedCode.length < 1) {
      errors.push('Job Role code cannot be empty');
    } else if (trimmedCode.length > 50) {
      errors.push('Job Role code cannot exceed 50 characters');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates job role update payload.
 */
function validateUpdateJobRole(params = {}, data = {}) {
  validateObjectId(params.id, 'Job Role ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  const forbiddenFields = ['isActive', 'createdAt', 'updatedAt', 'id', '_id'];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client modification of '${field}' is not allowed`);
    }
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Job Role name must be a string');
    } else {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        errors.push('Job Role name must be at least 2 characters');
      } else if (trimmed.length > 150) {
        errors.push('Job Role name cannot exceed 150 characters');
      }
    }
  }

  if (data.code !== undefined) {
    if (typeof data.code !== 'string') {
      errors.push('Job Role code must be a string');
    } else {
      const trimmedCode = data.code.trim();
      if (trimmedCode.length < 1) {
        errors.push('Job Role code cannot be empty');
      } else if (trimmedCode.length > 50) {
        errors.push('Job Role code cannot exceed 50 characters');
      }
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates route parameters containing job role ID.
 */
function validateJobRoleId(params = {}) {
  validateObjectId(params.id || params.jobRoleId, 'Job Role ID');
}

/**
 * Validates query parameters for listing job roles.
 */
function validateJobRoleQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  if (query.isActive !== undefined) {
    if (query.isActive !== 'true' && query.isActive !== 'false' && typeof query.isActive !== 'boolean') {
      errors.push('isActive filter must be a boolean (true or false)');
    }
  }

  if (query.page !== undefined) {
    const pageNum = Number(query.page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (query.limit !== undefined) {
    const limitNum = Number(query.limit);
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed maximum of 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

module.exports = {
  validateObjectId,
  validateCreateJobRole,
  validateUpdateJobRole,
  validateJobRoleId,
  validateJobRoleQuery
};
