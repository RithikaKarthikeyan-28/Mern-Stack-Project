const enrollmentService = require('../services/enrollment.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller for creating an enrollment (self-enrollment by employee or administrative enrollment).
 */
async function createEnrollment(req, res, next) {
  try {
    const courseId = req.body.course;
    const employeeId = req.body.employee;

    const enrollment = await enrollmentService.enrollEmployee(
      { courseId, employeeId },
      req.user
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Enrolled successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller specifically for employee self-enrollment.
 */
async function selfEnroll(req, res, next) {
  return createEnrollment(req, res, next);
}

/**
 * Controller specifically for admin enrollment creation.
 */
async function adminCreateEnrollment(req, res, next) {
  return createEnrollment(req, res, next);
}

/**
 * Controller to retrieve enrollments of the authenticated employee.
 */
async function getMyEnrollments(req, res, next) {
  try {
    const enrollments = await enrollmentService.getMyEnrollments(req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Enrollments retrieved successfully',
      data: { enrollments }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve the authenticated employee's enrollment for a course.
 */
async function getCourseEnrollment(req, res, next) {
  try {
    const enrollment = await enrollmentService.getCourseEnrollment(
      req.params.courseId,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course enrollment retrieved successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve a single enrollment by ID.
 */
async function getEnrollmentById(req, res, next) {
  try {
    const enrollment = await enrollmentService.getEnrollmentById(
      req.params.id,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Enrollment retrieved successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve all enrollments with filtering (admin or trainer).
 */
async function getAllEnrollments(req, res, next) {
  try {
    const enrollments = await enrollmentService.getAllEnrollments(
      req.query,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Enrollments retrieved successfully',
      data: { enrollments }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update an enrollment's status (admin-only).
 */
async function updateEnrollmentStatus(req, res, next) {
  try {
    const enrollment = await enrollmentService.updateEnrollmentStatus(
      req.params.id,
      req.body.status
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Enrollment status updated successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to update lesson progress for an enrollment.
 */
async function updateLessonProgress(req, res, next) {
  try {
    const enrollment = await enrollmentService.updateLessonProgress(
      req.params.id,
      req.body,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lesson progress updated successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to drop an enrollment.
 */
async function dropEnrollment(req, res, next) {
  try {
    const enrollment = await enrollmentService.dropEnrollment(
      req.params.id,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Enrollment dropped successfully',
      data: { enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to assign course to an entire department.
 * Admin and Trainer.
 */
async function assignDepartment(req, res, next) {
  try {
    const result = await enrollmentService.assignCourseToDepartment(
      {
        courseId: req.body.course || req.body.courseId,
        departmentId: req.body.department || req.body.departmentId,
        isMandatory: req.body.isMandatory !== undefined ? Boolean(req.body.isMandatory) : true
      },
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course successfully assigned to department',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEnrollment,
  assignDepartment,
  selfEnroll,
  adminCreateEnrollment,
  getMyEnrollments,
  getCourseEnrollment,
  getEnrollmentById,
  getAllEnrollments,
  updateEnrollmentStatus,
  updateLessonProgress,
  dropEnrollment
};
