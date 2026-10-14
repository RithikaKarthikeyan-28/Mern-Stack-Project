const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { validateObjectId } = require('./department.validator');

const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];
const VALID_STATUSES = ['draft', 'published', 'archived'];

/**
 * Validates payload for creating a new Course.
 *
 * @param {object} data - Course creation data
 * @param {object} [options={ requireTrainer: true }] - Validation options
 * @throws {AppError} When validation fails
 */
function validateCreateCourse(data, options = { requireTrainer: true }) {
  const errors = [];
  const { title, description, category, level, duration, trainer, status } = data || {};

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Course title is required');
  } else if (title.trim().length < 3) {
    errors.push('Course title must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Course title cannot exceed 200 characters');
  }

  // Validate description
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Course description is required');
  } else if (description.trim().length < 10) {
    errors.push('Course description must be at least 10 characters long');
  } else if (description.trim().length > 5000) {
    errors.push('Course description cannot exceed 5000 characters');
  }

  // Validate category
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Course category is required');
  } else if (category.trim().length < 2) {
    errors.push('Course category must be at least 2 characters long');
  } else if (category.trim().length > 100) {
    errors.push('Course category cannot exceed 100 characters');
  }

  // Validate level
  if (!level) {
    errors.push('Course level is required');
  } else if (!VALID_LEVELS.includes(level)) {
    errors.push(`Course level must be one of: ${VALID_LEVELS.join(', ')}`);
  }

  // Validate duration
  if (duration === undefined || duration === null) {
    errors.push('Course duration is required');
  } else if (typeof duration !== 'number' || !Number.isInteger(duration) || duration < 1) {
    errors.push('Course duration must be an integer of at least 1 hour');
  }

  // Validate trainer if required
  if (options.requireTrainer) {
    if (!trainer) {
      errors.push('Trainer ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(trainer)) {
      errors.push('Invalid Trainer ID format');
    }
  } else if (trainer !== undefined && !mongoose.Types.ObjectId.isValid(trainer)) {
    errors.push('Invalid Trainer ID format');
  }

  // Validate status if provided
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating an existing Course.
 *
 * @param {object} data - Course update data
 * @throws {AppError} When validation fails
 */
function validateUpdateCourse(data) {
  const errors = [];
  const { title, description, category, level, duration, trainer, status, isActive } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Course title cannot be empty');
    } else if (title.trim().length < 3) {
      errors.push('Course title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      errors.push('Course title cannot exceed 200 characters');
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Course description cannot be empty');
    } else if (description.trim().length < 10) {
      errors.push('Course description must be at least 10 characters long');
    } else if (description.trim().length > 5000) {
      errors.push('Course description cannot exceed 5000 characters');
    }
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim().length === 0) {
      errors.push('Course category cannot be empty');
    } else if (category.trim().length < 2) {
      errors.push('Course category must be at least 2 characters long');
    } else if (category.trim().length > 100) {
      errors.push('Course category cannot exceed 100 characters');
    }
  }

  if (level !== undefined && !VALID_LEVELS.includes(level)) {
    errors.push(`Course level must be one of: ${VALID_LEVELS.join(', ')}`);
  }

  if (duration !== undefined) {
    if (typeof duration !== 'number' || !Number.isInteger(duration) || duration < 1) {
      errors.push('Course duration must be an integer of at least 1 hour');
    }
  }

  if (trainer !== undefined && !mongoose.Types.ObjectId.isValid(trainer)) {
    errors.push('Invalid Trainer ID format');
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
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
  validateCreateCourse,
  validateUpdateCourse,
  VALID_LEVELS,
  VALID_STATUSES
};
