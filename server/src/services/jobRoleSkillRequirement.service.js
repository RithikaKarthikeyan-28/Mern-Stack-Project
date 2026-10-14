const JobRoleSkillRequirement = require('../models/JobRoleSkillRequirement');
const JobRole = require('../models/JobRole');
const Skill = require('../models/Skill');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateRequirement,
  validateUpdateRequirement
} = require('../validators/jobRoleSkillRequirement.validator');

const POPULATE_OPTIONS = [
  { path: 'skill', select: 'name description category proficiencyLevels isActive' },
  { path: 'jobRole', select: 'name code description isActive' }
];

/**
 * Creates a new skill requirement for a job role.
 * Admin only.
 */
async function createRequirement(currentUser, jobRoleId, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can add requirements.', 403);
  }

  validateCreateRequirement(jobRoleId, data);

  const jobRole = await JobRole.findById(jobRoleId);
  if (!jobRole) {
    throw new AppError('Job Role not found', 404);
  }
  if (!jobRole.isActive) {
    throw new AppError('Job Role is inactive and cannot accept requirements', 400);
  }

  const skillId = data.skill || data.skillId;
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new AppError('Skill not found', 404);
  }
  if (!skill.isActive) {
    throw new AppError('Skill is inactive and cannot be added as a requirement', 400);
  }

  // Check for duplicate requirement
  const existing = await JobRoleSkillRequirement.findOne({
    jobRole: jobRole._id,
    skill: skill._id
  });

  if (existing) {
    throw new AppError('Requirement already exists for this job role and skill', 409);
  }

  const requirement = await JobRoleSkillRequirement.create({
    jobRole: jobRole._id,
    skill: skill._id,
    requiredLevel: data.requiredLevel,
    mandatory: data.mandatory !== undefined ? Boolean(data.mandatory) : true,
    weight: data.weight !== undefined ? Number(data.weight) : 1
  });

  const populated = await JobRoleSkillRequirement.findById(requirement._id).populate(POPULATE_OPTIONS);
  return populated;
}

/**
 * Retrieves requirements for a specific job role.
 * Employees & trainers receive active requirements only.
 */
async function getRequirementsForJobRole(currentUser, jobRoleId, query = {}) {
  validateObjectId(jobRoleId, 'Job Role ID');

  const jobRole = await JobRole.findById(jobRoleId);
  if (!jobRole) {
    throw new AppError('Job Role not found', 404);
  }

  if (!jobRole.isActive && currentUser.role !== 'admin') {
    throw new AppError('Job Role not found', 404);
  }

  const filter = { jobRole: jobRoleId };

  if (currentUser.role !== 'admin') {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const requirements = await JobRoleSkillRequirement.find(filter)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: 1 });

  // For non-admin, filter out requirements where the referenced skill is inactive
  const filtered =
    currentUser.role === 'admin'
      ? requirements
      : requirements.filter((r) => r.skill && r.skill.isActive);

  return {
    requirements: filtered,
    total: filtered.length
  };
}

/**
 * Retrieves a single requirement by ID.
 */
async function getRequirementById(currentUser, id) {
  validateObjectId(id, 'Requirement ID');

  const requirement = await JobRoleSkillRequirement.findById(id).populate(POPULATE_OPTIONS);
  if (!requirement) {
    throw new AppError('Requirement not found', 404);
  }

  if (!requirement.isActive && currentUser.role !== 'admin') {
    throw new AppError('Requirement not found', 404);
  }

  return requirement;
}

/**
 * Updates a requirement.
 * Admin only. Mutable: requiredLevel, mandatory, weight.
 */
async function updateRequirement(currentUser, id, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can update requirements.', 403);
  }

  validateUpdateRequirement({ id }, data);

  const requirement = await JobRoleSkillRequirement.findById(id);
  if (!requirement) {
    throw new AppError('Requirement not found', 404);
  }

  if (data.requiredLevel !== undefined) {
    requirement.requiredLevel = data.requiredLevel;
  }

  if (data.mandatory !== undefined) {
    requirement.mandatory = Boolean(data.mandatory);
  }

  if (data.weight !== undefined) {
    requirement.weight = Number(data.weight);
  }

  await requirement.save();

  const populated = await JobRoleSkillRequirement.findById(requirement._id).populate(POPULATE_OPTIONS);
  return populated;
}

/**
 * Soft deletes a requirement (isActive = false).
 * Admin only.
 */
async function softDeleteRequirement(currentUser, id) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can delete requirements.', 403);
  }

  validateObjectId(id, 'Requirement ID');

  const requirement = await JobRoleSkillRequirement.findById(id);
  if (!requirement) {
    throw new AppError('Requirement not found', 404);
  }

  requirement.isActive = false;
  await requirement.save();

  return { message: 'Requirement deleted successfully' };
}

module.exports = {
  createRequirement,
  getRequirementsForJobRole,
  getRequirementById,
  updateRequirement,
  softDeleteRequirement
};
