const express = require('express');
const departmentController = require('../controllers/department.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all department routes
router.use(authMiddleware);

// Admin-only creation
router.post('/', authorizeRoles('admin'), departmentController.createDepartment);

// Admin and Trainer can list departments
router.get('/', authorizeRoles('admin', 'trainer'), departmentController.getDepartments);

// Admin and Trainer can view single department by ID
router.get('/:id', authorizeRoles('admin', 'trainer'), departmentController.getDepartmentById);

// Admin-only update
router.patch('/:id', authorizeRoles('admin'), departmentController.updateDepartment);

// Admin-only soft deletion
router.delete('/:id', authorizeRoles('admin'), departmentController.deleteDepartment);

module.exports = router;
