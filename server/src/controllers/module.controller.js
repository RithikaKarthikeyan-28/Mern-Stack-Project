const moduleService = require('../services/module.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle module creation.
 */
async function createModule(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.params.courseId && !payload.course) {
      payload.course = req.params.courseId;
    }

    const moduleDoc = await moduleService.createModule(payload, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Module created successfully',
      data: { module: moduleDoc }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving modules for a course.
 */
async function getModules(req, res, next) {
  try {
    const courseId = req.params.courseId || req.query.courseId;
    const modules = await moduleService.getModules(courseId, req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Modules retrieved successfully',
      data: { modules }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle retrieving a single module by ID.
 */
async function getModuleById(req, res, next) {
  try {
    const moduleDoc = await moduleService.getModuleById(req.params.id, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Module retrieved successfully',
      data: { module: moduleDoc }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle updating a module.
 */
async function updateModule(req, res, next) {
  try {
    const moduleDoc = await moduleService.updateModule(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Module updated successfully',
      data: { module: moduleDoc }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle soft-deleting a module.
 */
async function deleteModule(req, res, next) {
  try {
    const moduleDoc = await moduleService.deleteModule(req.params.id, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Module deleted successfully',
      data: { module: moduleDoc }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule
};
