const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates input for creating an Employee profile.
 *
 * @param {object} data - Employee creation payload
 * @throws {AppError} When validation fails
 */
function validateCreateEmployee(data) {
  const errors = [];
  const { user, employeeId, department, designation, phone, dateOfJoining } = data || {};

  // Validate user reference
  if (!user) {
    errors.push('User ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(user)) {
    errors.push('Invalid User ID format');
  }

  // Validate employeeId
  if (!employeeId || typeof employeeId !== 'string' || employeeId.trim().length === 0) {
    errors.push('Employee ID is required');
  } else if (employeeId.trim().length > 50) {
    errors.push('Employee ID cannot exceed 50 characters');
  }

  // Validate department reference
  if (!department) {
    errors.push('Department ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(department)) {
    errors.push('Invalid Department ID format');
  }

  // Validate optional designation
  if (designation !== undefined && typeof designation === 'string' && designation.trim().length > 100) {
    errors.push('Designation cannot exceed 100 characters');
  }

  // Validate optional phone
  if (phone !== undefined && typeof phone === 'string' && phone.trim().length > 25) {
    errors.push('Phone number cannot exceed 25 characters');
  }

  // Validate optional dateOfJoining
  if (dateOfJoining !== undefined && dateOfJoining !== null && isNaN(Date.parse(dateOfJoining))) {
    errors.push('Please provide a valid date for dateOfJoining');
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

/**
 * Validates input for updating an existing Employee profile.
 *
 * @param {object} data - Employee update payload
 * @throws {AppError} When validation fails
 */
function validateUpdateEmployee(data) {
  const errors = [];
  const { user, employeeId, department, designation, phone, dateOfJoining, isActive } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  // Reject altering user reference
  if (user !== undefined) {
    errors.push('Cannot change user reference of an employee profile');
  }

  if (employeeId !== undefined) {
    if (typeof employeeId !== 'string' || employeeId.trim().length === 0) {
      errors.push('Employee ID cannot be empty');
    } else if (employeeId.trim().length > 50) {
      errors.push('Employee ID cannot exceed 50 characters');
    }
  }

  if (department !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(department)) {
      errors.push('Invalid Department ID format');
    }
  }

  if (designation !== undefined && typeof designation === 'string' && designation.trim().length > 100) {
    errors.push('Designation cannot exceed 100 characters');
  }

  if (phone !== undefined && typeof phone === 'string' && phone.trim().length > 25) {
    errors.push('Phone number cannot exceed 25 characters');
  }

  if (dateOfJoining !== undefined && dateOfJoining !== null && isNaN(Date.parse(dateOfJoining))) {
    errors.push('Please provide a valid date for dateOfJoining');
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

module.exports = {
  validateCreateEmployee,
  validateUpdateEmployee
};
