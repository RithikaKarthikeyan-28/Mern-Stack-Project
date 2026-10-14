const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateLesson,
  validateUpdateLesson
} = require('../validators/lesson.validator');

const MODULE_POPULATE_FIELDS = 'title order course';

/**
 * Creates a new lesson within a module.
 *
 * @param {object} data - Lesson creation payload
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Created lesson document
 */
async function createLesson(data, currentUser) {
  validateCreateLesson(data);

  // 1. Resolve module and parent course
  const moduleDoc = await Module.findById(data.module).populate('course');
  if (!moduleDoc) {
    throw new AppError('Module not found', 404);
  }
  if (!moduleDoc.course) {
    throw new AppError('Course not found', 404);
  }
  if (!moduleDoc.course.isActive) {
    throw new AppError('Cannot add lesson to an inactive course', 400);
  }
  if (moduleDoc.course.status === 'archived') {
    throw new AppError('Cannot add lesson to an archived course', 400);
  }

  // 2. Ownership authorization
  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = (moduleDoc.course.trainer._id || moduleDoc.course.trainer).toString();

  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You can only create lessons in your own courses.', 403);
  }
  if (currentUser.role === 'employee') {
    throw new AppError('Access denied.', 403);
  }

  // 3. Unique order enforcement within module
  const existingOrder = await Lesson.findOne({ module: data.module, order: data.order });
  if (existingOrder) {
    throw new AppError('A lesson with this order already exists in the module', 409);
  }

  // 4. Create lesson
  const lesson = await Lesson.create({
    module: data.module,
    title: data.title.trim(),
    content: data.content.trim(),
    contentType: data.contentType,
    resourceUrl: data.resourceUrl ? data.resourceUrl.trim() : null,
    order: data.order,
    isActive: true
  });

  await lesson.populate({ path: 'module', select: MODULE_POPULATE_FIELDS });
  return lesson;
}

/**
 * Retrieves all lessons for a module.
 *
 * @param {string} moduleId - Module ID
 * @param {object} [query={}] - Filter criteria (isActive, contentType)
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<Array>} List of lesson documents
 */
async function getLessons(moduleId, query = {}, currentUser) {
  validateObjectId(moduleId, 'Module ID');

  const moduleDoc = await Module.findById(moduleId).populate('course');
  if (!moduleDoc) {
    throw new AppError('Module not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = moduleDoc.course
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

  const filter = { module: moduleId };

  if (currentUser.role === 'employee') {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.contentType) {
    filter.contentType = query.contentType;
  }

  return Lesson.find(filter)
    .populate({ path: 'module', select: MODULE_POPULATE_FIELDS })
    .sort({ order: 1 });
}

/**
 * Retrieves a single lesson by ID.
 *
 * @param {string} id - Lesson ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Populated lesson document
 */
async function getLessonById(id, currentUser) {
  validateObjectId(id, 'Lesson ID');

  const lesson = await Lesson.findById(id).populate({
    path: 'module',
    select: 'title order course isActive',
    populate: {
      path: 'course',
      select: 'title status isActive trainer'
    }
  });

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = lesson.module?.course?.trainer
    ? (lesson.module.course.trainer._id || lesson.module.course.trainer).toString()
    : null;

  // Employee visibility chain
  if (currentUser.role === 'employee') {
    if (
      !lesson.isActive ||
      !lesson.module ||
      !lesson.module.isActive ||
      !lesson.module.course ||
      !lesson.module.course.isActive ||
      lesson.module.course.status !== 'published'
    ) {
      throw new AppError('Lesson not found', 404);
    }
  }

  // Trainer ownership check
  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You do not own the course this lesson belongs to.', 403);
  }

  return lesson;
}

/**
 * Updates an existing lesson.
 *
 * @param {string} id - Lesson ID
 * @param {object} data - Update payload
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Updated lesson document
 */
async function updateLesson(id, data, currentUser) {
  validateObjectId(id, 'Lesson ID');
  validateUpdateLesson(data);

  const lesson = await Lesson.findById(id).populate({
    path: 'module',
    populate: { path: 'course' }
  });

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }
  if (!lesson.module || !lesson.module.course) {
    throw new AppError('Module or Course not found', 404);
  }

  if (lesson.module.course.status === 'archived') {
    throw new AppError('Cannot modify lessons of an archived course', 400);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = (lesson.module.course.trainer._id || lesson.module.course.trainer).toString();

  // Trainer ownership check
  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You can only update lessons in your own courses.', 403);
  }

  // Module immutability
  if (data.module !== undefined && data.module.toString() !== lesson.module._id.toString()) {
    throw new AppError('Cannot change module reference of a lesson', 400);
  }

  // Order conflict check if order changed
  if (data.order !== undefined && data.order !== lesson.order) {
    const existing = await Lesson.findOne({
      _id: { $ne: id },
      module: lesson.module._id,
      order: data.order
    });
    if (existing) {
      throw new AppError('A lesson with this order already exists in the module', 409);
    }
    lesson.order = data.order;
  }

  if (data.title !== undefined) lesson.title = data.title.trim();
  if (data.content !== undefined) lesson.content = data.content.trim();
  if (data.contentType !== undefined) lesson.contentType = data.contentType;
  if (data.resourceUrl !== undefined) lesson.resourceUrl = data.resourceUrl ? data.resourceUrl.trim() : null;
  if (data.isActive !== undefined) lesson.isActive = data.isActive;

  await lesson.save();
  await lesson.populate({ path: 'module', select: MODULE_POPULATE_FIELDS });
  return lesson;
}

/**
 * Soft-deletes a lesson.
 *
 * @param {string} id - Lesson ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Soft-deleted lesson document
 */
async function deleteLesson(id, currentUser) {
  validateObjectId(id, 'Lesson ID');

  const lesson = await Lesson.findById(id).populate({
    path: 'module',
    populate: { path: 'course' }
  });

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = lesson.module?.course?.trainer
    ? (lesson.module.course.trainer._id || lesson.module.course.trainer).toString()
    : null;

  if (currentUser.role === 'trainer' && courseTrainerId !== currentUserId) {
    throw new AppError('Access denied. You can only delete lessons in your own courses.', 403);
  }

  lesson.isActive = false;
  await lesson.save();
  await lesson.populate({ path: 'module', select: MODULE_POPULATE_FIELDS });

  return lesson;
}

module.exports = {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson
};
