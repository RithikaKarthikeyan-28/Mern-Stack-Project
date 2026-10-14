const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const AppError = require('../utils/AppError');
const { validateRegisterInput, validateLoginInput } = require('../validators/auth.validator');

/**
 * Generates a signed JWT with minimal identity payload.
 *
 * @param {object} user - User document
 * @returns {string} Signed JWT token string
 */
function generateToken(user) {
  const payload = {
    userId: user._id.toString(),
    role: user.role
  };

  return jwt.sign(payload, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn || '7d'
  });
}

/**
 * Registers a new user account.
 *
 * @param {object} data - Registration payload { name, email, password, role }
 * @returns {Promise<object>} Safe user data without password
 * @throws {AppError} If validation fails or email already exists
 */
async function register(data) {
  validateRegisterInput(data);

  const normalizedEmail = data.email.trim().toLowerCase();

  // Check for duplicate email before document creation
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email is already registered', 400);
  }

  const userData = {
    name: data.name.trim(),
    email: normalizedEmail,
    password: data.password,
    role: 'employee' // Always force employee role on public registration to prevent privilege escalation
  };

  const user = await User.create(userData);

  return user.toSafeObject();
}

/**
 * Authenticates user credentials and returns safe user data with a signed JWT.
 *
 * @param {object} data - Login credentials { email, password }
 * @returns {Promise<{ user: object, token: string }>}
 * @throws {AppError} If credentials are wrong or account is inactive
 */
async function login(data) {
  validateLoginInput(data);

  const normalizedEmail = data.email.trim().toLowerCase();

  // Explicitly request password since it is marked select: false in schema
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Use generic message to prevent email enumeration
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordMatch = await user.comparePassword(data.password);
  if (!isPasswordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('User account is inactive', 401);
  }

  const token = generateToken(user);

  return {
    user: user.toSafeObject(),
    token
  };
}

module.exports = {
  register,
  login,
  generateToken
};
