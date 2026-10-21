const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all enrollment routes
router.use(authMiddleware);

// Employee self-enrollment, Admin & Trainer enrollment
router.post(
  '/',
  authorizeRoles('admin', 'trainer', 'employee'),
  enrollmentController.createEnrollment
);

// Admin & Trainer assign course to entire department
router.post(
  '/department',
  authorizeRoles('admin', 'trainer'),
  enrollmentController.assignDepartment
);

// Authenticated employee retrieves own enrollments (MUST precede /:id)
router.get(
  '/me',
  authorizeRoles('admin', 'employee'),
  enrollmentController.getMyEnrollments
);

// Admin and Trainer list enrollments (Trainer automatically scoped to own courses)
router.get(
  '/',
  authorizeRoles('admin', 'trainer'),
  enrollmentController.getAllEnrollments
);

// Retrieve single enrollment by ID
router.get(
  '/:id',
  authorizeRoles('admin', 'trainer', 'employee'),
  enrollmentController.getEnrollmentById
);

// Admin updates enrollment status
router.patch(
  '/:id/status',
  authorizeRoles('admin'),
  enrollmentController.updateEnrollmentStatus
);

// Employee and Admin update lesson progress
router.patch(
  '/:id/progress',
  authorizeRoles('admin', 'employee'),
  enrollmentController.updateLessonProgress
);

// Employee and Admin drop enrollment
router.delete(
  '/:id',
  authorizeRoles('admin', 'employee'),
  enrollmentController.dropEnrollment
);

module.exports = router;
