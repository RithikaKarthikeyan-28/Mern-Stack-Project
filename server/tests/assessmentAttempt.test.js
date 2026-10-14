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
const { validateSubmitAttempt } = require('../src/validators/assessment.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Assessment Attempt Foundation & Submission Tests (Phase 10)', () => {
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

  let courseA;
  let courseB;
  let draftCourse;
  let archivedCourse;
  let inactiveCourse;

  let assessmentA;
  let assessmentLimited;
  let assessmentCourseB;
  let draftAssessment;
  let archivedAssessment;
  let inactiveAssessment;

  let questionA1;
  let questionA2;
  let questionB1;
  let inactiveQuestion;

  let enrollmentA;
  let enrollmentB;
  let droppedEnrollment;
  let inactiveEnrollment;

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
      name: 'Engineering QA',
      description: 'Quality Assurance Department'
    });

    adminUser = await User.create({
      name: 'Attempt Admin',
      email: 'att_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'att_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'att_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUserA = await User.create({
      name: 'Employee Charlie',
      email: 'att_charlie@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeUserB = await User.create({
      name: 'Employee Dave',
      email: 'att_dave@example.com',
      password: 'Password123',
      role: 'employee'
    });

    noProfileUser = await User.create({
      name: 'Employee NoProfile',
      email: 'att_noprofile@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeProfileA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-ATT-001',
      department: department._id,
      designation: 'Backend Engineer'
    });

    employeeProfileB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-ATT-002',
      department: department._id,
      designation: 'Frontend Engineer'
    });

    courseA = await Course.create({
      title: 'Course A: Microservices In Practice',
      description: 'Enterprise architecture',
      category: 'Architecture',
      level: 'advanced',
      duration: 30,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Course B: Cloud Kubernetes',
      description: 'Container orchestration',
      category: 'Cloud',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Draft Course',
      description: 'Under development',
      category: 'Draft',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedCourse = await Course.create({
      title: 'Archived Course',
      description: 'Old course',
      category: 'Archived',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });

    inactiveCourse = await Course.create({
      title: 'Inactive Course',
      description: 'Disabled course',
      category: 'Disabled',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: false
    });

    assessmentA = await Assessment.create({
      title: 'Course A Comprehensive Exam',
      course: courseA._id,
      trainer: trainerUserA._id,
      passingPercentage: 70,
      timeLimitMinutes: 45,
      maxAttempts: 2,
      status: 'published',
      isActive: true
    });

    assessmentLimited = await Assessment.create({
      title: 'Single Attempt Assessment',
      course: courseA._id,
      trainer: trainerUserA._id,
      passingPercentage: 80,
      maxAttempts: 1,
      status: 'published',
      isActive: true
    });

    assessmentCourseB = await Assessment.create({
      title: 'Course B Exam',
      course: courseB._id,
      trainer: trainerUserB._id,
      passingPercentage: 60,
      status: 'published',
      isActive: true
    });

    draftAssessment = await Assessment.create({
      title: 'Draft Assessment',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedAssessment = await Assessment.create({
      title: 'Archived Assessment',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });

    inactiveAssessment = await Assessment.create({
      title: 'Inactive Assessment',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: false
    });

    questionA1 = await Question.create({
      assessment: assessmentA._id,
      questionText: 'What is the primary benefit of microservices?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Independent deployability' },
        { key: 'B', text: 'Single monolithic database' },
        { key: 'C', text: 'Tight coupling' }
      ],
      correctAnswers: ['A'],
      marks: 5,
      order: 1,
      isActive: true
    });

    questionA2 = await Question.create({
      assessment: assessmentA._id,
      questionText: 'Which protocols are commonly used for synchronous RPC? (Select all)',
      questionType: 'multiple_choice',
      options: [
        { key: 'A', text: 'gRPC' },
        { key: 'B', text: 'REST/HTTP' },
        { key: 'C', text: 'FTP' }
      ],
      correctAnswers: ['A', 'B'],
      marks: 10,
      order: 2,
      isActive: true
    });

    questionB1 = await Question.create({
      assessment: assessmentCourseB._id,
      questionText: 'What is a Kubernetes Pod?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Smallest deployable unit' },
        { key: 'B', text: 'A physical server' }
      ],
      correctAnswers: ['A'],
      marks: 5,
      order: 1,
      isActive: true
    });

    inactiveQuestion = await Question.create({
      assessment: assessmentA._id,
      questionText: 'Deprecated question?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Yes' },
        { key: 'B', text: 'No' }
      ],
      correctAnswers: ['A'],
      marks: 5,
      order: 99,
      isActive: false
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

    droppedEnrollment = await Enrollment.create({
      employee: employeeProfileB._id,
      course: courseA._id,
      status: 'dropped',
      isActive: true
    });

    adminToken = jwt.sign(
      { id: adminUser._id, userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    trainerTokenA = jwt.sign(
      { id: trainerUserA._id, userId: trainerUserA._id, email: trainerUserA.email, role: trainerUserA.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    trainerTokenB = jwt.sign(
      { id: trainerUserB._id, userId: trainerUserB._id, email: trainerUserB.email, role: trainerUserB.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    employeeTokenA = jwt.sign(
      { id: employeeUserA._id, userId: employeeUserA._id, email: employeeUserA.email, role: employeeUserA.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    employeeTokenB = jwt.sign(
      { id: employeeUserB._id, userId: employeeUserB._id, email: employeeUserB.email, role: employeeUserB.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    noProfileToken = jwt.sign(
      { id: noProfileUser._id, userId: noProfileUser._id, email: noProfileUser.email, role: noProfileUser.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
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
  // 1. MODEL UNIT TESTS & SCHEMA VALIDATION
  // ============================================================================
  describe('AssessmentAttempt Model Invariants', () => {
    test('successfully creates a valid attempt with schema defaults', async () => {
      const attempt = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1
      });

      expect(attempt._id).toBeDefined();
      expect(attempt.status).toBe('in_progress');
      expect(attempt.answers).toEqual([]);
      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.startedAt).toBeInstanceOf(Date);
      expect(attempt.submittedAt).toBeNull();

      const json = attempt.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });

    test('fails validation when required fields are missing', async () => {
      const missingAttempt = new AssessmentAttempt({});
      let err;
      try {
        await missingAttempt.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.employee).toBeDefined();
      expect(err.errors.assessment).toBeDefined();
      expect(err.errors.enrollment).toBeDefined();
      expect(err.errors.attemptNumber).toBeDefined();
    });

    test('enforces attemptNumber min 1 and integer constraint', async () => {
      const zeroAttempt = new AssessmentAttempt({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 0
      });
      let err;
      try {
        await zeroAttempt.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.attemptNumber).toBeDefined();

      const floatAttempt = new AssessmentAttempt({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1.5
      });
      let errFloat;
      try {
        await floatAttempt.validate();
      } catch (e) {
        errFloat = e;
      }
      expect(errFloat).toBeDefined();
      expect(errFloat.errors.attemptNumber).toBeDefined();
    });

    test('rejects invalid status enum value', async () => {
      const invalidStatus = new AssessmentAttempt({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'invalid_status'
      });
      let err;
      try {
        await invalidStatus.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    test('enforces compound unique index on { employee, assessment, attemptNumber }', async () => {
      await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1
      });

      let duplicateErr;
      try {
        await AssessmentAttempt.create({
          employee: employeeProfileA._id,
          assessment: assessmentA._id,
          enrollment: enrollmentA._id,
          attemptNumber: 1
        });
      } catch (e) {
        duplicateErr = e;
      }
      expect(duplicateErr).toBeDefined();
      expect(duplicateErr.code).toBe(11000);
    });
  });

  // ============================================================================
  // 2. STARTING AN ASSESSMENT ATTEMPT (POST /api/assessments/:id/attempts)
  // ============================================================================
  describe('POST /api/assessments/:assessmentId/attempts', () => {
    test('returns 401 Unauthorized when no authentication token is provided', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('returns 403 Forbidden when authenticated as trainer', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('returns 403 Forbidden when authenticated as admin', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('returns 403 Forbidden when employee has no employee profile', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${noProfileToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/employee profile/i);
    });

    test('returns 400 when assessment ID is invalid ObjectId', async () => {
      const res = await request(app)
        .post('/api/assessments/invalid-object-id/attempts')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('returns 404 when assessment does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/assessments/${fakeId}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('returns 404 when assessment is draft', async () => {
      const res = await request(app)
        .post(`/api/assessments/${draftAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(404);
    });

    test('returns 404 when assessment is archived', async () => {
      const res = await request(app)
        .post(`/api/assessments/${archivedAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(404);
    });

    test('returns 404 when assessment is inactive', async () => {
      const res = await request(app)
        .post(`/api/assessments/${inactiveAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(404);
    });

    test('returns 403 Forbidden when employee is not enrolled in course', async () => {
      // employeeA has no enrollment in courseB
      const res = await request(app)
        .post(`/api/assessments/${assessmentCourseB._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/enrollment/i);
    });

    test('returns 403 Forbidden when employee enrollment is dropped', async () => {
      // employeeB has dropped enrollment in courseA
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/enrollment/i);
    });

    test('starts attempt successfully with initial status in_progress and attemptNumber 1', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.status).toBe('in_progress');
      expect(res.body.data.attempt.attemptNumber).toBe(1);
      expect(res.body.data.attempt.answers).toEqual([]);
      expect(res.body.data.attempt.startedAt).toBeDefined();
      expect(res.body.data.attempt.submittedAt).toBeNull();
      expect(res.body.data.attempt.assessment).toBeDefined();
      expect(res.body.data.attempt.employee).toBeDefined();
      expect(res.body.data.attempt.enrollment).toBeDefined();
    });

    test('sanitizes client-injected fields (attemptNumber, status, score, answers)', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          attemptNumber: 99,
          status: 'submitted',
          score: 100,
          submittedAt: new Date(),
          answers: [{ question: questionA1._id, selectedAnswers: ['A'] }]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.attempt.attemptNumber).toBe(1);
      expect(res.body.data.attempt.status).toBe('in_progress');
      expect(res.body.data.attempt.answers).toEqual([]);
      expect(res.body.data.attempt.submittedAt).toBeNull();
    });

    test('increments attemptNumber sequentially for subsequent attempts', async () => {
      const res1 = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(res1.status).toBe(201);
      expect(res1.body.data.attempt.attemptNumber).toBe(1);

      const res2 = await request(app)
        .post(`/api/assessments/${assessmentA._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(res2.status).toBe(201);
      expect(res2.body.data.attempt.attemptNumber).toBe(2);
    });

    test('enforces maxAttempts policy and returns 400 Bad Request when limit exceeded', async () => {
      // assessmentLimited has maxAttempts: 1
      const res1 = await request(app)
        .post(`/api/assessments/${assessmentLimited._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/assessments/${assessmentLimited._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/limit reached/i);
    });

    test('allows new attempt if previous attempt was abandoned (does not count against maxAttempts)', async () => {
      // assessmentLimited maxAttempts: 1
      const res1 = await request(app)
        .post(`/api/assessments/${assessmentLimited._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(res1.status).toBe(201);

      // Abandon the first attempt
      await AssessmentAttempt.findByIdAndUpdate(res1.body.data.attempt.id, { status: 'abandoned' });

      // Employee can now start another attempt since non-abandoned count is 0
      const res2 = await request(app)
        .post(`/api/assessments/${assessmentLimited._id}/attempts`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(res2.status).toBe(201);
      // Attempt number is total attempts + 1 = 2
      expect(res2.body.data.attempt.attemptNumber).toBe(2);
    });
  });

  // ============================================================================
  // 3. ATTEMPT SUBMISSION (PATCH /api/assessments/attempts/:attemptId/submit)
  // ============================================================================
  describe('PATCH /api/assessments/attempts/:attemptId/submit', () => {
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

    test('returns 401 Unauthorized when no token provided', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .send({ answers: [] });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('returns 403 Forbidden when submitted by trainer or admin', async () => {
      const resTrainer = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ answers: [] });
      expect(resTrainer.status).toBe(403);

      const resAdmin = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answers: [] });
      expect(resAdmin.status).toBe(403);
    });

    test('returns 400 when attempt ID is invalid ObjectId', async () => {
      const res = await request(app)
        .patch('/api/assessments/attempts/invalid-id/submit')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ answers: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('returns 404 when attempt does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/assessments/attempts/${fakeId}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ answers: [] });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('returns 403 IDOR Forbidden when employee tries to submit another employee attempt', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ answers: [] });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own attempt/i);
    });

    test('returns 400 Bad Request when payload answers is missing or not an array', async () => {
      const resMissing = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({});
      expect(resMissing.status).toBe(400);

      const resNonArray = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ answers: 'invalid' });
      expect(resNonArray.status).toBe(400);
    });

    test('returns 400 Bad Request when answers entry has missing or invalid question ID', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: 'invalid-id', selectedAnswers: ['A'] }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid question ObjectId/i);
    });

    test('returns 400 Bad Request when answers entry has missing or empty selectedAnswers', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: questionA1._id, selectedAnswers: [] }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/non-empty array/i);
    });

    test('returns 400 Bad Request when answers array contains duplicate questions', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: questionA1._id, selectedAnswers: ['A'] },
            { question: questionA1._id, selectedAnswers: ['B'] }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/duplicate question/i);
    });

    test('returns 400 Bad Request when question does not belong to the assessment', async () => {
      // questionB1 belongs to assessmentCourseB, not assessmentA
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: questionB1._id, selectedAnswers: ['A'] }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not belong/i);
    });

    test('returns 400 Bad Request when question is inactive', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: inactiveQuestion._id, selectedAnswers: ['A'] }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive/i);
    });

    test('returns 400 Bad Request when selected answer key does not exist in question options', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: questionA1._id, selectedAnswers: ['Z'] }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not a valid option/i);
    });

    test('successfully submits attempt with valid single and multiple choice answers', async () => {
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [
            { question: questionA1._id, selectedAnswers: ['A'] },
            { question: questionA2._id, selectedAnswers: ['A', 'B'] }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.status).toBe('submitted');
      expect(res.body.data.attempt.submittedAt).toBeDefined();
      expect(res.body.data.attempt.answers).toHaveLength(2);
      expect(res.body.data.attempt.answers[0].question.toString()).toBe(questionA1._id.toString());
      expect(res.body.data.attempt.answers[0].selectedAnswers).toEqual(['A']);
      expect(res.body.data.attempt.answers[1].question.toString()).toBe(questionA2._id.toString());
      expect(res.body.data.attempt.answers[1].selectedAnswers).toEqual(['A', 'B']);
    });

    test('returns 400 Bad Request when attempting to submit an already submitted attempt', async () => {
      // First submission
      await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [{ question: questionA1._id, selectedAnswers: ['A'] }]
        });

      // Second submission attempt
      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [{ question: questionA1._id, selectedAnswers: ['B'] }]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been submitted/i);
    });

    test('returns 400 Bad Request when attempting to submit an abandoned attempt', async () => {
      await AssessmentAttempt.findByIdAndUpdate(activeAttempt._id, { status: 'abandoned' });

      const res = await request(app)
        .patch(`/api/assessments/attempts/${activeAttempt._id}/submit`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          answers: [{ question: questionA1._id, selectedAnswers: ['A'] }]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been submitted or completed/i);
    });
  });

  // ============================================================================
  // 4. RETRIEVING AN ATTEMPT (GET /api/assessments/attempts/:attemptId)
  // ============================================================================
  describe('GET /api/assessments/attempts/:attemptId', () => {
    let savedAttemptA;
    let savedAttemptB;

    beforeEach(async () => {
      savedAttemptA = await AssessmentAttempt.create({
        employee: employeeProfileA._id,
        assessment: assessmentA._id,
        enrollment: enrollmentA._id,
        attemptNumber: 1,
        status: 'submitted',
        answers: [{ question: questionA1._id, selectedAnswers: ['A'] }],
        startedAt: new Date(),
        submittedAt: new Date()
      });

      savedAttemptB = await AssessmentAttempt.create({
        employee: employeeProfileB._id,
        assessment: assessmentCourseB._id,
        enrollment: enrollmentB._id,
        attemptNumber: 1,
        status: 'in_progress',
        startedAt: new Date()
      });
    });

    test('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptA._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('returns 400 when attempt ID is invalid ObjectId', async () => {
      const res = await request(app)
        .get('/api/assessments/attempts/invalid-id')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('returns 404 when attempt does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/assessments/attempts/${fakeId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('employee can retrieve their own attempt', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptA._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.id).toBe(savedAttemptA._id.toString());
      expect(res.body.data.attempt.assessment).toBeDefined();
      expect(res.body.data.attempt.employee).toBeDefined();
    });

    test('employee cannot retrieve another employee attempt (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptA._id}`)
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('trainer can retrieve attempt for assessment in their own course', async () => {
      const res = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptA._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.id).toBe(savedAttemptA._id.toString());
    });

    test('trainer cannot retrieve attempt for assessment in another trainer course (returns 403)', async () => {
      // Trainer A tries to get attempt for Course B
      const res = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptB._id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own courses/i);
    });

    test('admin can retrieve any attempt regardless of trainer or employee', async () => {
      const resA = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resA.status).toBe(200);

      const resB = await request(app)
        .get(`/api/assessments/attempts/${savedAttemptB._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resB.status).toBe(200);
    });
  });

  // ============================================================================
  // 5. ATTEMPT DATA ENDPOINT (GET /api/assessments/:id/attempt-data)
  // ============================================================================
  describe('GET /api/assessments/:id/attempt-data', () => {
    test('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id}/attempt-data`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('returns 403 Forbidden when requested by trainer or admin (employee only)', async () => {
      const resTrainer = await request(app)
        .get(`/api/assessments/${assessmentA._id}/attempt-data`)
        .set('Authorization', `Bearer ${trainerTokenA}`);
      expect(resTrainer.status).toBe(403);

      const resAdmin = await request(app)
        .get(`/api/assessments/${assessmentA._id}/attempt-data`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(403);
    });

    test('returns 400 when assessment ID has invalid format, and 404 when assessment does not exist', async () => {
      const res = await request(app)
        .get('/api/assessments/invalid-id/attempt-data')
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(res.status).toBe(400);

      const fakeId = new mongoose.Types.ObjectId();
      const resFake = await request(app)
        .get(`/api/assessments/${fakeId}/attempt-data`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(resFake.status).toBe(404);
    });

    test('returns 404 when assessment is draft or archived', async () => {
      const resDraft = await request(app)
        .get(`/api/assessments/${draftAssessment._id}/attempt-data`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(resDraft.status).toBe(404);

      const resArch = await request(app)
        .get(`/api/assessments/${archivedAssessment._id}/attempt-data`)
        .set('Authorization', `Bearer ${employeeTokenA}`);
      expect(resArch.status).toBe(404);
    });

    test('returns 403 Forbidden when employee is not enrolled in the course', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentCourseB._id}/attempt-data`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/enrollment/i);
    });

    test('returns assessment attempt-data with correctAnswers COMPLETELY STRIPPED for employee', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id}/attempt-data`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assessment).toBeDefined();
      expect(res.body.data.assessment.title).toBe(assessmentA.title);
      expect(res.body.data.assessment.passingPercentage).toBe(70);
      expect(res.body.data.assessment.timeLimitMinutes).toBe(45);

      const questions = res.body.data.questions;
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThanOrEqual(2);

      // Verify that NO question in the array exposes correctAnswers
      questions.forEach((q) => {
        expect(q.correctAnswers).toBeUndefined();
        expect(q.options).toBeDefined();
        expect(q.questionText).toBeDefined();
        expect(q.marks).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 6. VALIDATOR UNIT TEST
  // ============================================================================
  describe('Validator Unit Tests: validateSubmitAttempt', () => {
    test('throws 400 when answers is not an array', () => {
      expect(() => validateSubmitAttempt({ answers: 'test' })).toThrow(/array/i);
    });

    test('throws 400 when question ID is missing or invalid', () => {
      expect(() => validateSubmitAttempt({ answers: [{ selectedAnswers: ['A'] }] })).toThrow(/valid question ObjectId/i);
      expect(() => validateSubmitAttempt({ answers: [{ question: 'invalid', selectedAnswers: ['A'] }] })).toThrow(/valid question ObjectId/i);
    });

    test('throws 400 when selectedAnswers is not a non-empty array of strings', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() => validateSubmitAttempt({ answers: [{ question: validId, selectedAnswers: [] }] })).toThrow(/non-empty array/i);
      expect(() => validateSubmitAttempt({ answers: [{ question: validId, selectedAnswers: [123] }] })).toThrow(/must be strings/i);
    });

    test('throws 400 when duplicate questions are present in submission', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(() =>
        validateSubmitAttempt({
          answers: [
            { question: validId, selectedAnswers: ['A'] },
            { question: validId, selectedAnswers: ['B'] }
          ]
        })
      ).toThrow(/duplicate question/i);
    });
  });
});
