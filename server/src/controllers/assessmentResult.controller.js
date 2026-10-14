const resultService = require('../services/assessmentResult.service');
const { sendSuccess } = require('../utils/response');

/**
 * Retrieves the evaluated result for an attempt.
 */
async function getAttemptResult(req, res, next) {
  try {
    const result = await resultService.getAttemptResult(req.params.attemptId, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment attempt result retrieved successfully',
      data: { result }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves the authenticated employee's assessment history.
 */
async function getEmployeeAssessmentHistory(req, res, next) {
  try {
    const history = await resultService.getEmployeeAssessmentHistory(req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee assessment history retrieved successfully',
      data: { history }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves safe performance statistics for an assessment.
 */
async function getAssessmentPerformance(req, res, next) {
  try {
    const performance = await resultService.getAssessmentPerformance(
      req.params.assessmentId,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment performance statistics retrieved successfully',
      data: { performance }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAttemptResult,
  getEmployeeAssessmentHistory,
  getAssessmentPerformance
};
