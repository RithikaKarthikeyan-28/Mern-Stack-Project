const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const config = require('../../src/config');
const User = require('../../src/models/User');
const Department = require('../../src/models/Department');
const Employee = require('../../src/models/Employee');
const Course = require('../../src/models/Course');
const Enrollment = require('../../src/models/Enrollment');
const Assessment = require('../../src/models/Assessment');
const AssessmentAttempt = require('../../src/models/AssessmentAttempt');
const Certificate = require('../../src/models/Certificate');
const ComplianceRequirement = require('../../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../../src/models/ComplianceAssignment');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 9 Integration: Cross-Module Analytics Consistency', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser1;
  let employeeUser2;

  let dept1;
  let dept2;
  let employee1;
  let employee2;

  let course1;
  let course2;
  let enr1;
  let enr2;
  let assessment1;
  let complianceReq1;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    try {
      await Certificate.collection.dropIndexes();
      await ComplianceAssignment.collection.dropIndexes();
      await ComplianceRequirement.collection.dropIndexes();
    } catch (e) {
      // ignore
    }
    await Certificate.syncIndexes();
    await ComplianceAssignment.syncIndexes();
    await ComplianceRequirement.syncIndexes();

    await ComplianceAssignment.deleteMany({});
    await ComplianceRequirement.deleteMany({});
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Departments
    dept1 = await Department.create({
      name: 'Engineering Systems',
      description: 'Core Engineering Dept'
    });

    dept2 = await Department.create({
      name: 'Product Design',
      description: 'Product Design Dept'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Analytics Admin',
      email: 'analytics.admin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Analytics Trainer',
      email: 'analytics.trainer@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUser1 = await User.create({
      name: 'Dev Dana',
      email: 'dana.dev@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    employeeUser2 = await User.create({
      name: 'Designer Dave',
      email: 'dave.designer@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    // 3. Tokens
    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerToken = jwt.sign(
      { userId: trainerUser._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeToken = jwt.sign(
      { userId: employeeUser1._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // 4. Employees
    employee1 = await Employee.create({
      user: employeeUser1._id,
      employeeId: 'EMP-AN-01',
      department: dept1._id,
      designation: 'Senior Developer',
      phone: '9555544441',
      isActive: true
    });

    employee2 = await Employee.create({
      user: employeeUser2._id,
      employeeId: 'EMP-AN-02',
      department: dept2._id,
      designation: 'Lead Designer',
      phone: '9555544442',
      isActive: true
    });

    // 5. Courses (2 published)
    course1 = await Course.create({
      title: 'Full Stack Architecture 101',
      description: 'Full stack development',
      category: 'technical',
      level: 'intermediate',
      duration: 30,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    course2 = await Course.create({
      title: 'Modern UI/UX Patterns',
      description: 'UI/UX best practices',
      category: 'design',
      level: 'beginner',
      duration: 20,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    // 6. Enrollments: Employee 1 completed course 1 (100%), Employee 2 enrolled in course 2 (50%)
    enr1 = await Enrollment.create({
      employee: employee1._id,
      course: course1._id,
      status: 'completed',
      progressPercentage: 100,
      startedAt: new Date(Date.now() - 5 * 86400000),
      completedAt: new Date(Date.now() - 1 * 86400000),
      isActive: true
    });

    enr2 = await Enrollment.create({
      employee: employee2._id,
      course: course2._id,
      status: 'in_progress',
      progressPercentage: 50,
      startedAt: new Date(Date.now() - 2 * 86400000),
      isActive: true
    });

    // 7. Assessments & Attempts
    assessment1 = await Assessment.create({
      title: 'Full Stack Certification Quiz',
      course: course1._id,
      trainer: trainerUser._id,
      status: 'published',
      passingPercentage: 60,
      isActive: true
    });

    // Attempt 1: Employee 1 passed (100%)
    await AssessmentAttempt.create({
      employee: employee1._id,
      assessment: assessment1._id,
      enrollment: enr1._id,
      attemptNumber: 1,
      status: 'submitted',
      totalMarks: 10,
      obtainedMarks: 10,
      percentage: 100,
      result: 'passed',
      submittedAt: new Date(Date.now() - 1 * 86400000),
      evaluatedAt: new Date(Date.now() - 1 * 86400000)
    });

    // Attempt 2: Employee 2 failed (40%)
    await AssessmentAttempt.create({
      employee: employee2._id,
      assessment: assessment1._id,
      enrollment: enr2._id,
      attemptNumber: 1,
      status: 'submitted',
      totalMarks: 10,
      obtainedMarks: 4,
      percentage: 40,
      result: 'failed',
      submittedAt: new Date(Date.now() - 1 * 86400000),
      evaluatedAt: new Date(Date.now() - 1 * 86400000)
    });

    // 8. Certificates: Employee 1 has active certificate
    await Certificate.create({
      employee: employee1._id,
      course: course1._id,
      enrollment: enr1._id,
      certificateNumber: 'SKILLTRACK-2026-ANALYT01',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000)
    });

    // 9. Compliance Requirements & Assignments
    complianceReq1 = await ComplianceRequirement.create({
      title: 'Global Engineering Standards',
      course: course1._id,
      frequency: 'annual',
      dueWithinDays: 30,
      isActive: true
    });

    // Assignment 1: Employee 1 is COMPLIANT
    await ComplianceAssignment.create({
      complianceRequirement: complianceReq1._id,
      employee: employee1._id,
      dueAt: new Date(Date.now() + 30 * 86400000),
      status: 'COMPLIANT',
      completedAt: new Date(),
      isActive: true
    });

    // Assignment 2: Employee 2 is OVERDUE
    await ComplianceAssignment.create({
      complianceRequirement: complianceReq1._id,
      employee: employee2._id,
      dueAt: new Date(Date.now() - 10 * 86400000),
      status: 'OVERDUE',
      isActive: true
    });
  });

  afterAll(async () => {
    await ComplianceAssignment.deleteMany({});
    await ComplianceRequirement.deleteMany({});
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('9.1: All 8 analytics endpoints respond with consistent, non-drifting authoritative figures', async () => {
    // 1. Overview Analytics
    const overviewRes = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const ov = overviewRes.body.data;
    expect(ov.employees.total).toBe(2);
    expect(ov.departments.total).toBe(2);
    expect(ov.courses.total).toBe(2);
    expect(ov.enrollments.total).toBe(2);
    expect(ov.enrollments.completed).toBe(1);
    expect(ov.assessments.attempts).toBe(2);
    expect(ov.assessments.passed).toBe(1);
    expect(ov.assessments.passRate).toBe(50);     // 1 passed of 2 attempts = 50%
    expect(ov.compliance.total).toBe(2);
    expect(ov.compliance.compliant).toBe(1);
    expect(ov.compliance.complianceRate).toBe(50); // 1 compliant of 2 assignments = 50%

    // 2. Learning Analytics
    const learningRes = await request(app)
      .get('/api/analytics/learning')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const lr = learningRes.body.data;
    expect(lr.totalEnrollments).toBe(2);
    expect(lr.completed).toBe(1);
    expect(lr.inProgress).toBe(1);
    expect(lr.completionRate).toBe(50);

    // Cross-module consistency check
    expect(ov.enrollments.total).toBe(lr.totalEnrollments);
    expect(ov.enrollments.completed).toBe(lr.completed);

    // 3. Assessments Analytics
    const assessRes = await request(app)
      .get('/api/analytics/assessments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const as = assessRes.body.data;
    expect(as.totalAttempts).toBe(2);
    expect(as.passed).toBe(1);
    expect(as.failed).toBe(1);
    expect(as.passRate).toBe(50);
    expect(ov.assessments.passRate).toBe(as.passRate);

    // 4. Compliance Analytics
    const compRes = await request(app)
      .get('/api/analytics/compliance')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const cp = compRes.body.data;
    expect(cp.totalAssignments).toBe(2);
    expect(cp.compliant).toBe(1);
    expect(cp.overdue).toBe(1);
    expect(cp.complianceRate).toBe(50);
    expect(ov.compliance.complianceRate).toBe(cp.complianceRate);

    // 5. Certifications Analytics
    const certRes = await request(app)
      .get('/api/analytics/certifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const cr = certRes.body.data;
    expect(cr.totalIssued).toBe(1);
    expect(cr.active).toBe(1);
    expect(ov.certificates.active).toBe(cr.active);

    // 6. Employees Analytics
    const empRes = await request(app)
      .get('/api/analytics/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const em = empRes.body.data;
    expect(em.totalEmployees).toBe(2);
    expect(em.activeEmployees).toBe(2);
    expect(ov.employees.total).toBe(em.totalEmployees);

    // 7. Departments Analytics
    const deptRes = await request(app)
      .get('/api/analytics/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const dp = deptRes.body.data;
    expect(dp.departments.length).toBe(2);
    expect(dp.pagination.total).toBe(2);

    // 8. Courses Analytics
    const courseRes = await request(app)
      .get('/api/analytics/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const cs = courseRes.body.data;
    expect(cs.courses.length).toBe(2);
    expect(cs.pagination.total).toBe(2);
  });

  it('9.2: RBAC defense: Non-admin users are strictly blocked from analytics endpoints', async () => {
    // Trainer blocked from analytics
    await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${trainerToken}`)
      .expect(403);

    // Employee blocked from analytics
    await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(403);

    // Unauthenticated blocked
    await request(app)
      .get('/api/analytics/overview')
      .expect(401);
  });
});
