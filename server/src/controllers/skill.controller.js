const skillService = require('../services/skill.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to create a skill.
 */
async function createSkill(req, res, next) {
  try {
    const skill = await skillService.createSkill(req.user, req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Skill created successfully',
      data: { skill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to list skills.
 */
async function getSkills(req, res, next) {
  try {
    const result = await skillService.getSkills(req.user, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Skills retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to get a single skill by ID.
 */
async function getSkillById(req, res, next) {
  try {
    const skill = await skillService.getSkillById(req.user, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Skill retrieved successfully',
      data: { skill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update a skill.
 */
async function updateSkill(req, res, next) {
  try {
    const skill = await skillService.updateSkill(req.user, req.params.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Skill updated successfully',
      data: { skill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to soft delete a skill.
 */
async function deleteSkill(req, res, next) {
  try {
    const result = await skillService.softDeleteSkill(req.user, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill
};
