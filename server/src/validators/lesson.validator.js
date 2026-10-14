const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { validateObjectId } = require('./department.validator');

const VALID_CONTENT_TYPES = ['text', 'video', 'link'];

/**
 * Checks if a string is a valid HTTP or HTTPS URL.
 *
 * @param {string} urlString - Candidate URL string
 * @returns {boolean} True if valid URL
 */
function isValidUrl(urlString) {
  if (typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

/**
 * Validates payload for creating a new Lesson.
 *
 * @param {object} data - Lesson creation data
 * @throws {AppError} When validation fails
 */
function validateCreateLesson(data) {
  const errors = [];
  const { module: moduleId, title, content, contentType, resourceUrl, order } = data || {};

  // Validate module reference
  if (!moduleId) {
    errors.push('Module ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    errors.push('Invalid Module ID format');
  }

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Lesson title is required');
  } else if (title.trim().length < 3) {
    errors.push('Lesson title must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Lesson title cannot exceed 200 characters');
  }

  // Validate content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('Lesson content is required');
  } else if (content.length > 20000) {
    errors.push('Lesson content cannot exceed 20000 characters');
  }

  // Validate contentType
  if (!contentType) {
    errors.push('Content type is required');
  } else if (!VALID_CONTENT_TYPES.includes(contentType)) {
    errors.push(`Content type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }

  // Validate resourceUrl based on contentType
  if (contentType === 'link') {
    if (!resourceUrl || typeof resourceUrl !== 'string' || resourceUrl.trim().length === 0) {
      errors.push('Resource URL is required for link content type');
    } else if (!isValidUrl(resourceUrl)) {
      errors.push('Resource URL must be a valid HTTP or HTTPS URL');
    }
  } else if (resourceUrl !== undefined && resourceUrl !== null && typeof resourceUrl === 'string' && resourceUrl.trim().length > 0) {
    if (!isValidUrl(resourceUrl)) {
      errors.push('Resource URL must be a valid HTTP or HTTPS URL');
    }
  }

  // Validate order
  if (order === undefined || order === null) {
    errors.push('Lesson order is required');
  } else if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
    errors.push('Lesson order must be an integer of at least 1');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating an existing Lesson.
 *
 * @param {object} data - Lesson update data
 * @throws {AppError} When validation fails
 */
function validateUpdateLesson(data) {
  const errors = [];
  const { module: moduleId, title, content, contentType, resourceUrl, order, isActive } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  // Immutable module reference
  if (moduleId !== undefined) {
    errors.push('Cannot change module reference of a lesson');
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Lesson title cannot be empty');
    } else if (title.trim().length < 3) {
      errors.push('Lesson title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      errors.push('Lesson title cannot exceed 200 characters');
    }
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      errors.push('Lesson content cannot be empty');
    } else if (content.length > 20000) {
      errors.push('Lesson content cannot exceed 20000 characters');
    }
  }

  if (contentType !== undefined && !VALID_CONTENT_TYPES.includes(contentType)) {
    errors.push(`Content type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }

  // Validate resourceUrl if supplied
  if (resourceUrl !== undefined && resourceUrl !== null && typeof resourceUrl === 'string' && resourceUrl.trim().length > 0) {
    if (!isValidUrl(resourceUrl)) {
      errors.push('Resource URL must be a valid HTTP or HTTPS URL');
    }
  }

  if (contentType === 'link' && (resourceUrl === undefined || resourceUrl === null || resourceUrl.trim().length === 0)) {
    errors.push('Resource URL is required for link content type');
  }

  if (order !== undefined) {
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
      errors.push('Lesson order must be an integer of at least 1');
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
  validateCreateLesson,
  validateUpdateLesson,
  VALID_CONTENT_TYPES,
  isValidUrl
};
