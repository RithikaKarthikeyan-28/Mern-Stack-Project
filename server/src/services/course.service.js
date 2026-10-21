const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateCourse,
  validateUpdateCourse
} = require('../validators/course.validator');

const TRAINER_POPULATE_FIELDS = 'name email role isActive';

/**
 * Creates a new course.
 *
 * @param {object} data - Course payload
 * @param {object} currentUser - Authenticated user object (from req.user)
 * @returns {Promise<object>} Created course with populated trainer
 */
async function createCourse(data, currentUser) {
  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  // 1. Enforce trainer ownership invariant
  if (currentUser.role === 'trainer') {
    // For trainers, the trainer field is forced to the authenticated trainer's user ID
    data.trainer = currentUserId;
  }

  // 2. Validate input data
  validateCreateCourse(data, { requireTrainer: currentUser.role === 'admin' });

  // 3. Verify trainer exists, is active, and possesses the 'trainer' role
  const trainerId = data.trainer;
  validateObjectId(trainerId, 'Trainer ID');

  const trainerUser = await User.findById(trainerId);
  if (!trainerUser) {
    throw new AppError('Trainer not found', 404);
  }
  if (!trainerUser.isActive) {
    throw new AppError('Cannot assign an inactive trainer', 400);
  }
  if (trainerUser.role !== 'trainer') {
    throw new AppError('Assigned user is not a trainer', 400);
  }

  // 4. Create course document
  const course = await Course.create({
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category.trim(),
    level: data.level,
    duration: data.duration,
    trainer: trainerUser._id,
    department: data.department || undefined,
    isGlobal: Boolean(data.isGlobal),
    status: data.status || 'draft',
    isActive: true
  });

  await course.populate({ path: 'trainer', select: TRAINER_POPULATE_FIELDS });
  return course;
}

/**
 * Retrieves courses with role-based filtering and visibility rules.
 *
 * @param {object} [filters={}] - Filter criteria (category, level, status, trainer, isActive)
 * @param {object} currentUser - Authenticated user object (from req.user)
 * @returns {Promise<Array>} List of populated course documents
 */
async function getCourses(filters = {}, currentUser) {
  const query = {};

  // Enforce employee visibility rule
  if (currentUser.role === 'employee') {
    query.isActive = true;
    query.status = 'published';
  } else {
    // Admin and Trainer may filter by status and isActive
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true' || filters.isActive === true;
    }
    if (filters.status) {
      query.status = filters.status;
    }
  }

  // Category filter (case-insensitive)
  if (filters.category) {
    query.category = { $regex: new RegExp(`^${filters.category.trim()}$`, 'i') };
  }

  // Level filter
  if (filters.level) {
    query.level = filters.level;
  }

  // Trainer filter
  if (filters.trainer) {
    validateObjectId(filters.trainer, 'Trainer ID');
    query.trainer = filters.trainer;
  }

  // Department filter
  if (filters.department) {
    validateObjectId(filters.department, 'Department ID');
    if (filters.includeGlobal === 'true' || filters.includeGlobal === true) {
      query.$or = [{ department: filters.department }, { isGlobal: true }];
    } else {
      query.department = filters.department;
    }
  } else if (filters.isGlobal !== undefined) {
    query.isGlobal = filters.isGlobal === 'true' || filters.isGlobal === true;
  }

  // Guard against obsolete demo and non-technical courses
  const OBSOLETE_COURSES = [
    'Excel for Better Decisions',
    'Coaching for Performance',
    'Leadership Essentials',
    'Data Privacy Foundations',
    'Secure Working Practices',
    'Project Management Fundamentals',
    'Inclusive Communication',
    'Financial Acumen for Non-Finance Teams',
    'Customer Experience Excellence',
    'Advanced Presentation Skills',
    'Workplace Health and Safety'
  ];

  if (!query.title) {
    query.title = { $nin: OBSOLETE_COURSES };
  }

  return Course.find(query)
    .populate({ path: 'trainer', select: TRAINER_POPULATE_FIELDS })
    .populate({ path: 'department', select: 'name description' })
    .sort({ createdAt: -1 });
}

/**
 * Retrieves a single course by ID, enforcing employee visibility constraints.
 *
 * @param {string} id - Course ID
 * @param {object} currentUser - Authenticated user object (from req.user)
 * @returns {Promise<object>} Populated course document
 */
async function getCourseById(id, currentUser) {
  validateObjectId(id, 'Course ID');

  const course = await Course.findById(id)
    .populate({
      path: 'trainer',
      select: TRAINER_POPULATE_FIELDS
    })
    .populate({
      path: 'department',
      select: 'name description'
    });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Employee visibility rule: draft, archived, or inactive courses return 404
  if (currentUser.role === 'employee') {
    if (!course.isActive || course.status !== 'published') {
      throw new AppError('Course not found', 404);
    }
  }

  return course;
}

/**
 * Updates an existing course with trainer ownership and admin authority checks.
 *
 * @param {string} id - Course ID
 * @param {object} data - Update payload
 * @param {object} currentUser - Authenticated user object (from req.user)
 * @returns {Promise<object>} Updated populated course document
 */
async function updateCourse(id, data, currentUser) {
  validateObjectId(id, 'Course ID');
  validateUpdateCourse(data);

  const course = await Course.findById(id);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const courseTrainerId = (course.trainer._id || course.trainer).toString();

  // Trainer authorization checks
  if (currentUser.role === 'trainer') {
    // Trainer can only update their own course
    if (courseTrainerId !== currentUserId) {
      throw new AppError('Access denied. You can only update courses you own.', 403);
    }

    // Trainer cannot transfer course ownership
    if (data.trainer !== undefined && data.trainer.toString() !== currentUserId) {
      throw new AppError('Trainers cannot transfer course ownership', 403);
    }
  }

  // Admin changing course trainer
  if (currentUser.role === 'admin' && data.trainer !== undefined) {
    validateObjectId(data.trainer, 'Trainer ID');
    const newTrainer = await User.findById(data.trainer);
    if (!newTrainer) {
      throw new AppError('Trainer not found', 404);
    }
    if (!newTrainer.isActive) {
      throw new AppError('Cannot assign an inactive trainer', 400);
    }
    if (newTrainer.role !== 'trainer') {
      throw new AppError('Assigned user is not a trainer', 400);
    }
    course.trainer = newTrainer._id;
  }

  // Apply updates
  if (data.title !== undefined) course.title = data.title.trim();
  if (data.description !== undefined) course.description = data.description.trim();
  if (data.category !== undefined) course.category = data.category.trim();
  if (data.level !== undefined) course.level = data.level;
  if (data.duration !== undefined) course.duration = data.duration;
  if (data.department !== undefined) course.department = data.department || null;
  if (data.isGlobal !== undefined) course.isGlobal = Boolean(data.isGlobal);
  if (data.status !== undefined) course.status = data.status;
  if (data.isActive !== undefined) course.isActive = data.isActive;

  await course.save();
  await course.populate({ path: 'trainer', select: TRAINER_POPULATE_FIELDS });
  return course;
}

/**
 * Soft-deletes a course by setting isActive to false.
 *
 * @param {string} id - Course ID
 * @param {object} currentUser - Authenticated user object (from req.user)
 * @returns {Promise<object>} Soft-deleted populated course document
 */
async function deleteCourse(id, currentUser) {
  if (currentUser && currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can delete courses.', 403);
  }

  validateObjectId(id, 'Course ID');

  const course = await Course.findById(id);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  course.isActive = false;
  await course.save();
  await course.populate({ path: 'trainer', select: TRAINER_POPULATE_FIELDS });

  return course;
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
