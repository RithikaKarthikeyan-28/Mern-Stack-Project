const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { COMPLIANCE_FREQUENCIES } = require('../models/ComplianceRequirement');
const { COMPLIANCE_STATUSES } = require('../models/ComplianceAssignment');

/**
 * Validates a MongoDB ObjectId.
 */
function validateObjectId(id, fieldName = 'ID') {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

const FORBIDDEN_SERVER_FIELDS = [
  'status',
  'dueAt',
  'assignedAt',
  'completedAt',
  'lastEvaluatedAt',
  'isActive',
  'createdAt',
  'updatedAt',
  'id',
  '_id'
];

/**
 * Rejects client injection of server-controlled fields.
 */
function checkForbiddenFields(data, errors = [], customForbidden = FORBIDDEN_SERVER_FIELDS) {
  if (!data || typeof data !== 'object') return;
  for (const field of customForbidden) {
    if (data[field] !== undefined) {
      errors.push(`Client injection of '${field}' is not allowed`);
    }
  }
}

/**
 * Validates compliance requirement creation payload.
 */
function validateCreateRequirement(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];
  checkForbiddenFields(data, errors);

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Compliance requirement title is required');
  } else {
    const trimmed = data.title.trim();
    if (trimmed.length < 3) {
      errors.push('Title must be at least 3 characters');
    } else if (trimmed.length > 120) {
      errors.push('Title cannot exceed 120 characters');
    }
  }

  // Course validation
  if (!data.course) {
    errors.push('Course reference is required');
  } else if (!mongoose.Types.ObjectId.isValid(data.course)) {
    errors.push('Invalid Course ID format');
  }

  // Frequency validation
  if (data.frequency !== undefined) {
    if (!COMPLIANCE_FREQUENCIES.includes(data.frequency)) {
      errors.push(`Frequency must be one of: ${COMPLIANCE_FREQUENCIES.join(', ')}`);
    }
  }

  // dueWithinDays validation
  if (data.dueWithinDays !== undefined) {
    const days = Number(data.dueWithinDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      errors.push('dueWithinDays must be an integer between 1 and 365');
    }
  }

  // renewalGraceDays validation
  if (data.renewalGraceDays !== undefined) {
    const grace = Number(data.renewalGraceDays);
    if (!Number.isInteger(grace) || grace < 0 || grace > 90) {
      errors.push('renewalGraceDays must be an integer between 0 and 90');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates compliance requirement update payload.
 */
function validateUpdateRequirement(params = {}, data = {}) {
  validateObjectId(params.id, 'Compliance Requirement ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];
  checkForbiddenFields(data, errors);

  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push('Title must be a string');
    } else {
      const trimmed = data.title.trim();
      if (trimmed.length < 3) {
        errors.push('Title must be at least 3 characters');
      } else if (trimmed.length > 120) {
        errors.push('Title cannot exceed 120 characters');
      }
    }
  }

  if (data.course !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(data.course)) {
      errors.push('Invalid Course ID format');
    }
  }

  if (data.frequency !== undefined) {
    if (!COMPLIANCE_FREQUENCIES.includes(data.frequency)) {
      errors.push(`Frequency must be one of: ${COMPLIANCE_FREQUENCIES.join(', ')}`);
    }
  }

  if (data.dueWithinDays !== undefined) {
    const days = Number(data.dueWithinDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      errors.push('dueWithinDays must be an integer between 1 and 365');
    }
  }

  if (data.renewalGraceDays !== undefined) {
    const grace = Number(data.renewalGraceDays);
    if (!Number.isInteger(grace) || grace < 0 || grace > 90) {
      errors.push('renewalGraceDays must be an integer between 0 and 90');
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates single employee assignment payload.
 */
function validateSingleAssignment(params = {}, data = {}) {
  validateObjectId(params.requirementId || params.id, 'Compliance Requirement ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];
  checkForbiddenFields(data, errors);

  if (!data.employeeId) {
    errors.push('employeeId is required');
  } else if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
    errors.push('Invalid employeeId format');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates bulk employee assignment payload.
 */
function validateBulkAssignment(params = {}, data = {}) {
  validateObjectId(params.requirementId || params.id, 'Compliance Requirement ID');

  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  const errors = [];
  checkForbiddenFields(data, errors);

  if (!data.employeeIds || !Array.isArray(data.employeeIds)) {
    errors.push('employeeIds must be an array');
  } else if (data.employeeIds.length === 0) {
    errors.push('employeeIds array cannot be empty');
  } else if (data.employeeIds.length > 500) {
    errors.push('employeeIds array cannot exceed 500 items');
  } else {
    for (let i = 0; i < data.employeeIds.length; i++) {
      if (!mongoose.Types.ObjectId.isValid(data.employeeIds[i])) {
        errors.push(`Invalid employeeId format at index ${i}`);
        break;
      }
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
  }
}

/**
 * Validates department assignment route parameters.
 */
function validateDepartmentAssignment(params = {}) {
  validateObjectId(params.requirementId || params.id, 'Compliance Requirement ID');
  validateObjectId(params.departmentId, 'Department ID');
}

/**
 * Validates query parameters for listing requirements.
 */
function validateRequirementQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  if (query.isActive !== undefined) {
    if (
      query.isActive !== 'true' &&
      query.isActive !== 'false' &&
      typeof query.isActive !== 'boolean'
    ) {
      errors.push('isActive filter must be a boolean (true or false)');
    }
  }

  if (query.frequency !== undefined) {
    if (!COMPLIANCE_FREQUENCIES.includes(query.frequency)) {
      errors.push(`Frequency must be one of: ${COMPLIANCE_FREQUENCIES.join(', ')}`);
    }
  }

  if (query.courseId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(query.courseId)) {
      errors.push('Invalid courseId format');
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

/**
 * Validates query parameters for listing compliance assignments.
 */
function validateComplianceQuery(query = {}) {
  if (typeof query !== 'object' || query === null) {
    throw new AppError('Invalid query parameters', 400);
  }

  const errors = [];

  if (query.status !== undefined) {
    if (!COMPLIANCE_STATUSES.includes(query.status)) {
      errors.push(`Status must be one of: ${COMPLIANCE_STATUSES.join(', ')}`);
    }
  }

  if (query.employeeId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(query.employeeId)) {
      errors.push('Invalid employeeId format');
    }
  }

  if (query.requirementId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(query.requirementId)) {
      errors.push('Invalid requirementId format');
    }
  }

  if (query.departmentId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(query.departmentId)) {
      errors.push('Invalid departmentId format');
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

/**
 * Validates compliance requirement ID parameter.
 */
function validateRequirementId(params = {}) {
  validateObjectId(params.id || params.requirementId, 'Compliance Requirement ID');
}

/**
 * Validates employee ID parameter.
 */
function validateEmployeeId(params = {}) {
  validateObjectId(params.employeeId || params.id, 'Employee ID');
}

module.exports = {
  validateObjectId,
  validateCreateRequirement,
  validateUpdateRequirement,
  validateSingleAssignment,
  validateBulkAssignment,
  validateDepartmentAssignment,
  validateRequirementQuery,
  validateComplianceQuery,
  validateRequirementId,
  validateEmployeeId
};
