const AssessmentAttempt = require('../models/AssessmentAttempt');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const { validateObjectId } = require('../validators/assessmentResult.validator');

const POPULATE_OPTIONS = [
  {
    path: 'assessment',
    select: 'title passingPercentage timeLimitMinutes maxAttempts status isActive course',
    populate: {
      path: 'course',
      select: 'title trainer'
    }
  },
  {
    path: 'employee',
    select: 'employeeId designation user'
  },
  {
    path: 'enrollment',
    select: 'status progressPercentage isActive'
  },
  {
    path: 'certificate',
    select: 'certificateNumber issuedAt expiresAt status emailStatus emailSentAt score'
  }
];

/**
 * Checks whether the submitted selected answers for a question are correct.
 *
 * @param {object} question - Question document with questionType and correctAnswers
 * @param {string[]} selectedAnswers - Array of option keys submitted by employee
 * @returns {boolean} True if answer strictly matches correct answer rules
 */
function isAnswerCorrect(question, selectedAnswers) {
  if (!selectedAnswers || !Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
    return false;
  }
  const correctAnswers = question.correctAnswers || [];
  if (correctAnswers.length === 0) {
    return false;
  }

  if (question.questionType === 'single_choice') {
    return selectedAnswers.length === 1 && selectedAnswers[0] === correctAnswers[0];
  }

  if (question.questionType === 'multiple_choice') {
    const selSet = new Set(selectedAnswers);
    const corSet = new Set(correctAnswers);
    if (selSet.size !== corSet.size) {
      return false;
    }
    for (const item of selSet) {
      if (!corSet.has(item)) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Evaluates a submitted assessment attempt server-side.
 * Idempotent: If already evaluated and not forced, returns the existing persisted result.
 *
 * @param {string} attemptId - ID of the attempt to evaluate
 * @param {object} [options={}] - Options, e.g. { force: boolean }
 * @returns {Promise<object>} Evaluated attempt document
 */
async function evaluateAttempt(attemptId, options = {}) {
  validateObjectId(attemptId, 'Attempt ID');

  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Assessment attempt not found', 404);
  }

  if (attempt.status !== 'submitted') {
    throw new AppError('Only submitted assessment attempts can be evaluated', 400);
  }

  // Idempotency: return existing evaluated result unless forced
  if (attempt.evaluatedAt && attempt.result && !options.force) {
    return await AssessmentAttempt.findById(attempt._id).populate(POPULATE_OPTIONS);
  }

  const assessment = await Assessment.findById(attempt.assessment);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Load all active questions belonging to the assessment
  const activeQuestions = await Question.find({
    assessment: assessment._id,
    isActive: true
  }).sort({ order: 1 });

  // totalMarks is the sum of marks from all active questions
  const totalMarks = activeQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

  // Map active questions by string ID
  const questionMap = new Map(activeQuestions.map((q) => [q._id.toString(), q]));

  let obtainedMarks = 0;
  for (const ans of attempt.answers) {
    const qDoc = questionMap.get(ans.question.toString());
    if (qDoc && isAnswerCorrect(qDoc, ans.selectedAnswers)) {
      obtainedMarks += qDoc.marks || 0;
    }
  }

  let percentage = 0;
  if (totalMarks > 0) {
    percentage = Math.round(((obtainedMarks / totalMarks) * 100 + Number.EPSILON) * 100) / 100;
  }

  const passingPercentage =
    typeof assessment.passingPercentage === 'number' ? assessment.passingPercentage : 60;
  const result = percentage >= passingPercentage ? 'passed' : 'failed';

  attempt.totalMarks = totalMarks;
  attempt.obtainedMarks = obtainedMarks;
  attempt.percentage = percentage;
  attempt.result = result;
  attempt.evaluatedAt = new Date();

  // If attempt passed and is associated with a course, automatically issue certificate with score and audit links
  if (result === 'passed' && assessment.course) {
    try {
      const certificateService = require('./certificate.service');
      const certResult = await certificateService.issueCertificateInternal({
        employeeId: attempt.employee,
        courseId: assessment.course,
        enrollmentId: attempt.enrollment,
        assessmentId: assessment._id,
        attemptId: attempt._id,
        score: percentage
      });
      if (certResult?.certificate) {
        attempt.certificate = certResult.certificate._id || certResult.certificate.id;
      }
    } catch (err) {
      console.error('Failed to auto-issue certificate for passing attempt:', err.message);
    }
  }

  await attempt.save();
  return await AssessmentAttempt.findById(attempt._id).populate(POPULATE_OPTIONS);
}

/**
 * Retrieves the evaluated result of an attempt with strict role authorization.
 *
 * @param {string} attemptId - Attempt ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Safe attempt result
 */
async function getAttemptResult(attemptId, currentUser) {
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
    const course = await Course.findById(attempt.assessment.course);
    if (!course || course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only view results for your own courses.', 403);
    }
  }

  if (attempt.status !== 'submitted') {
    throw new AppError('Attempt has not been submitted or evaluated yet', 400);
  }

  // Ensure attempt is evaluated
  if (!attempt.evaluatedAt || !attempt.result) {
    return await evaluateAttempt(attempt._id);
  }

  if (attempt.result === 'passed' && attempt.assessment?.course && !attempt.certificate) {
    try {
      const Certificate = require('../models/Certificate');
      const courseId = attempt.assessment.course._id || attempt.assessment.course;
      const employeeId = attempt.employee._id || attempt.employee;
      const cert = await Certificate.findOne({
        employee: employeeId,
        course: courseId,
        status: 'active'
      });
      if (cert) {
        attempt.certificate = cert;
        await AssessmentAttempt.findByIdAndUpdate(attempt._id, { certificate: cert._id });
      }
    } catch (err) {
      // Non-blocking
    }
  }

  return attempt;
}

/**
 * Retrieves the authenticated employee's assessment history.
 *
 * @param {object} currentUser - Authenticated employee user
 * @returns {Promise<Array>} List of historical assessment results
 */
async function getEmployeeAssessmentHistory(currentUser) {
  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can access their assessment performance history', 403);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const employee = await Employee.findOne({ user: currentUserId });
  if (!employee || !employee.isActive) {
    throw new AppError('Active employee profile required', 403);
  }

  const attempts = await AssessmentAttempt.find({
    employee: employee._id,
    status: 'submitted'
  })
    .populate({
      path: 'assessment',
      select: 'title course passingPercentage',
      populate: {
        path: 'course',
        select: 'title'
      }
    })
    .populate('certificate', 'certificateNumber status')
    .sort({ submittedAt: -1, createdAt: -1 });

  return attempts.map((att) => {
    const assessment = att.assessment || {};
    const course = assessment.course || {};

    return {
      id: att._id.toString(),
      attemptId: att._id.toString(),
      assessmentId: assessment._id ? assessment._id.toString() : '',
      assessmentTitle: assessment.title || '',
      courseId: course._id ? course._id.toString() : '',
      courseTitle: course.title || '',
      attemptNumber: att.attemptNumber,
      submittedAt: att.submittedAt,
      totalMarks: att.totalMarks,
      obtainedMarks: att.obtainedMarks,
      percentage: att.percentage,
      result: att.result,
      evaluatedAt: att.evaluatedAt,
      certificateId: att.certificate?._id ? att.certificate._id.toString() : (att.certificate ? att.certificate.toString() : null),
      certificateNumber: att.certificate?.certificateNumber || null
    };
  });
}

/**
 * Computes safe performance statistics for an assessment.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Assessment performance summary
 */
async function getAssessmentPerformance(assessmentId, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');

  if (currentUser.role === 'employee') {
    throw new AppError('Access denied. Employees cannot access assessment performance analytics.', 403);
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
      throw new AppError('Access denied. You can only view performance for your own courses.', 403);
    }
  }

  const totalAttempts = await AssessmentAttempt.countDocuments({
    assessment: assessment._id
  });

  const submittedAttempts = await AssessmentAttempt.find({
    assessment: assessment._id,
    status: 'submitted'
  });

  const submittedCount = submittedAttempts.length;
  const passedAttempts = submittedAttempts.filter((a) => a.result === 'passed').length;
  const failedAttempts = submittedAttempts.filter((a) => a.result === 'failed').length;

  let averagePercentage = 0;
  let highestPercentage = 0;
  let lowestPercentage = 0;
  let passPercentage = 0;

  if (submittedCount > 0) {
    const percentages = submittedAttempts.map((a) => a.percentage || 0);
    const sum = percentages.reduce((total, p) => total + p, 0);

    averagePercentage = Math.round(((sum / submittedCount) + Number.EPSILON) * 100) / 100;
    highestPercentage = Math.round((Math.max(...percentages) + Number.EPSILON) * 100) / 100;
    lowestPercentage = Math.round((Math.min(...percentages) + Number.EPSILON) * 100) / 100;
    passPercentage = Math.round(((passedAttempts / submittedCount) * 100 + Number.EPSILON) * 100) / 100;
  }

  return {
    assessment: {
      id: assessment._id.toString(),
      title: assessment.title,
      passingPercentage: assessment.passingPercentage,
      course: {
        id: course._id.toString(),
        title: course.title
      }
    },
    totalAttempts,
    submittedAttempts: submittedCount,
    passedAttempts,
    failedAttempts,
    averagePercentage,
    highestPercentage,
    lowestPercentage,
    passPercentage
  };
}

module.exports = {
  isAnswerCorrect,
  evaluateAttempt,
  getAttemptResult,
  getEmployeeAssessmentHistory,
  getAssessmentPerformance
};
