const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Assessment = require('../src/models/Assessment');
const AssessmentAttempt = require('../src/models/AssessmentAttempt');
const Certificate = require('../src/models/Certificate');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');
const config = require('../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 19 — Analytics & Reporting APIs Tests', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser1;
  let employeeUser2;

  let departmentEngineering;
  let departmentMarketing;

  let employee1;
  let employee2;

  let courseSecurity;
  let courseCloud;
  let courseDraft;

  let assessmentSec;
  let complianceReq1;
  let complianceReq2;

  const generateToken = (user) => {
    return jwt.sign(
      {
        id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role,
        email: user.email
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    // Clean up test data from previous runs
    const existingEmployees = await Employee.find({ employeeId: /^P19-/ }).select('_id');
    const existingEmpIds = existingEmployees.map((e) => e._id);
    const existingCourses = await Course.find({ title: /^Phase 19 / }).select('_id');
    const existingCourseIds = existingCourses.map((c) => c._id);
    const existingReqs = await ComplianceRequirement.find({ title: /^Phase 19 / }).select('_id');
    const existingReqIds = existingReqs.map((r) => r._id);
    const existingAssessments = await Assessment.find({ title: /^Phase 19 / }).select('_id');
    const existingAssessmentIds = existingAssessments.map((a) => a._id);

    await Promise.all([
      User.deleteMany({ email: /@phase19test\.com$/ }),
      Department.deleteMany({ $or: [{ code: /^P19-/ }, { name: /^Phase 19/i }] }),
      Employee.deleteMany({ employeeId: /^P19-/ }),
      Course.deleteMany({ title: /^Phase 19 / }),
      Assessment.deleteMany({ title: /^Phase 19 / }),
      AssessmentAttempt.deleteMany({ $or: [{ assessment: { $in: existingAssessmentIds } }, { employee: { $in: existingEmpIds } }] }),
      Certificate.deleteMany({ $or: [{ certificateNumber: /^CERT-P19-/ }, { employee: { $in: existingEmpIds } }] }),
      ComplianceRequirement.deleteMany({ title: /^Phase 19 / }),
      ComplianceAssignment.deleteMany({ $or: [{ complianceRequirement: { $in: existingReqIds } }, { employee: { $in: existingEmpIds } }] }),
      Enrollment.deleteMany({ $or: [{ course: { $in: existingCourseIds } }, { employee: { $in: existingEmpIds } }] })
    ]);

    // 1. Users
    adminUser = await User.create({
      name: 'Phase 19 Admin',
      email: 'admin@phase19test.com',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });
    trainerUser = await User.create({
      name: 'Phase 19 Trainer',
      email: 'trainer@phase19test.com',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });
    employeeUser1 = await User.create({
      name: 'Phase 19 Alice',
      email: 'alice@phase19test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });
    employeeUser2 = await User.create({
      name: 'Phase 19 Bob',
      email: 'bob@phase19test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    adminToken = generateToken(adminUser);
    trainerToken = generateToken(trainerUser);
    employeeToken = generateToken(employeeUser1);

    // 2. Departments
    departmentEngineering = await Department.create({
      name: 'Phase 19 Engineering',
      code: 'P19-ENG',
      description: 'Engineering Dept for Phase 19',
      isActive: true
    });
    departmentMarketing = await Department.create({
      name: 'Phase 19 Marketing',
      code: 'P19-MKT',
      description: 'Marketing Dept for Phase 19',
      isActive: true
    });

    // 3. Employees
    employee1 = await Employee.create({
      user: employeeUser1._id,
      employeeId: 'P19-EMP-001',
      department: departmentEngineering._id,
      designation: 'Senior Backend Engineer',
      isActive: true
    });
    employee2 = await Employee.create({
      user: employeeUser2._id,
      employeeId: 'P19-EMP-002',
      department: departmentMarketing._id,
      designation: 'Marketing Lead',
      isActive: true
    });

    // 4. Courses
    courseSecurity = await Course.create({
      title: 'Phase 19 Security Essentials',
      description: 'Comprehensive cybersecurity fundamentals course',
      category: 'Security',
      level: 'beginner',
      duration: 12,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });
    courseCloud = await Course.create({
      title: 'Phase 19 Cloud Architecture',
      description: 'AWS and Cloud infrastructure foundations',
      category: 'Cloud',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });
    courseDraft = await Course.create({
      title: 'Phase 19 AI Machine Learning Draft',
      description: 'Draft course on deep learning models',
      category: 'AI',
      level: 'advanced',
      duration: 30,
      trainer: trainerUser._id,
      status: 'draft',
      isActive: true
    });

    // 5. Enrollments
    await Enrollment.create({
      employee: employee1._id,
      course: courseSecurity._id,
      status: 'completed',
      progressPercentage: 100,
      startedAt: new Date(Date.now() - 10 * 86400000),
      completedAt: new Date(Date.now() - 2 * 86400000),
      isActive: true
    });
    await Enrollment.create({
      employee: employee1._id,
      course: courseCloud._id,
      status: 'in_progress',
      progressPercentage: 50,
      startedAt: new Date(Date.now() - 5 * 86400000),
      isActive: true
    });
    await Enrollment.create({
      employee: employee2._id,
      course: courseSecurity._id,
      status: 'enrolled',
      progressPercentage: 0,
      startedAt: new Date(),
      isActive: true
    });

    // 6. Assessments & Attempts
    assessmentSec = await Assessment.create({
      title: 'Phase 19 Security Quiz',
      course: courseSecurity._id,
      trainer: trainerUser._id,
      status: 'published',
      passingPercentage: 70,
      isActive: true
    });

    await AssessmentAttempt.create({
      employee: employee1._id,
      assessment: assessmentSec._id,
      enrollment: new mongoose.Types.ObjectId(),
      attemptNumber: 1,
      status: 'submitted',
      totalMarks: 100,
      obtainedMarks: 85,
      percentage: 85,
      result: 'passed',
      submittedAt: new Date(Date.now() - 2 * 86400000)
    });
    await AssessmentAttempt.create({
      employee: employee2._id,
      assessment: assessmentSec._id,
      enrollment: new mongoose.Types.ObjectId(),
      attemptNumber: 1,
      status: 'submitted',
      totalMarks: 100,
      obtainedMarks: 50,
      percentage: 50,
      result: 'failed',
      submittedAt: new Date(Date.now() - 1 * 86400000)
    });

    // 7. Certificates
    await Certificate.create({
      employee: employee1._id,
      course: courseSecurity._id,
      enrollment: new mongoose.Types.ObjectId(),
      certificateNumber: 'CERT-P19-001',
      issuedAt: new Date(Date.now() - 2 * 86400000),
      expiresAt: new Date(Date.now() + 360 * 86400000),
      status: 'active'
    });
    await Certificate.create({
      employee: employee2._id,
      course: courseSecurity._id,
      enrollment: new mongoose.Types.ObjectId(),
      certificateNumber: 'CERT-P19-002',
      issuedAt: new Date(Date.now() - 400 * 86400000),
      expiresAt: new Date(Date.now() - 35 * 86400000),
      status: 'active' // Expired
    });

    // 8. Compliance Requirements & Assignments
    complianceReq1 = await ComplianceRequirement.create({
      title: 'Phase 19 Annual Security Compliance',
      course: courseSecurity._id,
      frequency: 'annual',
      dueWithinDays: 30,
      isActive: true
    });
    complianceReq2 = await ComplianceRequirement.create({
      title: 'Phase 19 Cloud Governance Compliance',
      course: courseCloud._id,
      frequency: 'annual',
      dueWithinDays: 45,
      isActive: true
    });

    await ComplianceAssignment.create({
      complianceRequirement: complianceReq1._id,
      employee: employee1._id,
      assignedAt: new Date(Date.now() - 15 * 86400000),
      dueAt: new Date(Date.now() + 15 * 86400000),
      status: 'COMPLIANT',
      completedAt: new Date(),
      isActive: true
    });
    await ComplianceAssignment.create({
      complianceRequirement: complianceReq1._id,
      employee: employee2._id,
      assignedAt: new Date(Date.now() - 40 * 86400000),
      dueAt: new Date(Date.now() - 10 * 86400000),
      status: 'OVERDUE',
      isActive: true
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase19test\.com$/ }),
      Department.deleteMany({ $or: [{ code: /^P19-/ }, { name: /^Phase 19/i }] }),
      Employee.deleteMany({ employeeId: /^P19-/ }),
      Course.deleteMany({ title: /^Phase 19 / }),
      Assessment.deleteMany({ title: /^Phase 19 / }),
      AssessmentAttempt.deleteMany({
        $or: [
          { assessment: assessmentSec?._id },
          { employee: { $in: [employee1?._id, employee2?._id].filter(Boolean) } }
        ]
      }),
      Certificate.deleteMany({
        $or: [
          { certificateNumber: /^CERT-P19-/ },
          { employee: { $in: [employee1?._id, employee2?._id].filter(Boolean) } }
        ]
      }),
      ComplianceRequirement.deleteMany({ title: /^Phase 19 / }),
      ComplianceAssignment.deleteMany({
        $or: [
          { complianceRequirement: { $in: [complianceReq1?._id, complianceReq2?._id].filter(Boolean) } },
          { employee: { $in: [employee1?._id, employee2?._id].filter(Boolean) } }
        ]
      }),
      Enrollment.deleteMany({
        $or: [
          { course: { $in: [courseSecurity?._id, courseCloud?._id, courseDraft?._id].filter(Boolean) } },
          { employee: { $in: [employee1?._id, employee2?._id].filter(Boolean) } }
        ]
      })
    ]);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // =========================================================================
  // 1. ACCESS CONTROL & RBAC
  // =========================================================================
  describe('1. Access Control & RBAC', () => {
    const endpoints = [
      '/api/analytics/overview',
      '/api/analytics/learning',
      '/api/analytics/assessments',
      '/api/analytics/compliance',
      '/api/analytics/certifications',
      '/api/analytics/employees',
      '/api/analytics/departments',
      '/api/analytics/courses'
    ];

    test.each(endpoints)('Admin can access %s (200 OK)', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test.each(endpoints)('Trainer is rejected with 403 Forbidden for %s', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${trainerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test.each(endpoints)('Employee is rejected with 403 Forbidden for %s', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test.each(endpoints)('Unauthenticated request is rejected with 401 Unauthorized for %s', async (endpoint) => {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. INPUT VALIDATION & QUERY FILTERS
  // =========================================================================
  describe('2. Input Validation & Query Filters', () => {
    test('Rejects invalid from date (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/overview?from=not-a-date')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/from.*valid date/i);
    });

    test('Rejects impossible date (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/overview?from=2026-02-31')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/impossible/i);
    });

    test('Rejects date range where from > to (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/overview?from=2026-10-01&to=2026-05-01')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be after/i);
    });

    test('Rejects malformed departmentId format (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/learning?departmentId=invalid123')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Department ID format/i);
    });

    test('Rejects malformed courseId format (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/learning?courseId=bad-course')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Course ID format/i);
    });

    test('Rejects invalid status (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/learning?status=NOT_A_STATUS')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/status/i);
    });

    test('Rejects non-positive integer page (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/departments?page=-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/page/i);
    });

    test('Rejects limit greater than 100 (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/departments?limit=101')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/limit/i);
    });

    test('Rejects NoSQL operator injection in query (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/learning?departmentId[$ne]=null')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/forbidden|operator/i);
    });

    test('Rejects dot-path injection in query (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/analytics/learning?user.role=admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/forbidden|dot-path/i);
    });
  });

  // =========================================================================
  // 3. OVERVIEW ANALYTICS (GET /api/analytics/overview)
  // =========================================================================
  describe('3. Overview Analytics', () => {
    test('Returns exact Section 7 schema structure with correct values', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // employees: { total, active, inactive }
      expect(data.employees).toBeDefined();
      expect(data.employees.total).toBeGreaterThanOrEqual(2);
      expect(data.employees.active).toBeGreaterThanOrEqual(2);
      expect(typeof data.employees.inactive).toBe('number');

      // departments: { total, active }
      expect(data.departments).toBeDefined();
      expect(data.departments.total).toBeGreaterThanOrEqual(2);
      expect(data.departments.active).toBeGreaterThanOrEqual(2);

      // courses: { total, published, draft, archived }
      expect(data.courses).toBeDefined();
      expect(data.courses.published).toBeGreaterThanOrEqual(2);
      expect(data.courses.draft).toBeGreaterThanOrEqual(1);

      // enrollments: { total, enrolled, inProgress, completed, dropped }
      expect(data.enrollments).toBeDefined();
      expect(data.enrollments.total).toBeGreaterThanOrEqual(3);
      expect(data.enrollments.completed).toBeGreaterThanOrEqual(1);
      expect(data.enrollments.inProgress).toBeGreaterThanOrEqual(1);
      expect(data.enrollments.enrolled).toBeGreaterThanOrEqual(1);

      // assessments: { total, published, attempts, passed, failed, passRate }
      expect(data.assessments).toBeDefined();
      expect(data.assessments.total).toBeGreaterThanOrEqual(1);
      expect(data.assessments.attempts).toBeGreaterThanOrEqual(2);
      expect(data.assessments.passed).toBeGreaterThanOrEqual(1);
      expect(data.assessments.failed).toBeGreaterThanOrEqual(1);
      expect(data.assessments.passRate).toBe(50); // 1 / 2 = 50%

      // certificates: { active, expired, revoked }
      expect(data.certificates).toBeDefined();
      expect(data.certificates.active).toBeGreaterThanOrEqual(1);
      expect(data.certificates.expired).toBeGreaterThanOrEqual(1);

      // compliance: { total, compliant, dueSoon, overdue, inProgress, notStarted, complianceRate }
      expect(data.compliance).toBeDefined();
      expect(data.compliance.total).toBeGreaterThanOrEqual(2);
      expect(data.compliance.compliant).toBeGreaterThanOrEqual(1);
      expect(data.compliance.overdue).toBeGreaterThanOrEqual(1);
      expect(data.compliance.complianceRate).toBe(50);
    });

    test('Supports inclusive normalized date range filtering', async () => {
      const res = await request(app)
        .get('/api/analytics/overview?from=2026-01-01&to=2026-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employees).toBeDefined();
    });
  });

  // =========================================================================
  // 4. LEARNING ANALYTICS (GET /api/analytics/learning)
  // =========================================================================
  describe('4. Learning Analytics', () => {
    test('Returns exact Section 9 metrics, courseBreakdown and departmentBreakdown', async () => {
      const res = await request(app)
        .get('/api/analytics/learning')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.totalEnrollments).toBeGreaterThanOrEqual(3);
      expect(data.completed).toBeGreaterThanOrEqual(1);
      expect(data.inProgress).toBeGreaterThanOrEqual(1);
      expect(data.enrolled).toBeGreaterThanOrEqual(1);
      expect(data.completionRate).toBeGreaterThan(0);
      expect(data.averageProgressPercentage).toBeGreaterThan(0);
      expect(typeof data.averageCompletionTimeDays).toBe('number');

      // Course Breakdown
      expect(Array.isArray(data.courseBreakdown)).toBe(true);
      expect(data.courseBreakdown.length).toBeGreaterThanOrEqual(2);
      const secCourse = data.courseBreakdown.find((c) => c.title === 'Phase 19 Security Essentials');
      expect(secCourse).toBeDefined();
      expect(secCourse.enrollmentCount).toBe(2);
      expect(secCourse.completedCount).toBe(1);
      expect(secCourse.completionRate).toBe(50);

      // Department Breakdown
      expect(Array.isArray(data.departmentBreakdown)).toBe(true);
      expect(data.departmentBreakdown.length).toBeGreaterThanOrEqual(2);
    });

    test('Filters learning by courseId', async () => {
      const res = await request(app)
        .get(`/api/analytics/learning?courseId=${courseSecurity._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalEnrollments).toBe(2);
      expect(res.body.data.completed).toBe(1);
    });

    test('Filters learning by departmentId', async () => {
      const res = await request(app)
        .get(`/api/analytics/learning?departmentId=${departmentEngineering._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalEnrollments).toBe(2);
    });

    test('Filters learning by status', async () => {
      const res = await request(app)
        .get('/api/analytics/learning?status=completed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(res.body.data.totalEnrollments);
    });
  });

  // =========================================================================
  // 5. ASSESSMENT ANALYTICS (GET /api/analytics/assessments)
  // =========================================================================
  describe('5. Assessment Analytics', () => {
    test('Returns exact Section 12 metrics, min/max percentages, and assessmentBreakdown', async () => {
      const res = await request(app)
        .get('/api/analytics/assessments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.submittedAttempts).toBe(2);
      expect(data.passed).toBe(1);
      expect(data.failed).toBe(1);
      expect(data.passRate).toBe(50);
      expect(data.averagePercentage).toBe(67.5);
      expect(data.highestPercentage).toBe(85);
      expect(data.lowestPercentage).toBe(50);
      expect(data.averageAttemptsPerEmployee).toBe(1); // 2 attempts across 2 unique employees

      expect(Array.isArray(data.assessmentBreakdown)).toBe(true);
      const secAss = data.assessmentBreakdown.find((a) => a.title === 'Phase 19 Security Quiz');
      expect(secAss).toBeDefined();
      expect(secAss.attemptCount).toBe(2);
      expect(secAss.uniqueEmployees).toBe(2);
      expect(secAss.passed).toBe(1);
      expect(secAss.failed).toBe(1);
      expect(secAss.passRate).toBe(50);
      expect(secAss.highestPercentage).toBe(85);
      expect(secAss.lowestPercentage).toBe(50);
    });

    test('Filters assessment analytics by courseId', async () => {
      const res = await request(app)
        .get(`/api/analytics/assessments?courseId=${courseSecurity._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.submittedAttempts).toBe(2);
    });
  });

  // =========================================================================
  // 6. COMPLIANCE ANALYTICS (GET /api/analytics/compliance)
  // =========================================================================
  describe('6. Compliance Analytics', () => {
    test('Returns exact Section 15 metrics, requirementBreakdown and departmentBreakdown', async () => {
      const res = await request(app)
        .get('/api/analytics/compliance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.totalAssignments).toBe(2);
      expect(data.compliant).toBe(1);
      expect(data.overdue).toBe(1);
      expect(data.complianceRate).toBe(50);

      expect(Array.isArray(data.requirementBreakdown)).toBe(true);
      expect(data.requirementBreakdown.length).toBeGreaterThanOrEqual(1);

      expect(Array.isArray(data.departmentBreakdown)).toBe(true);
      expect(data.departmentBreakdown.length).toBe(2);
    });

    test('Filters compliance analytics by departmentId', async () => {
      const res = await request(app)
        .get(`/api/analytics/compliance?departmentId=${departmentEngineering._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAssignments).toBe(1);
      expect(res.body.data.compliant).toBe(1);
      expect(res.body.data.complianceRate).toBe(100);
    });
  });

  // =========================================================================
  // 7. CERTIFICATION ANALYTICS (GET /api/analytics/certifications)
  // =========================================================================
  describe('7. Certification Analytics', () => {
    test('Returns exact Section 18 metrics, expiringSoon window, and courseBreakdown', async () => {
      const res = await request(app)
        .get(`/api/analytics/certifications?courseId=${courseSecurity._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.totalIssued).toBe(2);
      expect(data.active).toBe(1);
      expect(data.expired).toBe(1);
      expect(data.revoked).toBe(0);
      expect(typeof data.expiringSoon).toBe('number');
      expect(typeof data.renewed).toBe('number');
      expect(typeof data.renewalRate).toBe('number');

      expect(Array.isArray(data.courseBreakdown)).toBe(true);
      expect(data.courseBreakdown.length).toBeGreaterThanOrEqual(1);
    });

    test('Filters certifications by status active', async () => {
      const res = await request(app)
        .get(`/api/analytics/certifications?courseId=${courseSecurity._id}&status=active`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(1);
    });

    test('Returns certification analytics without query filters', async () => {
      const res = await request(app)
        .get('/api/analytics/certifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIssued).toBeGreaterThanOrEqual(2);
      expect(res.body.data.active).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 8. EMPLOYEE ANALYTICS (GET /api/analytics/employees)
  // =========================================================================
  describe('8. Employee Analytics', () => {
    test('Returns exact Section 21 metrics and departmentBreakdown', async () => {
      const res = await request(app)
        .get('/api/analytics/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.totalEmployees).toBeGreaterThanOrEqual(2);
      expect(data.activeEmployees).toBeGreaterThanOrEqual(2);
      expect(typeof data.inactiveEmployees).toBe('number');
      expect(data.employeesWithEnrollments).toBeGreaterThanOrEqual(2);
      expect(data.employeesWithCompletedCourses).toBeGreaterThanOrEqual(1);
      expect(data.employeesWithCertificates).toBeGreaterThanOrEqual(1);
      expect(data.employeesWithComplianceGaps).toBeGreaterThanOrEqual(1);

      expect(Array.isArray(data.departmentBreakdown)).toBe(true);
      expect(data.departmentBreakdown.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // 9. DEPARTMENT ANALYTICS (GET /api/analytics/departments)
  // =========================================================================
  describe('9. Department Comparative Analytics', () => {
    test('Returns exact Section 22 metrics with pagination and stable sorting', async () => {
      const res = await request(app)
        .get('/api/analytics/departments?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { departments, pagination } = res.body.data;

      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThanOrEqual(2);
      expect(pagination.total).toBeGreaterThanOrEqual(2);
      expect(pagination.page).toBe(1);

      const eng = departments.find((d) => d.departmentName === 'Phase 19 Engineering');
      expect(eng).toBeDefined();
      expect(eng.employeeCount).toBe(1);
      expect(eng.activeEmployeeCount).toBe(1);
      expect(eng.enrollmentCount).toBe(2);
      expect(eng.completionCount).toBe(1);
      expect(eng.averageProgressPercentage).toBe(75); // (100 + 50) / 2 = 75
      expect(eng.assessmentAttempts).toBe(1);
      expect(eng.assessmentPassRate).toBe(100);
      expect(eng.complianceAssignments).toBe(1);
      expect(eng.compliantAssignments).toBe(1);
      expect(eng.complianceRate).toBe(100);
    });
  });

  // =========================================================================
  // 10. COURSE ANALYTICS (GET /api/analytics/courses)
  // =========================================================================
  describe('10. Course Performance Analytics', () => {
    test('Returns exact Section 23 metrics with pagination and stable sorting', async () => {
      const res = await request(app)
        .get('/api/analytics/courses?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { courses, pagination } = res.body.data;

      expect(Array.isArray(courses)).toBe(true);
      expect(courses.length).toBeGreaterThanOrEqual(3);

      const sec = courses.find((c) => c.title === 'Phase 19 Security Essentials');
      expect(sec).toBeDefined();
      expect(sec.enrollmentCount).toBe(2);
      expect(sec.completedCount).toBe(1);
      expect(sec.completionRate).toBe(50);
      expect(sec.assessmentAttempts).toBe(2);
      expect(sec.assessmentPassRate).toBe(50);
      expect(sec.certificateCount).toBe(2);
      expect(sec.complianceAssignmentCount).toBe(2);
    });

    test('Filters course analytics by status', async () => {
      const res = await request(app)
        .get('/api/analytics/courses?status=published')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses.every((c) => c.status === 'published')).toBe(true);
    });
  });

  // =========================================================================
  // 11. SECURITY, READ-ONLY IMMUTABILITY & LEAK PREVENTION
  // =========================================================================
  describe('11. Security & Data Immutability', () => {
    test('Analytics queries do NOT modify any business database records', async () => {
      const enrollmentsBefore = await Enrollment.countDocuments();
      const certificatesBefore = await Certificate.countDocuments();

      await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      await request(app)
        .get('/api/analytics/learning')
        .set('Authorization', `Bearer ${adminToken}`);
      await request(app)
        .get('/api/analytics/compliance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(await Enrollment.countDocuments()).toBe(enrollmentsBefore);
      expect(await Certificate.countDocuments()).toBe(certificatesBefore);
    });

    test('Password hashes, internal secrets, and correctAnswers are NEVER exposed', async () => {
      const endpoints = [
        '/api/analytics/overview',
        '/api/analytics/learning',
        '/api/analytics/assessments',
        '/api/analytics/compliance',
        '/api/analytics/certifications',
        '/api/analytics/employees',
        '/api/analytics/departments',
        '/api/analytics/courses'
      ];

      for (const ep of endpoints) {
        const res = await request(app)
          .get(ep)
          .set('Authorization', `Bearer ${adminToken}`);
        const str = JSON.stringify(res.body);
        expect(str).not.toMatch(/password/i);
        expect(str).not.toContain('Password123!');
        expect(str).not.toMatch(/correctAnswers/i);
      }
    });
  });
});
