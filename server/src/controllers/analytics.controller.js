const analyticsService = require('../services/analytics.service');
const {
  validateOverviewQuery,
  validateLearningQuery,
  validateAssessmentQuery,
  validateComplianceQuery,
  validateCertificationQuery,
  validateEmployeeQuery,
  validateDepartmentQuery,
  validateCourseQuery
} = require('../validators/analytics.validator');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/analytics/overview
 * Executive overview across all domains.
 */
async function getOverview(req, res, next) {
  try {
    validateOverviewQuery(req.query);
    const data = await analyticsService.getOverviewAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Overview analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/learning
 * Learning and enrollment engagement metrics.
 */
async function getLearning(req, res, next) {
  try {
    validateLearningQuery(req.query);
    const data = await analyticsService.getLearningAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Learning analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/assessments
 * Assessment performance, scores, and pass rates.
 */
async function getAssessments(req, res, next) {
  try {
    validateAssessmentQuery(req.query);
    const data = await analyticsService.getAssessmentAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assessment analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/compliance
 * Compliance status distributions and department breakdowns.
 */
async function getCompliance(req, res, next) {
  try {
    validateComplianceQuery(req.query);
    const data = await analyticsService.getComplianceAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Compliance analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/certifications
 * Certificate lifecycle, active, expired, revoked, and renewals.
 */
async function getCertifications(req, res, next) {
  try {
    validateCertificationQuery(req.query);
    const data = await analyticsService.getCertificationAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certification analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/employees
 * Employee learning, skill distributions, and active learners.
 */
async function getEmployees(req, res, next) {
  try {
    validateEmployeeQuery(req.query);
    const data = await analyticsService.getEmployeeAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/departments
 * Department-by-department aggregated performance metrics.
 */
async function getDepartments(req, res, next) {
  try {
    validateDepartmentQuery(req.query);
    const data = await analyticsService.getDepartmentAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/courses
 * Course-by-course performance, engagement, and assessment metrics.
 */
async function getCourses(req, res, next) {
  try {
    validateCourseQuery(req.query);
    const data = await analyticsService.getCourseAnalytics(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course analytics retrieved successfully',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getLearning,
  getAssessments,
  getCompliance,
  getCertifications,
  getEmployees,
  getDepartments,
  getCourses
};
