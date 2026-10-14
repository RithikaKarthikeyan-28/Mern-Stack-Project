const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { CERTIFICATE_STATUSES, LIFECYCLE_STATUSES } = require('../models/Certificate');

/**
 * Validates a MongoDB ObjectId.
 *
 * @param {string} id - The ID to validate
 * @param {string} fieldName - Human-readable name of the ID field
 * @throws {AppError} If the ID is invalid
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

/**
 * Validates certificate issuance payload.
 * Strictly enforces anti-injection of server-controlled fields.
 *
 * @param {object} data - Payload to validate
 * @throws {AppError} When validation fails
 */
function validateIssueCertificate(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request payload is required', 400);
  }

  const errors = [];

  // Anti-injection: Client cannot supply server-controlled fields
  const forbiddenFields = [
    'employee',
    'course',
    'certificateNumber',
    'issuedAt',
    'expiresAt',
    'validityDays',
    'status',
    'lifecycleStatus',
    'revokedAt',
    'revokedBy',
    'revocationReason',
    'renewedFrom',
    'renewedAt',
    'renewalReason',
    'progressPercentage',
    'score'
  ];

  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Client injection of ${field} is not allowed`);
    }
  }

  // Enrollment ID validation
  const { enrollmentId } = data;
  if (!enrollmentId) {
    errors.push('Enrollment ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    errors.push('Invalid Enrollment ID format');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates certificate renewal request params and body.
 *
 * @param {object} params - Route params ({ id })
 * @param {object} data - Request body ({ reason })
 * @throws {AppError} When validation fails
 */
function validateRenewal(params, data) {
  const { id } = params || {};
  validateObjectId(id, 'Certificate ID');

  const errors = [];

  if (data && typeof data === 'object') {
    const forbiddenFields = [
      'employee',
      'course',
      'enrollment',
      'certificateNumber',
      'issuedAt',
      'expiresAt',
      'validityDays',
      'status',
      'lifecycleStatus',
      'revokedAt',
      'revokedBy',
      'revocationReason',
      'renewedFrom',
      'renewedAt',
      'score'
    ];

    for (const field of forbiddenFields) {
      if (data[field] !== undefined) {
        errors.push(`Client injection of ${field} is not allowed`);
      }
    }

    if (data.reason !== undefined && data.reason !== null) {
      if (typeof data.reason !== 'string') {
        errors.push('Renewal reason must be a string');
      } else if (data.reason.length > 500) {
        errors.push('Renewal reason cannot exceed 500 characters');
      }
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates certificate revocation request params and body.
 *
 * @param {object} params - Route params ({ id })
 * @param {object} data - Request body ({ reason })
 * @throws {AppError} When validation fails
 */
function validateRevokeCertificate(params, data) {
  const { id } = params || {};
  validateObjectId(id, 'Certificate ID');

  const errors = [];

  if (data && typeof data === 'object') {
    // Anti-injection: Client cannot directly set status, revokedAt, or revokedBy
    const forbiddenFields = [
      'status',
      'lifecycleStatus',
      'revokedAt',
      'revokedBy',
      'certificateNumber',
      'issuedAt',
      'expiresAt',
      'employee',
      'course',
      'enrollment',
      'renewedFrom',
      'renewedAt'
    ];

    for (const field of forbiddenFields) {
      if (data[field] !== undefined) {
        errors.push(`Client injection of ${field} is not allowed`);
      }
    }

    if (data.reason !== undefined && data.reason !== null) {
      if (typeof data.reason !== 'string') {
        errors.push('Revocation reason must be a string');
      } else if (data.reason.length > 500) {
        errors.push('Revocation reason cannot exceed 500 characters');
      }
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates query parameters for expiring certificates search.
 *
 * @param {object} query - Query parameters ({ days })
 */
function validateExpiringQuery(query = {}) {
  if (query.days !== undefined) {
    const days = Number(query.days);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      throw new AppError(
        'Validation failed: Expiring query days must be an integer between 1 and 365',
        400
      );
    }
  }
}

/**
 * Validates certificate ID route param.
 *
 * @param {object} params - Route params ({ id })
 */
function validateCertificateId(params) {
  const { id } = params || {};
  validateObjectId(id, 'Certificate ID');
}

/**
 * Validates certificate number route param for verification.
 *
 * @param {object} params - Route params ({ certificateNumber })
 */
function validateCertificateNumber(params) {
  const { certificateNumber } = params || {};
  if (!certificateNumber || typeof certificateNumber !== 'string' || !certificateNumber.trim()) {
    throw new AppError('Certificate number is required', 400);
  }
}

/**
 * Validates query parameters for admin certificate listing.
 *
 * @param {object} query - Query parameters
 */
function validateAdminCertificateQuery(query = {}) {
  const errors = [];

  if (query.employee && !mongoose.Types.ObjectId.isValid(query.employee)) {
    errors.push('Invalid Employee ID format in query');
  }

  if (query.course && !mongoose.Types.ObjectId.isValid(query.course)) {
    errors.push('Invalid Course ID format in query');
  }

  if (query.status && !LIFECYCLE_STATUSES.includes(query.status)) {
    errors.push(`Status must be one of: ${LIFECYCLE_STATUSES.join(', ')}`);
  }

  if (query.page !== undefined) {
    const page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be an integer between 1 and 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates query parameters for employee certificate history.
 *
 * @param {object} query - Query parameters
 */
function validateEmployeeCertificateQuery(query = {}) {
  const errors = [];

  if (query.status && !LIFECYCLE_STATUSES.includes(query.status)) {
    errors.push(`Status must be one of: ${LIFECYCLE_STATUSES.join(', ')}`);
  }

  if (query.page !== undefined) {
    const page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be an integer between 1 and 100');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

module.exports = {
  validateObjectId,
  validateIssueCertificate,
  validateRenewal,
  validateRevokeCertificate,
  validateExpiringQuery,
  validateCertificateId,
  validateCertificateNumber,
  validateAdminCertificateQuery,
  validateEmployeeCertificateQuery
};
