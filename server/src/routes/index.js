const express = require('express');
const healthRoutes = require('./health.routes');
const readyRoutes = require('./ready.routes');
const authRoutes = require('./auth.routes');
const rbacRoutes = require('./rbac.routes');
const departmentRoutes = require('./department.routes');
const employeeRoutes = require('./employee.routes');
const courseRoutes = require('./course.routes');
const moduleRoutes = require('./module.routes');
const lessonRoutes = require('./lesson.routes');
const enrollmentRoutes = require('./enrollment.routes');
const assessmentRoutes = require('./assessment.routes');
const certificateRoutes = require('./certificate.routes');
const notificationRoutes = require('./notification.routes');
const skillRoutes = require('./skill.routes');
const jobRoleRoutes = require('./jobRole.routes');
const jobRoleSkillRequirementRoutes = require('./jobRoleSkillRequirement.routes');
const employeeSkillRoutes = require('./employeeSkill.routes');
const courseSkillRoutes = require('./courseSkill.routes');
const complianceRequirementRoutes = require('./complianceRequirement.routes');
const complianceRoutes = require('./compliance.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

// Mount module routes
router.use('/health', healthRoutes);
router.use('/ready', readyRoutes);
router.use('/auth', authRoutes);
router.use('/rbac', rbacRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);
router.use('/skills', skillRoutes);
router.use('/job-roles', jobRoleRoutes);
router.use('/job-role-requirements', jobRoleSkillRequirementRoutes);
router.use('/employee-skills', employeeSkillRoutes);
router.use('/course-skills', courseSkillRoutes);
router.use('/compliance-requirements', complianceRequirementRoutes);
router.use('/compliance', complianceRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;

