const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Certificate = require('../src/models/Certificate');
const config = require('../src/config');
const {
  validateIssueCertificate,
  validateRevokeCertificate,
  validateRenewal,
  validateExpiringQuery,
  validateAdminCertificateQuery,
  validateEmployeeCertificateQuery
} = require('../src/validators/certificate.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Certificate Management Tests (Phase 12)', () => {
  let adminToken;
  let trainerTokenA;
  let trainerTokenB;
  let employeeTokenA;
  let employeeTokenB;
  let noProfileToken;

  let adminUser;
  let trainerUserA;
  let trainerUserB;
  let employeeUserA;
  let employeeUserB;
  let noProfileUser;

  let department;
  let employeeProfileA;
  let employeeProfileB;
  let inactiveEmployeeUser;
  let inactiveEmployeeProfile;
  let inactiveEmployeeToken;

  let courseA;
  let courseB;
  let courseC;
  let draftCourse;
  let inactiveCourse;

  let completedEnrollmentA;
  let completedEnrollmentB;
  let inProgressEnrollment;
  let droppedEnrollment;
  let inactiveEnrollment;
  let uncompletedEnrollment;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    try {
      await Certificate.collection.dropIndexes();
    } catch (err) {
      // ignore if collection does not exist
    }
    await Certificate.syncIndexes();

    await Certificate.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    department = await Department.create({
      name: 'Cert Engineering',
      description: 'Certification Testing Dept'
    });

    adminUser = await User.create({
      name: 'Cert Admin',
      email: 'cert_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Arthur',
      email: 'cert_trainer_a@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Beatrice',
      email: 'cert_trainer_b@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUserA = await User.create({
      name: 'Employee Alice',
      email: 'cert_alice@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeUserB = await User.create({
      name: 'Employee Bob',
      email: 'cert_bob@example.com',
      password: 'Password123',
      role: 'employee'
    });

    noProfileUser = await User.create({
      name: 'No Profile User',
      email: 'cert_noprofile@example.com',
      password: 'Password123',
      role: 'employee'
    });

    inactiveEmployeeUser = await User.create({
      name: 'Inactive Employee',
      email: 'cert_inactive@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeProfileA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-CERT-001',
      department: department._id,
      designation: 'Senior Software Engineer'
    });

    employeeProfileB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-CERT-002',
      department: department._id,
      designation: 'QA Engineer'
    });

    inactiveEmployeeProfile = await Employee.create({
      user: inactiveEmployeeUser._id,
      employeeId: 'EMP-CERT-003',
      department: department._id,
      designation: 'Contractor',
      isActive: false
    });

    adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, config.jwtSecret, { expiresIn: '1h' });
    trainerTokenA = jwt.sign({ userId: trainerUserA._id, role: trainerUserA.role }, config.jwtSecret, { expiresIn: '1h' });
    trainerTokenB = jwt.sign({ userId: trainerUserB._id, role: trainerUserB.role }, config.jwtSecret, { expiresIn: '1h' });
    employeeTokenA = jwt.sign({ userId: employeeUserA._id, role: employeeUserA.role }, config.jwtSecret, { expiresIn: '1h' });
    employeeTokenB = jwt.sign({ userId: employeeUserB._id, role: employeeUserB.role }, config.jwtSecret, { expiresIn: '1h' });
    noProfileToken = jwt.sign({ userId: noProfileUser._id, role: noProfileUser.role }, config.jwtSecret, { expiresIn: '1h' });
    inactiveEmployeeToken = jwt.sign({ userId: inactiveEmployeeUser._id, role: inactiveEmployeeUser.role }, config.jwtSecret, { expiresIn: '1h' });

    courseA = await Course.create({
      title: 'Full Stack Modern MERN',
      description: 'Comprehensive MERN stack certification course',
      category: 'Development',
      level: 'intermediate',
      duration: 40,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Advanced Cloud Architectures',
      description: 'Distributed cloud systems and DevOps',
      category: 'Cloud',
      level: 'advanced',
      duration: 30,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    courseC = await Course.create({
      title: 'DevOps & CI/CD Essentials',
      description: 'DevOps pipeline essentials',
      category: 'DevOps',
      level: 'beginner',
      duration: 15,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Draft Unreleased Course',
      description: 'Work in progress',
      category: 'Development',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    inactiveCourse = await Course.create({
      title: 'Deactivated Course',
      description: 'Course no longer active',
      category: 'Legacy',
      level: 'beginner',
      duration: 5,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: false
    });

    completedEnrollmentA = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseA._id,
      status: 'completed',
      progressPercentage: 100,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(),
      isActive: true
    });

    completedEnrollmentB = await Enrollment.create({
      employee: employeeProfileB._id,
      course: courseA._id,
      status: 'completed',
      progressPercentage: 100,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(),
      isActive: true
    });

    inProgressEnrollment = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseB._id,
      status: 'in_progress',
      progressPercentage: 60,
      startedAt: new Date(),
      isActive: true
    });

    droppedEnrollment = await Enrollment.create({
      employee: employeeProfileB._id,
      course: courseB._id,
      status: 'dropped',
      progressPercentage: 100,
      isActive: true
    });

    inactiveEnrollment = await Enrollment.create({
      employee: employeeProfileA._id,
      course: draftCourse._id,
      status: 'completed',
      progressPercentage: 100,
      isActive: false
    });

    uncompletedEnrollment = await Enrollment.create({
      employee: employeeProfileA._id,
      course: inactiveCourse._id,
      status: 'completed',
      progressPercentage: 100,
      isActive: true
    });
  });

  afterAll(async () => {
    await Certificate.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ============================================================================
  // 1. CERTIFICATE MODEL & SCHEMA TESTS
  // ============================================================================
  describe('Certificate Model & Schema Constraints', () => {
    test('1. Certificate schema accepts valid data', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-TEST0001',
        issuedAt: new Date(),
        status: 'active'
      });
      const saved = await cert.save();
      expect(saved._id).toBeDefined();
      expect(saved.certificateNumber).toBe('SKILLTRACK-2026-TEST0001');
      expect(saved.status).toBe('active');
      await Certificate.deleteOne({ _id: saved._id });
    });

    test('2. requires employee reference', async () => {
      const cert = new Certificate({
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-TEST0002'
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.employee).toBeDefined();
    });

    test('3. requires course reference', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-TEST0003'
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.course).toBeDefined();
    });

    test('4. requires enrollment reference', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        certificateNumber: 'SKILLTRACK-2026-TEST0004'
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.enrollment).toBeDefined();
    });

    test('5. requires certificateNumber', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.certificateNumber).toBeDefined();
    });

    test('6. enforces certificateNumber uniqueness', async () => {
      const cert1 = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-UNIQUE01'
      });

      let err;
      try {
        await Certificate.create({
          employee: employeeProfileB._id,
          course: courseB._id,
          enrollment: completedEnrollmentB._id,
          certificateNumber: 'SKILLTRACK-2026-UNIQUE01'
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
      await Certificate.deleteOne({ _id: cert1._id });
    });

    test('7. rejects invalid status enum values', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-STATUS01',
        status: 'expired'
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    test('8. defaults issuedAt to Date.now and status to active', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-DEFAULTS'
      });
      expect(cert.status).toBe('active');
      expect(cert.issuedAt).toBeInstanceOf(Date);
      expect(cert.revokedAt).toBeNull();
      expect(cert.revokedBy).toBeNull();
      expect(cert.revocationReason).toBeNull();
    });

    test('9. validates revocation reason maxlength (<= 500 chars)', async () => {
      const longReason = 'A'.repeat(501);
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-REASON01',
        revocationReason: longReason
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.revocationReason).toBeDefined();
    });

    test('10. compound unique index enforces one certificate per employee and course', async () => {
      const cert1 = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-COMP01'
      });

      let err;
      try {
        await Certificate.create({
          employee: employeeProfileA._id,
          course: courseA._id,
          enrollment: completedEnrollmentA._id,
          certificateNumber: 'SKILLTRACK-2026-COMP02'
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
      await Certificate.deleteOne({ _id: cert1._id });
    });

    test('transforms toJSON mapping id and removing _id and __v', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-TRANSFORM'
      });
      const json = cert.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ============================================================================
  // 2. CERTIFICATE ISSUANCE & ELIGIBILITY TESTS
  // ============================================================================
  describe('POST /api/certificates - Certificate Issuance & Eligibility', () => {
    let createdCertA;

    test('11. Employee can issue certificate for completed enrollment', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/issued successfully/i);

      const cert = res.body.data.certificate;
      expect(cert.certificateNumber).toMatch(/^SKILLTRACK-\d{4}-[A-Z0-9]+$/);
      expect(cert.status).toBe('active');
      expect(cert.employee.id || cert.employee._id).toBe(employeeProfileA._id.toString());
      expect(cert.course.id || cert.course._id).toBe(courseA._id.toString());
      createdCertA = cert;
    });

    test('12-14. In-progress enrollment rejected (400)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ enrollmentId: inProgressEnrollment._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/completed/i);
    });

    test('15. Dropped enrollment rejected (400)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: droppedEnrollment._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/dropped/i);
    });

    test('16. Progress less than 100 rejected (400)', async () => {
      const partialEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: courseC._id,
        status: 'completed',
        progressPercentage: 99,
        isActive: true
      });

      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: partialEnrollment._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/100%/i);
      await Enrollment.deleteOne({ _id: partialEnrollment._id });
    });

    test('17. Wrong employee enrollment rejected (400)', async () => {
      // Employee B tries to use Employee A's completed enrollment
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belong to the authenticated employee/i);
    });

    test('18. Inactive enrollment rejected (400)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ enrollmentId: inactiveEnrollment._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive/i);
    });

    test('19. Inactive course rejected (400)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ enrollmentId: uncompletedEnrollment._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/course is inactive/i);
    });

    test('20. Draft/Unpublished course rejected (400)', async () => {
      const draftCourseEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: draftCourse._id,
        status: 'completed',
        progressPercentage: 100,
        isActive: true
      });

      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: draftCourseEnrollment._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not published/i);
      await Enrollment.deleteOne({ _id: draftCourseEnrollment._id });
    });

    test('21. Non-existent enrollment ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ enrollmentId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/enrollment not found/i);
    });

    test('22. Trainer cannot issue certificate (403)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('23. Admin cannot issue certificate via employee issuance endpoint (403)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('24. Unauthenticated issuance request rejected (401)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(401);
    });

    test('25. Certificate number and issuedAt are generated server-side', async () => {
      expect(createdCertA.certificateNumber).toMatch(/^SKILLTRACK-\d{4}-[A-Z0-9]+$/);
      expect(new Date(createdCertA.issuedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('26-30. Anti-injection: rejects client-supplied server-controlled fields (400)', async () => {
      // Injected employee
      const res1 = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id, employee: employeeProfileA._id });
      expect(res1.status).toBe(400);
      expect(res1.body.message).toMatch(/Client injection of employee is not allowed/i);

      // Injected course
      const res2 = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id, course: courseA._id });
      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/Client injection of course is not allowed/i);

      // Injected certificateNumber
      const res3 = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id, certificateNumber: 'CUSTOM-123' });
      expect(res3.status).toBe(400);
      expect(res3.body.message).toMatch(/Client injection of certificateNumber is not allowed/i);

      // Injected issuedAt
      const res4 = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id, issuedAt: new Date(2020, 1, 1) });
      expect(res4.status).toBe(400);
      expect(res4.body.message).toMatch(/Client injection of issuedAt is not allowed/i);

      // Injected status
      const res5 = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id, status: 'active' });
      expect(res5.status).toBe(400);
      expect(res5.body.message).toMatch(/Client injection of status is not allowed/i);

      // Injected progressPercentage
      const res6 = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id, progressPercentage: 100 });
      expect(res6.status).toBe(400);
      expect(res6.body.message).toMatch(/Client injection of progressPercentage is not allowed/i);
    });

    test('31-32. Duplicate issuance is idempotent and does not create duplicates', async () => {
      const initialCount = await Certificate.countDocuments({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      expect(initialCount).toBe(1);

      // Call issuance again for same employee and course enrollment
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/already issued/i);
      expect(res.body.data.certificate.certificateNumber).toBe(createdCertA.certificateNumber);

      const finalCount = await Certificate.countDocuments({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      expect(finalCount).toBe(1);
    });

    test('Employee B issues certificate for completed enrollment B', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id });

      expect(res.status).toBe(201);
      expect(res.body.data.certificate.status).toBe('active');
    });
  });

  // ============================================================================
  // 3. CERTIFICATE IMMUTABILITY & ANTI-TAMPERING TESTS
  // ============================================================================
  describe('Certificate Immutability & Modification Protections', () => {
    test('33-36. Modifying certificate via PUT/PATCH on generic endpoints does not exist (404/405)', async () => {
      const cert = await Certificate.findOne({ employee: employeeProfileA._id });
      // Attempting PUT /api/certificates/:id returns 404/405
      const res1 = await request(app)
        .put(`/api/certificates/${cert._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ certificateNumber: 'HACKED-001', employee: employeeProfileB._id });
      expect([404, 405]).toContain(res1.status);

      // Verification that document was not altered
      const unmodified = await Certificate.findById(cert._id);
      expect(unmodified.certificateNumber).toBe(cert.certificateNumber);
      expect(unmodified.employee.toString()).toBe(employeeProfileA._id.toString());
    });
  });

  // ============================================================================
  // 4. CERTIFICATE REVOCATION TESTS
  // ============================================================================
  describe('PATCH /api/certificates/:id/revoke - Certificate Revocation', () => {
    let certToRevoke;

    beforeAll(async () => {
      certToRevoke = await Certificate.findOne({ employee: employeeProfileB._id });
    });

    test('37. Trainer cannot revoke certificate (403)', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ reason: 'Malpractice' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('38. Employee cannot revoke certificate (403)', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ reason: 'Self revocation' });

      expect(res.status).toBe(403);
    });

    test('39. Unauthenticated revoke request rejected (401)', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .send({ reason: 'Unauthenticated' });

      expect(res.status).toBe(401);
    });

    test('40-42. Client cannot inject status, revokedAt, or revokedBy into revoke payload (400)', async () => {
      const res1 = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });
      expect(res1.status).toBe(400);
      expect(res1.body.message).toMatch(/Client injection of status is not allowed/i);

      const res2 = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revokedAt: new Date(2020, 1, 1) });
      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/Client injection of revokedAt is not allowed/i);

      const res3 = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revokedBy: adminUser._id });
      expect(res3.status).toBe(400);
      expect(res3.body.message).toMatch(/Client injection of revokedBy is not allowed/i);
    });

    test('43. Revocation reason exceeding 500 characters rejected (400)', async () => {
      const longReason = 'A'.repeat(501);
      const res = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: longReason });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/500 characters/i);
    });

    test('44. Admin can revoke active certificate with valid reason (200)', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violation of academic integrity during course' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const revoked = res.body.data.certificate;
      expect(revoked.status).toBe('revoked');
      expect(revoked.revocationReason).toBe('Violation of academic integrity during course');
      expect(revoked.revokedAt).toBeDefined();
      expect(revoked.revokedBy.id || revoked.revokedBy._id).toBe(adminUser._id.toString());
    });

    test('45. Already revoked certificate cannot be revoked again (400)', async () => {
      const res = await request(app)
        .patch(`/api/certificates/${certToRevoke._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Another reason' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already revoked/i);
    });

    test('46. Revocation preserves certificate record in DB (soft revocation)', async () => {
      const certInDb = await Certificate.findById(certToRevoke._id);
      expect(certInDb).not.toBeNull();
      expect(certInDb.status).toBe('revoked');
      expect(certInDb.certificateNumber).toBe(certToRevoke.certificateNumber);
    });

    test('47. Re-issuing after revocation is rejected (409 Conflict)', async () => {
      // Employee B tries to re-issue certificate for course A after it was revoked
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ enrollmentId: completedEnrollmentB._id });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/revoked and cannot be re-issued/i);
    });
  });

  // ============================================================================
  // 5. PUBLIC CERTIFICATE VERIFICATION TESTS
  // ============================================================================
  describe('GET /api/certificates/verify/:certificateNumber - Public Verification', () => {
    let activeCert;
    let revokedCert;

    beforeAll(async () => {
      activeCert = await Certificate.findOne({ employee: employeeProfileA._id });
      revokedCert = await Certificate.findOne({ employee: employeeProfileB._id });
    });

    test('48. Public verification works without authentication (200)', async () => {
      const res = await request(app)
        .get(`/api/certificates/verify/${activeCert.certificateNumber}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data.certificate;
      expect(data.certificateNumber).toBe(activeCert.certificateNumber);
      expect(data.status).toBe('active');
      expect(data.employeeName).toBe(employeeUserA.name);
      expect(data.courseTitle).toBe(courseA.title);
      expect(data.courseCategory).toBe(courseA.category);
      expect(data.courseLevel).toBe(courseA.level);
    });

    test('49. Case-insensitive lookup works on verification', async () => {
      const lower = activeCert.certificateNumber.toLowerCase();
      const res = await request(app).get(`/api/certificates/verify/${lower}`);
      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(activeCert.certificateNumber);
    });

    test('50. Unknown certificate number returns 404', async () => {
      const res = await request(app).get('/api/certificates/verify/SKILLTRACK-9999-NOTFOUND');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('51. Revoked certificate reports revoked status, revokedAt, and reason', async () => {
      const res = await request(app)
        .get(`/api/certificates/verify/${revokedCert.certificateNumber}`);

      expect(res.status).toBe(200);
      const data = res.body.data.certificate;
      expect(data.status).toBe('revoked');
      expect(data.revokedAt).toBeDefined();
      expect(data.revocationReason).toBe('Violation of academic integrity during course');
    });

    test('52-54. Public verification strictly strips passwords, emails, and DB IDs', async () => {
      const res = await request(app)
        .get(`/api/certificates/verify/${activeCert.certificateNumber}`);

      const data = res.body.data.certificate;
      expect(data.password).toBeUndefined();
      expect(data.passwordHash).toBeUndefined();
      expect(data.email).toBeUndefined();
      expect(data._id).toBeUndefined();
      expect(data.employeeId).toBeUndefined();
      expect(data.user).toBeUndefined();
    });
  });

  // ============================================================================
  // 6. EMPLOYEE CERTIFICATE HISTORY TESTS
  // ============================================================================
  describe('GET /api/certificates/me - Employee Certificate History', () => {
    test('55. Employee sees own certificates', async () => {
      const res = await request(app)
        .get('/api/certificates/me')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { certificates, pagination } = res.body.data;
      expect(Array.isArray(certificates)).toBe(true);
      expect(certificates.length).toBe(1);
      expect(certificates[0].course.title).toBe(courseA.title);
      expect(pagination.total).toBe(1);
      expect(pagination.page).toBe(1);
    });

    test('56. Employee B sees their revoked certificate', async () => {
      const res = await request(app)
        .get('/api/certificates/me')
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificates.length).toBe(1);
      expect(res.body.data.certificates[0].status).toBe('revoked');
    });

    test('57. Empty history for employee with no certificates', async () => {
      // Create fresh employee C with no certificates
      const userC = await User.create({
        name: 'Employee Charlie',
        email: 'cert_charlie@example.com',
        password: 'Password123',
        role: 'employee'
      });
      await Employee.create({
        user: userC._id,
        employeeId: 'EMP-CERT-004',
        department: department._id
      });
      const tokenC = jwt.sign({ userId: userC._id, role: 'employee' }, config.jwtSecret, { expiresIn: '1h' });

      const res = await request(app)
        .get('/api/certificates/me')
        .set('Authorization', `Bearer ${tokenC}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificates).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    test('58. Trainer cannot access /me endpoint (403)', async () => {
      const res = await request(app)
        .get('/api/certificates/me')
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
    });

    test('59. Admin cannot access /me endpoint (403)', async () => {
      const res = await request(app)
        .get('/api/certificates/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });

    test('60. Pagination query validation works on /me', async () => {
      const res1 = await request(app)
        .get('/api/certificates/me?page=0')
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get('/api/certificates/me?limit=150')
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res2.status).toBe(400);
    });
  });

  // ============================================================================
  // 7. CERTIFICATE DETAIL & ADMIN LIST TESTS
  // ============================================================================
  describe('Certificate Detail & Admin Listing Endpoints', () => {
    let certA;
    let certB;

    beforeAll(async () => {
      certA = await Certificate.findOne({ employee: employeeProfileA._id });
      certB = await Certificate.findOne({ employee: employeeProfileB._id });
    });

    test('61. Employee can view own certificate by ID (200)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${certA._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(certA.certificateNumber);
    });

    test('62. Employee cannot view another employee certificate (404 IDOR anti-enumeration)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${certB._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('63. Trainer can view certificate for course they authored (200)', async () => {
      // Course A is authored by Trainer A
      const res = await request(app)
        .get(`/api/certificates/${certA._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificate.course.title).toBe(courseA.title);
    });

    test('64. Trainer cannot view certificate for another trainer course (403)', async () => {
      // Trainer B tries to view certA (Course A authored by Trainer A)
      const res = await request(app)
        .get(`/api/certificates/${certA._id}`)
        .set('Authorization', `Bearer ${trainerTokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own courses/i);
    });

    test('65. Admin can view any certificate by ID (200)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${certA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(certA.certificateNumber);
    });

    test('66. Admin certificate listing works (200)', async () => {
      const res = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { certificates, pagination } = res.body.data;
      expect(certificates.length).toBeGreaterThanOrEqual(2);
      expect(pagination.total).toBeGreaterThanOrEqual(2);
    });

    test('67. Trainer cannot access admin certificate listing (403)', async () => {
      const res = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
    });

    test('68. Employee cannot access admin certificate listing (403)', async () => {
      const res = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(403);
    });

    test('69. Admin listing filters by status=active', async () => {
      const res = await request(app)
        .get('/api/certificates?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      expect(certs.every((c) => c.status === 'active')).toBe(true);
    });

    test('70. Admin listing filters by status=revoked', async () => {
      const res = await request(app)
        .get('/api/certificates?status=revoked')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      expect(certs.every((c) => c.status === 'revoked')).toBe(true);
    });

    test('71. Admin listing filters by course ID', async () => {
      const res = await request(app)
        .get(`/api/certificates?course=${courseA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificates.length).toBeGreaterThanOrEqual(1);
    });

    test('72. Admin listing filters by employee ID', async () => {
      const res = await request(app)
        .get(`/api/certificates?employee=${employeeProfileA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificates.length).toBe(1);
    });

    test('73. Admin listing pagination works', async () => {
      const res = await request(app)
        .get('/api/certificates?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificates.length).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  // ============================================================================
  // 8. ROUTE PRECEDENCE, EDGE CASES & VALIDATOR UNIT TESTS
  // ============================================================================
  describe('Route Precedence & Validation Error Handling', () => {
    test('74. Route precedence: /me does not get shadowed by /:id', async () => {
      const res = await request(app)
        .get('/api/certificates/me')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificates).toBeDefined();
    });

    test('75. Route precedence: /verify/:num does not get shadowed by /:id', async () => {
      const cert = await Certificate.findOne({ employee: employeeProfileA._id });
      const res = await request(app)
        .get(`/api/certificates/verify/${cert.certificateNumber}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(cert.certificateNumber);
    });

    test('76. Invalid certificate ObjectId in detail returns 400', async () => {
      const res = await request(app)
        .get('/api/certificates/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid certificate id/i);
    });

    test('77. Non-existent certificate ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/certificates/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    test('78. Employee with inactive profile cannot issue certificate (403)', async () => {
      // Completed enrollment for inactive employee
      const inactiveEnrollmentDoc = await Enrollment.create({
        employee: inactiveEmployeeProfile._id,
        course: courseA._id,
        status: 'completed',
        progressPercentage: 100,
        isActive: true
      });

      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${inactiveEmployeeToken}`)
        .send({ enrollmentId: inactiveEnrollmentDoc._id });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/inactive/i);
      await Enrollment.deleteOne({ _id: inactiveEnrollmentDoc._id });
    });

    test('79. Employee without profile cannot issue certificate (404)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${noProfileToken}`)
        .send({ enrollmentId: completedEnrollmentA._id });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/employee profile not found/i);
    });

    test('80. Validator unit test: validateIssueCertificate requires enrollmentId', () => {
      expect(() => validateIssueCertificate({})).toThrow(/enrollment id is required/i);
      expect(() => validateIssueCertificate({ enrollmentId: 'invalid' })).toThrow(/invalid enrollment id/i);
    });

    test('81. Validator unit test: validateRevokeCertificate checks reason length', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRevokeCertificate({ id: validId }, { reason: 'A'.repeat(501) })).toThrow(/500 characters/i);
      expect(() => validateRevokeCertificate({ id: 'bad' }, { reason: 'ok' })).toThrow(/invalid certificate id/i);
    });
  });

  // ============================================================================
  // PHASE 13: CERTIFICATE EXPIRY & RENEWAL TESTS
  // ============================================================================
  describe('Phase 13: Centralized Configuration Tests', () => {
    test('82. Centralized config: certificateValidityDays defaults to 365', () => {
      expect(config.certificateValidityDays).toBeDefined();
      expect(typeof config.certificateValidityDays).toBe('number');
      expect(config.certificateValidityDays).toBe(365);
    });

    test('83. Centralized config: certificateRenewalWindowDays defaults to 30', () => {
      expect(config.certificateRenewalWindowDays).toBeDefined();
      expect(typeof config.certificateRenewalWindowDays).toBe('number');
      expect(config.certificateRenewalWindowDays).toBe(30);
    });

    test('84. Centralized config: values are positive integers', () => {
      expect(Number.isInteger(config.certificateValidityDays)).toBe(true);
      expect(config.certificateValidityDays).toBeGreaterThan(0);
      expect(Number.isInteger(config.certificateRenewalWindowDays)).toBe(true);
      expect(config.certificateRenewalWindowDays).toBeGreaterThan(0);
    });

    test('85. Centralized config: renewal window is less than validity duration', () => {
      expect(config.certificateRenewalWindowDays).toBeLessThan(config.certificateValidityDays);
    });
  });

  describe('Phase 13: Certificate Model Expiry & Renewal Constraints', () => {
    test('86. Certificate Model: allows valid expiresAt date', async () => {
      const futureDate = new Date(Date.now() + 365 * 86400000);
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-SCHEMA01',
        expiresAt: futureDate
      });
      await cert.validate();
      expect(cert.expiresAt).toEqual(futureDate);
    });

    test('87. Certificate Model: allows renewedFrom ObjectId reference', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-SCHEMA02',
        renewedFrom: parentId
      });
      await cert.validate();
      expect(cert.renewedFrom.toString()).toBe(parentId.toString());
    });

    test('88. Certificate Model: allows renewedAt date and renewalReason', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-SCHEMA03',
        renewedAt: new Date(),
        renewalReason: 'Annual recertification requirement'
      });
      await cert.validate();
      expect(cert.renewalReason).toBe('Annual recertification requirement');
    });

    test('89. Certificate Model: rejects renewalReason exceeding 500 characters', async () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-SCHEMA04',
        renewalReason: 'R'.repeat(501)
      });
      let err;
      try {
        await cert.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.renewalReason).toBeDefined();
    });

    test('90. Certificate Model: getDerivedExpiry returns persisted expiresAt', () => {
      const exp = new Date(Date.now() + 100000);
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH01',
        expiresAt: exp
      });
      expect(cert.getDerivedExpiry()).toEqual(exp);
    });

    test('91. Certificate Model: getDerivedExpiry derives expiresAt from issuedAt + validityDays when null', () => {
      const issued = new Date(Date.now() - 100 * 86400000);
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH02',
        issuedAt: issued,
        expiresAt: null
      });
      const derived = cert.getDerivedExpiry();
      const expected = new Date(issued.getTime() + 365 * 86400000);
      expect(derived.getTime()).toBe(expected.getTime());
    });

    test('92. Certificate Model: getLifecycleStatus returns active for valid non-expired cert', () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH03',
        status: 'active',
        expiresAt: new Date(Date.now() + 100 * 86400000)
      });
      expect(cert.getLifecycleStatus()).toBe('active');
    });

    test('93. Certificate Model: getLifecycleStatus returns expired when expiresAt is in the past', () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH04',
        status: 'active',
        expiresAt: new Date(Date.now() - 10 * 86400000)
      });
      expect(cert.getLifecycleStatus()).toBe('expired');
    });

    test('94. Certificate Model: getLifecycleStatus returns revoked for revoked cert even if past expiry', () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH05',
        status: 'revoked',
        expiresAt: new Date(Date.now() - 50 * 86400000)
      });
      // Revocation ALWAYS takes precedence
      expect(cert.getLifecycleStatus()).toBe('revoked');
    });

    test('95. Certificate Model: getIsExpired returns true for past expiry, false for future', () => {
      const pastCert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH06',
        expiresAt: new Date(Date.now() - 1000)
      });
      expect(pastCert.getIsExpired()).toBe(true);

      const futureCert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-METH07',
        expiresAt: new Date(Date.now() + 1000000)
      });
      expect(futureCert.getIsExpired()).toBe(false);
    });

    test('96. Certificate Model: toJSON transforms include isExpired and derived lifecycleStatus', () => {
      const cert = new Certificate({
        employee: employeeProfileA._id,
        course: courseA._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-JSON01',
        status: 'active',
        expiresAt: new Date(Date.now() + 100 * 86400000)
      });
      const json = cert.toJSON();
      expect(json.isExpired).toBe(false);
      expect(json.lifecycleStatus).toBe('active');
    });

    test('97. Certificate Model: DB unique constraint prevents duplicate renewedFrom entries', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const cert1 = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseB._id,
        enrollment: inProgressEnrollment._id,
        certificateNumber: 'SKILLTRACK-2026-UNIQ01',
        renewedFrom: parentId
      });

      let duplicateErr;
      try {
        await Certificate.create({
          employee: employeeProfileA._id,
          course: courseB._id,
          enrollment: inProgressEnrollment._id,
          certificateNumber: 'SKILLTRACK-2026-UNIQ02',
          renewedFrom: parentId
        });
      } catch (e) {
        duplicateErr = e;
      }

      expect(duplicateErr).toBeDefined();
      expect(duplicateErr.code).toBe(11000);
      await Certificate.deleteOne({ _id: cert1._id });
    });
  });

  describe('Phase 13: Validator Unit Tests', () => {
    test('98. Validator unit test: validateRenewal accepts empty object (optional reason)', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, {})).not.toThrow();
    });

    test('99. Validator unit test: validateRenewal accepts valid reason <= 500 chars', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { reason: 'Standard annual renewal' })).not.toThrow();
    });

    test('100. Validator unit test: validateRenewal rejects reason > 500 chars', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { reason: 'R'.repeat(501) })).toThrow(/500 characters/i);
    });

    test('101. Validator unit test: validateRenewal rejects injected expiresAt', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { expiresAt: new Date() })).toThrow(/Client injection of expiresAt/i);
    });

    test('102. Validator unit test: validateRenewal rejects injected issuedAt', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { issuedAt: new Date() })).toThrow(/Client injection of issuedAt/i);
    });

    test('103. Validator unit test: validateRenewal rejects injected certificateNumber', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { certificateNumber: 'CUSTOM-NUM' })).toThrow(/Client injection of certificateNumber/i);
    });

    test('104. Validator unit test: validateRenewal rejects injected renewedFrom', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { renewedFrom: new mongoose.Types.ObjectId() })).toThrow(/Client injection of renewedFrom/i);
    });

    test('105. Validator unit test: validateRenewal rejects injected status', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateRenewal({ id: validId }, { status: 'active' })).toThrow(/Client injection of status/i);
    });

    test('106. Validator unit test: validateExpiringQuery accepts valid integer days', () => {
      expect(() => validateExpiringQuery({ days: '30' })).not.toThrow();
      expect(() => validateExpiringQuery({ days: 60 })).not.toThrow();
    });

    test('107. Validator unit test: validateExpiringQuery defaults days when omitted', () => {
      expect(() => validateExpiringQuery({})).not.toThrow();
    });

    test('108. Validator unit test: validateExpiringQuery rejects days <= 0', () => {
      expect(() => validateExpiringQuery({ days: '0' })).toThrow(/integer between 1 and 365/i);
      expect(() => validateExpiringQuery({ days: '-5' })).toThrow(/integer between 1 and 365/i);
    });

    test('109. Validator unit test: validateExpiringQuery rejects days > 365', () => {
      expect(() => validateExpiringQuery({ days: '366' })).toThrow(/integer between 1 and 365/i);
    });

    test('110. Validator unit test: validateExpiringQuery rejects non-numeric days', () => {
      expect(() => validateExpiringQuery({ days: 'invalid' })).toThrow(/integer between 1 and 365/i);
      expect(() => validateExpiringQuery({ days: '12.5' })).toThrow(/integer between 1 and 365/i);
    });

    test('111. Validator unit test: query validators accept status=expired', () => {
      expect(() => validateAdminCertificateQuery({ status: 'expired' })).not.toThrow();
      expect(() => validateEmployeeCertificateQuery({ status: 'expired' })).not.toThrow();
    });
  });

  describe('Phase 13: Public Verification with Expiry Metadata', () => {
    let activeCert;
    let expiredCert;
    let revokedExpiredCert;
    let renewedCert;

    beforeAll(async () => {
      activeCert = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseC._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-PUBVACT1',
        issuedAt: new Date(Date.now() - 10 * 86400000),
        expiresAt: new Date(Date.now() + 355 * 86400000),
        status: 'active'
      });

      expiredCert = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseB._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-PUBVEXP1',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000),
        status: 'active'
      });

      revokedExpiredCert = await Certificate.create({
        employee: employeeProfileB._id,
        course: courseC._id,
        enrollment: completedEnrollmentB._id,
        certificateNumber: 'SKILLTRACK-2026-PUBVRVK1',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000),
        status: 'revoked',
        revokedAt: new Date(Date.now() - 50 * 86400000),
        revocationReason: 'Academic misconduct'
      });

      renewedCert = await Certificate.create({
        employee: employeeProfileA._id,
        course: courseC._id,
        enrollment: completedEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-PUBVRNW1',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 86400000),
        status: 'active',
        renewedFrom: expiredCert._id,
        renewedAt: new Date(),
        renewalReason: 'Recertification completed'
      });
    });

    afterAll(async () => {
      await Certificate.deleteMany({
        _id: { $in: [activeCert._id, expiredCert._id, revokedExpiredCert._id, renewedCert._id] }
      });
    });

    test('112. Public verification: returns expiresAt, isExpired: false, lifecycleStatus: active for active cert', async () => {
      const res = await request(app).get(`/api/certificates/verify/${activeCert.certificateNumber}`);
      expect(res.status).toBe(200);
      const data = res.body.data.certificate;
      expect(data.certificateNumber).toBe(activeCert.certificateNumber);
      expect(data.lifecycleStatus).toBe('active');
      expect(data.isExpired).toBe(false);
      expect(data.expiresAt).toBeDefined();
    });

    test('113. Public verification: returns isExpired: true, lifecycleStatus: expired for expired cert', async () => {
      const res = await request(app).get(`/api/certificates/verify/${expiredCert.certificateNumber}`);
      expect(res.status).toBe(200);
      const data = res.body.data.certificate;
      expect(data.certificateNumber).toBe(expiredCert.certificateNumber);
      expect(data.lifecycleStatus).toBe('expired');
      expect(data.isExpired).toBe(true);
      expect(data.expiresAt).toBeDefined();
    });

    test('114. Public verification: returns lifecycleStatus: revoked for revoked cert even if expired', async () => {
      const res = await request(app).get(`/api/certificates/verify/${revokedExpiredCert.certificateNumber}`);
      expect(res.status).toBe(200);
      const data = res.body.data.certificate;
      expect(data.certificateNumber).toBe(revokedExpiredCert.certificateNumber);
      expect(data.lifecycleStatus).toBe('revoked');
      expect(data.isExpired).toBe(true);
      expect(data.revokedAt).toBeDefined();
      expect(data.revocationReason).toBe('Academic misconduct');
    });

    test('115. Public verification: returns renewal metadata (isRenewal, renewedFrom) for renewed cert', async () => {
      const res = await request(app).get(`/api/certificates/verify/${renewedCert.certificateNumber}`);
      expect(res.status).toBe(200);
      const data = res.body.data.certificate;
      expect(data.isRenewal).toBe(true);
      expect(data.renewedFrom).toBeDefined();
      expect(data.renewedFrom.certificateNumber).toBe(expiredCert.certificateNumber);
      expect(data.renewedFrom._id).toBeUndefined();
    });

    test('116. Public verification: never leaks password, email, or DB ObjectId', async () => {
      const res = await request(app).get(`/api/certificates/verify/${activeCert.certificateNumber}`);
      expect(res.status).toBe(200);
      const data = res.body.data.certificate;
      expect(data.password).toBeUndefined();
      expect(data.email).toBeUndefined();
      expect(data._id).toBeUndefined();
      expect(data.employee).toBeUndefined();
      expect(data.course?._id).toBeUndefined();
      expect(data.employeeName).toBeDefined();
    });

    test('117. Public verification: case-insensitive certificateNumber lookup works', async () => {
      const lower = activeCert.certificateNumber.toLowerCase();
      const res = await request(app).get(`/api/certificates/verify/${lower}`);
      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(activeCert.certificateNumber);
    });

    test('118. Public verification: non-existent certificate returns 404', async () => {
      const res = await request(app).get('/api/certificates/verify/SKILLTRACK-NON-EXISTENT');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Phase 13: GET /api/certificates/expiring - Expiring Certificates', () => {
    let certExpiringSoon;
    let certExpiringLater;
    let certExpired;
    let certRevokedExpiring;
    let expCourse1;
    let expCourse2;
    let expCourse3;
    let expCourse4;
    let expEnrollment1;
    let expEnrollment2;
    let expEnrollment3;
    let expEnrollment4;

    beforeAll(async () => {
      expCourse1 = await Course.create({ title: 'Expiring Course 1', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      expCourse2 = await Course.create({ title: 'Expiring Course 2', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      expCourse3 = await Course.create({ title: 'Expiring Course 3', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      expCourse4 = await Course.create({ title: 'Expiring Course 4', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });

      expEnrollment1 = await Enrollment.create({ employee: employeeProfileA._id, course: expCourse1._id, status: 'completed', progressPercentage: 100, isActive: true });
      expEnrollment2 = await Enrollment.create({ employee: employeeProfileA._id, course: expCourse2._id, status: 'completed', progressPercentage: 100, isActive: true });
      expEnrollment3 = await Enrollment.create({ employee: employeeProfileB._id, course: expCourse3._id, status: 'completed', progressPercentage: 100, isActive: true });
      expEnrollment4 = await Enrollment.create({ employee: employeeProfileB._id, course: expCourse4._id, status: 'completed', progressPercentage: 100, isActive: true });

      certExpiringSoon = await Certificate.create({
        employee: employeeProfileA._id,
        course: expCourse1._id,
        enrollment: expEnrollment1._id,
        certificateNumber: 'SKILLTRACK-2026-EXPIRING01',
        issuedAt: new Date(Date.now() - 350 * 86400000),
        expiresAt: new Date(Date.now() + 15 * 86400000), // in 15 days (within 30d window)
        status: 'active'
      });

      certExpiringLater = await Certificate.create({
        employee: employeeProfileA._id,
        course: expCourse2._id,
        enrollment: expEnrollment2._id,
        certificateNumber: 'SKILLTRACK-2026-EXPIRING02',
        issuedAt: new Date(Date.now() - 300 * 86400000),
        expiresAt: new Date(Date.now() + 65 * 86400000), // in 65 days (outside 30d window)
        status: 'active'
      });

      certExpired = await Certificate.create({
        employee: employeeProfileB._id,
        course: expCourse3._id,
        enrollment: expEnrollment3._id,
        certificateNumber: 'SKILLTRACK-2026-EXPIRING03',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 10 * 86400000), // already expired
        status: 'active'
      });

      certRevokedExpiring = await Certificate.create({
        employee: employeeProfileB._id,
        course: expCourse4._id,
        enrollment: expEnrollment4._id,
        certificateNumber: 'SKILLTRACK-2026-EXPIRING04',
        issuedAt: new Date(Date.now() - 350 * 86400000),
        expiresAt: new Date(Date.now() + 15 * 86400000),
        status: 'revoked',
        revokedAt: new Date()
      });
    });

    afterAll(async () => {
      const toDelete = [certExpiringSoon, certExpiringLater, certExpired, certRevokedExpiring].filter(Boolean).map(c => c._id);
      if (toDelete.length) await Certificate.deleteMany({ _id: { $in: toDelete } });
      const enrollmentsToDelete = [expEnrollment1, expEnrollment2, expEnrollment3, expEnrollment4].filter(Boolean).map(e => e._id);
      if (enrollmentsToDelete.length) await Enrollment.deleteMany({ _id: { $in: enrollmentsToDelete } });
      const coursesToDelete = [expCourse1, expCourse2, expCourse3, expCourse4].filter(Boolean).map(c => c._id);
      if (coursesToDelete.length) await Course.deleteMany({ _id: { $in: coursesToDelete } });
    });

    test('119. GET /api/certificates/expiring: Admin can query expiring certificates (200)', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.certificates)).toBe(true);
      expect(res.body.data.windowDays).toBe(30);
    });

    test('120. GET /api/certificates/expiring: Default window is 30 days and includes certExpiringSoon', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring')
        .set('Authorization', `Bearer ${adminToken}`);

      const certs = res.body.data.certificates;
      const found = certs.find((c) => c.certificateNumber === certExpiringSoon.certificateNumber);
      expect(found).toBeDefined();
      expect(found.lifecycleStatus).toBe('active');
    });

    test('121. GET /api/certificates/expiring: Admin can specify custom window days=70', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring?days=70')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.windowDays).toBe(70);
      const certs = res.body.data.certificates;
      const foundLater = certs.find((c) => c.certificateNumber === certExpiringLater.certificateNumber);
      expect(foundLater).toBeDefined();
    });

    test('122. GET /api/certificates/expiring: Certificates expiring outside window are excluded with days=10', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring?days=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      const foundSoon = certs.find((c) => c.certificateNumber === certExpiringSoon.certificateNumber);
      expect(foundSoon).toBeUndefined(); // expiring in 15 days, so outside 10 day window
    });

    test('123. GET /api/certificates/expiring: Already expired certificates are excluded', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring?days=30')
        .set('Authorization', `Bearer ${adminToken}`);

      const certs = res.body.data.certificates;
      const foundExpired = certs.find((c) => c.certificateNumber === certExpired.certificateNumber);
      expect(foundExpired).toBeUndefined();
    });

    test('124. GET /api/certificates/expiring: Revoked certificates are excluded', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring?days=30')
        .set('Authorization', `Bearer ${adminToken}`);

      const certs = res.body.data.certificates;
      const foundRevoked = certs.find((c) => c.certificateNumber === certRevokedExpiring.certificateNumber);
      expect(foundRevoked).toBeUndefined();
    });

    test('125. GET /api/certificates/expiring: Trainer cannot access /expiring (403)', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring')
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('126. GET /api/certificates/expiring: Employee cannot access /expiring (403)', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('127. GET /api/certificates/expiring: Unauthenticated request rejected (401)', async () => {
      const res = await request(app).get('/api/certificates/expiring');
      expect(res.status).toBe(401);
    });

    test('128. GET /api/certificates/expiring: Invalid days param returns 400', async () => {
      const res1 = await request(app)
        .get('/api/certificates/expiring?days=0')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get('/api/certificates/expiring?days=500')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get('/api/certificates/expiring?days=invalid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res3.status).toBe(400);
    });

    test('129. GET /api/certificates/expiring: Pagination works (page, limit)', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.certificates.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Phase 13: GET /api/certificates/expired - Expired Certificates', () => {
    let expiredCertCourseA;
    let expiredCertCourseB;
    let activeCertCourseA;
    let revokedExpiredCourseA;
    let expiredCourseA;
    let expiredCourseB;
    let expiredCourseC;
    let expiredCourseD;
    let expdEnrollmentA;
    let expdEnrollmentB;
    let expdEnrollmentC;
    let expdEnrollmentD;

    beforeAll(async () => {
      // Course A is authored by trainerUserA
      expiredCourseA = await Course.create({ title: 'Expired Course A', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      // Course B is authored by trainerUserB
      expiredCourseB = await Course.create({ title: 'Expired Course B', description: 'Test description', trainer: trainerUserB._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      expiredCourseC = await Course.create({ title: 'Expired Course C', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      expiredCourseD = await Course.create({ title: 'Expired Course D', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });

      expdEnrollmentA = await Enrollment.create({ employee: employeeProfileA._id, course: expiredCourseA._id, status: 'completed', progressPercentage: 100, isActive: true });
      expdEnrollmentB = await Enrollment.create({ employee: employeeProfileB._id, course: expiredCourseB._id, status: 'completed', progressPercentage: 100, isActive: true });
      expdEnrollmentC = await Enrollment.create({ employee: employeeProfileB._id, course: expiredCourseC._id, status: 'completed', progressPercentage: 100, isActive: true });
      expdEnrollmentD = await Enrollment.create({ employee: employeeProfileA._id, course: expiredCourseD._id, status: 'completed', progressPercentage: 100, isActive: true });

      expiredCertCourseA = await Certificate.create({
        employee: employeeProfileA._id,
        course: expiredCourseA._id,
        enrollment: expdEnrollmentA._id,
        certificateNumber: 'SKILLTRACK-2026-EXPD01',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000),
        status: 'active'
      });

      expiredCertCourseB = await Certificate.create({
        employee: employeeProfileB._id,
        course: expiredCourseB._id,
        enrollment: expdEnrollmentB._id,
        certificateNumber: 'SKILLTRACK-2026-EXPD02',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000),
        status: 'active'
      });

      activeCertCourseA = await Certificate.create({
        employee: employeeProfileB._id,
        course: expiredCourseC._id,
        enrollment: expdEnrollmentC._id,
        certificateNumber: 'SKILLTRACK-2026-EXPD03',
        issuedAt: new Date(Date.now() - 100 * 86400000),
        expiresAt: new Date(Date.now() + 265 * 86400000),
        status: 'active'
      });

      revokedExpiredCourseA = await Certificate.create({
        employee: employeeProfileA._id,
        course: expiredCourseD._id,
        enrollment: expdEnrollmentD._id,
        certificateNumber: 'SKILLTRACK-2026-EXPD04',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000),
        status: 'revoked',
        revokedAt: new Date()
      });
    });

    afterAll(async () => {
      const toDelete = [expiredCertCourseA, expiredCertCourseB, activeCertCourseA, revokedExpiredCourseA].filter(Boolean).map(c => c._id);
      if (toDelete.length) await Certificate.deleteMany({ _id: { $in: toDelete } });
      const enrollmentsToDelete = [expdEnrollmentA, expdEnrollmentB, expdEnrollmentC, expdEnrollmentD].filter(Boolean).map(e => e._id);
      if (enrollmentsToDelete.length) await Enrollment.deleteMany({ _id: { $in: enrollmentsToDelete } });
      const coursesToDelete = [expiredCourseA, expiredCourseB, expiredCourseC, expiredCourseD].filter(Boolean).map(c => c._id);
      if (coursesToDelete.length) await Course.deleteMany({ _id: { $in: coursesToDelete } });
    });

    test('130. GET /api/certificates/expired: Admin can query all expired certificates (200)', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).toContain(expiredCertCourseA.certificateNumber);
      expect(nums).toContain(expiredCertCourseB.certificateNumber);
    });

    test('131. GET /api/certificates/expired: Trainer A can query expired certificates for course authored by Trainer A (200)', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).toContain(expiredCertCourseA.certificateNumber);
    });

    test('132. GET /api/certificates/expired: Trainer A cannot see expired certificates for Trainer B courses', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).not.toContain(expiredCertCourseB.certificateNumber);
    });

    test('133. GET /api/certificates/expired: Active (unexpired) certificates are excluded', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${adminToken}`);

      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).not.toContain(activeCertCourseA.certificateNumber);
    });

    test('134. GET /api/certificates/expired: Revoked certificates are excluded from expired list', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${adminToken}`);

      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).not.toContain(revokedExpiredCourseA.certificateNumber);
    });

    test('135. GET /api/certificates/expired: Employee cannot access /expired (403)', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('136. GET /api/certificates/expired: Unauthenticated request rejected (401)', async () => {
      const res = await request(app).get('/api/certificates/expired');
      expect(res.status).toBe(401);
    });

    test('137. GET /api/certificates/expired: Pagination works (page, limit)', async () => {
      const res = await request(app)
        .get('/api/certificates/expired?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.certificates.length).toBeLessThanOrEqual(1);
    });

    test('138. GET /api/certificates/expired: Filter by course works', async () => {
      const res = await request(app)
        .get(`/api/certificates/expired?course=${expiredCourseA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).toContain(expiredCertCourseA.certificateNumber);
      expect(nums).not.toContain(expiredCertCourseB.certificateNumber);
    });

    test('139. GET /api/certificates/expired: Filter by employee works', async () => {
      const res = await request(app)
        .get(`/api/certificates/expired?employee=${employeeProfileA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const nums = res.body.data.certificates.map((c) => c.certificateNumber);
      expect(nums).toContain(expiredCertCourseA.certificateNumber);
      expect(nums).not.toContain(expiredCertCourseB.certificateNumber);
    });
  });

  describe('Phase 13: POST /api/certificates/:id/renew - Certificate Renewal Workflow', () => {
    let renewableCertSoon;
    let renewableCertExpired;
    let prematureCert;
    let revokedCertForRenew;

    let renewCourse1;
    let renewCourse2;
    let renewCourse3;
    let renewCourse4;
    let renewEnrollment1;
    let renewEnrollment2;
    let renewEnrollment3;
    let renewEnrollment4;

    beforeAll(async () => {
      renewCourse1 = await Course.create({ title: 'Renew Course 1', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      renewCourse2 = await Course.create({ title: 'Renew Course 2', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      renewCourse3 = await Course.create({ title: 'Renew Course 3', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      renewCourse4 = await Course.create({ title: 'Renew Course 4', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });

      renewEnrollment1 = await Enrollment.create({ employee: employeeProfileA._id, course: renewCourse1._id, status: 'completed', progressPercentage: 100, isActive: true });
      renewEnrollment2 = await Enrollment.create({ employee: employeeProfileA._id, course: renewCourse2._id, status: 'completed', progressPercentage: 100, isActive: true });
      renewEnrollment3 = await Enrollment.create({ employee: employeeProfileA._id, course: renewCourse3._id, status: 'completed', progressPercentage: 100, isActive: true });
      renewEnrollment4 = await Enrollment.create({ employee: employeeProfileA._id, course: renewCourse4._id, status: 'completed', progressPercentage: 100, isActive: true });

      // Cert expiring in 10 days (within 30-day renewal window)
      renewableCertSoon = await Certificate.create({
        employee: employeeProfileA._id,
        course: renewCourse1._id,
        enrollment: renewEnrollment1._id,
        certificateNumber: 'SKILLTRACK-2026-RNWSOON01',
        issuedAt: new Date(Date.now() - 355 * 86400000),
        expiresAt: new Date(Date.now() + 10 * 86400000),
        status: 'active'
      });

      // Cert already expired 5 days ago
      renewableCertExpired = await Certificate.create({
        employee: employeeProfileA._id,
        course: renewCourse2._id,
        enrollment: renewEnrollment2._id,
        certificateNumber: 'SKILLTRACK-2026-RNWEXPD01',
        issuedAt: new Date(Date.now() - 370 * 86400000),
        expiresAt: new Date(Date.now() - 5 * 86400000),
        status: 'active'
      });

      // Cert expiring in 200 days (premature renewal)
      prematureCert = await Certificate.create({
        employee: employeeProfileA._id,
        course: renewCourse3._id,
        enrollment: renewEnrollment3._id,
        certificateNumber: 'SKILLTRACK-2026-PREMAT01',
        issuedAt: new Date(Date.now() - 100 * 86400000),
        expiresAt: new Date(Date.now() + 200 * 86400000),
        status: 'active'
      });

      // Revoked cert
      revokedCertForRenew = await Certificate.create({
        employee: employeeProfileA._id,
        course: renewCourse4._id,
        enrollment: renewEnrollment4._id,
        certificateNumber: 'SKILLTRACK-2026-RNWRVK01',
        issuedAt: new Date(Date.now() - 355 * 86400000),
        expiresAt: new Date(Date.now() + 10 * 86400000),
        status: 'revoked',
        revokedAt: new Date(),
        revocationReason: 'Breach of policy'
      });
    });

    afterAll(async () => {
      const toDelete = [renewableCertSoon, renewableCertExpired, prematureCert, revokedCertForRenew, newlyIssuedRenewal].filter(Boolean).map(c => c._id || c.id);
      if (toDelete.length) await Certificate.deleteMany({ _id: { $in: toDelete } });
      const enrollmentsToDelete = [renewEnrollment1, renewEnrollment2, renewEnrollment3, renewEnrollment4].filter(Boolean).map(e => e._id);
      if (enrollmentsToDelete.length) await Enrollment.deleteMany({ _id: { $in: enrollmentsToDelete } });
      const coursesToDelete = [renewCourse1, renewCourse2, renewCourse3, renewCourse4].filter(Boolean).map(c => c._id);
      if (coursesToDelete.length) await Course.deleteMany({ _id: { $in: coursesToDelete } });
    });

    let newlyIssuedRenewal;

    test('140. POST /api/certificates/:id/renew: Employee can renew expiring certificate within window (201)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ reason: 'Annual recertification requirement' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/renewed successfully/i);
      newlyIssuedRenewal = res.body.data.certificate;
    });

    test('141. POST /api/certificates/:id/renew: Creates new certificate with unique number and renewedFrom link', () => {
      expect(newlyIssuedRenewal).toBeDefined();
      expect(newlyIssuedRenewal.certificateNumber).not.toBe(renewableCertSoon.certificateNumber);
      expect(newlyIssuedRenewal.certificateNumber).toMatch(/^SKILLTRACK-\d{4}-[A-Z0-9]+$/);
      expect(newlyIssuedRenewal.status).toBe('active');
      expect(newlyIssuedRenewal.renewedFrom.id || newlyIssuedRenewal.renewedFrom._id || newlyIssuedRenewal.renewedFrom).toBe(renewableCertSoon._id.toString());
      expect(newlyIssuedRenewal.renewalReason).toBe('Annual recertification requirement');
      expect(new Date(newlyIssuedRenewal.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    test('142. POST /api/certificates/:id/renew: Leaves source certificate strictly immutable', async () => {
      const sourceInDb = await Certificate.findById(renewableCertSoon._id);
      expect(sourceInDb.certificateNumber).toBe(renewableCertSoon.certificateNumber);
      expect(sourceInDb.status).toBe('active');
      expect(sourceInDb.expiresAt.getTime()).toBe(renewableCertSoon.expiresAt.getTime());
      expect(sourceInDb.issuedAt.getTime()).toBe(renewableCertSoon.issuedAt.getTime());
      expect(sourceInDb.renewedFrom).toBeNull();
    });

    test('143. POST /api/certificates/:id/renew: Employee can renew expired certificate (201)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${renewableCertExpired._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const renewed = res.body.data.certificate;
      expect(renewed.certificateNumber).not.toBe(renewableCertExpired.certificateNumber);
      expect(renewed.status).toBe('active');
      expect(renewed.renewedFrom.id || renewed.renewedFrom._id || renewed.renewedFrom).toBe(renewableCertExpired._id.toString());
    });

    test('144. POST /api/certificates/:id/renew: Premature renewal outside window is rejected (400)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${prematureCert._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not eligible for renewal yet|renewal is only permitted/i);
    });

    test('145. POST /api/certificates/:id/renew: Revoked certificate cannot be renewed (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${revokedCertForRenew._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/revoked certificate cannot be renewed/i);
    });

    test('146. POST /api/certificates/:id/renew: Employee cannot renew another employee certificate (404 IDOR)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${prematureCert._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/certificate not found/i);
    });

    test('147. POST /api/certificates/:id/renew: Duplicate renewal attempt is idempotent (200)', async () => {
      // Attempting to renew renewableCertSoon again returns the existing renewal
      const res = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/already renewed|already active/i);
      expect(res.body.data.certificate.certificateNumber).toBe(newlyIssuedRenewal.certificateNumber);
    });

    test('148. POST /api/certificates/:id/renew: DB constraint prevents duplicate renewedFrom entries (E11000)', async () => {
      let duplicateErr;
      try {
        await Certificate.create({
          employee: employeeProfileA._id,
          course: renewCourse1._id,
          enrollment: renewEnrollment1._id,
          certificateNumber: 'SKILLTRACK-2026-FORCE-DUP',
          renewedFrom: renewableCertSoon._id
        });
      } catch (e) {
        duplicateErr = e;
      }
      expect(duplicateErr).toBeDefined();
      expect(duplicateErr.code).toBe(11000);
    });

    test('149. POST /api/certificates/:id/renew: Trainer cannot renew certificate (403)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('150. POST /api/certificates/:id/renew: Admin cannot renew certificate via employee renewal endpoint (403)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|insufficient/i);
    });

    test('151. POST /api/certificates/:id/renew: Unauthenticated renewal rejected (401)', async () => {
      const res = await request(app).post(`/api/certificates/${renewableCertSoon._id}/renew`);
      expect(res.status).toBe(401);
    });

    test('152. POST /api/certificates/:id/renew: Client injection of expiresAt, issuedAt, certificateNumber rejected (400)', async () => {
      const res1 = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ expiresAt: new Date() });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ issuedAt: new Date() });
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ certificateNumber: 'FORGED-CERT-01' });
      expect(res3.status).toBe(400);
    });

    test('153. POST /api/certificates/:id/renew: Client injection of renewedFrom or status rejected (400)', async () => {
      const res1 = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ renewedFrom: new mongoose.Types.ObjectId() });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ status: 'revoked' });
      expect(res2.status).toBe(400);
    });

    test('154. POST /api/certificates/:id/renew: Optional renewal reason accepted and stored (201)', async () => {
      const testReasonCourse = await Course.create({
        title: 'Reason Test Course',
        description: 'Test description',
        trainer: trainerUserA._id,
        status: 'published',
        isActive: true,
        duration: 10,
        level: 'beginner',
        category: 'Testing'
      });
      const testReasonEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: testReasonCourse._id,
        status: 'completed',
        progressPercentage: 100,
        isActive: true
      });
      const testRenewCert = await Certificate.create({
        employee: employeeProfileB._id,
        course: testReasonCourse._id,
        enrollment: testReasonEnrollment._id,
        certificateNumber: 'SKILLTRACK-2026-REASON-TEST',
        issuedAt: new Date(Date.now() - 360 * 86400000),
        expiresAt: new Date(Date.now() + 5 * 86400000),
        status: 'active'
      });

      const res = await request(app)
        .post(`/api/certificates/${testRenewCert._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ reason: 'Bi-annual compliance standard update' });

      expect(res.status).toBe(201);
      expect(res.body.data.certificate.renewalReason).toBe('Bi-annual compliance standard update');
      await Certificate.deleteMany({
        _id: { $in: [testRenewCert._id, res.body.data.certificate.id] }
      });
      await Enrollment.deleteOne({ _id: testReasonEnrollment._id });
      await Course.deleteOne({ _id: testReasonCourse._id });
    });

    test('155. POST /api/certificates/:id/renew: Renewal reason > 500 characters rejected (400)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${renewableCertSoon._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ reason: 'A'.repeat(501) });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/500 characters/i);
    });

    test('156. POST /api/certificates/:id/renew: Re-verifies course isActive (400 if deactivated)', async () => {
      // Create cert with inactive course
      const certWithInactiveCourse = await Certificate.create({
        employee: employeeProfileA._id,
        course: inactiveCourse._id,
        enrollment: uncompletedEnrollment._id,
        certificateNumber: 'SKILLTRACK-2026-INACT-CRS',
        issuedAt: new Date(Date.now() - 360 * 86400000),
        expiresAt: new Date(Date.now() + 5 * 86400000),
        status: 'active'
      });

      const res = await request(app)
        .post(`/api/certificates/${certWithInactiveCourse._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/no longer active|course is inactive/i);
      await Certificate.deleteOne({ _id: certWithInactiveCourse._id });
    });

    test('157. POST /api/certificates/:id/renew: Inactive employee cannot renew certificate (403)', async () => {
      const testInactCourse = await Course.create({
        title: 'Inactive Emp Test Course',
        description: 'Test description',
        trainer: trainerUserA._id,
        status: 'published',
        isActive: true,
        duration: 10,
        level: 'beginner',
        category: 'Testing'
      });
      const testInactEnrollment = await Enrollment.create({
        employee: inactiveEmployeeProfile._id,
        course: testInactCourse._id,
        status: 'completed',
        progressPercentage: 100,
        isActive: true
      });
      const certForInactiveEmp = await Certificate.create({
        employee: inactiveEmployeeProfile._id,
        course: testInactCourse._id,
        enrollment: testInactEnrollment._id,
        certificateNumber: 'SKILLTRACK-2026-INACT-EMP',
        issuedAt: new Date(Date.now() - 360 * 86400000),
        expiresAt: new Date(Date.now() + 5 * 86400000),
        status: 'active'
      });

      const res = await request(app)
        .post(`/api/certificates/${certForInactiveEmp._id}/renew`)
        .set('Authorization', `Bearer ${inactiveEmployeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/inactive/i);
      await Certificate.deleteOne({ _id: certForInactiveEmp._id });
      await Enrollment.deleteOne({ _id: testInactEnrollment._id });
      await Course.deleteOne({ _id: testInactCourse._id });
    });

    test('158. POST /api/certificates/:id/renew: Invalid certificate ObjectId returns 400', async () => {
      const res = await request(app)
        .post('/api/certificates/not-an-id/renew')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid certificate id/i);
    });

    test('159. POST /api/certificates/:id/renew: Non-existent certificate ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/certificates/${fakeId}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/certificate not found/i);
    });
  });

  describe('Phase 13: GET /api/certificates/:id/renewals - Renewal Chain & History', () => {
    let gen1Cert;
    let gen2Cert;
    let gen3Cert;
    let genCourse;
    let genEnrollment;

    beforeAll(async () => {
      genCourse = await Course.create({
        title: 'Renewal Chain History Course',
        description: 'Test description',
        trainer: trainerUserA._id,
        status: 'published',
        isActive: true,
        duration: 10,
        level: 'intermediate',
        category: 'Testing'
      });

      genEnrollment = await Enrollment.create({
        employee: employeeProfileA._id,
        course: genCourse._id,
        status: 'completed',
        progressPercentage: 100,
        isActive: true
      });

      // Build a 3-generation renewal chain
      gen1Cert = await Certificate.create({
        employee: employeeProfileA._id,
        course: genCourse._id,
        enrollment: genEnrollment._id,
        certificateNumber: 'SKILLTRACK-2024-GEN00001',
        issuedAt: new Date(Date.now() - 730 * 86400000),
        expiresAt: new Date(Date.now() - 365 * 86400000),
        status: 'active'
      });

      gen2Cert = await Certificate.create({
        employee: employeeProfileA._id,
        course: genCourse._id,
        enrollment: genEnrollment._id,
        certificateNumber: 'SKILLTRACK-2025-GEN00002',
        issuedAt: new Date(Date.now() - 365 * 86400000),
        expiresAt: new Date(Date.now() - 5 * 86400000),
        status: 'active',
        renewedFrom: gen1Cert._id,
        renewedAt: new Date(Date.now() - 365 * 86400000),
        renewalReason: 'Year 2 renewal'
      });

      gen3Cert = await Certificate.create({
        employee: employeeProfileA._id,
        course: genCourse._id,
        enrollment: genEnrollment._id,
        certificateNumber: 'SKILLTRACK-2026-GEN00003',
        issuedAt: new Date(Date.now() - 5 * 86400000),
        expiresAt: new Date(Date.now() + 360 * 86400000),
        status: 'active',
        renewedFrom: gen2Cert._id,
        renewedAt: new Date(Date.now() - 5 * 86400000),
        renewalReason: 'Year 3 renewal'
      });
    });

    afterAll(async () => {
      const toDelete = [gen1Cert, gen2Cert, gen3Cert].filter(Boolean).map(c => c._id);
      if (toDelete.length) await Certificate.deleteMany({ _id: { $in: toDelete } });
      if (genEnrollment) await Enrollment.deleteOne({ _id: genEnrollment._id });
      if (genCourse) await Course.deleteOne({ _id: genCourse._id });
    });

    test('160. GET /api/certificates/:id/renewals: Admin can view renewal chain for any certificate (200)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${gen2Cert._id}/renewals`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificate.certificateNumber).toBe(gen2Cert.certificateNumber);
    });

    test('161. GET /api/certificates/:id/renewals: Returns parent and child renewal documents', async () => {
      const res = await request(app)
        .get(`/api/certificates/${gen2Cert._id}/renewals`)
        .set('Authorization', `Bearer ${adminToken}`);

      const { certificate, parent, renewals } = res.body.data;
      expect(certificate.certificateNumber).toBe(gen2Cert.certificateNumber);
      expect(parent).not.toBeNull();
      expect(parent.certificateNumber).toBe(gen1Cert.certificateNumber);
      expect(Array.isArray(renewals)).toBe(true);
      expect(renewals.length).toBe(1);
      expect(renewals[0].certificateNumber).toBe(gen3Cert.certificateNumber);
    });

    test('162. GET /api/certificates/:id/renewals: Employee can view renewal chain for own certificate (200)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${gen2Cert._id}/renewals`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(gen2Cert.certificateNumber);
    });

    test('163. GET /api/certificates/:id/renewals: Employee cannot view renewal chain for another employee certificate (404 IDOR)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${gen2Cert._id}/renewals`)
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/certificate not found/i);
    });

    test('164. GET /api/certificates/:id/renewals: Trainer can view renewal chain for course they authored (200)', async () => {
      // Course A is authored by trainerUserA
      const res = await request(app)
        .get(`/api/certificates/${gen2Cert._id}/renewals`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.certificate.certificateNumber).toBe(gen2Cert.certificateNumber);
    });

    test('165. GET /api/certificates/:id/renewals: Trainer cannot view renewal chain for course authored by another trainer (403)', async () => {
      // Course A is authored by trainerUserA; trainerTokenB belongs to trainerUserB
      const res = await request(app)
        .get(`/api/certificates/${gen2Cert._id}/renewals`)
        .set('Authorization', `Bearer ${trainerTokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|courses authored by you/i);
    });

    test('166. GET /api/certificates/:id/renewals: Unauthenticated request rejected (401)', async () => {
      const res = await request(app).get(`/api/certificates/${gen2Cert._id}/renewals`);
      expect(res.status).toBe(401);
    });

    test('167. GET /api/certificates/:id/renewals: Invalid ObjectId returns 400', async () => {
      const res = await request(app)
        .get('/api/certificates/invalid-id/renewals')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid certificate id/i);
    });

    test('168. GET /api/certificates/:id/renewals: Non-existent certificate returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/certificates/${fakeId}/renewals`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/certificate not found/i);
    });

    test('169. GET /api/certificates/:id/renewals: Multi-generation root inspection returns null parent and descendants', async () => {
      const res = await request(app)
        .get(`/api/certificates/${gen1Cert._id}/renewals`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.parent).toBeNull();
      expect(res.body.data.renewals.length).toBe(1);
      expect(res.body.data.renewals[0].certificateNumber).toBe(gen2Cert.certificateNumber);
    });
  });

  describe('Phase 13: Lifecycle Status Filtering & Route Precedence', () => {
    let filterActive;
    let filterExpired;
    let filterRevoked;
    let fltCourse1;
    let fltCourse2;
    let fltCourse3;
    let fltEnrollment1;
    let fltEnrollment2;
    let fltEnrollment3;

    beforeAll(async () => {
      fltCourse1 = await Course.create({ title: 'Filter Course 1', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      fltCourse2 = await Course.create({ title: 'Filter Course 2', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });
      fltCourse3 = await Course.create({ title: 'Filter Course 3', description: 'Test description', trainer: trainerUserA._id, status: 'published', isActive: true, duration: 10, level: 'beginner', category: 'Testing' });

      fltEnrollment1 = await Enrollment.create({ employee: employeeProfileA._id, course: fltCourse1._id, status: 'completed', progressPercentage: 100, isActive: true });
      fltEnrollment2 = await Enrollment.create({ employee: employeeProfileA._id, course: fltCourse2._id, status: 'completed', progressPercentage: 100, isActive: true });
      fltEnrollment3 = await Enrollment.create({ employee: employeeProfileA._id, course: fltCourse3._id, status: 'completed', progressPercentage: 100, isActive: true });

      filterActive = await Certificate.create({
        employee: employeeProfileA._id,
        course: fltCourse1._id,
        enrollment: fltEnrollment1._id,
        certificateNumber: 'SKILLTRACK-2026-FLTACT1',
        issuedAt: new Date(Date.now() - 10 * 86400000),
        expiresAt: new Date(Date.now() + 355 * 86400000),
        status: 'active'
      });

      filterExpired = await Certificate.create({
        employee: employeeProfileA._id,
        course: fltCourse2._id,
        enrollment: fltEnrollment2._id,
        certificateNumber: 'SKILLTRACK-2026-FLTEXP1',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000),
        status: 'active'
      });

      filterRevoked = await Certificate.create({
        employee: employeeProfileA._id,
        course: fltCourse3._id,
        enrollment: fltEnrollment3._id,
        certificateNumber: 'SKILLTRACK-2026-FLTRVK1',
        issuedAt: new Date(Date.now() - 100 * 86400000),
        expiresAt: new Date(Date.now() + 265 * 86400000),
        status: 'revoked',
        revokedAt: new Date()
      });
    });

    afterAll(async () => {
      const toDelete = [filterActive, filterExpired, filterRevoked].filter(Boolean).map(c => c._id);
      if (toDelete.length) await Certificate.deleteMany({ _id: { $in: toDelete } });
      const enrollmentsToDelete = [fltEnrollment1, fltEnrollment2, fltEnrollment3].filter(Boolean).map(e => e._id);
      if (enrollmentsToDelete.length) await Enrollment.deleteMany({ _id: { $in: enrollmentsToDelete } });
      const coursesToDelete = [fltCourse1, fltCourse2, fltCourse3].filter(Boolean).map(c => c._id);
      if (coursesToDelete.length) await Course.deleteMany({ _id: { $in: coursesToDelete } });
    });

    test('170. Query filtering: GET /api/certificates/me?status=active returns only active certs', async () => {
      const res = await request(app)
        .get('/api/certificates/me?status=active')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      for (const c of certs) {
        expect(c.lifecycleStatus).toBe('active');
        expect(c.status).toBe('active');
        expect(c.isExpired).toBe(false);
      }
    });

    test('171. Query filtering: GET /api/certificates/me?status=expired returns only expired certs', async () => {
      const res = await request(app)
        .get('/api/certificates/me?status=expired')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      expect(certs.length).toBeGreaterThanOrEqual(1);
      for (const c of certs) {
        expect(c.lifecycleStatus).toBe('expired');
        expect(c.isExpired).toBe(true);
      }
    });

    test('172. Query filtering: GET /api/certificates/me?status=revoked returns only revoked certs', async () => {
      const res = await request(app)
        .get('/api/certificates/me?status=revoked')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      expect(certs.length).toBeGreaterThanOrEqual(1);
      for (const c of certs) {
        expect(c.lifecycleStatus).toBe('revoked');
        expect(c.status).toBe('revoked');
      }
    });

    test('173. Query filtering: GET /api/certificates?status=expired in admin listing returns expired certs', async () => {
      const res = await request(app)
        .get('/api/certificates?status=expired')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const certs = res.body.data.certificates;
      expect(certs.length).toBeGreaterThanOrEqual(1);
      for (const c of certs) {
        expect(c.lifecycleStatus).toBe('expired');
        expect(c.isExpired).toBe(true);
      }
    });

    test('174. Query filtering: Invalid status parameter returns 400', async () => {
      const res = await request(app)
        .get('/api/certificates/me?status=unsupported_status')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be one of: active, expired, revoked/i);
    });

    test('175. Route precedence: /expiring is not shadowed by /:id', async () => {
      const res = await request(app)
        .get('/api/certificates/expiring')
        .set('Authorization', `Bearer ${adminToken}`);

      // If shadowed, it would try to parse 'expiring' as an ObjectId and return 400
      expect(res.status).toBe(200);
      expect(res.body.data.windowDays).toBe(30);
    });

    test('176. Route precedence: /expired is not shadowed by /:id', async () => {
      const res = await request(app)
        .get('/api/certificates/expired')
        .set('Authorization', `Bearer ${adminToken}`);

      // If shadowed, it would try to parse 'expired' as an ObjectId and return 400
      expect(res.status).toBe(200);
      expect(res.body.data.certificates).toBeDefined();
    });

    test('177. Route precedence: /:id/renew and /:id/renewals route properly', async () => {
      const resRenew = await request(app)
        .post(`/api/certificates/${filterActive._id}/renew`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      // Should hit renewal controller (premature renewal -> 400) rather than a wildcard route
      expect(resRenew.status).toBe(400);
      expect(resRenew.body.message).toMatch(/not eligible for renewal yet|renewal is only permitted/i);

      const resRenewals = await request(app)
        .get(`/api/certificates/${filterActive._id}/renewals`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resRenewals.status).toBe(200);
      expect(resRenewals.body.data.certificate).toBeDefined();
    });
  });
});
