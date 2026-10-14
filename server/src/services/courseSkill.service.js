const CourseSkill = require('../models/CourseSkill');
const Course = require('../models/Course');
const Skill = require('../models/Skill');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateCourseSkill,
  validateUpdateCourseSkill,
  validateCourseSkillId,
  validateCourseSkillQuery
} = require('../validators/courseSkill.validator');

const POPULATE_OPTIONS = [
  { path: 'skill', select: 'name category description proficiencyLevels isActive' },
  { path: 'course', select: 'title description category level duration status isActive' }
];

/**
 * Creates a course-to-skill mapping.
 * Admin only.
 */
async function createCourseSkill(currentUser, courseId, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can map skills to courses.', 403);
  }

  validateCreateCourseSkill(courseId, data);

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (!course.isActive) {
    throw new AppError('Cannot assign skills to an inactive course', 400);
  }

  const skillId = data.skill || data.skillId;
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new AppError('Skill not found', 404);
  }
  if (!skill.isActive) {
    throw new AppError('Cannot assign inactive skill to a course', 400);
  }

  const existing = await CourseSkill.findOne({
    course: course._id,
    skill: skill._id
  });

  if (existing) {
    throw new AppError('Course skill mapping already exists', 409);
  }

  const courseSkill = await CourseSkill.create({
    course: course._id,
    skill: skill._id,
    coverageLevel: data.coverageLevel,
    coverageWeight: data.coverageWeight !== undefined ? Number(data.coverageWeight) : 1
  });

  const populated = await CourseSkill.findById(courseSkill._id).populate(POPULATE_OPTIONS);
  return populated;
}

/**
 * Retrieves skill mappings for a course.
 * Respects course visibility rules: employees can only view published active courses.
 */
async function getCourseSkills(currentUser, courseId, query = {}) {
  validateObjectId(courseId, 'Course ID');
  validateCourseSkillQuery(query);

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Employee visibility rule: draft, archived, or inactive course returns 404
  if (currentUser.role === 'employee') {
    if (!course.isActive || course.status !== 'published') {
      throw new AppError('Course not found', 404);
    }
  } else if (!course.isActive && currentUser.role !== 'admin') {
    throw new AppError('Course not found', 404);
  }

  const filter = { course: courseId };

  if (currentUser.role !== 'admin') {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const mappings = await CourseSkill.find(filter)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });

  // For non-admin, filter out mappings where the referenced skill is inactive
  const filtered =
    currentUser.role === 'admin'
      ? mappings
      : mappings.filter((m) => m.skill && m.skill.isActive);

  return {
    courseSkills: filtered,
    total: filtered.length
  };
}

/**
 * Updates a course-to-skill mapping (coverageLevel and/or coverageWeight).
 * Admin only.
 */
async function updateCourseSkill(currentUser, id, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can update course skills.', 403);
  }

  validateUpdateCourseSkill({ id }, data);

  const courseSkill = await CourseSkill.findById(id);
  if (!courseSkill) {
    throw new AppError('Course skill mapping not found', 404);
  }

  if (data.coverageLevel !== undefined) {
    courseSkill.coverageLevel = data.coverageLevel;
  }

  if (data.coverageWeight !== undefined) {
    courseSkill.coverageWeight = Number(data.coverageWeight);
  }

  await courseSkill.save();

  const populated = await CourseSkill.findById(courseSkill._id).populate(POPULATE_OPTIONS);
  return populated;
}

/**
 * Soft deletes a course-to-skill mapping (isActive = false).
 * Admin only.
 */
async function softDeleteCourseSkill(currentUser, id) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can delete course skills.', 403);
  }

  validateCourseSkillId({ id });

  const courseSkill = await CourseSkill.findById(id);
  if (!courseSkill) {
    throw new AppError('Course skill mapping not found', 404);
  }

  courseSkill.isActive = false;
  await courseSkill.save();

  return { message: 'Course skill mapping deleted successfully' };
}

module.exports = {
  createCourseSkill,
  getCourseSkills,
  updateCourseSkill,
  softDeleteCourseSkill
};
