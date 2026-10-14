const express = require('express');
const moduleController = require('../controllers/module.controller');
const lessonController = require('../controllers/lesson.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all module routes
router.use(authMiddleware);

// Create module
router.post('/', authorizeRoles('admin', 'trainer'), moduleController.createModule);

// Nested lesson routes under module
router.post('/:moduleId/lessons', authorizeRoles('admin', 'trainer'), lessonController.createLesson);
router.get('/:moduleId/lessons', authorizeRoles('admin', 'trainer', 'employee'), lessonController.getLessons);

// Module ID routes
router.get('/:id', authorizeRoles('admin', 'trainer', 'employee'), moduleController.getModuleById);
router.patch('/:id', authorizeRoles('admin', 'trainer'), moduleController.updateModule);
router.delete('/:id', authorizeRoles('admin', 'trainer'), moduleController.deleteModule);

module.exports = router;
