const attemptService = require('../services/assessmentAttempt.service');
const { sendSuccess } = require('../utils/response');

async function startAttempt(req, res, next) {
  try {
    const attempt = await attemptService.startAttempt(req.params.assessmentId, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Assessment attempt started successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
}

async function submitAttempt(req, res, next) {
  try {
    const attempt = await attemptService.submitAttempt(
      req.params.attemptId,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment attempt submitted successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
}

async function getAttemptById(req, res, next) {
  try {
    const attempt = await attemptService.getAttemptById(req.params.attemptId, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment attempt retrieved successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
}

async function saveDraftAnswers(req, res, next) {
  try {
    const attempt = await attemptService.saveDraftAnswers(
      req.params.attemptId,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Draft answers saved successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startAttempt,
  submitAttempt,
  getAttemptById,
  saveDraftAnswers
};
