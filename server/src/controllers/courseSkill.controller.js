const courseSkillService = require('../services/courseSkill.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to create a course-to-skill mapping.
 * Admin only.
 */
async function createCourseSkill(req, res, next) {
  try {
    const courseSkill = await courseSkillService.createCourseSkill(
      req.user,
      req.params.courseId,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Course skill mapping created successfully',
      data: { courseSkill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to list skill mappings for a course.
 */
async function getCourseSkills(req, res, next) {
  try {
    const result = await courseSkillService.getCourseSkills(
      req.user,
      req.params.courseId,
      req.query
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course skill mappings retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update a course skill mapping.
 * Admin only.
 */
async function updateCourseSkill(req, res, next) {
  try {
    const courseSkill = await courseSkillService.updateCourseSkill(
      req.user,
      req.params.id,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course skill mapping updated successfully',
      data: { courseSkill }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to soft delete a course skill mapping.
 * Admin only.
 */
async function deleteCourseSkill(req, res, next) {
  try {
    const result = await courseSkillService.softDeleteCourseSkill(
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
  createCourseSkill,
  getCourseSkills,
  updateCourseSkill,
  deleteCourseSkill
};
