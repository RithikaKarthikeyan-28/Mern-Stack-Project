const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { PROFICIENCY_LEVELS } = require('../models/Skill');

/**
 * Validates a MongoDB ObjectId.
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates skill creation payload.
 */
function validateCreateSkill(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  // Anti-injection: Client cannot supply server-controlled fields
  const forbiddenFields = ['isActive', 'createdAt', 'updatedAt', 'id', '_id'];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client injection of '${field}' is not allowed`);
    }
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Skill name is required');
  } else {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) {
      errors.push('Skill name must be at least 2 characters');
    } else if (trimmed.length > 100) {
      errors.push('Skill name cannot exceed 100 characters');
    }
  }

  // Category validation
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required');
  } else {
    const trimmedCat = data.category.trim();
    if (trimmedCat.length < 1) {
      errors.push('Category cannot be empty');
    } else if (trimmedCat.length > 100) {
      errors.push('Category cannot exceed 100 characters');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }
  }

  // Proficiency levels validation (optional)
  if (data.proficiencyLevels !== undefined) {
    if (!Array.isArray(data.proficiencyLevels) || data.proficiencyLevels.length === 0) {
      errors.push('Proficiency levels must be a non-empty array');
    } else {
      for (const level of data.proficiencyLevels) {
        if (!PROFICIENCY_LEVELS.includes(level)) {
          errors.push(`Invalid proficiency level: '${level}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates skill update payload.
 */
function validateUpdateSkill(params = {}, data = {}) {
  validateObjectId(params.id, 'Skill ID');

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
      errors.push('Skill name must be a string');
    } else {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        errors.push('Skill name must be at least 2 characters');
      } else if (trimmed.length > 100) {
        errors.push('Skill name cannot exceed 100 characters');
      }
    }
  }

  if (data.category !== undefined) {
    if (typeof data.category !== 'string') {
      errors.push('Category must be a string');
    } else {
      const trimmed = data.category.trim();
      if (trimmed.length < 1) {
        errors.push('Category cannot be empty');
      } else if (trimmed.length > 100) {
        errors.push('Category cannot exceed 100 characters');
      }
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }
  }

  if (data.proficiencyLevels !== undefined) {
    if (!Array.isArray(data.proficiencyLevels) || data.proficiencyLevels.length === 0) {
      errors.push('Proficiency levels must be a non-empty array');
    } else {
      for (const level of data.proficiencyLevels) {
        if (!PROFICIENCY_LEVELS.includes(level)) {
          errors.push(`Invalid proficiency level: '${level}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates route parameters containing skill ID.
 */
function validateSkillId(params = {}) {
  validateObjectId(params.id, 'Skill ID');
}

/**
 * Validates query parameters for listing skills.
 */
function validateSkillQuery(query = {}) {
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
  validateCreateSkill,
  validateUpdateSkill,
  validateSkillId,
  validateSkillQuery
};
