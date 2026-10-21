const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const JobRole = require('../models/JobRole');
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
 * @param {object} data - Registration payload { name, email, password, role, department }
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

  // Automatically provision Employee profile with assigned department and role
  try {
    let departmentDoc = null;
    if (data.department) {
      departmentDoc = await Department.findOne({ _id: data.department, isActive: true });
    }
    if (!departmentDoc) {
      departmentDoc = await Department.findOne({ isActive: true }).sort({ createdAt: 1 });
    }

    if (departmentDoc) {
      let jobRoleDoc = null;
      if (data.jobRole) {
        jobRoleDoc = await JobRole.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(data.jobRole) ? data.jobRole : null },
            { name: data.jobRole },
            { code: data.jobRole }
          ],
          isActive: true
        });
      }

      const empCount = await Employee.countDocuments();
      const employeeId = `EMP-${String(empCount + 1).padStart(4, '0')}`;
      const designation = jobRoleDoc
        ? jobRoleDoc.name
        : (data.designation ? data.designation.trim() : 'Software Engineer');

      const employee = await Employee.create({
        user: user._id,
        employeeId,
        department: departmentDoc._id,
        designation,
        dateOfJoining: new Date()
      });

      // Calibrate and assign mandatory compliance obligations for the role
      try {
        const complianceService = require('./compliance.service');
        await complianceService.assignInitialComplianceForEmployee(employee, jobRoleDoc);
      } catch (compErr) {
        console.error('Error assigning initial compliance to registered employee:', compErr.message);
      }
    }
  } catch (empErr) {
    console.error('Error creating employee profile on registration:', empErr.message);
  }

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

  // If email is not registered, inform the user to create an account first
  if (!user) {
    throw new AppError('Account not found. Please create an account first.', 401);
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
