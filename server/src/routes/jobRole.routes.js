const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const jobRoleController = require('../controllers/jobRole.controller');
const requirementController = require('../controllers/jobRoleSkillRequirement.controller');

const router = express.Router();

// All job role routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/job-roles
 * @desc    Create a new job role
 * @access  Private (Admin only)
 */
router.post('/', authorizeRoles('admin'), jobRoleController.createJobRole);

/**
 * @route   GET /api/job-roles
 * @desc    Get all job roles (active only for non-admin)
 * @access  Private (Authenticated: admin, trainer, employee)
 */
router.get('/', jobRoleController.getJobRoles);

/**
 * @route   GET /api/job-roles/:id
 * @desc    Get a single job role by ID
 * @access  Private (Authenticated: admin, trainer, employee)
 */
router.get('/:id', jobRoleController.getJobRoleById);

/**
 * @route   PATCH /api/job-roles/:id
 * @desc    Update a job role
 * @access  Private (Admin only)
 */
router.patch('/:id', authorizeRoles('admin'), jobRoleController.updateJobRole);

/**
 * @route   DELETE /api/job-roles/:id
 * @desc    Soft delete a job role
 * @access  Private (Admin only)
 */
router.delete('/:id', authorizeRoles('admin'), jobRoleController.deleteJobRole);

/**
 * Nested requirement routes:
 * @route   POST /api/job-roles/:jobRoleId/requirements
 * @desc    Add a skill requirement to a job role
 * @access  Private (Admin only)
 */
router.post(
  '/:jobRoleId/requirements',
  authorizeRoles('admin'),
  requirementController.createRequirement
);

/**
 * @route   GET /api/job-roles/:jobRoleId/requirements
 * @desc    Get all skill requirements for a job role
 * @access  Private (Authenticated: admin, trainer, employee)
 */
router.get('/:jobRoleId/requirements', requirementController.getRequirementsForJobRole);

module.exports = router;
