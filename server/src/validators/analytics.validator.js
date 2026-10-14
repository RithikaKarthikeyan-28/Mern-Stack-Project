const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { ENROLLMENT_STATUSES } = require('../models/Enrollment');
const { COMPLIANCE_STATUSES } = require('../models/ComplianceAssignment');

const CERTIFICATE_LIFECYCLE_STATUSES = ['active', 'expired', 'revoked'];
const COURSE_STATUSES = ['draft', 'published', 'archived'];
const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];

/**
 * Checks for NoSQL operator or dot-path injection in query parameters.
 */
function checkForNoSqlInjection(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      throw new AppError(`Invalid query parameter: operator or dot-path '${key}' is forbidden`, 400);
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      checkForNoSqlInjection(obj[key]);
    }
  }
}

/**
 * Validates and normalizes date range.
 * - 'from' is inclusive (start of day if date-only).
 * - 'to' is inclusive (end of day if date-only: 23:59:59.999Z).
 * - Rejects malformed, impossible dates, and from > to.
 */
function validateAndNormalizeDates(query, errors) {
  let fromDate = null;
  let toDate = null;

  if (query.from !== undefined) {
    if (typeof query.from !== 'string' || query.from.trim() === '') {
      errors.push("'from' must be a valid date string");
    } else {
      const parsed = Date.parse(query.from);
      if (isNaN(parsed)) {
        errors.push("'from' must be a valid date string");
      } else {
        // Check for impossible date (e.g., 2026-02-31 parses to March in some JS engines)
        const d = new Date(parsed);
        if (query.from.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(query.from)) {
          const [y, m, day] = query.from.split('-').map(Number);
          if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
            errors.push("'from' is an impossible calendar date");
          } else {
            // Normalize date-only to start of day UTC
            fromDate = new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0));
            query.fromNormalized = fromDate;
          }
        } else {
          fromDate = d;
          query.fromNormalized = fromDate;
        }
      }
    }
  }

  if (query.to !== undefined) {
    if (typeof query.to !== 'string' || query.to.trim() === '') {
      errors.push("'to' must be a valid date string");
    } else {
      const parsed = Date.parse(query.to);
      if (isNaN(parsed)) {
        errors.push("'to' must be a valid date string");
      } else {
        const d = new Date(parsed);
        if (query.to.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
          const [y, m, day] = query.to.split('-').map(Number);
          if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
            errors.push("'to' is an impossible calendar date");
          } else {
            // Normalize date-only to end of day UTC (23:59:59.999Z)
            toDate = new Date(Date.UTC(y, m - 1, day, 23, 59, 59, 999));
            query.toNormalized = toDate;
          }
        } else {
          toDate = d;
          query.toNormalized = toDate;
        }
      }
    }
  }

  if (fromDate && toDate && fromDate > toDate) {
    errors.push("'from' date cannot be after 'to' date");
  }
}

/**
 * Validates pagination parameters (page, limit).
 */
function validatePagination(page, limit, errors) {
  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push("'page' must be a positive integer");
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("'limit' must be an integer between 1 and 100");
    }
  }
}

/**
 * Validates ObjectId parameter.
 */
function validateId(id, fieldName, errors) {
  if (id !== undefined) {
    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      errors.push(`Invalid ${fieldName} format`);
    }
  }
}

/**
 * Validates query parameters for GET /api/analytics/overview
 */
function validateOverviewQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateAndNormalizeDates(query, errors);
  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/learning
 */
function validateLearningQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateAndNormalizeDates(query, errors);
  validateId(query.departmentId, 'Department ID', errors);
  validateId(query.courseId, 'Course ID', errors);

  if (query.status !== undefined) {
    if (typeof query.status !== 'string' || !ENROLLMENT_STATUSES.includes(query.status)) {
      errors.push(`'status' must be one of: ${ENROLLMENT_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/assessments
 */
function validateAssessmentQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateAndNormalizeDates(query, errors);
  validateId(query.departmentId, 'Department ID', errors);
  validateId(query.courseId, 'Course ID', errors);

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/compliance
 */
function validateComplianceQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateAndNormalizeDates(query, errors);
  validateId(query.departmentId, 'Department ID', errors);
  validateId(query.requirementId, 'Requirement ID', errors);

  if (query.status !== undefined) {
    if (typeof query.status !== 'string' || !COMPLIANCE_STATUSES.includes(query.status)) {
      errors.push(`'status' must be one of: ${COMPLIANCE_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/certifications
 */
function validateCertificationQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateAndNormalizeDates(query, errors);
  validateId(query.departmentId, 'Department ID', errors);
  validateId(query.courseId, 'Course ID', errors);

  if (query.status !== undefined) {
    if (
      typeof query.status !== 'string' ||
      !CERTIFICATE_LIFECYCLE_STATUSES.includes(query.status)
    ) {
      errors.push(`'status' must be one of: ${CERTIFICATE_LIFECYCLE_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/employees
 */
function validateEmployeeQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateId(query.departmentId, 'Department ID', errors);
  validatePagination(query.page, query.limit, errors);

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/departments
 */
function validateDepartmentQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateId(query.departmentId, 'Department ID', errors);
  validatePagination(query.page, query.limit, errors);

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates query parameters for GET /api/analytics/courses
 */
function validateCourseQuery(query = {}) {
  checkForNoSqlInjection(query);
  const errors = [];
  validateAndNormalizeDates(query, errors);
  validateId(query.courseId, 'Course ID', errors);
  validatePagination(query.page, query.limit, errors);

  if (query.status !== undefined) {
    if (typeof query.status !== 'string' || !COURSE_STATUSES.includes(query.status)) {
      errors.push(`'status' must be one of: ${COURSE_STATUSES.join(', ')}`);
    }
  }

  if (query.level !== undefined) {
    if (typeof query.level !== 'string' || !COURSE_LEVELS.includes(query.level)) {
      errors.push(`'level' must be one of: ${COURSE_LEVELS.join(', ')}`);
    }
  }

  if (query.category !== undefined) {
    if (typeof query.category !== 'string' || query.category.trim().length === 0) {
      errors.push("'category' must be a non-empty string");
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

module.exports = {
  validateOverviewQuery,
  validateLearningQuery,
  validateAssessmentQuery,
  validateComplianceQuery,
  validateCertificationQuery,
  validateEmployeeQuery,
  validateDepartmentQuery,
  validateCourseQuery
};
