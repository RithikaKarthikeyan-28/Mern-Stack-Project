const JobRole = require('../models/JobRole');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateJobRole,
  validateUpdateJobRole,
  validateJobRoleQuery
} = require('../validators/jobRole.validator');

/**
 * Creates a new job role.
 * Admin only.
 */
async function createJobRole(currentUser, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can create job roles.', 403);
  }

  validateCreateJobRole(data);

  const trimmedName = data.name.trim();
  const normalizedCode = data.code.trim().toUpperCase();

  // Check duplicate name
  const existingName = await JobRole.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  });
  if (existingName) {
    throw new AppError('Job Role with this name already exists', 409);
  }

  // Check duplicate code
  const existingCode = await JobRole.findOne({
    code: normalizedCode
  });
  if (existingCode) {
    throw new AppError('Job Role with this code already exists', 409);
  }

  const jobRole = await JobRole.create({
    name: trimmedName,
    code: normalizedCode,
    description: data.description ? data.description.trim() : ''
  });

  return jobRole;
}

/**
 * Retrieves job roles.
 * Employees & trainers receive active roles only.
 * Admins can view active or inactive roles.
 */
async function getJobRoles(currentUser, query = {}) {
  validateJobRoleQuery(query);

  const filter = {};

  if (currentUser.role !== 'admin') {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.department) {
    filter.$or = [
      { department: query.department },
      { departments: query.department },
      { isGlobal: true }
    ];
  }

  const page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 20;
  if (limit > 100) limit = 100;
  const skip = (page - 1) * limit;

  const [total, jobRoles] = await Promise.all([
    JobRole.countDocuments(filter),
    JobRole.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    jobRoles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Retrieves a single job role by ID.
 * Returns 404 for inactive role if requested by non-admin.
 */
async function getJobRoleById(currentUser, id) {
  validateObjectId(id, 'Job Role ID');

  const jobRole = await JobRole.findById(id);
  if (!jobRole) {
    throw new AppError('Job Role not found', 404);
  }

  if (!jobRole.isActive && currentUser.role !== 'admin') {
    throw new AppError('Job Role not found', 404);
  }

  return jobRole;
}

/**
 * Updates a job role.
 * Admin only.
 */
async function updateJobRole(currentUser, id, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can update job roles.', 403);
  }

  validateUpdateJobRole({ id }, data);

  const jobRole = await JobRole.findById(id);
  if (!jobRole) {
    throw new AppError('Job Role not found', 404);
  }

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (trimmedName.toLowerCase() !== jobRole.name.toLowerCase()) {
      const duplicateName = await JobRole.findOne({
        _id: { $ne: jobRole._id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      if (duplicateName) {
        throw new AppError('Job Role with this name already exists', 409);
      }
    }
    jobRole.name = trimmedName;
  }

  if (data.code !== undefined) {
    const normalizedCode = data.code.trim().toUpperCase();
    if (normalizedCode !== jobRole.code) {
      const duplicateCode = await JobRole.findOne({
        _id: { $ne: jobRole._id },
        code: normalizedCode
      });
      if (duplicateCode) {
        throw new AppError('Job Role with this code already exists', 409);
      }
    }
    jobRole.code = normalizedCode;
  }

  if (data.description !== undefined) {
    jobRole.description = data.description.trim();
  }

  await jobRole.save();
  return jobRole;
}

/**
 * Soft deletes a job role (isActive = false).
 * Admin only.
 */
async function softDeleteJobRole(currentUser, id) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can delete job roles.', 403);
  }

  validateObjectId(id, 'Job Role ID');

  const jobRole = await JobRole.findById(id);
  if (!jobRole) {
    throw new AppError('Job Role not found', 404);
  }

  jobRole.isActive = false;
  await jobRole.save();

  return { message: 'Job Role deleted successfully' };
}

module.exports = {
  createJobRole,
  getJobRoles,
  getJobRoleById,
  updateJobRole,
  softDeleteJobRole
};
