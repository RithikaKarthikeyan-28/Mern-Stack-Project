const authService = require('../services/auth.service');
const Department = require('../models/Department');
const JobRole = require('../models/JobRole');
const Employee = require('../models/Employee');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle user registration.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to return active departments for registration dropdowns.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function getPublicDepartments(req, res, next) {
  try {
    const departments = await Department.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Active departments retrieved successfully',
      data: { departments }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to return active benchmark job roles for registration dropdowns.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function getPublicJobRoles(req, res, next) {
  try {
    const jobRoles = await JobRole.find({ isActive: true })
      .select('name code description')
      .sort({ name: 1 });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Active job roles retrieved successfully',
      data: { jobRoles }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle user login and JWT issuance.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to return the currently authenticated user's profile.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function getMe(req, res, next) {
  try {
    let employee = null;
    if (req.user && req.user.role === 'employee') {
      employee = await Employee.findOne({ user: req.user.id || req.user._id, isActive: true })
        .populate('department', 'name')
        .populate('jobRole', 'name code');

      if (employee && !employee.jobRole && employee.department) {
        const deptRole = await JobRole.findOne({
          $or: [
            { department: employee.department._id || employee.department },
            { departments: employee.department._id || employee.department }
          ],
          isActive: true
        });
        if (deptRole) {
          employee.jobRole = deptRole;
        }
      }
    }

    const userData = {
      ...req.user,
      employee: employee
        ? {
            id: employee._id,
            employeeId: employee.employeeId,
            department: employee.department,
            jobRole: employee.jobRole,
            designation: employee.designation
          }
        : null
    };

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Current user profile retrieved successfully',
      data: {
        user: userData
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  getPublicDepartments,
  getPublicJobRoles,
  login,
  getMe
};
