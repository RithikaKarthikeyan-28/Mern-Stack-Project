const skillGapAnalysisService = require('../services/skillGapAnalysis.service');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * Controller for employee self-analysis against a Job Role.
 * Employee only. Resolves employee strictly from authenticated user context.
 */
async function getMySkillGap(req, res, next) {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const employee = await Employee.findOne({ user: userId, isActive: true });
    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    const result = await skillGapAnalysisService.analyzeEmployeeSkillGap(
      employee._id,
      req.params.jobRoleId,
      req.query
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Skill gap analysis generated successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for administrator analysis of an arbitrary employee against a Job Role.
 * Admin only.
 */
async function getEmployeeSkillGap(req, res, next) {
  try {
    const result = await skillGapAnalysisService.analyzeEmployeeSkillGap(
      req.params.employeeId,
      req.params.jobRoleId,
      req.query
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Skill gap analysis generated successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMySkillGap,
  getEmployeeSkillGap
};
