const Skill = require('../models/Skill');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateSkill,
  validateUpdateSkill,
  validateSkillQuery
} = require('../validators/skill.validator');

/**
 * Creates a new skill.
 * Admin only.
 */
async function createSkill(currentUser, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can create skills.', 403);
  }

  validateCreateSkill(data);

  const trimmedName = data.name.trim();

  // Check for duplicate name (case-insensitive)
  const existing = await Skill.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  });

  if (existing) {
    throw new AppError('Skill already exists', 409);
  }

  const skill = await Skill.create({
    name: trimmedName,
    description: data.description ? data.description.trim() : '',
    category: data.category.trim(),
    proficiencyLevels: data.proficiencyLevels || undefined
  });

  return skill;
}

/**
 * Retrieves skills.
 * Employees & trainers receive active skills only.
 * Admins can view active or inactive skills.
 */
async function getSkills(currentUser, query = {}) {
  validateSkillQuery(query);

  const filter = {};

  if (currentUser.role !== 'admin') {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.category) {
    filter.category = query.category.trim();
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

  const [total, skills] = await Promise.all([
    Skill.countDocuments(filter),
    Skill.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    skills,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Retrieves a single skill by ID.
 * Returns 404 for inactive skill if requested by non-admin.
 */
async function getSkillById(currentUser, id) {
  validateObjectId(id, 'Skill ID');

  const skill = await Skill.findById(id);
  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  if (!skill.isActive && currentUser.role !== 'admin') {
    throw new AppError('Skill not found', 404);
  }

  return skill;
}

/**
 * Updates a skill.
 * Admin only.
 */
async function updateSkill(currentUser, id, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can update skills.', 403);
  }

  validateUpdateSkill({ id }, data);

  const skill = await Skill.findById(id);
  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (trimmedName.toLowerCase() !== skill.name.toLowerCase()) {
      const duplicate = await Skill.findOne({
        _id: { $ne: skill._id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      if (duplicate) {
        throw new AppError('Skill already exists', 409);
      }
    }
    skill.name = trimmedName;
  }

  if (data.description !== undefined) {
    skill.description = data.description.trim();
  }

  if (data.category !== undefined) {
    skill.category = data.category.trim();
  }

  if (data.proficiencyLevels !== undefined) {
    skill.proficiencyLevels = data.proficiencyLevels;
  }

  await skill.save();
  return skill;
}

/**
 * Soft deletes a skill (isActive = false).
 * Admin only.
 */
async function softDeleteSkill(currentUser, id) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can delete skills.', 403);
  }

  validateObjectId(id, 'Skill ID');

  const skill = await Skill.findById(id);
  if (!skill) {
    throw new AppError('Skill not found', 404);
  }

  skill.isActive = false;
  await skill.save();

  return { message: 'Skill deleted successfully' };
}

module.exports = {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  softDeleteSkill
};
