const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Organization-level analytics endpoints are strictly Admin-only
router.use(authMiddleware);
router.use(authorizeRoles('admin'));

// 8 Dedicated Analytics Endpoints
router.get('/overview', analyticsController.getOverview);
router.get('/learning', analyticsController.getLearning);
router.get('/assessments', analyticsController.getAssessments);
router.get('/compliance', analyticsController.getCompliance);
router.get('/certifications', analyticsController.getCertifications);
router.get('/employees', analyticsController.getEmployees);
router.get('/departments', analyticsController.getDepartments);
router.get('/courses', analyticsController.getCourses);

module.exports = router;
