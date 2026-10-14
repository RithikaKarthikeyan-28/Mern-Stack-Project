const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all lesson routes
router.use(authMiddleware);

// Lesson ID routes
router.get('/:id', authorizeRoles('admin', 'trainer', 'employee'), lessonController.getLessonById);
router.patch('/:id', authorizeRoles('admin', 'trainer'), lessonController.updateLesson);
router.delete('/:id', authorizeRoles('admin', 'trainer'), lessonController.deleteLesson);

module.exports = router;
