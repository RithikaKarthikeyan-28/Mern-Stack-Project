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
 * Validates creation of a job role skill requirement.
 */
function validateCreateRequirement(jobRoleId, data) {
  validateObjectId(jobRoleId, 'Job Role ID');

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

  const skillId = data.skill || data.skillId;
  if (!skillId) {
    errors.push('Skill reference is required');
  } else if (!mongoose.Types.ObjectId.isValid(skillId)) {
    errors.push('Invalid Skill ID format');
  }

  if (!data.requiredLevel) {
    errors.push('Required proficiency level is required');
  } else if (!PROFICIENCY_LEVELS.includes(data.requiredLevel)) {
    errors.push(
      `Invalid required level: '${data.requiredLevel}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
    );
  }

  if (data.mandatory !== undefined && typeof data.mandatory !== 'boolean') {
    errors.push('Mandatory must be a boolean');
  }

  if (data.weight !== undefined) {
    const weightNum = Number(data.weight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 100) {
      errors.push('Weight must be a number between 0 and 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates update of a job role skill requirement.
 * Strictly prevents mutation of jobRole and skill references.
 */
function validateUpdateRequirement(params = {}, data = {}) {
  validateObjectId(params.id, 'Requirement ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];

  const forbiddenFields = [
    'jobRole',
    'jobRoleId',
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

  if (data.requiredLevel !== undefined) {
    if (!PROFICIENCY_LEVELS.includes(data.requiredLevel)) {
      errors.push(
        `Invalid required level: '${data.requiredLevel}'. Must be one of: ${PROFICIENCY_LEVELS.join(', ')}`
      );
    }
  }

  if (data.mandatory !== undefined && typeof data.mandatory !== 'boolean') {
    errors.push('Mandatory must be a boolean');
  }

  if (data.weight !== undefined) {
    const weightNum = Number(data.weight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 100) {
      errors.push('Weight must be a number between 0 and 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates route parameters containing requirement ID.
 */
function validateRequirementId(params = {}) {
  validateObjectId(params.id, 'Requirement ID');
}

module.exports = {
  validateObjectId,
  validateCreateRequirement,
  validateUpdateRequirement,
  validateRequirementId
};
