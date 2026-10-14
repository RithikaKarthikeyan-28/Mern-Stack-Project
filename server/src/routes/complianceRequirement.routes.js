const express = require('express');
const complianceController = require('../controllers/compliance.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication and Admin role for all compliance requirement operations
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// Requirement CRUD
router.post('/', complianceController.createRequirement);
router.get('/', complianceController.getRequirements);
router.get('/:id', complianceController.getRequirementById);
router.patch('/:id', complianceController.updateRequirement);
router.delete('/:id', complianceController.deleteRequirement);

// Assignment operations
router.post('/:requirementId/assignments', complianceController.assignToEmployee);
router.post('/:requirementId/assignments/bulk', complianceController.bulkAssign);
router.post(
  '/:requirementId/departments/:departmentId/assign',
  complianceController.assignToDepartment
);

module.exports = router;
