const express = require('express');
const employeeController = require('../controllers/employee.controller');
const employeeSkillController = require('../controllers/employeeSkill.controller');
const skillGapAnalysisController = require('../controllers/skillGapAnalysis.controller');
const courseRecommendationController = require('../controllers/courseRecommendation.controller');
const complianceController = require('../controllers/compliance.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication for all employee routes
router.use(authMiddleware);

// Self-profile route: Accessible to ANY authenticated user (admin, trainer, employee)
// CRITICAL: Must be defined before '/:id' to avoid route parameter collision
router.get('/me', employeeController.getMe);

// Employee self-service skill routes (CRITICAL: defined before '/:id')
router.get('/me/skills', employeeSkillController.getMySkills);
router.get(
  '/me/skill-gap/:jobRoleId',
  authorizeRoles('employee'),
  skillGapAnalysisController.getMySkillGap
);
router.get(
  '/me/recommendations/:jobRoleId',
  authorizeRoles('employee'),
  courseRecommendationController.getMyRecommendations
);

// Employee self-service compliance routes (CRITICAL: defined before '/:id')
router.get(
  '/me/compliance',
  authorizeRoles('employee'),
  complianceController.getMyCompliance
);
router.get(
  '/me/compliance/summary',
  authorizeRoles('employee'),
  complianceController.getMyComplianceSummary
);

// Employee skill assignment & listing (Admin/Trainer/Employee)
router.post(
  '/:employeeId/skills',
  authorizeRoles('admin'),
  employeeSkillController.createEmployeeSkill
);
router.get('/:employeeId/skills', employeeSkillController.getEmployeeSkills);

// Admin arbitrary employee skill gap analysis & course recommendations
router.get(
  '/:employeeId/skill-gap/:jobRoleId',
  authorizeRoles('admin'),
  skillGapAnalysisController.getEmployeeSkillGap
);
router.get(
  '/:employeeId/recommendations/:jobRoleId',
  authorizeRoles('admin'),
  courseRecommendationController.getEmployeeRecommendations
);

// Admin arbitrary employee compliance assignments
router.get(
  '/:employeeId/compliance',
  authorizeRoles('admin'),
  complianceController.getEmployeeCompliance
);

// Admin-only creation
router.post('/', authorizeRoles('admin'), employeeController.createEmployee);

// Admin and Trainer can list all employees
router.get('/', authorizeRoles('admin', 'trainer'), employeeController.getEmployees);

// Admin and Trainer can view single employee by ID
router.get('/:id', authorizeRoles('admin', 'trainer'), employeeController.getEmployeeById);

// Admin-only update
router.patch('/:id', authorizeRoles('admin'), employeeController.updateEmployee);

// Admin-only soft deletion
router.delete('/:id', authorizeRoles('admin'), employeeController.deleteEmployee);

module.exports = router;
