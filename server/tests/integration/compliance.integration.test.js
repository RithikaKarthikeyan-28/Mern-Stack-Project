const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const config = require('../../src/config');
const User = require('../../src/models/User');
const Department = require('../../src/models/Department');
const Employee = require('../../src/models/Employee');
const Course = require('../../src/models/Course');
const Module = require('../../src/models/Module');
const Lesson = require('../../src/models/Lesson');
const Enrollment = require('../../src/models/Enrollment');
const Certificate = require('../../src/models/Certificate');
const ComplianceRequirement = require('../../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../../src/models/ComplianceAssignment');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 8 Integration: Compliance Management & Learning Sync', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser;
  let department;
  let employeeDoc;

  let securityCourse;
  let safetyCourse;
  let secModule;
  let secLesson;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    try {
      await ComplianceAssignment.collection.dropIndexes();
      await ComplianceRequirement.collection.dropIndexes();
      await Certificate.collection.dropIndexes();
    } catch (e) {
      // ignore
    }
    await ComplianceAssignment.syncIndexes();
    await ComplianceRequirement.syncIndexes();
    await Certificate.syncIndexes();

    await ComplianceAssignment.deleteMany({});
    await ComplianceRequirement.deleteMany({});
    await Certificate.deleteMany({});
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Department
    department = await Department.create({
      name: 'Governance & Compliance Dept',
      description: 'Department overseeing regulatory compliance'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Compliance Officer',
      email: 'compliance.admin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Security Instructor',
      email: 'security.trainer@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Charlie Trainee',
      email: 'charlie.trainee@skilltrack.test',
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
      { userId: employeeUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // 4. Employee profile
    const empRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: employeeUser._id.toString(),
        employeeId: 'EMP-COMP-01',
        department: department._id.toString(),
        designation: 'Operations Analyst',
        phone: '9777766661'
      })
      .expect(201);

    employeeDoc = empRes.body.data.employee;

    // 5. Courses
    securityCourse = await Course.create({
      title: 'Mandatory Information Security 2026',
      description: 'Annual corporate data protection and security',
      category: 'compliance',
      level: 'beginner',
      duration: 15,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    secModule = await Module.create({
      course: securityCourse._id,
      title: 'Module 1: Phishing Prevention',
      order: 1,
      isActive: true
    });

    secLesson = await Lesson.create({
      module: secModule._id,
      title: 'Lesson 1: Identifying Email Threats',
      contentType: 'text',
      content: 'Examine sender headers and suspicious links.',
      order: 1,
      isActive: true
    });

    safetyCourse = await Course.create({
      title: 'Workplace Safety & Hazard Protocol',
      description: 'Physical workplace safety compliance',
      category: 'compliance',
      level: 'beginner',
      duration: 10,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });
  });

  afterAll(async () => {
    await ComplianceAssignment.deleteMany({});
    await ComplianceRequirement.deleteMany({});
    await Certificate.deleteMany({});
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('8.1: Compliance Requirement creation, assignment, NOT_STARTED and DUE_SOON derived statuses', async () => {
    const empId = employeeDoc._id || employeeDoc.id;

    // Step 1: Admin creates compliance requirement (due in 60 days)
    const reqRes = await request(app)
      .post('/api/compliance-requirements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Information Security Annual Training',
        description: 'Mandatory for all active staff',
        course: securityCourse._id.toString(),
        frequency: 'annual',
        dueWithinDays: 60
      })
      .expect(201);

    const requirement = reqRes.body.data.requirement;
    const reqId = requirement._id || requirement.id;
    expect(requirement.title).toBe('Information Security Annual Training');
    expect(requirement.dueWithinDays).toBe(60);

    // Step 2: Admin assigns requirement to employee
    const assignRes = await request(app)
      .post(`/api/compliance-requirements/${reqId}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: empId })
      .expect(201);

    const assignment = assignRes.body.data.assignment;
    const assignId = assignment._id || assignment.id;
    expect(assignment.status).toBe('NOT_STARTED');

    // Step 3: Employee checks compliance - initially NOT_STARTED (>30 days away)
    const empCompRes1 = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(empCompRes1.body.data.assignments.length).toBe(1);
    expect(empCompRes1.body.data.assignments[0].status).toBe('NOT_STARTED');
    expect(empCompRes1.body.data.assignments[0].daysRemaining).toBeGreaterThan(30);

    // Step 4: Advance dueAt date into the DUE_SOON threshold (10 days from now)
    const tenDaysFromNow = new Date(Date.now() + 10 * 86400000);
    await ComplianceAssignment.findByIdAndUpdate(assignId, { dueAt: tenDaysFromNow });

    // Step 5: Employee checks compliance - dynamically evaluated as DUE_SOON
    const empCompRes2 = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(empCompRes2.body.data.assignments[0].status).toBe('DUE_SOON');
    expect(empCompRes2.body.data.assignments[0].daysRemaining).toBeLessThanOrEqual(10);
  });

  it('8.2: State transitions: IN_PROGRESS, COMPLIANT upon course completion, and OVERDUE when deadline passes', async () => {
    const empId = employeeDoc._id || employeeDoc.id;

    // Step 1: Employee enrolls in the required security course
    const enrRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ course: securityCourse._id.toString() })
      .expect(201);

    const enrollmentId = enrRes.body.data.enrollment.id || enrRes.body.data.enrollment._id;

    // Set enrollment to in_progress
    await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'in_progress', progressPercentage: 50 });

    // Step 2: Employee checks compliance - evaluates to IN_PROGRESS
    const empCompRes3 = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(empCompRes3.body.data.assignments[0].status).toBe('IN_PROGRESS');

    // Step 3: Employee completes the lesson and reaches 100%
    await request(app)
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ lessonId: secLesson._id.toString(), completed: true })
      .expect(200);

    // Step 4: Employee checks compliance - evaluates to COMPLIANT
    const empCompRes4 = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(empCompRes4.body.data.assignments[0].status).toBe('COMPLIANT');

    // Step 5: Employee checks compliance summary metrics
    const summaryRes = await request(app)
      .get('/api/employees/me/compliance/summary')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(summaryRes.body.data.totalAssignments).toBe(1);
    expect(summaryRes.body.data.compliant).toBe(1);
    expect(summaryRes.body.data.complianceRate).toBe(100);

    // Step 6: OVERDUE scenario - Admin creates second requirement (Safety)
    const req2Res = await request(app)
      .post('/api/compliance-requirements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Workplace Safety Protocol',
        description: 'Mandatory workplace hazard training',
        course: safetyCourse._id.toString(),
        frequency: 'one_time',
        dueWithinDays: 14
      })
      .expect(201);

    const req2Id = req2Res.body.data.requirement._id || req2Res.body.data.requirement.id;

    // Assign to employee
    const assign2Res = await request(app)
      .post(`/api/compliance-requirements/${req2Id}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: empId })
      .expect(201);

    const assign2Id = assign2Res.body.data.assignment._id || assign2Res.body.data.assignment.id;

    // Set dueAt to 5 days in the past (overdue!)
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
    await ComplianceAssignment.findByIdAndUpdate(assign2Id, { dueAt: fiveDaysAgo });

    // Step 7: Admin overall compliance summary reflects both COMPLIANT and OVERDUE
    const adminSummaryRes = await request(app)
      .get('/api/compliance/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminSummaryRes.body.data.totalAssignments).toBe(2);
    expect(adminSummaryRes.body.data.compliant).toBe(1);
    expect(adminSummaryRes.body.data.overdue).toBe(1);
    expect(adminSummaryRes.body.data.complianceRate).toBe(50);
  });
});
