const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { ENROLLMENT_STATUSES } = require('../models/Enrollment');
const { validateObjectId } = require('./department.validator');

/**
 * Validates payload for creating an enrollment.
 *
 * @param {object} data - Enrollment creation payload
 * @param {boolean} [isEmployee=true] - Whether the caller is an employee self-enrolling
 * @throws {AppError} When validation fails
 */
function validateCreateEnrollment(data, isEmployee = true) {
  const errors = [];
  const { course, employee, progressPercentage, completedLessons } = data || {};

  // Reject tampering attempts with calculated progress fields
  if (progressPercentage !== undefined) {
    errors.push('Cannot directly set progress percentage');
  }
  if (completedLessons !== undefined) {
    errors.push('Cannot directly set completed lessons');
  }

  // Course validation
  if (!course) {
    errors.push('Course ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(course)) {
    errors.push('Invalid Course ID format');
  }

  // Employee validation
  if (isEmployee) {
    if (employee !== undefined) {
      errors.push('Employees cannot specify an employee ID for self-enrollment');
    }
  } else {
    // Admin must provide employee ID
    if (!employee) {
      errors.push('Employee ID is required for administrative enrollment');
    } else if (!mongoose.Types.ObjectId.isValid(employee)) {
      errors.push('Invalid Employee ID format');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating an enrollment's status.
 *
 * @param {object} data - Enrollment status update payload
 * @throws {AppError} When validation fails
 */
function validateUpdateEnrollmentStatus(data) {
  const errors = [];
  const { status } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  if (!status) {
    errors.push('Status is required');
  } else if (!ENROLLMENT_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${ENROLLMENT_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating lesson progress.
 *
 * @param {object} data - Progress update payload
 * @throws {AppError} When validation fails
 */
function validateProgressUpdate(data) {
  const errors = [];
  const {
    lessonId,
    completed: rawCompleted,
    isCompleted: rawIsCompleted,
    moduleId,
    courseId,
    progressPercentage,
    completedLessons
  } = data || {};

  const completed = rawCompleted !== undefined ? rawCompleted : rawIsCompleted;

  // Reject direct tampering with progress
  if (progressPercentage !== undefined || completedLessons !== undefined) {
    throw new AppError('Direct submission of progress percentage or completed lessons is not allowed', 400);
  }

  if (!lessonId) {
    errors.push('Lesson ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    errors.push('Invalid Lesson ID format');
  }

  if (completed === undefined || completed === null) {
    errors.push('Completed status is required');
  } else if (typeof completed !== 'boolean') {
    errors.push('Completed status must be a boolean');
  }

  if (moduleId !== undefined && moduleId !== null && !mongoose.Types.ObjectId.isValid(moduleId)) {
    errors.push('Invalid Module ID format');
  }

  if (courseId !== undefined && courseId !== null && !mongoose.Types.ObjectId.isValid(courseId)) {
    errors.push('Invalid Course ID format');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

module.exports = {
  validateCreateEnrollment,
  validateUpdateEnrollmentStatus,
  validateProgressUpdate,
  validateObjectId
};
