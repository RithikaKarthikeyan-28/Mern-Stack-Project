const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const skillController = require('../controllers/skill.controller');

const router = express.Router();

// All skill routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/skills
 * @desc    Create a new skill
 * @access  Private (Admin only)
 */
router.post('/', authorizeRoles('admin'), skillController.createSkill);

/**
 * @route   GET /api/skills
 * @desc    Get all skills (active only for non-admin)
 * @access  Private (Authenticated: admin, trainer, employee)
 */
router.get('/', skillController.getSkills);

/**
 * @route   GET /api/skills/:id
 * @desc    Get a single skill by ID
 * @access  Private (Authenticated: admin, trainer, employee)
 */
router.get('/:id', skillController.getSkillById);

/**
 * @route   PATCH /api/skills/:id
 * @desc    Update a skill
 * @access  Private (Admin only)
 */
router.patch('/:id', authorizeRoles('admin'), skillController.updateSkill);

/**
 * @route   DELETE /api/skills/:id
 * @desc    Soft delete a skill
 * @access  Private (Admin only)
 */
router.delete('/:id', authorizeRoles('admin'), skillController.deleteSkill);

module.exports = router;
