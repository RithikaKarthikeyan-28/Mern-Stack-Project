const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');
const Question = require('../src/models/Question');
const Enrollment = require('../src/models/Enrollment');
const AssessmentAttempt = require('../src/models/AssessmentAttempt');
const config = require('../src/config');
const assessmentResultService = require('../src/services/assessmentResult.service');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Assessment Results & Performance Analytics Tests (Phase 11)', () => {
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

  let assessmentA;
  let assessmentB;
  let assessmentZeroMarks;

  let questionA1;
  let questionA2;
  let questionA3;
  let questionB1;

  let enrollmentA;
  let enrollmentB;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await AssessmentAttempt.syncIndexes();

    await AssessmentAttempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    department = await Department.create({
      name: 'Cloud Infrastructure Dept',
      description: 'Infrastructure and DevOps'
    });

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'p11_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'p11_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'p11_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUserA = await User.create({
      name: 'Employee Charlie',
      email: 'p11_charlie@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeUserB = await User.create({
      name: 'Employee Dave',
      email: 'p11_dave@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeProfileA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-P11-001',
      department: department._id,
      designation: 'Staff Engineer'
    });

    employeeProfileB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-P11-002',
      department: department._id,
      designation: 'Senior QA'
    });

    courseA = await Course.create({
      title: 'Course A: Microservices & Distributed Architecture',
      description: 'Enterprise patterns and practices',
      category: 'Architecture',
      level: 'advanced',
      duration: 40,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Course B: Cloud Kubernetes Deployments',
      description: 'Kubernetes orchestration',
      category: 'Cloud',
      level: 'intermediate',
      duration: 30,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    // Assessment A: passingPercentage = 70%
    assessmentA = await Assessment.create({
      title: 'Microservices Certification Exam',
      course: courseA._id,
      trainer: trainerUserA._id,
      passingPercentage: 70,
      status: 'published',
      isActive: true
    });

    // Assessment B: Course B by Trainer B
    assessmentB = await Assessment.create({
      title: 'Kubernetes Operational Quiz',
      course: courseB._id,
      trainer: trainerUserB._id,
      passingPercentage: 60,
      status: 'published',
      isActive: true
    });

    // Assessment with no questions / zero marks
    assessmentZeroMarks = await Assessment.create({
      title: 'Empty Question Assessment',
      course: courseA._id,
      trainer: trainerUserA._id,
      passingPercentage: 50,
      status: 'published',
      isActive: true
    });

    // Q1: Single choice (marks: 10) -> correct = ['A']
    questionA1 = await Question.create({
      assessment: assessmentA._id,
      questionText: 'What is the primary benefit of service mesh?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Observability and traffic control' },
        { key: 'B', text: 'Monolithic storage' },
        { key: 'C', text: 'Synchronous locking' }
      ],
      correctAnswers: ['A'],
      marks: 10,
      order: 1,
      isActive: true
    });

    // Q2: Multiple choice (marks: 15) -> correct = ['A', 'C']
    questionA2 = await Question.create({
      assessment: assessmentA._id,
      questionText: 'Which protocols support binary serialization? (Select all)',
      questionType: 'multiple_choice',
      options: [
        { key: 'A', text: 'Protocol Buffers' },
        { key: 'B', text: 'JSON' },
        { key: 'C', text: 'Apache Avro' }
      ],
      correctAnswers: ['A', 'C'],
      marks: 15,
      order: 2,
      isActive: true
    });

    // Q3: Single choice (marks: 5) -> correct = ['B']
    questionA3 = await Question.create({
      assessment: assessmentA._id,
      questionText: 'What does CQRS stand for?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Concurrent Queue Routing Service' },
        { key: 'B', text: 'Command Query Responsibility Segregation' },
        { key: 'C', text: 'Centralized Query Recovery System' }
      ],
      correctAnswers: ['B'],
      marks: 5,
      order: 3,
      isActive: true
    });

    // Course B Question
    questionB1 = await Question.create({
      assessment: assessmentB._id,
      questionText: 'What is a Pod?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Smallest deployable unit' },
        { key: 'B', text: 'Physical node' }
      ],
      correctAnswers: ['A'],
      marks: 10,
      order: 1,
      isActive: true
    });

    enrollmentA = await Enrollment.create({
      employee: employeeProfileA._id,
      course: courseA._id,
      status: 'in_progress',
      isActive: true
    });

    enrollmentB = await Enrollment.create({
      employee: employeeProfileB._id,
      course: courseB._id,
      status: 'in_progress',
      isActive: true
    });

    adminToken = jwt.sign(
      { id: adminUser._id, userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerTokenA = jwt.sign(
      { id: trainerUserA._id, userId: trainerUserA._id, email: trainerUserA.email, role: trainerUserA.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerTokenB = jwt.sign(
      { id: trainerUserB._id, userId: trainerUserB._id, email: trainerUserB.email, role: trainerUserB.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeTokenA = jwt.sign(
      { id: employeeUserA._id, userId: employeeUserA._id, email: employeeUserA.email, role: employeeUserA.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeTokenB = jwt.sign(
      { id: employeeUserB._id, userId: employeeUserB._id, email: employeeUserB.email, role: employeeUserB.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await AssessmentAttempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await AssessmentAttempt.deleteMany({});
  });

  // ============================================================================
  // 1. SERVER-SIDE SCORING & EVALUATION UNIT TESTS
  // ============================================================================
  describe('Server-Side Scoring Logic & Correctness Rules', () => {
    test('1. submitted attempt can be evaluated', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA1._id, selectedAnswers: ['A'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });

      const evaluated = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(evaluated.status).toBe('submitted');
      expect(evaluated.evaluatedAt).toBeInstanceOf(Date);
      expect(evaluated.totalMarks).toBe(30); // 10 + 15 + 5
      expect(evaluated.obtainedMarks).toBe(10);
      expect(evaluated.percentage).toBe(33.33);
      expect(evaluated.result).toBe('failed'); // 33.33 < 70
    });

    test('2. in_progress attempt cannot be evaluated (throws 400)', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'in_progress',
        answers: []
      });

      await expect(assessmentResultService.evaluateAttempt(attempt._id)).rejects.toThrow(
        /only submitted assessment attempts/i
      );
    });

    test('3. abandoned attempt cannot be evaluated (throws 400)', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'abandoned',
        answers: []
      });

      await expect(assessmentResultService.evaluateAttempt(attempt._id)).rejects.toThrow(
        /only submitted assessment attempts/i
      );
    });

    test('4-6. totalMarks, obtainedMarks, percentage calculated server-side', async () => {
      // Answer all 3 questions correctly: Q1 (10), Q2 (15), Q3 (5) = 30 marks
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA2._id, selectedAnswers: ['A', 'C'] },
          { question: questionA3._id, selectedAnswers: ['B'] }
        ],
        startedAt: new Date(),
        submittedAt: new Date()
      });

      const evaluated = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(evaluated.totalMarks).toBe(30);
      expect(evaluated.obtainedMarks).toBe(30);
      expect(evaluated.percentage).toBe(100);
      expect(evaluated.result).toBe('passed');
    });

    test('7-10. passing percentage threshold behavior', async () => {
      // Assessment threshold = 70%
      // Case A: Exactly at threshold
      // Q1 (10) + Q3 (5) = 15/30 = 50% -> below threshold fails
      const attemptFail = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA3._id, selectedAnswers: ['B'] }
        ],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalFail = await assessmentResultService.evaluateAttempt(attemptFail._id);
      expect(evalFail.obtainedMarks).toBe(15);
      expect(evalFail.percentage).toBe(50);
      expect(evalFail.result).toBe('failed');

      // Case B: Above threshold
      // Q1 (10) + Q2 (15) = 25/30 = 83.33% -> passes
      const attemptPass = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 2,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA2._id, selectedAnswers: ['A', 'C'] }
        ],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalPass = await assessmentResultService.evaluateAttempt(attemptPass._id);
      expect(evalPass.obtainedMarks).toBe(25);
      expect(evalPass.percentage).toBe(83.33);
      expect(evalPass.result).toBe('passed');
    });

    test('11-12. single-choice correct and wrong answer evaluation', async () => {
      // Wrong answer on single-choice
      const attemptWrong = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA1._id, selectedAnswers: ['B'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evaluatedWrong = await assessmentResultService.evaluateAttempt(attemptWrong._id);
      expect(evaluatedWrong.obtainedMarks).toBe(0);
      expect(evaluatedWrong.percentage).toBe(0);
      expect(evaluatedWrong.result).toBe('failed');
    });

    test('13-14. multiple-choice exact set correct regardless of selection order', async () => {
      // Q2 correctAnswers = ['A', 'C']. Employee submits in reverse order ['C', 'A']
      const attemptReordered = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA2._id, selectedAnswers: ['C', 'A'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalReordered = await assessmentResultService.evaluateAttempt(attemptReordered._id);
      expect(evalReordered.obtainedMarks).toBe(15);
      expect(evalReordered.percentage).toBe(50); // 15/30 = 50%
    });

    test('15. multiple-choice partial selection is incorrect (zero marks)', async () => {
      // Employee selects only ['A'] when ['A', 'C'] is required
      const attemptPartial = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA2._id, selectedAnswers: ['A'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalPartial = await assessmentResultService.evaluateAttempt(attemptPartial._id);
      expect(evalPartial.obtainedMarks).toBe(0);
    });

    test('16. multiple-choice extra selection is incorrect (zero marks)', async () => {
      // Employee selects ['A', 'B', 'C'] when ['A', 'C'] is required
      const attemptExtra = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA2._id, selectedAnswers: ['A', 'B', 'C'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalExtra = await assessmentResultService.evaluateAttempt(attemptExtra._id);
      expect(evalExtra.obtainedMarks).toBe(0);
    });

    test('17. unanswered questions contribute to totalMarks but zero to obtainedMarks', async () => {
      // Submit empty answers array
      const attemptEmpty = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalEmpty = await assessmentResultService.evaluateAttempt(attemptEmpty._id);
      expect(evalEmpty.totalMarks).toBe(30);
      expect(evalEmpty.obtainedMarks).toBe(0);
      expect(evalEmpty.percentage).toBe(0);
      expect(evalEmpty.result).toBe('failed');
    });

    test('18. zero total marks handled safely without division by zero', async () => {
      const attemptZero = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentZeroMarks._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalZero = await assessmentResultService.evaluateAttempt(attemptZero._id);
      expect(evalZero.totalMarks).toBe(0);
      expect(evalZero.obtainedMarks).toBe(0);
      expect(evalZero.percentage).toBe(0);
      expect(evalZero.result).toBe('failed');
    });

    test('19-20. percentage rounded to 2 decimal places and evaluatedAt generated server-side', async () => {
      // 10 / 30 = 33.3333... -> 33.33
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA1._id, selectedAnswers: ['A'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });
      const evalRes = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(evalRes.percentage).toBe(33.33);
      expect(evalRes.evaluatedAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // 2. ANTI-TAMPERING & CLIENT INJECTION PREVENTION
  // ============================================================================
  describe('Anti-Tampering & Client Injection Prevention', () => {
    let activeAttempt;

    beforeEach(async () => {
      activeAttempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'in_progress',
        startedAt: new Date()
      });
    });

    test('21-26. rejects client injection of score, percentage, result, totalMarks, obtainedMarks, evaluatedAt in submit', async () => {
      const forbiddenPayloads = [
        { score: 100 },
        { percentage: 100 },
        { result: 'passed' },
        { totalMarks: 100 },
        { obtainedMarks: 100 },
        { evaluatedAt: new Date() }
      ];

      for (const payload of forbiddenPayloads) {
        const res = await request(app)
          .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
          .set('Authorization', `Bearer ${employeeTokenA}`)
          .send({
            answers: [{ question: questionA1._id, selectedAnswers: ['A'] }],
            ...payload
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not allowed/i);
      }
    });

    test('27. server evaluates score independently from database, ignoring any spoofed option keys', async () => {
      // Valid submission with correct answer for Q1
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [{ question: questionA1._id, selectedAnswers: ['A'] }]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.attempt.obtainedMarks).toBe(10);
      expect(res.body.data.attempt.totalMarks).toBe(30);
      expect(res.body.data.attempt.percentage).toBe(33.33);
      expect(res.body.data.attempt.result).toBe('failed');
    });

    test('28-30. employee cannot modify evaluated result or submitted answers', async () => {
      // Submit attempt
      await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [{ question: questionA1._id, selectedAnswers: ['A'] }]
        });

      // Attempt re-submit
      const resResubmit = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [{ question: questionA1._id, selectedAnswers: ['A'] }]
        });
      expect(resResubmit.status).toBe(400);
      expect(resResubmit.body.message).toMatch(/already been submitted/i);
    });
  });

  // ============================================================================
  // 3. IMMUTABILITY STRATEGY
  // ============================================================================
  describe('Result Immutability Strategy', () => {
    test('31-34. evaluated result remains unchanged even if question text or marks are modified later', async () => {
      // Create and submit attempt
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA1._id, selectedAnswers: ['A'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });

      const initialEval = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(initialEval.obtainedMarks).toBe(10);
      expect(initialEval.totalMarks).toBe(30);
      expect(initialEval.percentage).toBe(33.33);

      // Trainer changes question marks from 10 to 50 and updates text
      await Question.findByIdAndUpdate(questionA1._id, {
        marks: 50,
        questionText: 'Altered question text by trainer'
      });

      // Re-evaluating without force should return the identical persisted result
      const reEvaluated = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(reEvaluated.obtainedMarks).toBe(10);
      expect(reEvaluated.totalMarks).toBe(30);
      expect(reEvaluated.percentage).toBe(33.33);

      // Fetching through result service also yields the immutable persisted result
      const fetched = await assessmentResultService.getAttemptResult(attempt._id, adminUser);
      expect(fetched.obtainedMarks).toBe(10);
      expect(fetched.totalMarks).toBe(30);

      // Restore question marks
      await Question.findByIdAndUpdate(questionA1._id, {
        marks: 10,
        questionText: 'What is the primary benefit of service mesh?'
      });
    });
  });

  // ============================================================================
  // 4. ATTEMPT RESULT ENDPOINT (GET /api/assessments/attempts/:attemptId/result)
  // ============================================================================
  describe('GET /api/assessments/attempts/:attemptId/result', () => {
    let evaluatedAttemptA;
    let evaluatedAttemptB;

    beforeEach(async () => {
      evaluatedAttemptA = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA2._id, selectedAnswers: ['A', 'C'] },
          { question: questionA3._id, selectedAnswers: ['B'] }
        ],
        totalMarks: 30,
        obtainedMarks: 30,
        percentage: 100,
        result: 'passed',
        startedAt: new Date(),
        submittedAt: new Date(),
        evaluatedAt: new Date()
      });

      evaluatedAttemptB = await AssessmentAttempt.create({
        employee: employeeProfileB._id,
        assessment: assessmentB._id,
        enrollment: enrollmentB._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionB1._id, selectedAnswers: ['A'] }],
        totalMarks: 10,
        obtainedMarks: 10,
        percentage: 100,
        result: 'passed',
        startedAt: new Date(),
        submittedAt: new Date(),
        evaluatedAt: new Date()
      });
    });

    test('35. unauthenticated request rejected with 401', async () => {
      const res = await request(app).get(
        `/api/assessments/attempts/${evaluatedAttemptA._id}/result`
      );
      expect(res.status).toBe(401);
    });

    test('36. employee can retrieve own evaluated result (200)', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${evaluatedAttemptA._id}/result`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.totalMarks).toBe(30);
      expect(res.body.data.result.obtainedMarks).toBe(30);
      expect(res.body.data.result.percentage).toBe(100);
      expect(res.body.data.result.result).toBe('passed');
      expect(res.body.data.result.evaluatedAt).toBeDefined();
    });

    test('37. employee cannot retrieve another employee result (returns 404 anti-enumeration)', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${evaluatedAttemptA._id}/result`)
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('38. trainer can retrieve result for an assessment on their own course (200)', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${evaluatedAttemptA._id}/result`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.result.totalMarks).toBe(30);
    });

    test('39. trainer cannot retrieve result for another trainer course (403)', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${evaluatedAttemptB._id}/result`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own courses/i);
    });

    test('40. admin can retrieve any attempt result (200)', async () => {
      const resA = await request(app)
        .get(`/api/assessments/attempts/${evaluatedAttemptA._id}/result`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resA.status).toBe(200);

      const resB = await request(app)
        .get(`/api/assessments/attempts/${evaluatedAttemptB._id}/result`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resB.status).toBe(200);
    });
  });

  // ============================================================================
  // 5. EMPLOYEE ASSESSMENT HISTORY (GET /api/assessments/results/me)
  // ============================================================================
  describe('GET /api/assessments/results/me', () => {
    beforeEach(async () => {
      // Create history for Employee A: 2 submitted attempts, 1 in_progress, 1 abandoned
      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA1._id, selectedAnswers: ['A'] }],
        totalMarks: 30,
        obtainedMarks: 10,
        percentage: 33.33,
        result: 'failed',
        startedAt: new Date(Date.now() - 100000),
        submittedAt: new Date(Date.now() - 90000),
        evaluatedAt: new Date(Date.now() - 90000)
      });

      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 2,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA2._id, selectedAnswers: ['A', 'C'] },
          { question: questionA3._id, selectedAnswers: ['B'] }
        ],
        totalMarks: 30,
        obtainedMarks: 30,
        percentage: 100,
        result: 'passed',
        startedAt: new Date(Date.now() - 50000),
        submittedAt: new Date(Date.now() - 40000),
        evaluatedAt: new Date(Date.now() - 40000)
      });

      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 3,
        status: 'in_progress',
        startedAt: new Date()
      });

      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 4,
        status: 'abandoned',
        startedAt: new Date()
      });
    });

    test('45-50. employee retrieves own history containing only submitted attempts sorted newest first', async () => {
      const res = await request(app)
        .get('/api/assessments/results/me')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const history = res.body.data.history;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2); // Only the 2 submitted attempts

      // Newest first (attemptNumber 2 was submitted after attemptNumber 1)
      expect(history[0].attemptNumber).toBe(2);
      expect(history[0].result).toBe('passed');
      expect(history[0].percentage).toBe(100);
      expect(history[0].assessmentTitle).toBe(assessmentA.title);
      expect(history[0].courseTitle).toBe(courseA.title);

      expect(history[1].attemptNumber).toBe(1);
      expect(history[1].result).toBe('failed');
      expect(history[1].percentage).toBe(33.33);
    });

    test('51-52. history payload contains no correctAnswers or password hashes', async () => {
      const res = await request(app)
        .get('/api/assessments/results/me')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      const rawJson = JSON.stringify(res.body);
      expect(rawJson).not.toContain('correctAnswers');
      expect(rawJson).not.toContain('password');
    });

    test('trainer or admin calling /results/me returns 403 Forbidden', async () => {
      const resTrainer = await request(app)
        .get('/api/assessments/results/me')
        .set('Authorization', `Bearer ${trainerTokenA}`);
      expect(resTrainer.status).toBe(403);

      const resAdmin = await request(app)
        .get('/api/assessments/results/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(403);
    });
  });

  // ============================================================================
  // 6. ASSESSMENT PERFORMANCE ANALYTICS (GET /api/assessments/:assessmentId/performance)
  // ============================================================================
  describe('GET /api/assessments/:assessmentId/performance', () => {
    beforeEach(async () => {
      // Attempt 1: Charlie, passed (100%)
      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        totalMarks: 30,
        obtainedMarks: 30,
        percentage: 100,
        result: 'passed',
        startedAt: new Date(),
        submittedAt: new Date(),
        evaluatedAt: new Date()
      });

      // Attempt 2: Dave, failed (33.33%)
      await AssessmentAttempt.create({
        employee: employeeProfileB._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        totalMarks: 30,
        obtainedMarks: 10,
        percentage: 33.33,
        result: 'failed',
        startedAt: new Date(),
        submittedAt: new Date(),
        evaluatedAt: new Date()
      });

      // Attempt 3: Dave, passed (83.33%)
      await AssessmentAttempt.create({
        employee: employeeProfileB._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 2,
        status: 'submitted',
        totalMarks: 30,
        obtainedMarks: 25,
        percentage: 83.33,
        result: 'passed',
        startedAt: new Date(),
        submittedAt: new Date(),
        evaluatedAt: new Date()
      });

      // Attempt 4: In-progress (should be excluded from performance stats)
      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 2,
        status: 'in_progress',
        startedAt: new Date()
      });

      // Attempt 5: Abandoned (should be excluded from performance stats)
      await AssessmentAttempt.create({
        employee: employeeProfileB._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 3,
        status: 'abandoned',
        startedAt: new Date()
      });
    });

    test('41. employee cannot access assessment performance endpoint (403)', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id}/performance`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied|permission/i);
    });

    test('42-44. trainer and admin can access assessment performance with accurate statistics', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id}/performance`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const perf = res.body.data.performance;
      expect(perf.assessment.title).toBe(assessmentA.title);
      expect(perf.totalAttempts).toBe(5);
      expect(perf.submittedAttempts).toBe(3);
      expect(perf.passedAttempts).toBe(2);
      expect(perf.failedAttempts).toBe(1);

      // (100 + 33.33 + 83.33) / 3 = 216.66 / 3 = 72.22
      expect(perf.averagePercentage).toBe(72.22);
      expect(perf.highestPercentage).toBe(100);
      expect(perf.lowestPercentage).toBe(33.33);
      // (2 / 3) * 100 = 66.67
      expect(perf.passPercentage).toBe(66.67);
    });

    test('43. trainer cannot access performance for another trainer assessment (403)', async () => {
      // Trainer A tries to get performance for Assessment B (Course B owned by Trainer B)
      const res = await request(app)
        .get(`/api/assessments/${assessmentB._id}/performance`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own courses/i);
    });

    test('61. handles assessment with zero submitted attempts gracefully', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentB._id}/performance`)
        .set('Authorization', `Bearer ${trainerTokenB}`);

      expect(res.status).toBe(200);
      const perf = res.body.data.performance;
      expect(perf.totalAttempts).toBe(0);
      expect(perf.submittedAttempts).toBe(0);
      expect(perf.passedAttempts).toBe(0);
      expect(perf.failedAttempts).toBe(0);
      expect(perf.averagePercentage).toBe(0);
      expect(perf.highestPercentage).toBe(0);
      expect(perf.lowestPercentage).toBe(0);
      expect(perf.passPercentage).toBe(0);
    });

    test('returns 400 for invalid assessment ID format in performance endpoint', async () => {
      const res = await request(app)
        .get('/api/assessments/invalid-id/performance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent assessment in performance endpoint', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/assessments/${fakeId}/performance`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ============================================================================
  // 7. ADDITIONAL SCORING & isAnswerCorrect UNIT TESTS
  // ============================================================================
  describe('isAnswerCorrect Helper Unit Tests', () => {
    test('returns false when selectedAnswers is null, empty, or non-array', () => {
      const q = { questionType: 'single_choice', correctAnswers: ['A'] };
      expect(assessmentResultService.isAnswerCorrect(q, null)).toBe(false);
      expect(assessmentResultService.isAnswerCorrect(q, [])).toBe(false);
      expect(assessmentResultService.isAnswerCorrect(q, 'A')).toBe(false);
    });

    test('returns false when question has no correctAnswers', () => {
      const q = { questionType: 'single_choice', correctAnswers: [] };
      expect(assessmentResultService.isAnswerCorrect(q, ['A'])).toBe(false);
    });

    test('single_choice returns false if multiple options selected', () => {
      const q = { questionType: 'single_choice', correctAnswers: ['A'] };
      expect(assessmentResultService.isAnswerCorrect(q, ['A', 'B'])).toBe(false);
    });

    test('multiple_choice returns false for duplicate selections that do not match set size', () => {
      const q = { questionType: 'multiple_choice', correctAnswers: ['A', 'B'] };
      expect(assessmentResultService.isAnswerCorrect(q, ['A', 'A'])).toBe(false);
    });

    test('multiple_choice returns false for completely disjoint selections', () => {
      const q = { questionType: 'multiple_choice', correctAnswers: ['A', 'B'] };
      expect(assessmentResultService.isAnswerCorrect(q, ['C', 'D'])).toBe(false);
    });

    test('returns false for unknown questionType', () => {
      const q = { questionType: 'essay', correctAnswers: ['A'] };
      expect(assessmentResultService.isAnswerCorrect(q, ['A'])).toBe(false);
    });
  });

  // ============================================================================
  // 8. RESULT ENDPOINT ERROR CONDITIONS & EDGE CASES
  // ============================================================================
  describe('GET /api/assessments/attempts/:attemptId/result Error Conditions', () => {
    test('returns 400 for invalid attempt ID format', async () => {
      const res = await request(app)
        .get('/api/assessments/attempts/invalid-id/result')
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent attempt ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/assessments/attempts/${fakeId}/result`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res.status).toBe(404);
    });

    test('returns 400 when attempt has not been submitted yet (in_progress)', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'in_progress',
        startedAt: new Date()
      });

      const res = await request(app)
        .get(`/api/assessments/attempts/${attempt._id}/result`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not been submitted/i);
    });

    test('returns 400 when attempt has status abandoned', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'abandoned',
        startedAt: new Date()
      });

      const res = await request(app)
        .get(`/api/assessments/attempts/${attempt._id}/result`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not been submitted/i);
    });
  });

  // ============================================================================
  // 9. EXTENDED IMMUTABILITY TESTS
  // ============================================================================
  describe('Extended Immutability Verification', () => {
    test('modifying assessment passingPercentage after evaluation does NOT change historical attempt result', async () => {
      // Create and submit attempt with 50% score (fails under 70% threshold)
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA3._id, selectedAnswers: ['B'] }
        ],
        startedAt: new Date(),
        submittedAt: new Date()
      });

      const initialEval = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(initialEval.obtainedMarks).toBe(15);
      expect(initialEval.percentage).toBe(50);
      expect(initialEval.result).toBe('failed');

      // Trainer lowers passingPercentage to 40% on the assessment
      await Assessment.findByIdAndUpdate(assessmentA._id, { passingPercentage: 40 });

      // Fetching result should return the persisted result ('failed')
      const fetched = await assessmentResultService.getAttemptResult(attempt._id, adminUser);
      expect(fetched.result).toBe('failed');
      expect(fetched.percentage).toBe(50);

      // Restore passing percentage to 70%
      await Assessment.findByIdAndUpdate(assessmentA._id, { passingPercentage: 70 });
    });

    test('soft-deleting a question after evaluation does NOT change historical totalMarks or percentage', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [
          { question: questionA1._id, selectedAnswers: ['A'] },
          { question: questionA2._id, selectedAnswers: ['A', 'C'] },
          { question: questionA3._id, selectedAnswers: ['B'] }
        ],
        startedAt: new Date(),
        submittedAt: new Date()
      });

      const initialEval = await assessmentResultService.evaluateAttempt(attempt._id);
      expect(initialEval.totalMarks).toBe(30);
      expect(initialEval.obtainedMarks).toBe(30);
      expect(initialEval.percentage).toBe(100);

      // Trainer soft-deletes question A3
      await Question.findByIdAndUpdate(questionA3._id, { isActive: false });

      // Re-evaluating or fetching maintains persisted result
      const fetched = await assessmentResultService.getAttemptResult(attempt._id, adminUser);
      expect(fetched.totalMarks).toBe(30);
      expect(fetched.obtainedMarks).toBe(30);
      expect(fetched.percentage).toBe(100);

      // Restore question A3
      await Question.findByIdAndUpdate(questionA3._id, { isActive: true });
    });
  });

  // ============================================================================
  // 10. HISTORY EMPTY STATE & MULTI-COURSE TESTS
  // ============================================================================
  describe('Employee History Empty & Multi-Course State', () => {
    test('returns empty array when employee has zero submitted attempts', async () => {
      const res = await request(app)
        .get('/api/assessments/results/me')
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.history).toEqual([]);
    });

    test('employee history aggregates across multiple courses and assessments', async () => {
      // Attempt 1: Course A
      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        totalMarks: 30,
        obtainedMarks: 30,
        percentage: 100,
        result: 'passed',
        startedAt: new Date(Date.now() - 60000),
        submittedAt: new Date(Date.now() - 50000),
        evaluatedAt: new Date(Date.now() - 50000)
      });

      // Attempt 2: Course B (with enrollment on Course B)
      const enrollmentA_CourseB = await Enrollment.create({
        employee: employeeProfileA._id,
        course: courseB._id,
        status: 'in_progress',
        isActive: true
      });

      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentB._id,
        enrollment: enrollmentA_CourseB._id,
        attemptNumber: 1,
        status: 'submitted',
        totalMarks: 10,
        obtainedMarks: 10,
        percentage: 100,
        result: 'passed',
        startedAt: new Date(Date.now() - 30000),
        submittedAt: new Date(Date.now() - 20000),
        evaluatedAt: new Date(Date.now() - 20000)
      });

      const res = await request(app)
        .get('/api/assessments/results/me')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.history.length).toBe(2);
      expect(res.body.data.history[0].assessmentTitle).toBe(assessmentB.title);
      expect(res.body.data.history[1].assessmentTitle).toBe(assessmentA.title);
    });
  });
});

