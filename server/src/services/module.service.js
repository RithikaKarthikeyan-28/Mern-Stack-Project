const Module = require('../models/Module');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateModule,
  validateUpdateModule
} = require('../validators/module.validator');

const COURSE_POPULATE_FIELDS = 'title status isActive';

/**
 * Creates a new module within a course.
 *
 * @param {object} data - Module creation payload
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Created module document
 */
async function createModule(data, currentUser) {
  validateCreateModule(data);

  // 1. Resolve parent course
  const course = await Course.findById(data.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (!course.isActive) {
    throw new AppError('Cannot add module to an inactive course', 400);
  }
  if (course.status === 'archived') {
    throw new AppError('Cannot add module to an archived course', 400);
  }

  // 2. Trainer ownership authorization
  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = (course.trainer._id || course.trainer).toString();

  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You can only create modules in your own courses.', 403);
  }
  if (currentUser.role === 'employee') {
    throw new AppError('Access denied.', 403);
  }

  // 3. Unique order enforcement within course
  const existingOrder = await Module.findOne({ course: data.course, order: data.order });
  if (existingOrder) {
    throw new AppError('A module with this order already exists in the course', 409);
  }

  // 4. Create module
  const moduleDoc = await Module.create({
    course: data.course,
    title: data.title.trim(),
    description: data.description !== undefined ? data.description.trim() : '',
    order: data.order,
    isActive: true
  });

  await moduleDoc.populate({ path: 'course', select: COURSE_POPULATE_FIELDS });
  return moduleDoc;
}

/**
 * Retrieves all modules for a given course.
 *
 * @param {string} courseId - Course ID
 * @param {object} [query={}] - Filter criteria (isActive)
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<Array>} List of module documents
 */
async function getModules(courseId, query = {}, currentUser) {
  validateObjectId(courseId, 'Course ID');

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = (course.trainer._id || course.trainer).toString();

  // Employee visibility rule
  if (currentUser.role === 'employee') {
    if (!course.isActive || course.status !== 'published') {
      throw new AppError('Course not found', 404);
    }
  }

  // Trainer ownership rule
  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You do not own this course.', 403);
  }

  const filter = { course: courseId };

  if (currentUser.role === 'employee') {
    // Employees can only view active modules
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  return Module.find(filter)
    .populate({ path: 'course', select: COURSE_POPULATE_FIELDS })
    .sort({ order: 1 });
}

/**
 * Retrieves a single module by ID.
 *
 * @param {string} id - Module ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Module document
 */
async function getModuleById(id, currentUser) {
  validateObjectId(id, 'Module ID');

  const moduleDoc = await Module.findById(id).populate({
    path: 'course',
    select: 'title status isActive trainer'
  });

  if (!moduleDoc) {
    throw new AppError('Module not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = moduleDoc.course?.trainer
    ? (moduleDoc.course.trainer._id || moduleDoc.course.trainer).toString()
    : null;

  // Employee visibility chain
  if (currentUser.role === 'employee') {
    if (
      !moduleDoc.isActive ||
      !moduleDoc.course ||
      !moduleDoc.course.isActive ||
      moduleDoc.course.status !== 'published'
    ) {
      throw new AppError('Module not found', 404);
    }
  }

  // Trainer ownership check
  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You do not own the course this module belongs to.', 403);
  }

  return moduleDoc;
}

/**
 * Updates a module.
 *
 * @param {string} id - Module ID
 * @param {object} data - Update payload
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Updated module document
 */
async function updateModule(id, data, currentUser) {
  validateObjectId(id, 'Module ID');
  validateUpdateModule(data);

  const moduleDoc = await Module.findById(id).populate('course');
  if (!moduleDoc) {
    throw new AppError('Module not found', 404);
  }
  if (!moduleDoc.course) {
    throw new AppError('Course not found', 404);
  }

  if (moduleDoc.course.status === 'archived') {
    throw new AppError('Cannot modify modules of an archived course', 400);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = (moduleDoc.course.trainer._id || moduleDoc.course.trainer).toString();

  // Trainer ownership check
  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You can only update modules in your own courses.', 403);
  }

  // Course immutability
  if (data.course !== undefined && data.course.toString() !== moduleDoc.course._id.toString()) {
    throw new AppError('Cannot change course reference of a module', 400);
  }

  // Order conflict check if order changed
  if (data.order !== undefined && data.order !== moduleDoc.order) {
    const existing = await Module.findOne({
      _id: { $ne: id },
      course: moduleDoc.course._id,
      order: data.order
    });
    if (existing) {
      throw new AppError('A module with this order already exists in the course', 409);
    }
    moduleDoc.order = data.order;
  }

  if (data.title !== undefined) moduleDoc.title = data.title.trim();
  if (data.description !== undefined) moduleDoc.description = data.description.trim();
  if (data.isActive !== undefined) moduleDoc.isActive = data.isActive;

  await moduleDoc.save();
  await moduleDoc.populate({ path: 'course', select: COURSE_POPULATE_FIELDS });
  return moduleDoc;
}

/**
 * Soft-deletes a module.
 *
 * @param {string} id - Module ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Soft-deleted module document
 */
async function deleteModule(id, currentUser) {
  validateObjectId(id, 'Module ID');

  const moduleDoc = await Module.findById(id).populate('course');
  if (!moduleDoc) {
    throw new AppError('Module not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = moduleDoc.course?.trainer
    ? (moduleDoc.course.trainer._id || moduleDoc.course.trainer).toString()
    : null;

  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You can only delete modules in your own courses.', 403);
  }

  moduleDoc.isActive = false;
  await moduleDoc.save();
  await moduleDoc.populate({ path: 'course', select: COURSE_POPULATE_FIELDS });

  return moduleDoc;
}

module.exports = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule
};
