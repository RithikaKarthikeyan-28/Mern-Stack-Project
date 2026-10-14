const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle employee profile creation.
 */
async function createEmployee(req, res, next) {
  try {
    const employee = await employeeService.createEmployee(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Employee profile created successfully',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving employees list.
 */
async function getEmployees(req, res, next) {
  try {
    const employees = await employeeService.getEmployees(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employees retrieved successfully',
      data: { employees }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving the authenticated user's own employee profile.
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const employee = await employeeService.getEmployeeByUserId(userId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee profile retrieved successfully',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving a single employee by document ID.
 */
async function getEmployeeById(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee retrieved successfully',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle updating an employee profile.
 */
async function updateEmployee(req, res, next) {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle soft-deleting an employee profile.
 */
async function deleteEmployee(req, res, next) {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee deleted successfully',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEmployee,
  getEmployees,
  getMe,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
