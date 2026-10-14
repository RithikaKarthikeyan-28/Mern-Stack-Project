const employeeSkillService = require('../services/employeeSkill.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to assign a skill to an employee.
 * Admin only.
 */
async function createEmployeeSkill(req, res, next) {
  try {
    const employeeSkill = await employeeSkillService.createEmployeeSkill(
      req.user,
      req.params.employeeId,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Employee skill assigned successfully',
      data: { employeeSkill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to list skills for a specific employee.
 */
async function getEmployeeSkills(req, res, next) {
  try {
    const result = await employeeSkillService.getEmployeeSkills(
      req.user,
      req.params.employeeId,
      req.query
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee skills retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for employee self-service to get own skills.
 */
async function getMySkills(req, res, next) {
  try {
    const result = await employeeSkillService.getMySkills(req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'My skills retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update an employee skill proficiency.
 * Admin only.
 */
async function updateEmployeeSkill(req, res, next) {
  try {
    const employeeSkill = await employeeSkillService.updateEmployeeSkill(
      req.user,
      req.params.id,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee skill updated successfully',
      data: { employeeSkill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to soft delete an employee skill.
 * Admin only.
 */
async function deleteEmployeeSkill(req, res, next) {
  try {
    const result = await employeeSkillService.softDeleteEmployeeSkill(
      req.user,
      req.params.id
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEmployeeSkill,
  getEmployeeSkills,
  getMySkills,
  updateEmployeeSkill,
  deleteEmployeeSkill
};
