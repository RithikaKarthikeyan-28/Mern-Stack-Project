const requirementService = require('../services/jobRoleSkillRequirement.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to create a requirement for a job role.
 */
async function createRequirement(req, res, next) {
  try {
    const jobRoleId = req.params.jobRoleId;
    const requirement = await requirementService.createRequirement(
      req.user,
      jobRoleId,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Job Role skill requirement created successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to list requirements for a job role.
 */
async function getRequirementsForJobRole(req, res, next) {
  try {
    const jobRoleId = req.params.jobRoleId;
    const result = await requirementService.getRequirementsForJobRole(
      req.user,
      jobRoleId,
      req.query
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Job Role skill requirements retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to get a single requirement by ID.
 */
async function getRequirementById(req, res, next) {
  try {
    const requirement = await requirementService.getRequirementById(
      req.user,
      req.params.id
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Requirement retrieved successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update a requirement.
 */
async function updateRequirement(req, res, next) {
  try {
    const requirement = await requirementService.updateRequirement(
      req.user,
      req.params.id,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Requirement updated successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to soft delete a requirement.
 */
async function deleteRequirement(req, res, next) {
  try {
    const result = await requirementService.softDeleteRequirement(
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
  createRequirement,
  getRequirementsForJobRole,
  getRequirementById,
  updateRequirement,
  deleteRequirement
};
