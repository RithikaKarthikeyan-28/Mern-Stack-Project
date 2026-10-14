const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const requirementController = require('../controllers/jobRoleSkillRequirement.controller');

const router = express.Router();

// All requirement routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/job-role-requirements/:id
 * @desc    Get a single requirement by ID
 * @access  Private (Authenticated: admin, trainer, employee)
 */
router.get('/:id', requirementController.getRequirementById);

/**
 * @route   PATCH /api/job-role-requirements/:id
 * @desc    Update a requirement (level, mandatory, weight)
 * @access  Private (Admin only)
 */
router.patch('/:id', authorizeRoles('admin'), requirementController.updateRequirement);

/**
 * @route   DELETE /api/job-role-requirements/:id
 * @desc    Soft delete a requirement
 * @access  Private (Admin only)
 */
router.delete('/:id', authorizeRoles('admin'), requirementController.deleteRequirement);

module.exports = router;
