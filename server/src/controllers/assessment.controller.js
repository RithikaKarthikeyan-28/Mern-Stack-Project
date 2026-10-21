const assessmentService = require('../services/assessment.service');
const { sendSuccess } = require('../utils/response');

async function createAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.createAssessment(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Assessment created successfully',
      data: { assessment }
    });
  } catch (err) {
    next(err);
  }
}

async function getAssessments(req, res, next) {
  try {
    const assessments = await assessmentService.getAssessments(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessments retrieved successfully',
      data: { assessments }
    });
  } catch (err) {
    next(err);
  }
}

async function getAssessmentById(req, res, next) {
  try {
    const assessment = await assessmentService.getAssessmentById(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment retrieved successfully',
      data: { assessment }
    });
  } catch (err) {
    next(err);
  }
}

async function updateAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.updateAssessment(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment updated successfully',
      data: { assessment }
    });
  } catch (err) {
    next(err);
  }
}

async function publishAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.publishAssessment(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment published successfully',
      data: { assessment }
    });
  } catch (err) {
    next(err);
  }
}

async function archiveAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.archiveAssessment(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment archived successfully',
      data: { assessment }
    });
  } catch (err) {
    next(err);
  }
}

async function deleteAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.deleteAssessment(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment deleted successfully',
      data: { assessment }
    });
  } catch (err) {
    next(err);
  }
}

async function getAttemptData(req, res, next) {
  try {
    const data = await assessmentService.getAttemptData(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment attempt data retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getCourseAssessmentStatus(req, res, next) {
  try {
    const data = await assessmentService.getCourseAssessmentStatus(req.params.courseId, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course assessment status retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  deleteAssessment,
  getAttemptData,
  getCourseAssessmentStatus
};

