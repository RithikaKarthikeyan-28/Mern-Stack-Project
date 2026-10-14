const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const employeeSkillController = require('../controllers/employeeSkill.controller');

const router = express.Router();

// Require authentication for all employee-skill routes
router.use(authMiddleware);

/**
 * @route   PATCH /api/employee-skills/:id
 * @desc    Update an employee skill's proficiency level
 * @access  Private (Admin only)
 */
router.patch('/:id', authorizeRoles('admin'), employeeSkillController.updateEmployeeSkill);

/**
 * @route   DELETE /api/employee-skills/:id
 * @desc    Soft delete an employee skill (isActive = false)
 * @access  Private (Admin only)
 */
router.delete('/:id', authorizeRoles('admin'), employeeSkillController.deleteEmployeeSkill);

module.exports = router;
