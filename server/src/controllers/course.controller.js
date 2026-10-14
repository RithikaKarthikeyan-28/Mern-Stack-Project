const courseService = require('../services/course.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle course creation.
 */
async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving courses list.
 */
async function getCourses(req, res, next) {
  try {
    const courses = await courseService.getCourses(req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Courses retrieved successfully',
      data: { courses }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving a single course by ID.
 */
async function getCourseById(req, res, next) {
  try {
    const course = await courseService.getCourseById(req.params.id, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course retrieved successfully',
      data: { course }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle updating a course.
 */
async function updateCourse(req, res, next) {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle soft-deleting a course.
 */
async function deleteCourse(req, res, next) {
  try {
    const course = await courseService.deleteCourse(req.params.id, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course deleted successfully',
      data: { course }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
