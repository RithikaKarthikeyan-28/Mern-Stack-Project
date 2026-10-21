const express = require('express');
const assessmentController = require('../controllers/assessment.controller');
const questionController = require('../controllers/question.controller');
const attemptController = require('../controllers/assessmentAttempt.controller');
const resultController = require('../controllers/assessmentResult.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all assessment routes
router.use(authMiddleware);

// ============================================================================
// ATTEMPT SUBMISSION, RESULT & RETRIEVAL (Defined first to prevent /:id collision)
// ============================================================================
router.patch(
  '/attempts/:attemptId/submit',
  authorizeRoles('employee'),
  attemptController.submitAttempt
);

router.patch(
  '/attempts/:attemptId/answers',
  authorizeRoles('employee'),
  attemptController.saveDraftAnswers
);

router.get(
  '/attempts/:attemptId/result',
  authorizeRoles('admin', 'trainer', 'employee'),
  resultController.getAttemptResult
);

router.get(
  '/attempts/:attemptId',
  authorizeRoles('admin', 'trainer', 'employee'),
  attemptController.getAttemptById
);

// Employee performance history (Must be defined before /:id parameter)
router.get(
  '/results/me',
  authorizeRoles('employee'),
  resultController.getEmployeeAssessmentHistory
);

// Course matching assessment status & learner progression
router.get(
  '/course/:courseId',
  authorizeRoles('admin', 'trainer', 'employee'),
  assessmentController.getCourseAssessmentStatus
);

// ============================================================================
// ASSESSMENT SPECIFIC SUB-ROUTES
// ============================================================================
// Assessment performance statistics (admin, course trainer)
router.get(
  '/:assessmentId/performance',
  authorizeRoles('admin', 'trainer'),
  resultController.getAssessmentPerformance
);

// Employee safe quiz attempt payload
router.get(
  '/:id/attempt-data',
  authorizeRoles('employee'),
  assessmentController.getAttemptData
);

// Start an assessment attempt
router.post(
  '/:assessmentId/attempts',
  authorizeRoles('employee'),
  attemptController.startAttempt
);

// ============================================================================
// NESTED QUESTION ROUTES
// ============================================================================
router.post(
  '/:assessmentId/questions',
  authorizeRoles('admin', 'trainer'),
  questionController.createQuestion
);

router.get(
  '/:assessmentId/questions',
  authorizeRoles('admin', 'trainer', 'employee'),
  questionController.getQuestionsByAssessment
);

router.get(
  '/:assessmentId/questions/:questionId',
  authorizeRoles('admin', 'trainer', 'employee'),
  questionController.getQuestionById
);

router.patch(
  '/:assessmentId/questions/:questionId',
  authorizeRoles('admin', 'trainer'),
  questionController.updateQuestion
);

router.delete(
  '/:assessmentId/questions/:questionId',
  authorizeRoles('admin', 'trainer'),
  questionController.deleteQuestion
);

// ============================================================================
// ASSESSMENT LIFECYCLE MANAGEMENT
// ============================================================================
router.patch(
  '/:id/publish',
  authorizeRoles('admin', 'trainer'),
  assessmentController.publishAssessment
);

router.patch(
  '/:id/archive',
  authorizeRoles('admin', 'trainer'),
  assessmentController.archiveAssessment
);

// ============================================================================
// BASE ASSESSMENT CRUD
// ============================================================================
router.post(
  '/',
  authorizeRoles('admin', 'trainer'),
  assessmentController.createAssessment
);

router.get(
  '/',
  authorizeRoles('admin', 'trainer', 'employee'),
  assessmentController.getAssessments
);

router.get(
  '/:id',
  authorizeRoles('admin', 'trainer', 'employee'),
  assessmentController.getAssessmentById
);

router.patch(
  '/:id',
  authorizeRoles('admin', 'trainer'),
  assessmentController.updateAssessment
);

router.delete(
  '/:id',
  authorizeRoles('admin', 'trainer'),
  assessmentController.deleteAssessment
);

module.exports = router;
