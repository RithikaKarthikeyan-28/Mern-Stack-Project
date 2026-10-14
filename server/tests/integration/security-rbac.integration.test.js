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
const Assessment = require('../../src/models/Assessment');
const AssessmentAttempt = require('../../src/models/AssessmentAttempt');
const Certificate = require('../../src/models/Certificate');
const Notification = require('../../src/models/Notification');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 10 & 11 Integration: Multi-Role Boundaries & IDOR Anti-Enumeration Defense', () => {
  let adminToken;
  let trainerTokenA;
  let trainerTokenB;
  let employeeTokenA;
  let employeeTokenB;

  let adminUser;
  let trainerUserA;
  let trainerUserB;
  let employeeUserA;
  let employeeUserB;

  let department;
  let employeeProfileA;
  let employeeProfileB;

  let courseA;
  let courseB;
  let lessonA;
  let lessonB;

  let assessmentA;
  let assessmentB;

  let enrollmentA;
  let enrollmentB;

  let attemptA;
  let attemptB;

  let certA;
  let certB;

  let notifA;
  let notifB;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    try {
      await Certificate.collection.dropIndexes();
      await Notification.collection.dropIndexes();
    } catch (e) {
      // ignore
    }
    await Certificate.syncIndexes();
    await Notification.syncIndexes();

    await Notification.deleteMany({});
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Department
    department = await Department.create({
      name: 'Security & Access Control Dept',
      description: 'Department for RBAC testing'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Super Admin',
      email: 'super.admin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'trainer.alice@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'trainer.bob@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUserA = await User.create({
      name: 'Employee Arthur',
      email: 'employee.arthur@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    employeeUserB = await User.create({
      name: 'Employee Beatrice',
      email: 'employee.beatrice@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    // 3. Tokens
    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerTokenA = jwt.sign(
      { userId: trainerUserA._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerTokenB = jwt.sign(
      { userId: trainerUserB._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeTokenA = jwt.sign(
      { userId: employeeUserA._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeTokenB = jwt.sign(
      { userId: employeeUserB._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // 4. Employee Profiles
    employeeProfileA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-SEC-01',
      department: department._id,
      designation: 'Backend Developer',
      phone: '9444433331',
      isActive: true
    });

    employeeProfileB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-SEC-02',
      department: department._id,
      designation: 'Frontend Developer',
      phone: '9444433332',
      isActive: true
    });

    // 5. Courses
    // Course A owned by Trainer A
    courseA = await Course.create({
      title: 'Course Alpha by Trainer A',
      description: 'Course owned strictly by Trainer A',
      category: 'technical',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    const modA = await Module.create({
      course: courseA._id,
      title: 'Module A1',
      order: 1,
      isActive: true
    });

    lessonA = await Lesson.create({
      module: modA._id,
      title: 'Lesson A1',
      contentType: 'text',
      content: 'Content A1',
      order: 1,
      isActive: true
    });

    // Course B owned by Trainer B
    courseB = await Course.create({
      title: 'Course Beta by Trainer B',
      description: 'Course owned strictly by Trainer B',
      category: 'technical',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    const modB = await Module.create({
      course: courseB._id,
      title: 'Module B1',
      order: 1,
      isActive: true
    });

    lessonB = await Lesson.create({
      module: modB._id,
      title: 'Lesson B1',
      contentType: 'text',
      content: 'Content B1',
      order: 1,
      isActive: true
    });

    // 6. Assessments
    assessmentA = await Assessment.create({
      title: 'Assessment Alpha',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'draft',
      passingPercentage: 60,
      isActive: true
    });

    assessmentB = await Assessment.create({
      title: 'Assessment Beta',
      course: courseB._id,
      trainer: trainerUserB._id,
      status: 'draft',
      passingPercentage: 60,
      isActive: true
    });

    // 7. Enrollments
    enrollmentA = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseA._id,
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date(),
      isActive: true
    });

    enrollmentB = await Enrollment.create({
      employee: employeeProfileB._id,
      course: courseB._id,
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date(),
      isActive: true
    });

    // 8. Assessment Attempts
    attemptA = await AssessmentAttempt.create({
      employee: employeeProfileA._id,
      assessment: assessmentA._id,
      enrollment: enrollmentA._id,
      attemptNumber: 1,
      status: 'submitted',
      totalMarks: 10,
      obtainedMarks: 9,
      percentage: 90,
      result: 'passed',
      submittedAt: new Date(),
      evaluatedAt: new Date()
    });

    attemptB = await AssessmentAttempt.create({
      employee: employeeProfileB._id,
      assessment: assessmentB._id,
      enrollment: enrollmentB._id,
      attemptNumber: 1,
      status: 'submitted',
      totalMarks: 10,
      obtainedMarks: 8,
      percentage: 80,
      result: 'passed',
      submittedAt: new Date(),
      evaluatedAt: new Date()
    });

    // 9. Certificates
    certA = await Certificate.create({
      employee: employeeProfileA._id,
      course: courseA._id,
      enrollment: enrollmentA._id,
      certificateNumber: 'SKILLTRACK-2026-SECA0001',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000)
    });

    certB = await Certificate.create({
      employee: employeeProfileB._id,
      course: courseB._id,
      enrollment: enrollmentB._id,
      certificateNumber: 'SKILLTRACK-2026-SECB0001',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000)
    });

    // 10. Notifications
    notifA = await Notification.create({
      recipient: employeeUserA._id,
      type: 'certificate_expiring',
      title: 'Notice for Arthur',
      message: 'Arthur certificate expiring',
      relatedCertificate: certA._id,
      eventKey: `test:notif:a:${certA._id}`
    });

    notifB = await Notification.create({
      recipient: employeeUserB._id,
      type: 'certificate_expiring',
      title: 'Notice for Beatrice',
      message: 'Beatrice certificate expiring',
      relatedCertificate: certB._id,
      eventKey: `test:notif:b:${certB._id}`
    });
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Workflow 10: Multi-Role Boundary Enforcement & Cross-Tenant Simulation', () => {
    it('10.1: Trainers are strictly isolated to their own courses, modules, and assessments', async () => {
      // 1. Trainer A cannot modify Course B (owned by Trainer B) -> 403 Forbidden
      const updateRes = await request(app)
        .patch(`/api/courses/${courseB._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ title: 'Tampered Title by Unauthorized Trainer' })
        .expect(403);

      expect(updateRes.body.message).toMatch(/only update courses you own/i);

      // 2. Trainer A cannot update or publish Assessment B (owned by Trainer B) -> 403 Forbidden
      await request(app)
        .patch(`/api/assessments/${assessmentB._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ title: 'Tampered Assessment Title' })
        .expect(403);

      await request(app)
        .patch(`/api/assessments/${assessmentB._id}/publish`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      // 3. Trainer A querying enrollments for Course B receives empty list -> scoped away
      const enrRes = await request(app)
        .get(`/api/enrollments?course=${courseB._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(enrRes.body.data.enrollments.length).toBe(0);

      // 4. Trainer A can legitimately update their own Course A and Assessment A
      await request(app)
        .patch(`/api/courses/${courseA._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ title: 'Legitimately Updated Alpha Title' })
        .expect(200);

      await request(app)
        .patch(`/api/assessments/${assessmentA._id}/publish`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      // 5. Admin possesses universal authority across both courses
      await request(app)
        .patch(`/api/courses/${courseB._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Authorized Beta Title' })
        .expect(200);
    });
  });

  describe('Workflow 11: Insecure Direct Object Reference (IDOR) & Anti-Enumeration Defense', () => {
    it('11.1: Employees attempting to access peer resources receive 404 (Anti-Enumeration)', async () => {
      // 1. Employee A accesses Employee B's Enrollment -> 404
      await request(app)
        .get(`/api/enrollments/${enrollmentB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);

      // 2. Employee A attempts to update progress on Employee B's Enrollment -> 404
      await request(app)
        .patch(`/api/enrollments/${enrollmentB._id}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonB._id.toString(), completed: true })
        .expect(404);

      // 3. Employee A accesses Employee B's Assessment Attempt -> 404
      await request(app)
        .get(`/api/assessments/attempts/${attemptB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);

      // 4. Employee A accesses Employee B's Attempt Result -> 404
      await request(app)
        .get(`/api/assessments/attempts/${attemptB._id}/result`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);

      // 5. Employee A accesses Employee B's Certificate -> 404
      await request(app)
        .get(`/api/certificates/${certB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);

      // 6. Employee A attempts to renew Employee B's Certificate -> 404
      await request(app)
        .post(`/api/certificates/${certB._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ reason: 'Malicious renewal attempt' })
        .expect(404);

      // 7. Employee A accesses Employee B's Notification -> 404
      await request(app)
        .get(`/api/notifications/${notifB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);

      // 8. Employee A attempts to mark Employee B's Notification as read -> 404
      await request(app)
        .patch(`/api/notifications/${notifB._id}/read`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);

      // 9. Employee B inversely receives 404 when probing Employee A's Certificate & Notification
      await request(app)
        .get(`/api/certificates/${certA._id}`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .expect(404);

      await request(app)
        .get(`/api/notifications/${notifA._id}`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .expect(404);
    });

    it('11.2: Employees attempting administrative operations receive 403 Forbidden', async () => {
      // 1. Employee cannot view administrative compliance summary
      await request(app)
        .get('/api/compliance/summary')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(403);

      // 2. Employee cannot create employee profiles
      await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          user: new mongoose.Types.ObjectId(),
          employeeId: 'EMP-HACK-01',
          department: department._id,
          designation: 'Hacker',
          phone: '9999999999'
        })
        .expect(403);

      // 3. Employee cannot create compliance requirements
      await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          title: 'Malicious Requirement',
          course: courseA._id,
          frequency: 'annual',
          dueWithinDays: 30
        })
        .expect(403);
    });
  });
});
