const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { PROFICIENCY_LEVELS } = require('../utils/proficiency');

/**
 * Validates a MongoDB ObjectId.
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates course skill creation payload.
 */
function validateCreateCourseSkill(courseId, data) {
  validateObjectId(courseId, 'Course ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  // Anti-injection: Client cannot supply server-controlled fields
  const forbiddenFields = [
    'course',
    'courseId',
    'isActive',
    'createdAt',
    'updatedAt',
    'id',
    '_id'
  ];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client injection of '${field}' is not allowed`);
    }
  }

  const skillId = data.skill || data.skillId;
  if (!skillId) {
    errors.push('Skill reference is required');
  } else if (!mongoose.Types.ObjectId.isValid(skillId)) {
    errors.push('Invalid Skill ID format');
  }

  if (!data.coverageLevel) {
    errors.push('Coverage level is required');
  } else if (!PROFICIENCY_LEVELS.includes(data.coverageLevel)) {
    errors.push(
      `Invalid coverage level: '${data.coverageLevel}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
    );
  }

  if (data.coverageWeight !== undefined) {
    const weightNum = Number(data.coverageWeight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 100) {
      errors.push('Coverage weight must be a number between 0 and 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates course skill update payload.
 * Only coverageLevel and coverageWeight are mutable.
 */
function validateUpdateCourseSkill(params = {}, data = {}) {
  validateObjectId(params.id, 'Course Skill ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  // Rejection of immutable fields
  const forbiddenFields = [
    'course',
    'courseId',
    'skill',
    'skillId',
    'isActive',
    'createdAt',
    'updatedAt',
    'id',
    '_id'
  ];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client modification of '${field}' is not allowed`);
    }
  }

  if (data.coverageLevel !== undefined) {
    if (!PROFICIENCY_LEVELS.includes(data.coverageLevel)) {
      errors.push(
        `Invalid coverage level: '${data.coverageLevel}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
      );
    }
  }

  if (data.coverageWeight !== undefined) {
    const weightNum = Number(data.coverageWeight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 100) {
      errors.push('Coverage weight must be a number between 0 and 100');
    }
  }

  if (data.coverageLevel === undefined && data.coverageWeight === undefined) {
    errors.push('At least one of coverageLevel or coverageWeight must be provided for update');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates route parameters containing course skill ID.
 */
function validateCourseSkillId(params = {}) {
  validateObjectId(params.id, 'Course Skill ID');
}

/**
 * Validates query parameters for listing course skills.
 */
function validateCourseSkillQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  if (query.isActive !== undefined) {
    if (query.isActive !== 'true' && query.isActive !== 'false' && typeof query.isActive !== 'boolean') {
      errors.push('isActive filter must be a boolean (true or false)');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

module.exports = {
  validateObjectId,
  validateCreateCourseSkill,
  validateUpdateCourseSkill,
  validateCourseSkillId,
  validateCourseSkillQuery
};
