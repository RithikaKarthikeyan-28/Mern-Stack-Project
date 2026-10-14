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
 * Validates employee skill creation payload.
 */
function validateCreateEmployeeSkill(employeeId, data) {
  validateObjectId(employeeId, 'Employee ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  // Anti-injection: Client cannot supply server-controlled or immutable fields
  const forbiddenFields = [
    'employee',
    'employeeId',
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

  if (!data.proficiencyLevel) {
    errors.push('Proficiency level is required');
  } else if (!PROFICIENCY_LEVELS.includes(data.proficiencyLevel)) {
    errors.push(
      `Invalid proficiency level: '${data.proficiencyLevel}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
    );
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates employee skill update payload.
 * Only proficiencyLevel is mutable.
 */
function validateUpdateEmployeeSkill(params = {}, data = {}) {
  validateObjectId(params.id, 'Employee Skill ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  // Strictly reject modifying immutable or protected fields
  const forbiddenFields = [
    'employee',
    'employeeId',
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

  if (data.proficiencyLevel !== undefined) {
    if (!PROFICIENCY_LEVELS.includes(data.proficiencyLevel)) {
      errors.push(
        `Invalid proficiency level: '${data.proficiencyLevel}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
      );
    }
  } else {
    errors.push('Proficiency level is required for update');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates route parameters containing employee skill ID.
 */
function validateEmployeeSkillId(params = {}) {
  validateObjectId(params.id, 'Employee Skill ID');
}

/**
 * Validates query parameters for listing employee skills.
 */
function validateEmployeeSkillQuery(query = {}) {
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
  validateCreateEmployeeSkill,
  validateUpdateEmployeeSkill,
  validateEmployeeSkillId,
  validateEmployeeSkillQuery
};
