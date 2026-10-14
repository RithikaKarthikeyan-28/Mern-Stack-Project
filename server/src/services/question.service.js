const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const Employee = require('../models/Employee');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/AppError');
const {
  validateCreateQuestion,
  validateUpdateQuestion,
  validateObjectId
} = require('../validators/assessment.validator');

/**
 * Creates a new Question under an Assessment.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {object} data - Question payload
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Created question document
 */
async function createQuestion(assessmentId, data, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');
  const payload = { ...data, assessment: assessmentId };
  validateCreateQuestion(payload);

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.isActive) {
    throw new AppError('Assessment not found or inactive', 404);
  }
  if (assessment.status === 'archived') {
    throw new AppError('Cannot add questions to an archived assessment', 400);
  }

  // Trainer ownership check
  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  if (currentUser.role === 'trainer') {
    if (course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only create questions for your own assessments.', 403);
    }
  }

  // Order conflict check
  const existingOrder = await Question.findOne({
    assessment: assessmentId,
    order: payload.order,
    isActive: true
  });
  if (existingOrder) {
    throw new AppError('A question with this order already exists in the assessment', 409);
  }

  const question = await Question.create({
    assessment: assessment._id,
    questionText: payload.questionText.trim(),
    questionType: payload.questionType || 'single_choice',
    options: payload.options.map((opt) => ({
      key: opt.key.trim(),
      text: opt.text.trim()
    })),
    correctAnswers: payload.correctAnswers,
    marks: payload.marks,
    order: payload.order,
    isActive: true
  });

  return question;
}

/**
 * Retrieves questions for an assessment with security stripping for employees.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<Array>} List of questions (sanitized for employees)
 */
async function getQuestionsByAssessment(assessmentId, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'trainer') {
    if (course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only view questions for your own assessments.', 403);
    }
  } else if (currentUser.role === 'employee') {
    if (!assessment.isActive || assessment.status !== 'published' || !course.isActive || course.status !== 'published') {
      throw new AppError('Assessment not found', 404);
    }

    const employee = await Employee.findOne({ user: currentUserId });
    if (!employee || !employee.isActive) {
      throw new AppError('Active employee profile required to view questions', 403);
    }

    const enrollment = await Enrollment.findOne({
      employee: employee._id,
      course: course._id,
      isActive: true,
      status: { $ne: 'dropped' }
    });

    if (!enrollment) {
      throw new AppError('You must have an active enrollment in this course to view assessment questions', 403);
    }
  }

  const query = { assessment: assessmentId };
  if (currentUser.role === 'employee') {
    query.isActive = true;
  }

  const questions = await Question.find(query).sort({ order: 1 });

  // Exclude correctAnswers for employees
  if (currentUser.role === 'employee') {
    return questions.map((q) => {
      const obj = q.toJSON();
      delete obj.correctAnswers;
      return obj;
    });
  }

  return questions;
}

/**
 * Retrieves a single question by ID.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {string} questionId - Question ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Question document (sanitized for employees)
 */
async function getQuestionById(assessmentId, questionId, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');
  validateObjectId(questionId, 'Question ID');

  const question = await Question.findById(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  if (question.assessment.toString() !== assessmentId.toString()) {
    throw new AppError('Question does not belong to the specified assessment', 404);
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'trainer') {
    if (course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only view questions for your own assessments.', 403);
    }
  } else if (currentUser.role === 'employee') {
    if (!question.isActive || !assessment.isActive || assessment.status !== 'published' || !course.isActive || course.status !== 'published') {
      throw new AppError('Question not found', 404);
    }

    const employee = await Employee.findOne({ user: currentUserId });
    if (!employee || !employee.isActive) {
      throw new AppError('Active employee profile required to view question', 403);
    }

    const enrollment = await Enrollment.findOne({
      employee: employee._id,
      course: course._id,
      isActive: true,
      status: { $ne: 'dropped' }
    });

    if (!enrollment) {
      throw new AppError('You must have an active enrollment in this course to view assessment questions', 403);
    }
  }

  if (currentUser.role === 'employee') {
    const obj = question.toJSON();
    delete obj.correctAnswers;
    return obj;
  }

  return question;
}

/**
 * Updates an existing question.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {string} questionId - Question ID
 * @param {object} data - Update payload
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Updated question document
 */
async function updateQuestion(assessmentId, questionId, data, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');
  validateObjectId(questionId, 'Question ID');
  validateUpdateQuestion(data);

  const question = await Question.findById(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  if (question.assessment.toString() !== assessmentId.toString()) {
    throw new AppError('Question does not belong to the specified assessment', 404);
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.isActive) {
    throw new AppError('Assessment not found or inactive', 404);
  }
  if (assessment.status === 'archived') {
    throw new AppError('Cannot modify questions in an archived assessment', 400);
  }

  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  if (currentUser.role === 'trainer') {
    if (course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only update questions for your own assessments.', 403);
    }
  }

  // Check order conflict if changing order
  if (data.order !== undefined && data.order !== question.order) {
    const existingOrder = await Question.findOne({
      _id: { $ne: questionId },
      assessment: assessmentId,
      order: data.order,
      isActive: true
    });
    if (existingOrder) {
      throw new AppError('A question with this order already exists in the assessment', 409);
    }
    question.order = data.order;
  }

  if (data.questionText !== undefined) question.questionText = data.questionText.trim();
  if (data.questionType !== undefined) question.questionType = data.questionType;
  if (data.options !== undefined) {
    question.options = data.options.map((opt) => ({
      key: opt.key.trim(),
      text: opt.text.trim()
    }));
  }
  if (data.correctAnswers !== undefined) question.correctAnswers = data.correctAnswers;
  if (data.marks !== undefined) question.marks = data.marks;
  if (data.isActive !== undefined) question.isActive = data.isActive;

  // Consistency validation for updated options and answers
  const effectiveOptions = question.options;
  const effectiveAnswers = question.correctAnswers;
  const effectiveType = question.questionType;

  const keysSet = new Set(effectiveOptions.map((o) => o.key));
  if (keysSet.size !== effectiveOptions.length) {
    throw new AppError('Option keys must be unique within a question', 400);
  }
  effectiveAnswers.forEach((ans) => {
    if (!keysSet.has(ans)) {
      throw new AppError(`Correct answer "${ans}" does not match any valid option key`, 400);
    }
  });

  if (effectiveType === 'single_choice' && effectiveAnswers.length !== 1) {
    throw new AppError('Single choice questions must have exactly one correct answer', 400);
  }
  if (effectiveType === 'multiple_choice' && effectiveAnswers.length < 1) {
    throw new AppError('Multiple choice questions must have at least one correct answer', 400);
  }

  await question.save();
  return question;
}

/**
 * Soft-deletes a question.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {string} questionId - Question ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Soft-deleted question document
 */
async function deleteQuestion(assessmentId, questionId, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');
  validateObjectId(questionId, 'Question ID');

  const question = await Question.findById(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  if (question.assessment.toString() !== assessmentId.toString()) {
    throw new AppError('Question does not belong to the specified assessment', 404);
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  if (currentUser.role === 'trainer') {
    if (course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only delete questions for your own assessments.', 403);
    }
  }

  question.isActive = false;
  await question.save();
  return question;
}

module.exports = {
  createQuestion,
  getQuestionsByAssessment,
  getQuestionById,
  updateQuestion,
  deleteQuestion
};
