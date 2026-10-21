const AssessmentAttempt = require('../models/AssessmentAttempt');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Employee = require('../models/Employee');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const AppError = require('../utils/AppError');
const assessmentResultService = require('./assessmentResult.service');
const {
  validateSubmitAttempt,
  validateObjectId
} = require('../validators/assessment.validator');

const POPULATE_OPTIONS = [
  {
    path: 'assessment',
    select: 'title passingPercentage timeLimitMinutes maxAttempts status isActive course'
  },
  {
    path: 'employee',
    select: 'employeeId designation user'
  },
  {
    path: 'enrollment',
    select: 'status progressPercentage isActive'
  }
];

/**
 * Starts a new assessment attempt for the authenticated employee.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Created attempt document
 */
async function startAttempt(assessmentId, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');

  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can start assessment attempts', 403);
  }

  const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
  if (!employee || !employee.isActive) {
    throw new AppError('Active employee profile required to start an assessment attempt', 403);
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment not found or inaccessible', 404);
  }

  const course = await Course.findById(assessment.course);
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course not found or inaccessible', 404);
  }

  if (assessment.module) {
    const moduleDoc = await Module.findById(assessment.module);
    if (!moduleDoc || !moduleDoc.isActive || moduleDoc.course.toString() !== course._id.toString()) {
      throw new AppError('Assessment module not found or inactive', 404);
    }
  }

  // Verify active non-dropped enrollment
  const enrollment = await Enrollment.findOne({
    employee: employee._id,
    course: course._id,
    isActive: true,
    status: { $ne: 'dropped' }
  });

  if (!enrollment) {
    throw new AppError('You must have an active enrollment in this course to start an attempt', 403);
  }

  // Enforce course completion prerequisite if required by assessment
  if (assessment.requiresCourseCompletion) {
    const activeModules = await Module.find({ course: course._id, isActive: true }).select('_id');
    const totalActiveLessons = await Lesson.countDocuments({
      module: { $in: activeModules.map((m) => m._id) },
      isActive: true
    });

    if (totalActiveLessons === 0) {
      throw new AppError('Assessment is not available because the course has no active lessons', 400);
    }

    const completedCount = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0;
    if (
      enrollment.progressPercentage < 100 ||
      enrollment.status !== 'completed' ||
      completedCount < totalActiveLessons
    ) {
      throw new AppError('You must complete all course lessons before starting the assessment', 403);
    }
  }

  // Check maxAttempts policy
  if (assessment.maxAttempts) {
    const nonAbandonedAttempts = await AssessmentAttempt.countDocuments({
      employee: employee._id,
      assessment: assessment._id,
      status: { $ne: 'abandoned' }
    });

    if (nonAbandonedAttempts >= assessment.maxAttempts) {
      throw new AppError('Maximum attempt limit reached for this assessment', 400);
    }
  }

  // Derive attemptNumber server-side
  const totalAttempts = await AssessmentAttempt.countDocuments({
    employee: employee._id,
    assessment: assessment._id
  });
  const attemptNumber = totalAttempts + 1;

  const startedAt = new Date();
  let expiresAt = null;
  if (assessment.timeLimitMinutes) {
    expiresAt = new Date(startedAt.getTime() + assessment.timeLimitMinutes * 60 * 1000);
  }

  const attempt = await AssessmentAttempt.create({
    employee: employee._id,
    assessment: assessment._id,
    enrollment: enrollment._id,
    attemptNumber,
    status: 'in_progress',
    answers: [],
    startedAt,
    expiresAt
  });

  return await AssessmentAttempt.findById(attempt._id).populate(POPULATE_OPTIONS);
}

/**
 * Submits an in-progress assessment attempt with validated answers.
 *
 * @param {string} attemptId - Attempt ID
 * @param {object} data - Submission payload { answers }
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Submitted attempt document
 */
