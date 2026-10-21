const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Assessment = require('../src/models/Assessment');
const Question = require('../src/models/Question');
const AssessmentAttempt = require('../src/models/AssessmentAttempt');
const Certificate = require('../src/models/Certificate');
const Notification = require('../src/models/Notification');
const { generateCertificatePDFBuffer } = require('../src/utils/pdfGenerator');
const emailService = require('../src/services/email.service');
const certificateService = require('../src/services/certificate.service');
const assessmentResultService = require('../src/services/assessmentResult.service');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Automatic Certificate Issuance, Email Dispatch & PDF Download Flow', () => {
  jest.setTimeout(30000);
  let adminToken, trainerToken, employeeToken, otherEmployeeToken;
  let adminUser, trainerUser, employeeUser, otherEmployeeUser;
  let department, employeeDoc, otherEmployeeDoc;
  let course, assessment, question1, question2;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    try {
      await Certificate.collection.dropIndexes();
    } catch (e) {
      // Ignore if indexes do not exist yet
    }
    await Certificate.syncIndexes();

    await Notification.deleteMany({});
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Department
    department = await Department.create({
      name: 'Cloud & FullStack Dept',
      description: 'Department for testing certificate and email workflows'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'System Admin',
      email: 'sysadmin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Course Trainer',
      email: 'coursetrainer@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Rithika Raman',
      email: 'rithika.learner@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    otherEmployeeUser = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    // 3. Employee documents
    employeeDoc = await Employee.create({
      user: employeeUser._id,
      department: department._id,
      designation: 'Software Development Engineer',
      employeeId: 'EMP-CERT-001',
      isActive: true
    });

    otherEmployeeDoc = await Employee.create({
      user: otherEmployeeUser._id,
      department: department._id,
      designation: 'QA Automation Engineer',
      employeeId: 'EMP-CERT-002',
      isActive: true
    });

    // 4. JWT tokens
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
    otherEmployeeToken = jwt.sign(
      { userId: otherEmployeeUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // 5. Course
    course = await Course.create({
      title: 'Java Programming Fundamentals',
      description: 'Comprehensive Java syntax, OOP, and collections',
      category: 'Backend Development',
      level: 'beginner',
      duration: 20,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    // 6. Assessment
    assessment = await Assessment.create({
      title: 'Java Fundamentals Final Certification Exam',
      description: 'Comprehensive exam for Java Programming Fundamentals',
      course: course._id,
      trainer: trainerUser._id,
      passingPercentage: 70,
      timeLimitMinutes: 45,
      maxAttempts: 3,
      status: 'published',
      isActive: true
    });

    // 7. Questions
    question1 = await Question.create({
      assessment: assessment._id,
      questionText: 'Which keyword in Java prevents method overriding?',
      questionType: 'single_choice',
      order: 1,
      options: [
        { key: 'A', text: 'static' },
        { key: 'B', text: 'final' },
        { key: 'C', text: 'abstract' },
        { key: 'D', text: 'protected' }
      ],
      correctAnswers: ['B'],
      marks: 10
    });

    question2 = await Question.create({
      assessment: assessment._id,
      questionText: 'What is the default value of an uninitialized boolean instance variable in Java?',
      questionType: 'single_choice',
      order: 2,
      options: [
        { key: 'A', text: 'true' },
        { key: 'B', text: 'false' },
        { key: 'C', text: 'null' },
        { key: 'D', text: 'undefined' }
      ],
      correctAnswers: ['B'],
      marks: 10
    });
  });

  afterAll(async () => {
    delete process.env.TEST_SIMULATE_EMAIL_FAIL;
    await Notification.deleteMany({});
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // Scenario 1: PDF Generator Verification
  test('Scenario 1: PDF generator produces valid binary Buffer conforming to PDF 1.4', () => {
    const pdfBuf = generateCertificatePDFBuffer({
      employeeName: 'Rithika Raman',
      courseTitle: 'Java Programming Fundamentals',
      score: 100,
      certificateNumber: 'SKILLTRACK-2026-TESTPDF1'
    });

    expect(Buffer.isBuffer(pdfBuf)).toBe(true);
    expect(pdfBuf.length).toBeGreaterThan(1500);
    const strHeader = pdfBuf.slice(0, 8).toString('latin1');
    expect(strHeader).toMatch(/^%PDF-1\.4/);
    const strTrailer = pdfBuf.slice(-10).toString('latin1').trim();
    expect(strTrailer).toContain('%%EOF');
  });

  // Scenario 2: Email Service HTML and Plain-text templates
  test('Scenario 2: Email templates include congratulations subject, score, download URL, and verification URL', () => {
    const html = emailService.buildCertificateEmailHtml({
      recipientName: 'Rithika Raman',
      courseTitle: 'Java Programming Fundamentals',
      score: 95,
      certificateNumber: 'SKILLTRACK-2026-TMP12345',
      issueDateStr: 'October 21, 2026',
      downloadUrl: 'http://localhost:5173/certificates/test-id-123',
      verificationUrl: 'http://localhost:5173/verify-certificate/SKILLTRACK-2026-TMP12345'
    });

    expect(html).toContain('Congratulations');
    expect(html).toContain('Rithika Raman');
    expect(html).toContain('Java Programming Fundamentals');
    expect(html).toContain('95%');
    expect(html).toContain('SKILLTRACK-2026-TMP12345');
    expect(html).toContain('Download Your Certificate (PDF)');

    const text = emailService.buildCertificateEmailText({
      recipientName: 'Rithika Raman',
      courseTitle: 'Java Programming Fundamentals',
      score: 95,
      certificateNumber: 'SKILLTRACK-2026-TMP12345',
      issueDateStr: 'October 21, 2026',
      downloadUrl: 'http://localhost:5173/certificates/test-id-123',
      verificationUrl: 'http://localhost:5173/verify-certificate/SKILLTRACK-2026-TMP12345'
    });

    expect(text).toContain('Congratulations Rithika Raman');
    expect(text).toContain('SKILLTRACK-2026-TMP12345');
    expect(text).toContain('http://localhost:5173/certificates/test-id-123');
  });

  // Scenario 3: Failing an assessment does NOT issue a certificate
  test('Scenario 3: Failing assessment does not create a certificate or send congratulations email', async () => {
    // Create an enrollment
    const enrollment = await Enrollment.create({
      employee: employeeDoc._id,
      course: course._id,
      status: 'in_progress',
      progressPercentage: 50
    });

    // Create an attempt where both answers are wrong (score 0%)
    const attempt = await AssessmentAttempt.create({
      assessment: assessment._id,
      employee: employeeDoc._id,
      enrollment: enrollment._id,
      attemptNumber: 1,
      status: 'submitted',
      submittedAt: new Date(),
      answers: [
        { question: question1._id, selectedAnswers: ['A'] }, // wrong
        { question: question2._id, selectedAnswers: ['A'] }  // wrong
      ],
      startedAt: new Date()
    });

    const evaluated = await assessmentResultService.evaluateAttempt(attempt._id);
    expect(evaluated.result).toBe('failed');
    expect(evaluated.percentage).toBe(0);
    expect(evaluated.certificate).toBeNull();

    const certCount = await Certificate.countDocuments({
      employee: employeeDoc._id,
      course: course._id
    });
    expect(certCount).toBe(0);
  });

  // Scenario 4: Passing an assessment automatically issues a certificate
  test('Scenario 4: Passing assessment automatically creates Certificate, sets score, emailStatus, and links attempt', async () => {
    const enrollment = await Enrollment.findOne({
      employee: employeeDoc._id,
      course: course._id
    });

    // Create attempt with 100% score (both answers correct)
    const attempt = await AssessmentAttempt.create({
      assessment: assessment._id,
      employee: employeeDoc._id,
      enrollment: enrollment._id,
      attemptNumber: 2,
      status: 'submitted',
      submittedAt: new Date(),
      answers: [
        { question: question1._id, selectedAnswers: ['B'] }, // correct
        { question: question2._id, selectedAnswers: ['B'] }  // correct
      ],
      startedAt: new Date()
    });

    const evaluated = await assessmentResultService.evaluateAttempt(attempt._id);
    expect(evaluated.result).toBe('passed');
    expect(evaluated.percentage).toBe(100);
    expect(evaluated.certificate).toBeTruthy();

    const cert = await Certificate.findById(evaluated.certificate._id || evaluated.certificate);
    expect(cert).toBeTruthy();
    expect(cert.certificateNumber).toMatch(/^SKILLTRACK-\d{4}-[A-Z0-9]{8}$/);
    expect(cert.status).toBe('active');
    expect(cert.score).toBe(100);
    expect(cert.emailStatus).toBe('sent');
    expect(cert.emailSentAt).toBeTruthy();
    expect(cert.assessment.toString()).toBe(assessment._id.toString());
    expect(cert.assessmentAttempt.toString()).toBe(attempt._id.toString());
  });

  // Scenario 5: In-app notification was created upon certificate issuance
  test('Scenario 5: In-app notification is created upon certificate issuance', async () => {
    const notifications = await Notification.find({
      recipient: employeeUser._id,
      type: 'certificate_issued'
    });

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toContain('Certificate Earned');
    expect(notifications[0].relatedCertificate).toBeTruthy();
  });

  // Scenario 6: Idempotency - duplicate passing attempts do not create duplicate certificates
  test('Scenario 6: Idempotent - subsequent passing attempts reuse existing certificate and do not create duplicates', async () => {
    const enrollment = await Enrollment.findOne({
      employee: employeeDoc._id,
      course: course._id
    });

    const existingCertBefore = await Certificate.findOne({
      employee: employeeDoc._id,
      course: course._id,
      renewedFrom: null
    });
    expect(existingCertBefore).toBeTruthy();

    const attempt3 = await AssessmentAttempt.create({
      assessment: assessment._id,
      employee: employeeDoc._id,
      enrollment: enrollment._id,
      attemptNumber: 3,
      status: 'submitted',
      submittedAt: new Date(),
      answers: [
        { question: question1._id, selectedAnswers: ['B'] },
        { question: question2._id, selectedAnswers: ['B'] }
      ],
      startedAt: new Date()
    });

    const evaluated = await assessmentResultService.evaluateAttempt(attempt3._id);
    expect(evaluated.result).toBe('passed');
    const returnedCertId = (evaluated.certificate._id || evaluated.certificate.id || evaluated.certificate).toString();
    expect(returnedCertId).toBe(existingCertBefore._id.toString());

    const totalCerts = await Certificate.countDocuments({
      employee: employeeDoc._id,
      course: course._id
    });
    expect(totalCerts).toBe(1);
  });

  // Scenario 7: Email failure handling - certificate remains intact with emailStatus='failed'
  test('Scenario 7: Graceful error handling - if email delivery fails, certificate is preserved with emailStatus="failed"', async () => {
    process.env.TEST_SIMULATE_EMAIL_FAIL = 'true';

    // Create a new employee for this test to have a clean slate
    const testFailUser = await User.create({
      name: 'Email Fail Learner',
      email: 'failtest@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });
    const testFailEmployee = await Employee.create({
      user: testFailUser._id,
      department: department._id,
      designation: 'Backend Tester',
      employeeId: 'EMP-FAIL-001',
      isActive: true
    });

    const secondCourse = await Course.create({
      title: 'Object-Oriented Programming',
      description: 'OOP concepts in Java',
      category: 'Software Engineering',
      level: 'intermediate',
      duration: 15,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    const result = await certificateService.issueCertificateInternal({
      employeeId: testFailEmployee._id,
      courseId: secondCourse._id,
      score: 88
    });

    expect(result.certificate).toBeTruthy();
    expect(result.isExisting).toBe(false);

    const savedCert = await Certificate.findById(result.certificate._id || result.certificate.id);
    expect(savedCert).toBeTruthy();
    expect(savedCert.status).toBe('active');
    expect(savedCert.emailStatus).toBe('failed');
    expect(savedCert.emailError).toContain('Simulated SMTP connection failure');

    // Reset flag
    delete process.env.TEST_SIMULATE_EMAIL_FAIL;
  });

  // Scenario 8: Resend certificate email endpoint
  test('Scenario 8: POST /api/certificates/:id/resend-email successfully dispatches and updates status to "sent"', async () => {
    const cert = await Certificate.findOne({ emailStatus: 'failed' });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .post(`/api/certificates/${cert._id}/resend-email`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.certificate.emailStatus).toBe('sent');

    const updated = await Certificate.findById(cert._id);
    expect(updated.emailStatus).toBe('sent');
    expect(updated.emailSentAt).toBeTruthy();
    expect(updated.emailError).toBeNull();
  });

  // Scenario 9: PDF download endpoint by owner employee
  test('Scenario 9: GET /api/certificates/:id/download returns PDF file for certificate owner', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .get(`/api/certificates/${cert._id}/download`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain(`attachment; filename="SkillTrack-Certificate-${cert.certificateNumber}.pdf"`);
    expect(res.body.length).toBeGreaterThan(1500);
    expect(res.body.slice(0, 8).toString('latin1')).toMatch(/^%PDF-1\.4/);
  });

  // Scenario 10: PDF download endpoint by admin
  test('Scenario 10: GET /api/certificates/:id/download allows Admin to download any certificate', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .get(`/api/certificates/${cert._id}/download`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  // Scenario 11: PDF download endpoint by course trainer
  test('Scenario 11: GET /api/certificates/:id/download allows Course Trainer to download', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .get(`/api/certificates/${cert._id}/download`)
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  // Scenario 12: PDF download endpoint denies unauthorized other employee
  test('Scenario 12: GET /api/certificates/:id/download denies access to unauthorized other employee (RBAC & anti-enumeration)', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .get(`/api/certificates/${cert._id}/download`)
      .set('Authorization', `Bearer ${otherEmployeeToken}`);

    expect(res.status).toBe(404); // Returns 404 for anti-enumeration
  });

  // Scenario 13: Unauthenticated request to download is rejected with 401
  test('Scenario 13: GET /api/certificates/:id/download without auth header returns 401 Unauthorized', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .get(`/api/certificates/${cert._id}/download`);

    expect(res.status).toBe(401);
  });

  // Scenario 14: Public verification endpoint remains open and returns safe metadata
  test('Scenario 14: GET /api/certificates/verify/:certNum returns public certificate details without authentication', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    const res = await request(app)
      .get(`/api/certificates/verify/${cert.certificateNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.certificate.certificateNumber).toBe(cert.certificateNumber);
    expect(res.body.data.certificate.status).toBe('active');
    expect(res.body.data.certificate.courseTitle).toBe('Java Programming Fundamentals');
  });

  // Scenario 15: Revoked certificate cannot be downloaded or re-issued
  test('Scenario 15: Revoked certificate cannot be re-issued, preserving audit integrity', async () => {
    const cert = await Certificate.findOne({ employee: employeeDoc._id });
    expect(cert).toBeTruthy();

    // Admin revokes certificate
    const revokeRes = await request(app)
      .patch(`/api/certificates/${cert._id}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Compliance audit test revocation' });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.certificate.status).toBe('revoked');

    // Attempt to re-issue should be rejected with 409 Conflict
    await expect(
      certificateService.issueCertificateInternal({
        employeeId: employeeDoc._id,
        courseId: course._id
      })
    ).rejects.toThrow('Certificate for this course has been revoked and cannot be re-issued');
  });
});
