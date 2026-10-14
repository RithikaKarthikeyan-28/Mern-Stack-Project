const express = require('express');
const complianceController = require('../controllers/compliance.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Require authentication and Admin role for all compliance aggregate operations
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// Admin assignments list with filters and pagination
router.get('/assignments', complianceController.getComplianceAssignments);

// Admin overall compliance summary metrics
router.get('/summary', complianceController.getComplianceSummary);

// Admin status refresh trigger
router.post('/refresh-statuses', complianceController.refreshStatuses);

module.exports = router;
