const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['admin', 'trainer', 'employee'];

/**
 * Validates registration input data.
 *
 * @param {object} data - Registration payload
 * @throws {AppError} When validation fails
 */
function validateRegisterInput(data) {
  const errors = [];
  const { name, email, password, role } = data || {};

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  // Validate email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Validate role if provided
  if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
    errors.push(`Role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

/**
 * Validates login input data.
 *
 * @param {object} data - Login payload
 * @throws {AppError} When validation fails
 */
function validateLoginInput(data) {
  const errors = [];
  const { email, password } = data || {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
