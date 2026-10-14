const questionService = require('../services/question.service');
const { sendSuccess } = require('../utils/response');

async function createQuestion(req, res, next) {
  try {
    const question = await questionService.createQuestion(
      req.params.assessmentId,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Question created successfully',
      data: { question }
    });
  } catch (err) {
    next(err);
  }
}

async function getQuestionsByAssessment(req, res, next) {
  try {
    const questions = await questionService.getQuestionsByAssessment(
      req.params.assessmentId,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Questions retrieved successfully',
      data: { questions }
    });
  } catch (err) {
    next(err);
  }
}

async function getQuestionById(req, res, next) {
  try {
    const question = await questionService.getQuestionById(
      req.params.assessmentId,
      req.params.questionId,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Question retrieved successfully',
      data: { question }
    });
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const question = await questionService.updateQuestion(
      req.params.assessmentId,
      req.params.questionId,
      req.body,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Question updated successfully',
      data: { question }
    });
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const question = await questionService.deleteQuestion(
      req.params.assessmentId,
      req.params.questionId,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Question deleted successfully',
      data: { question }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createQuestion,
  getQuestionsByAssessment,
  getQuestionById,
  updateQuestion,
  deleteQuestion
};
