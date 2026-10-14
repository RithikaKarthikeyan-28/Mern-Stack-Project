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
const Notification = require('../../src/models/Notification');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 5 Integration: Certificate Renewal & Expiration Notifications', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser;
  let department;
  let employeeDoc;

  let testCourse;
  let testModule;
  let testLesson;
  let enrollmentDoc;
  let certADoc;

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
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Department
    department = await Department.create({
      name: 'Renewal Testing Dept',
      description: 'Department for testing renewal flows'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Renewal Admin',
      email: 'renewal.admin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Renewal Trainer',
      email: 'renewal.trainer@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Renewal Student',
      email: 'renewal.student@skilltrack.test',
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
        employeeId: 'EMP-REN-01',
        department: department._id.toString(),
        designation: 'Staff Security Engineer',
        phone: '9123456780'
      })
      .expect(201);

    employeeDoc = empRes.body.data.employee;

    // 5. Course with 1 lesson
    testCourse = await Course.create({
      title: 'Infrastructure Security & Compliance',
      description: 'Security compliance course with certificate renewal',
      category: 'technical',
      level: 'advanced',
      duration: 20,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    testModule = await Module.create({
      course: testCourse._id,
      title: 'Module 1: Access Controls',
      order: 1,
      isActive: true
    });

    testLesson = await Lesson.create({
      module: testModule._id,
      title: 'Lesson 1: Zero Trust Architecture',
      contentType: 'text',
      content: 'Never trust, always verify.',
      order: 1,
      isActive: true
    });

    // 6. Employee enrolls, completes course, and issues initial certificate
    const enrRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ course: testCourse._id.toString() })
      .expect(201);

    const enrollmentId = enrRes.body.data.enrollment.id || enrRes.body.data.enrollment._id;

    // Complete lesson to 100%
    await request(app)
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ lessonId: testLesson._id.toString(), completed: true })
      .expect(200);

    // Issue initial Certificate A
    const certRes = await request(app)
      .post('/api/certificates')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ enrollmentId })
      .expect(201);

    certADoc = certRes.body.data.certificate;
  });

  afterAll(async () => {
    await Notification.deleteMany({});
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

  it('5.1: Renewal window enforcement & expiring notification scan with eventKey deduplication', async () => {
    const certAId = certADoc._id || certADoc.id;

    // Step 1: Early renewal attempt outside the window is rejected with 400
    const earlyRenewRes = await request(app)
      .post(`/api/certificates/${certAId}/renew`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ reason: 'Premature renewal' })
      .expect(400);

    expect(earlyRenewRes.body.message).toMatch(/not eligible for renewal yet/i);

    // Step 2: Trigger admin notification scan before expiry window - no expiring notifications generated
    await request(app)
      .post('/api/notifications/process-expiries')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const initialNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(initialNotifRes.body.data.notifications.length).toBe(0);

    // Step 3: Advance certificate expiry into the renewal window (15 days from now)
    const fifteenDaysFuture = new Date(Date.now() + 15 * 86400000);
    await Certificate.findByIdAndUpdate(certAId, { expiresAt: fifteenDaysFuture });

    // Step 4: Admin triggers notification scan
    const scanRes = await request(app)
      .post('/api/notifications/process-expiries')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(scanRes.body.success).toBe(true);
    expect(scanRes.body.data.expiringProcessed).toBeGreaterThanOrEqual(1);

    // Step 5: Employee retrieves notifications and sees certificate_expiring
    const empNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(empNotifRes.body.data.notifications.length).toBe(1);
    const expiringNotif = empNotifRes.body.data.notifications[0];
    expect(expiringNotif.type).toBe('certificate_expiring');
    expect(expiringNotif.isRead).toBe(false);

    // Step 6: EventKey Deduplication - Re-running the scan must NOT create duplicate notifications
    await request(app)
      .post('/api/notifications/process-expiries')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const dedupeNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(dedupeNotifRes.body.data.notifications.length).toBe(1);

    // Step 7: Employee marks notification as read
    const notifId = expiringNotif._id || expiringNotif.id;
    const readRes = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(readRes.body.data.notification.isRead).toBe(true);
  });

  it('5.2: Certificate renewal execution, renewal chain, idempotency, and revocation barrier', async () => {
    const certAId = certADoc._id || certADoc.id;

    // Step 1: Employee successfully renews certificate within renewal window
    const renewRes = await request(app)
      .post(`/api/certificates/${certAId}/renew`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ reason: 'Annual compliance recertification' })
      .expect(201);

    expect(renewRes.body.success).toBe(true);
    const certB = renewRes.body.data.certificate;
    const certBId = certB._id || certB.id;

    // Verify child certificate attributes
    expect(certB.certificateNumber).toBeDefined();
    expect(certB.certificateNumber).not.toBe(certADoc.certificateNumber);
    expect(certB.status).toBe('active');
    const parentRef = certB.renewedFrom?._id || certB.renewedFrom?.id || certB.renewedFrom;
    expect(parentRef.toString()).toBe(certAId.toString());

    // Step 2: Renewal History Chain
    const chainRes = await request(app)
      .get(`/api/certificates/${certAId}/renewals`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(chainRes.body.data.renewals.length).toBe(1);
    expect(chainRes.body.data.renewals[0].certificateNumber).toBe(certB.certificateNumber);

    // Step 3: Renewal Idempotency - Calling renew on parent again returns existing child with 200
    const duplicateRenewRes = await request(app)
      .post(`/api/certificates/${certAId}/renew`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ reason: 'Duplicate renewal call' })
      .expect(200);

    expect(duplicateRenewRes.body.data.certificate.certificateNumber).toBe(certB.certificateNumber);

    // Step 4: Admin revokes child certificate
    const revokeRes = await request(app)
      .patch(`/api/certificates/${certBId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Security clearance rescinded' })
      .expect(200);

    expect(revokeRes.body.data.certificate.status).toBe('revoked');

    // Step 5: Revocation Barrier - Cannot renew a revoked certificate
    await request(app)
      .post(`/api/certificates/${certBId}/renew`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ reason: 'Attempt renewal on revoked certificate' })
      .expect(409);
  });
});
