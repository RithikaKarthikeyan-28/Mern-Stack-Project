const express = require('express');
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all course routes
router.use(authMiddleware);

// Admin and Trainer can create courses
router.post('/', authorizeRoles('admin', 'trainer'), courseController.createCourse);

// Admin, Trainer, and Employee can list courses
router.get('/', authorizeRoles('admin', 'trainer', 'employee'), courseController.getCourses);

// Nested module route for course
const moduleController = require('../controllers/module.controller');
router.get('/:courseId/modules', authorizeRoles('admin', 'trainer', 'employee'), moduleController.getModules);

// Nested enrollment route for course (authenticated employee or admin)
const enrollmentController = require('../controllers/enrollment.controller');
router.get('/:courseId/enrollment', authorizeRoles('admin', 'employee'), enrollmentController.getCourseEnrollment);

// Nested skill mapping routes for course
const courseSkillController = require('../controllers/courseSkill.controller');
router.post('/:courseId/skills', authorizeRoles('admin'), courseSkillController.createCourseSkill);
router.get('/:courseId/skills', authorizeRoles('admin', 'trainer', 'employee'), courseSkillController.getCourseSkills);

// Admin, Trainer, and Employee can view single course by ID
router.get('/:id', authorizeRoles('admin', 'trainer', 'employee'), courseController.getCourseById);

// Admin and Trainer can update courses
router.patch('/:id', authorizeRoles('admin', 'trainer'), courseController.updateCourse);

// Admin-only soft deletion
router.delete('/:id', authorizeRoles('admin'), courseController.deleteCourse);

module.exports = router;