async function submitAttempt(attemptId, data, currentUser) {
  validateObjectId(attemptId, 'Attempt ID');
  validateSubmitAttempt(data);

  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can submit assessment attempts', 403);
  }

  const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
  if (!employee || attempt.employee.toString() !== employee._id.toString()) {
    throw new AppError('Access denied. You can only submit your own attempt.', 403);
  }

  if (attempt.status !== 'in_progress') {
    throw new AppError('This attempt has already been submitted or completed', 400);
  }

  const assessment = await Assessment.findById(attempt.assessment);
  if (!assessment || !assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment is no longer accessible', 400);
  }

  // Retrieve active questions belonging to the assessment
  const activeQuestions = await Question.find({ assessment: assessment._id, isActive: true });
  const questionMap = new Map(activeQuestions.map((q) => [q._id.toString(), q]));

  const validatedAnswers = [];
  for (const ans of data.answers) {
    const qDoc = questionMap.get(ans.question.toString());
    if (!qDoc) {
      throw new AppError('Question does not belong to this assessment or is inactive', 400);
    }

    const validOptionKeys = new Set(qDoc.options.map((opt) => opt.key));
    for (const sel of ans.selectedAnswers) {
      if (!validOptionKeys.has(sel)) {
        throw new AppError('Selected answer is not a valid option for the question', 400);
      }
    }

    validatedAnswers.push({
      question: qDoc._id,
      selectedAnswers: ans.selectedAnswers
    });
  }

  attempt.answers = validatedAnswers;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date();

  await attempt.save();

  // Automatically evaluate attempt server-side upon submission
  return await assessmentResultService.evaluateAttempt(attempt._id);
}

/**
 * Retrieves an attempt by ID with role-based authorization.
 *
 * @param {string} attemptId - Attempt ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Populated attempt document
 */
async function getAttemptById(attemptId, currentUser) {
  validateObjectId(attemptId, 'Attempt ID');

  const attempt = await AssessmentAttempt.findById(attemptId).populate(POPULATE_OPTIONS);
  if (!attempt) {
    throw new AppError('Assessment attempt not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'employee') {
    const employee = await Employee.findOne({ user: currentUserId });
    if (!employee || attempt.employee._id.toString() !== employee._id.toString()) {
      throw new AppError('Assessment attempt not found', 404);
    }
  } else if (currentUser.role === 'trainer') {
    const assessment = await Assessment.findById(attempt.assessment);
    if (assessment) {
      const course = await Course.findById(assessment.course);
      if (!course || course.trainer.toString() !== currentUserId) {
        throw new AppError('Access denied. You can only view attempts for your own courses.', 403);
      }
    }
  }

  return attempt;
}

/**
 * Saves draft answers in real-time for an in-progress attempt.
 *
 * @param {string} attemptId - Attempt ID
 * @param {object} data - Draft payload { answers }
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Updated attempt document
 */
async function saveDraftAnswers(attemptId, data, currentUser) {
  validateObjectId(attemptId, 'Attempt ID');
  validateSubmitAttempt(data);

  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can save assessment draft answers', 403);
  }

  const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
  if (!employee || attempt.employee.toString() !== employee._id.toString()) {
    throw new AppError('Access denied. You can only update your own attempt.', 403);
  }

  if (attempt.status !== 'in_progress') {
    throw new AppError('Cannot update answers for an attempt that is not in progress', 400);
  }

  const assessment = await Assessment.findById(attempt.assessment);
  if (!assessment || !assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment is no longer accessible', 400);
  }

  const activeQuestions = await Question.find({ assessment: assessment._id, isActive: true });
  const questionMap = new Map(activeQuestions.map((q) => [q._id.toString(), q]));

  const validatedAnswers = [];
  for (const ans of data.answers) {
    const qDoc = questionMap.get(ans.question.toString());
    if (!qDoc) {
      throw new AppError('Question does not belong to this assessment or is inactive', 400);
    }

    const validOptionKeys = new Set(qDoc.options.map((opt) => opt.key));
    for (const sel of ans.selectedAnswers) {
      if (!validOptionKeys.has(sel)) {
        throw new AppError('Selected answer is not a valid option for the question', 400);
      }
    }

    validatedAnswers.push({
      question: qDoc._id,
      selectedAnswers: ans.selectedAnswers
    });
  }

  attempt.answers = validatedAnswers;
  await attempt.save();

  return await AssessmentAttempt.findById(attempt._id).populate(POPULATE_OPTIONS);
}

module.exports = {
  startAttempt,
  submitAttempt,
  getAttemptById,
  saveDraftAnswers
};
