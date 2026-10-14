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
const Question = require('../../src/models/Question');
const AssessmentAttempt = require('../../src/models/AssessmentAttempt');
const Certificate = require('../../src/models/Certificate');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 3 & 4 Integration: Assessment & Certificate Lifecycle', () => {
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
  let lesson1;
  let lesson2;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    try {
      await Certificate.collection.dropIndexes();
    } catch (e) {
      // ignore
    }
    await Certificate.syncIndexes();

    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Question.deleteMany({});
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
      name: 'QA & Certification Dept',
      description: 'Department for testing certification pipelines'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Cert Admin',
      email: 'cert.admin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Assessment Trainer',
      email: 'cert.trainer@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Test Student',
      email: 'student.exam@skilltrack.test',
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

    // 4. Employee Profile
    const empRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: employeeUser._id.toString(),
        employeeId: 'EMP-CERT-01',
        department: department._id.toString(),
        designation: 'Software Engineer in Test',
        phone: '9876543210'
      })
      .expect(201);

    employeeDoc = empRes.body.data.employee;

    // 5. Course with 2 lessons
    testCourse = await Course.create({
      title: 'Backend Mastery with Node & Express',
      description: 'End-to-end backend testing course',
      category: 'technical',
      level: 'intermediate',
      duration: 30,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    testModule = await Module.create({
      course: testCourse._id,
      title: 'Module 1: APIs and Routing',
      order: 1,
      isActive: true
    });

    lesson1 = await Lesson.create({
      module: testModule._id,
      title: 'Lesson 1: REST Conventions',
      contentType: 'text',
      content: 'Core REST principles and HTTP methods.',
      order: 1,
      isActive: true
    });

    lesson2 = await Lesson.create({
      module: testModule._id,
      title: 'Lesson 2: Error Handling',
      contentType: 'text',
      content: 'Standardizing error responses.',
      order: 2,
      isActive: true
    });
  });

  afterAll(async () => {
    await Certificate.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Question.deleteMany({});
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

  describe('Workflow 3: Assessment Authoring, Publishing, and Deterministic Grading', () => {
    let assessmentId;
    let question1Id;
    let question2Id;
    let enrollmentId;
    let attempt1Id;

    it('3.1: Trainer authors assessment and questions, publishes assessment', async () => {
      // 1. Trainer creates draft assessment linked to course
      const createRes = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          title: 'Backend Mastery Certification Exam',
          description: 'Official certification assessment',
          course: testCourse._id.toString(),
          passingPercentage: 60,
          maxAttempts: 3
        })
        .expect(201);

      assessmentId = createRes.body.data.assessment._id || createRes.body.data.assessment.id;
      expect(createRes.body.data.assessment.status).toBe('draft');
      expect(createRes.body.data.assessment.passingPercentage).toBe(60);

      // 2. Add Question 1: single choice (2 marks)
      const q1Res = await request(app)
        .post(`/api/assessments/${assessmentId}/questions`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          questionText: 'What HTTP status code indicates resource created?',
          questionType: 'single_choice',
          options: [
            { key: 'A', text: '200 OK' },
            { key: 'B', text: '201 Created' },
            { key: 'C', text: '204 No Content' }
          ],
          correctAnswers: ['B'],
          marks: 2,
          order: 1
        })
        .expect(201);

      question1Id = q1Res.body.data.question._id || q1Res.body.data.question.id;
      expect(q1Res.body.data.question.marks).toBe(2);

      // 3. Add Question 2: multiple choice (3 marks)
      const q2Res = await request(app)
        .post(`/api/assessments/${assessmentId}/questions`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          questionText: 'Which HTTP methods are idempotent in standard REST?',
          questionType: 'multiple_choice',
          options: [
            { key: 'A', text: 'GET' },
            { key: 'B', text: 'PUT' },
            { key: 'C', text: 'POST' },
            { key: 'D', text: 'DELETE' }
          ],
          correctAnswers: ['A', 'B', 'D'],
          marks: 3,
          order: 2
        })
        .expect(201);

      question2Id = q2Res.body.data.question._id || q2Res.body.data.question.id;
      expect(q2Res.body.data.question.marks).toBe(3);

      // Total assessment marks = 5. Passing threshold 60% requires at least 3 marks.

      // 4. Publish assessment
      const pubRes = await request(app)
        .patch(`/api/assessments/${assessmentId}/publish`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(pubRes.body.data.assessment.status).toBe('published');
    });

    it('3.2: Employee enrolls and takes assessment: fails attempt 1, passes attempt 2', async () => {
      // 1. Employee enrolls in the course
      const enrRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ course: testCourse._id.toString() })
        .expect(201);

      enrollmentId = enrRes.body.data.enrollment.id || enrRes.body.data.enrollment._id;

      // 2. Employee starts Attempt 1
      const start1Res = await request(app)
        .post(`/api/assessments/${assessmentId}/attempts`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(201);

      attempt1Id = start1Res.body.data.attempt.id || start1Res.body.data.attempt._id;
      expect(start1Res.body.data.attempt.attemptNumber).toBe(1);
      expect(start1Res.body.data.attempt.status).toBe('in_progress');

      // 3. Employee submits Attempt 1 with failing answers (only Q1 correct = 2/5 marks = 40% < 60%)
      const submit1Res = await request(app)
        .patch(`/api/assessments/attempts/${attempt1Id}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          answers: [
            { question: question1Id, selectedAnswers: ['B'] }, // correct (2 marks)
            { question: question2Id, selectedAnswers: ['C'] }  // wrong (0 marks)
          ]
        })
        .expect(200);

      const a1Data = submit1Res.body.data.attempt;
      expect(a1Data.status).toBe('submitted');
      expect(a1Data.totalMarks).toBe(5);
      expect(a1Data.obtainedMarks).toBe(2);
      expect(a1Data.percentage).toBe(40);
      expect(a1Data.result).toBe('failed');

      // 4. Verify attempt immutability: Cannot re-submit already submitted attempt
      await request(app)
        .patch(`/api/assessments/attempts/${attempt1Id}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          answers: [
            { question: question1Id, selectedAnswers: ['B'] },
            { question: question2Id, selectedAnswers: ['A', 'B', 'D'] }
          ]
        })
        .expect(400);

      // 5. Employee starts Attempt 2
      const start2Res = await request(app)
        .post(`/api/assessments/${assessmentId}/attempts`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(201);

      const attempt2Id = start2Res.body.data.attempt.id || start2Res.body.data.attempt._id;
      expect(start2Res.body.data.attempt.attemptNumber).toBe(2);

      // 6. Employee submits Attempt 2 with 100% correct answers
      const submit2Res = await request(app)
        .patch(`/api/assessments/attempts/${attempt2Id}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          answers: [
            { question: question1Id, selectedAnswers: ['B'] },          // correct (2 marks)
            { question: question2Id, selectedAnswers: ['A', 'B', 'D'] } // correct (3 marks)
          ]
        })
        .expect(200);

      const a2Data = submit2Res.body.data.attempt;
      expect(a2Data.totalMarks).toBe(5);
      expect(a2Data.obtainedMarks).toBe(5);
      expect(a2Data.percentage).toBe(100);
      expect(a2Data.result).toBe('passed');

      // 7. Verify attempt result retrieval via GET endpoint
      const resultRes = await request(app)
        .get(`/api/assessments/attempts/${attempt2Id}/result`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      const resultData = resultRes.body.data.result || resultRes.body.data.attempt;
      expect(resultData.result).toBe('passed');
      expect(resultData.percentage).toBe(100);
    });
  });

  describe('Workflow 4: Certificate Issuance, Anti-Injection, Idempotency, and Public Verification', () => {
    let enrollmentId;
    let issuedCertNumber;

    beforeAll(async () => {
      // Find the employee's enrollment in testCourse
      const enr = await Enrollment.findOne({ employee: employeeDoc._id || employeeDoc.id, course: testCourse._id });
      enrollmentId = enr._id.toString();
    });

    it('4.1: Certificate issuance rejects incomplete course', async () => {
      // Current progress is 0% (lessons not yet completed)
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ enrollmentId })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/must be completed/i);
    });

    it('4.2: Course completion enables issuance with anti-injection and idempotency', async () => {
      // 1. Employee completes Lesson 1 (50%)
      await request(app)
        .patch(`/api/enrollments/${enrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ lessonId: lesson1._id.toString(), completed: true })
        .expect(200);

      // 2. Employee completes Lesson 2 (100% -> completed)
      const compRes = await request(app)
        .patch(`/api/enrollments/${enrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ lessonId: lesson2._id.toString(), completed: true })
        .expect(200);

      expect(compRes.body.data.enrollment.progressPercentage).toBe(100);
      expect(compRes.body.data.enrollment.status).toBe('completed');

      // 3. Client injection attack: Attempt to inject certificateNumber, status, or dates
      const injectionRes = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          enrollmentId,
          certificateNumber: 'SKILLTRACK-HACK-0000',
          status: 'active',
          expiresAt: new Date(Date.now() + 1000000000)
        })
        .expect(400);

      expect(injectionRes.body.success).toBe(false);
      expect(injectionRes.body.message).toMatch(/Client injection of/i);

      // 4. Legitimate certificate issuance
      const issueRes = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ enrollmentId })
        .expect(201);

      expect(issueRes.body.success).toBe(true);
      const cert = issueRes.body.data.certificate;
      issuedCertNumber = cert.certificateNumber;

      expect(issuedCertNumber).toMatch(/^SKILLTRACK-\d{4}-[A-F0-9]+$/);
      expect(cert.status).toBe('active');
      expect(cert.issuedAt).toBeDefined();
      expect(cert.expiresAt).toBeDefined();

      // 5. Issuance Idempotency: Calling issue again returns existing certificate with 200
      const duplicateRes = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ enrollmentId })
        .expect(200);

      expect(duplicateRes.body.success).toBe(true);
      expect(duplicateRes.body.message).toMatch(/already issued/i);
      expect(duplicateRes.body.data.certificate.certificateNumber).toBe(issuedCertNumber);
    });

    it('4.3: Public unauthenticated certificate verification', async () => {
      // 1. Verify legitimate certificate without any Authorization token
      const verifyRes = await request(app)
        .get(`/api/certificates/verify/${issuedCertNumber}`)
        .expect(200);

      expect(verifyRes.body.success).toBe(true);
      const data = verifyRes.body.data.certificate;
      expect(data.certificateNumber).toBe(issuedCertNumber);
      expect(data.status).toBe('active');
      expect(data.lifecycleStatus).toBe('active');
      expect(data.isExpired).toBe(false);
      expect(data.employeeName).toBe('Test Student');
      expect(data.courseTitle).toBe('Backend Mastery with Node & Express');

      // 2. Verification of non-existent certificate returns 404
      await request(app)
        .get('/api/certificates/verify/SKILLTRACK-2026-NONEXISTENT')
        .expect(404);
    });
  });
});
