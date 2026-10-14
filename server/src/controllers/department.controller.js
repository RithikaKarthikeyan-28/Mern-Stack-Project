const departmentService = require('../services/department.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle department creation.
 */
async function createDepartment(req, res, next) {
  try {
    const department = await departmentService.createDepartment(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Department created successfully',
      data: { department }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving departments.
 */
async function getDepartments(req, res, next) {
  try {
    const departments = await departmentService.getDepartments(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Departments retrieved successfully',
      data: { departments }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving a single department by ID.
 */
async function getDepartmentById(req, res, next) {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department retrieved successfully',
      data: { department }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle updating a department.
 */
async function updateDepartment(req, res, next) {
  try {
    const department = await departmentService.updateDepartment(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department updated successfully',
      data: { department }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle soft-deleting a department.
 */
async function deleteDepartment(req, res, next) {
  try {
    const department = await departmentService.deleteDepartment(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department deleted successfully',
      data: { department }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
