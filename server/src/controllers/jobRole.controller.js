const jobRoleService = require('../services/jobRole.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to create a job role.
 */
async function createJobRole(req, res, next) {
  try {
    const jobRole = await jobRoleService.createJobRole(req.user, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Job Role created successfully',
      data: { jobRole }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to list job roles.
 */
async function getJobRoles(req, res, next) {
  try {
    const result = await jobRoleService.getJobRoles(req.user, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Job Roles retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to get a single job role by ID.
 */
async function getJobRoleById(req, res, next) {
  try {
    const jobRole = await jobRoleService.getJobRoleById(req.user, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Job Role retrieved successfully',
      data: { jobRole }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update a job role.
 */
async function updateJobRole(req, res, next) {
  try {
    const jobRole = await jobRoleService.updateJobRole(req.user, req.params.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Job Role updated successfully',
      data: { jobRole }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to soft delete a job role.
 */
async function deleteJobRole(req, res, next) {
  try {
    const result = await jobRoleService.softDeleteJobRole(req.user, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createJobRole,
  getJobRoles,
  getJobRoleById,
  updateJobRole,
  deleteJobRole
};
