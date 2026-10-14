const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Enrollment = require('../src/models/Enrollment');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');
const Question = require('../src/models/Question');
const config = require('../src/config');
const {
  validateCreateQuestion,
  validateUpdateQuestion
} = require('../src/validators/assessment.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Question Management & Security Tests (Phase 10)', () => {
  let adminToken;
  let trainerTokenA;
  let trainerTokenB;
  let employeeToken;

  let adminUser;
  let trainerUserA;
  let trainerUserB;
  let employeeUser;

  let courseA;
  let courseB;
  let assessmentA;
  let assessmentB;
  let draftAssessment;
  let archivedAssessment;
  let inactiveAssessment;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Question.syncIndexes();

    await Enrollment.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});

    adminUser = await User.create({
      name: 'Question Admin',
      email: 'q_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'q_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'q_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Employee Charlie',
      email: 'q_charlie@example.com',
      password: 'Password123',
      role: 'employee'
    });

    courseA = await Course.create({
      title: 'Course A: Microservices',
      description: 'Distributed architectures',
      category: 'Architecture',
      level: 'advanced',
      duration: 30,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    const dept = await Department.create({
      name: 'Question Test Dept',
      description: 'Department for Question Tests'
    });

    const empProfile = await Employee.create({
      user: employeeUser._id,
      employeeId: 'EMP-Q-001',
      department: dept._id,
      designation: 'Test Engineer'
    });

    await Enrollment.create({
      employee: empProfile._id,
      course: courseA._id,
      status: 'in_progress',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Course B: Cloud DevOps',
      description: 'Container orchestration',
      category: 'DevOps',
      level: 'intermediate',
      duration: 25,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    assessmentA = await Assessment.create({
      title: 'Course A Published Exam',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    assessmentB = await Assessment.create({
      title: 'Course B Published Exam',
      course: courseB._id,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    draftAssessment = await Assessment.create({
      title: 'Course A Draft Quiz',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedAssessment = await Assessment.create({
      title: 'Course A Archived Exam',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });

    inactiveAssessment = await Assessment.create({
      title: 'Course A Inactive Exam',
      course: courseA._id,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: false
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: adminUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerTokenA = jwt.sign(
      { userId: trainerUserA._id.toString(), role: trainerUserA.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerTokenB = jwt.sign(
      { userId: trainerUserB._id.toString(), role: trainerUserB.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: employeeUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await Enrollment.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  // ============================================================================
  // 1. QUESTION MODEL & VALIDATION TESTS
  // ============================================================================
  describe('Question Model & Validation Tests', () => {
    it('Test 1: Valid single_choice question passes schema validation', async () => {
      const q = new Question({
        assessment: assessmentA._id,
        questionText: 'What is a bounded context in Domain Driven Design?',
        questionType: 'single_choice',
        options: [
          { key: 'A', text: 'A database boundary' },
          { key: 'B', text: 'An explicit boundary within which a domain model applies' }
        ],
        correctAnswers: ['B'],
        marks: 2,
        order: 1
      });

      const saved = await q.save();
      expect(saved._id).toBeDefined();
      expect(saved.questionType).toBe('single_choice');
      expect(saved.marks).toBe(2);
      await Question.findByIdAndDelete(saved._id);
    });

    it('Test 2: Valid multiple_choice question passes schema validation', async () => {
      const q = new Question({
        assessment: assessmentA._id,
        questionText: 'Which patterns are used for distributed transaction management?',
        questionType: 'multiple_choice',
        options: [
          { key: 'A', text: 'Saga Pattern' },
          { key: 'B', text: 'Two-Phase Commit' },
          { key: 'C', text: 'Singleton Pattern' }
        ],
        correctAnswers: ['A', 'B'],
        marks: 3,
        order: 2
      });

      const saved = await q.save();
      expect(saved._id).toBeDefined();
      expect(saved.correctAnswers).toEqual(['A', 'B']);
      await Question.findByIdAndDelete(saved._id);
    });

    it('Test 3: Validation fails when questionText is missing or under 5 chars', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Hi?',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        });
      }).toThrow('Question text must be at least 5 characters long');
    });

    it('Test 4: Validation fails when options have fewer than 2 items', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Which option is correct?',
          options: [{ key: 'A', text: 'Only one option' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        });
      }).toThrow('A question must have at least 2 options');
    });

    it('Test 5: Validation fails when correctAnswers is empty', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Which option is correct?',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: [],
          marks: 1,
          order: 1
        });
      }).toThrow('At least one correct answer is required');
    });

    it('Test 6: Single-choice requires exactly one correct answer', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Single choice question with two correct answers',
          questionType: 'single_choice',
          options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
          correctAnswers: ['A', 'B'],
          marks: 1,
          order: 1
        });
      }).toThrow('Single choice questions must have exactly one correct answer');
    });

    it('Test 7: Correct answer key must exist in options', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Question with mismatched answer key',
          options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
          correctAnswers: ['Z'],
          marks: 1,
          order: 1
        });
      }).toThrow('Correct answer "Z" does not match any valid option key');
    });

    it('Test 8: Duplicate option keys are rejected', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Question with duplicate keys',
          options: [{ key: 'A', text: 'First A' }, { key: 'A', text: 'Second A' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        });
      }).toThrow('Duplicate option key "A" detected');
    });

    it('Test 9: Duplicate correct answers are rejected', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Question with duplicate correct answers',
          questionType: 'multiple_choice',
          options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
          correctAnswers: ['A', 'A'],
          marks: 1,
          order: 1
        });
      }).toThrow('Duplicate correct answers are not allowed');
    });

    it('Test 10: Invalid marks (<= 0 or not integer) are rejected', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Question with 0 marks',
          options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
          correctAnswers: ['A'],
          marks: 0,
          order: 1
        });
      }).toThrow('Marks must be a positive integer');
    });

    it('Test 11: Invalid order (<= 0 or not integer) is rejected', () => {
      expect(() => {
        validateCreateQuestion({
          assessment: assessmentA._id.toString(),
          questionText: 'Question with 0 order',
          options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 0
        });
      }).toThrow('Order must be a positive integer');
    });

    it('Test 12: Updating question cannot alter assessment reference', () => {
      expect(() => {
        validateUpdateQuestion({
          assessment: assessmentB._id.toString(),
          questionText: 'Trying to change assessment'
        });
      }).toThrow('Assessment reference cannot be changed once created');
    });
  });

  // ============================================================================
  // 2. QUESTION API & AUTHORIZATION TESTS
  // ============================================================================
  describe('Question API & Authorization Tests', () => {
    let questionA1Id;

    it('Test 13: Trainer creates question for own assessment (POST -> 201)', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id.toString()}/questions`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          questionText: 'What is event sourcing in distributed databases?',
          questionType: 'single_choice',
          options: [
            { key: 'A', text: 'Storing state as an append-only log of events' },
            { key: 'B', text: 'Writing directly to cache memory' }
          ],
          correctAnswers: ['A'],
          marks: 2,
          order: 1
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.question.questionText).toContain('event sourcing');
      expect(res.body.data.question.order).toBe(1);
      questionA1Id = res.body.data.question.id;
    });

    it('Test 14: Duplicate active order in same assessment returns 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentA._id.toString()}/questions`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          questionText: 'Duplicate order question',
          questionType: 'single_choice',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        })
        .expect(409);

      expect(res.body.message).toContain('A question with this order already exists in the assessment');
    });

    it('Test 15: Trainer cannot create question for another trainer assessment (POST -> 403)', async () => {
      // Alice tries to add question to Bob's assessment B
      const res = await request(app)
        .post(`/api/assessments/${assessmentB._id.toString()}/questions`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          questionText: 'Alice unauthorized question',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        })
        .expect(403);

      expect(res.body.message).toContain('You can only create questions for your own assessments');
    });

    it('Test 16: Admin can create question in any assessment (POST -> 201)', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentB._id.toString()}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Admin created question for Course B',
          questionType: 'single_choice',
          options: [{ key: 'A', text: 'Kubernetes' }, { key: 'B', text: 'Docker Swarm' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        })
        .expect(201);

      expect(res.body.data.question.order).toBe(1);
    });

    it('Test 17: Employee cannot create question (POST -> 403)', async () => {
      await request(app)
        .post(`/api/assessments/${assessmentA._id.toString()}/questions`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          questionText: 'Employee attempt question',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 2
        })
        .expect(403);
    });

    it('Test 18: Adding question to archived assessment is rejected (400)', async () => {
      await request(app)
        .post(`/api/assessments/${archivedAssessment._id.toString()}/questions`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          questionText: 'Archived assessment question attempt',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        })
        .expect(400);
    });

    it('Test 19: Adding question to inactive assessment is rejected (404)', async () => {
      await request(app)
        .post(`/api/assessments/${inactiveAssessment._id.toString()}/questions`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          questionText: 'Inactive assessment question attempt',
          options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
          correctAnswers: ['A'],
          marks: 1,
          order: 1
        })
        .expect(404);
    });

    it('Test 20: Trainer can update own question (PATCH -> 200)', async () => {
      const res = await request(app)
        .patch(`/api/assessments/${assessmentA._id.toString()}/questions/${questionA1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          questionText: 'What is event sourcing in distributed databases? (Revised)',
          marks: 3
        })
        .expect(200);

      expect(res.body.data.question.questionText).toContain('(Revised)');
      expect(res.body.data.question.marks).toBe(3);
    });

    it('Test 21: Trainer cannot update another trainer question (PATCH -> 403)', async () => {
      // Find Bob's question in assessment B
      const bobQ = await Question.findOne({ assessment: assessmentB._id });

      await request(app)
        .patch(`/api/assessments/${assessmentB._id.toString()}/questions/${bobQ._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ marks: 5 })
        .expect(403);
    });

    it('Test 22: Soft-deleting a question sets isActive to false', async () => {
      const res = await request(app)
        .delete(`/api/assessments/${assessmentA._id.toString()}/questions/${questionA1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(res.body.data.question.isActive).toBe(false);

      // Restore for subsequent tests
      await Question.findByIdAndUpdate(questionA1Id, { isActive: true });
    });
  });

  // ============================================================================
  // 3. QUESTION SECURITY & PROJECTION TESTS
  // ============================================================================
  describe('Question Security & Employee Projection Tests', () => {
    let activeQId;

    beforeAll(async () => {
      const q = await Question.create({
        assessment: assessmentA._id,
        questionText: 'Security Verification Question: Which is private?',
        questionType: 'single_choice',
        options: [
          { key: 'A', text: 'Secret Answer Key' },
          { key: 'B', text: 'Public Option' }
        ],
        correctAnswers: ['A'],
        marks: 1,
        order: 5
      });
      activeQId = q._id.toString();
    });

    it('Test 23: Employee question response strictly excludes correctAnswers in list', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id.toString()}/questions`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      const questions = res.body.data.questions;
      expect(questions.length).toBeGreaterThanOrEqual(1);
      questions.forEach((q) => {
        expect(q.correctAnswers).toBeUndefined();
      });
    });

    it('Test 24: Employee single question retrieval strictly excludes correctAnswers', async () => {
      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id.toString()}/questions/${activeQId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body.data.question.correctAnswers).toBeUndefined();
      expect(res.body.data.question.questionText).toContain('Security Verification');
    });

    it('Test 25: Trainer and Admin question responses include correctAnswers', async () => {
      const trainerRes = await request(app)
        .get(`/api/assessments/${assessmentA._id.toString()}/questions/${activeQId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(trainerRes.body.data.question.correctAnswers).toBeDefined();
      expect(trainerRes.body.data.question.correctAnswers).toEqual(['A']);

      const adminRes = await request(app)
        .get(`/api/assessments/${assessmentA._id.toString()}/questions/${activeQId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminRes.body.data.question.correctAnswers).toBeDefined();
    });

    it('Test 26: Employee cannot retrieve questions for draft assessment (404)', async () => {
      await request(app)
        .get(`/api/assessments/${draftAssessment._id.toString()}/questions`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });

    it('Test 27: Employee cannot retrieve questions for archived assessment (404)', async () => {
      await request(app)
        .get(`/api/assessments/${archivedAssessment._id.toString()}/questions`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });

    it('Test 28: Employee cannot retrieve questions for inactive assessment (404)', async () => {
      await request(app)
        .get(`/api/assessments/${inactiveAssessment._id.toString()}/questions`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });

    it('Test 29: Cross-assessment question ID tampering is rejected (404)', async () => {
      // Trying to request Bob's question through Assessment A's URL
      const bobQ = await Question.findOne({ assessment: assessmentB._id });

      const res = await request(app)
        .get(`/api/assessments/${assessmentA._id.toString()}/questions/${bobQ._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(res.body.message).toContain('Question does not belong to the specified assessment');
    });
  });
});
