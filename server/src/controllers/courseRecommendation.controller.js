const courseRecommendationService = require('../services/courseRecommendation.service');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * Controller for employee self-recommendations based on skill gaps.
 * Employee only. Resolves employee strictly from authenticated user context.
 */
async function getMyRecommendations(req, res, next) {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const employee = await Employee.findOne({ user: userId, isActive: true });
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const result = await courseRecommendationService.getCourseRecommendations(
      employee._id,
      req.params.jobRoleId,
      req.query
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course recommendations generated successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for administrator generation of recommendations for an arbitrary employee.
 * Admin only.
 */
async function getEmployeeRecommendations(req, res, next) {
  try {
    const result = await courseRecommendationService.getCourseRecommendations(
      req.params.employeeId,
      req.params.jobRoleId,
      req.query
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Course recommendations generated successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyRecommendations,
  getEmployeeRecommendations
};
