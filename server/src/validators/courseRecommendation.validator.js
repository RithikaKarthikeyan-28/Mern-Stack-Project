const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates route parameters for course recommendations.
 */
function validateRecommendationParams(employeeId, jobRoleId) {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError('Invalid Employee ID format', 400);
  }

  if (!jobRoleId || !mongoose.Types.ObjectId.isValid(jobRoleId)) {
    throw new AppError('Invalid Job Role ID format', 400);
  }
}

/**
 * Validates query parameters for course recommendations.
 */
function validateRecommendationQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  if (query.minScore !== undefined) {
    const minScoreNum = Number(query.minScore);
    if (isNaN(minScoreNum) || minScoreNum < 0 || minScoreNum > 100) {
      errors.push('minScore must be a number between 0 and 100');
    }
  }

  if (query.mandatoryOnly !== undefined) {
    if (
      query.mandatoryOnly !== 'true' &&
      query.mandatoryOnly !== 'false' &&
      typeof query.mandatoryOnly !== 'boolean'
    ) {
      errors.push('mandatoryOnly must be true or false');
    }
  }

  if (query.limit !== undefined) {
    const limitNum = Number(query.limit);
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed 100');
    }
  }

  if (query.page !== undefined) {
    const pageNum = Number(query.page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  // Anti-injection: Reject client attempts to inject server-derived fields via query or body
  const forbiddenKeys = [
    'score',
    'mandatoryGapCount',
    'optionalGapCount',
    'matchedSkills',
    'summary',
    'recommendations',
    'currentLevel',
    'requiredLevel',
    'status'
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
  validateRecommendationParams,
  validateRecommendationQuery
};
