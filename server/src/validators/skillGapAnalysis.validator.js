const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const ALLOWED_STATUS_FILTERS = ['MISSING', 'BELOW_REQUIRED', 'MEETS_REQUIRED'];

/**
 * Validates route parameters for skill gap analysis.
 */
function validateSkillGapParams(employeeId, jobRoleId) {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError('Invalid Employee ID format', 400);
  }

  if (!jobRoleId || !mongoose.Types.ObjectId.isValid(jobRoleId)) {
    throw new AppError('Invalid Job Role ID format', 400);
  }
}

/**
 * Validates query parameters for skill gap analysis filtering.
 */
function validateSkillGapQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  if (query.status !== undefined) {
    if (!ALLOWED_STATUS_FILTERS.includes(query.status)) {
      errors.push(
        `Invalid status filter: '${query.status}'. Must be one of: ${ALLOWED_STATUS_FILTERS.join(', ')}`
      );
    }
  }

  if (query.mandatory !== undefined) {
    if (query.mandatory !== 'true' && query.mandatory !== 'false' && typeof query.mandatory !== 'boolean') {
      errors.push('Invalid mandatory filter. Must be true or false');
    }
  }

  // Anti-injection: Reject client attempts to inject server-derived fields via query or body
  const forbiddenKeys = [
    'currentLevel',
    'requiredLevel',
    'currentLevelRank',
    'requiredLevelRank',
    'overallMatchPercentage',
    'mandatoryMatchPercentage',
    'weightedMatchPercentage',
    'summary',
    'gaps'
  ];

  for (const key of forbiddenKeys) {
    if (query[key] !== undefined) {
      errors.push(`Client injection of '${key}' is not allowed`);
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

module.exports = {
  ALLOWED_STATUS_FILTERS,
  validateSkillGapParams,
  validateSkillGapQuery
};
