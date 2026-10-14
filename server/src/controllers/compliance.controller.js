const complianceService = require('../services/compliance.service');
const {
  validateCreateRequirement,
  validateUpdateRequirement,
  validateSingleAssignment,
  validateBulkAssignment,
  validateDepartmentAssignment,
  validateRequirementQuery,
  validateComplianceQuery,
  validateRequirementId,
  validateEmployeeId
} = require('../validators/compliance.validator');
const { sendSuccess } = require('../utils/response');

/**
 * Creates a new compliance requirement (Admin).
 */
async function createRequirement(req, res, next) {
  try {
    validateCreateRequirement(req.body);
    const requirement = await complianceService.createRequirement(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Compliance requirement created successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists compliance requirements with pagination and filtering (Admin).
 */
async function getRequirements(req, res, next) {
  try {
    validateRequirementQuery(req.query);
    const result = await complianceService.getRequirements(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance requirements retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single compliance requirement by ID (Admin).
 */
async function getRequirementById(req, res, next) {
  try {
    validateRequirementId(req.params);
    const requirement = await complianceService.getRequirementById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance requirement retrieved successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates a compliance requirement (Admin).
 */
async function updateRequirement(req, res, next) {
  try {
    validateUpdateRequirement(req.params, req.body);
    const requirement = await complianceService.updateRequirement(
      req.params.id,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance requirement updated successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Soft deletes a compliance requirement (Admin).
 */
async function deleteRequirement(req, res, next) {
  try {
    validateRequirementId(req.params);
    const requirement = await complianceService.deleteRequirement(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance requirement deleted successfully',
      data: { requirement }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Assigns a compliance requirement to a single employee (Admin).
 */
async function assignToEmployee(req, res, next) {
  try {
    validateSingleAssignment(req.params, req.body);
    const requirementId = req.params.requirementId || req.params.id;
    const assignment = await complianceService.assignToEmployee(
      requirementId,
      req.body.employeeId
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Compliance requirement assigned successfully',
      data: { assignment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk assigns a compliance requirement to multiple employees (Admin).
 */
async function bulkAssign(req, res, next) {
  try {
    validateBulkAssignment(req.params, req.body);
    const requirementId = req.params.requirementId || req.params.id;
    const result = await complianceService.bulkAssign(
      requirementId,
      req.body.employeeIds
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Bulk assignment completed',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Assigns a compliance requirement to all employees in a department (Admin).
 */
async function assignToDepartment(req, res, next) {
  try {
    validateDepartmentAssignment(req.params);
    const requirementId = req.params.requirementId || req.params.id;
    const result = await complianceService.assignToDepartment(
      requirementId,
      req.params.departmentId
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department assignment completed',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves the authenticated employee's compliance assignments (Employee).
 */
async function getMyCompliance(req, res, next) {
  try {
    const result = await complianceService.getMyCompliance(req.user, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance assignments retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves the authenticated employee's compliance summary metrics (Employee).
 */
async function getMyComplianceSummary(req, res, next) {
  try {
    const result = await complianceService.getMyComplianceSummary(req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance summary retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin view of an arbitrary employee's compliance assignments (Admin).
 */
async function getEmployeeCompliance(req, res, next) {
  try {
    validateEmployeeId(req.params);
    const result = await complianceService.getEmployeeCompliance(
      req.params.employeeId
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee compliance assignments retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin listing of all compliance assignments with filters and pagination (Admin).
 */
async function getComplianceAssignments(req, res, next) {
  try {
    validateComplianceQuery(req.query);
    const result = await complianceService.getComplianceAssignments(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance assignments retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin overall compliance summary metrics (Admin).
 */
async function getComplianceSummary(req, res, next) {
  try {
    validateComplianceQuery(req.query);
    const result = await complianceService.getComplianceSummary(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance summary retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin trigger to recalculate compliance statuses and trigger notifications (Admin).
 */
async function refreshStatuses(req, res, next) {
  try {
    const result = await complianceService.refreshStatuses(req.body || {});
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance statuses refreshed successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRequirement,
  getRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  assignToEmployee,
  bulkAssign,
  assignToDepartment,
  getMyCompliance,
  getMyComplianceSummary,
  getEmployeeCompliance,
  getComplianceAssignments,
  getComplianceSummary,
  refreshStatuses
};
