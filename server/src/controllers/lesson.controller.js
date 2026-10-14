const lessonService = require('../services/lesson.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle lesson creation.
 */
async function createLesson(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.params.moduleId && !payload.module) {
      payload.module = req.params.moduleId;
    }

    const lesson = await lessonService.createLesson(payload, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Lesson created successfully',
      data: { lesson }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving lessons for a module.
 */
async function getLessons(req, res, next) {
  try {
    const moduleId = req.params.moduleId || req.query.moduleId;
    const lessons = await lessonService.getLessons(moduleId, req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lessons retrieved successfully',
      data: { lessons }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving a single lesson by ID.
 */
async function getLessonById(req, res, next) {
  try {
    const lesson = await lessonService.getLessonById(req.params.id, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lesson retrieved successfully',
      data: { lesson }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle updating a lesson.
 */
async function updateLesson(req, res, next) {
  try {
    const lesson = await lessonService.updateLesson(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lesson updated successfully',
      data: { lesson }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle soft-deleting a lesson.
 */
async function deleteLesson(req, res, next) {
  try {
    const lesson = await lessonService.deleteLesson(req.params.id, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lesson deleted successfully',
      data: { lesson }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson
};
