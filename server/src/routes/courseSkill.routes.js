const express = require('express');
const courseSkillController = require('../controllers/courseSkill.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all course-skill routes
router.use(authMiddleware);

// Admin-only updates to course skill mappings
router.patch('/:id', authorizeRoles('admin'), courseSkillController.updateCourseSkill);

// Admin-only soft deletion of course skill mappings
router.delete('/:id', authorizeRoles('admin'), courseSkillController.deleteCourseSkill);

module.exports = router;
