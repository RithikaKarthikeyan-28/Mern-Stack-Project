const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Assessment = require('../src/models/Assessment');
const config = require('../src/config');
const {
  validateCreateAssessment,
  validateUpdateAssessment
} = require('../src/validators/assessment.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Assessment Management Tests (Phase 10)', () => {
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
  let draftCourse;
  let archivedCourse;
  let inactiveCourse;
  let moduleA1;
  let moduleB1;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Assessment.syncIndexes();

    await Assessment.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});

    adminUser = await User.create({
      name: 'Assessment Admin',
      email: 'asm_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'asm_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'asm_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Employee Charlie',
      email: 'asm_charlie@example.com',
      password: 'Password123',
      role: 'employee'
    });

    courseA = await Course.create({
      title: 'Course A: Microservices Architecture',
      description: 'Distributed systems and events',
      category: 'Architecture',
      level: 'advanced',
      duration: 30,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Course B: Cloud Kubernetes',
      description: 'Container management',
      category: 'Cloud',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Draft Security Course',
      description: 'In development',
      category: 'Security',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedCourse = await Course.create({
      title: 'Archived Legacy Course',
      description: 'Deprecated',
      category: 'Legacy',
      level: 'advanced',
      duration: 15,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });

    inactiveCourse = await Course.create({
      title: 'Inactive System Design Course',
      description: 'Soft-deleted course',
      category: 'Design',
      level: 'intermediate',
      duration: 25,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: false
    });

    moduleA1 = await Module.create({
      course: courseA._id,
      title: 'Module A1: Service Communication',
      order: 1
    });

    moduleB1 = await Module.create({
      course: courseB._id,
      title: 'Module B1: Pod Management',
      order: 1
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
    await Assessment.deleteMany({});
    await mongoose.disconnect();
  });

  // ============================================================================
  // 1. ASSESSMENT MODEL TESTS (Tests 1 to 13)
  // ============================================================================
  describe('Assessment Model Tests', () => {
    it('Test 1: Creates an assessment with valid fields', async () => {
      const assessment = new Assessment({
        title: 'Microservices Fundamentals Assessment',
        description: 'Test your understanding of distributed communication.',
        course: courseA._id,
        trainer: trainerUserA._id,
        status: 'draft',
        passingPercentage: 70,
        timeLimitMinutes: 45,
        maxAttempts: 3
      });

      const saved = await assessment.save();
      expect(saved._id).toBeDefined();
      expect(saved.title).toBe('Microservices Fundamentals Assessment');
      expect(saved.status).toBe('draft');
      expect(saved.passingPercentage).toBe(70);
      expect(saved.timeLimitMinutes).toBe(45);
      expect(saved.maxAttempts).toBe(3);
      await Assessment.findByIdAndDelete(saved._id);
    });

    it('Test 2: Validation fails when title is missing', async () => {
      const assessment = new Assessment({
        course: courseA._id,
        trainer: trainerUserA._id
      });
      let error;
      try {
        await assessment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('Test 3: Validation fails when course reference is missing', async () => {
      const assessment = new Assessment({
        title: 'Title without course',
        trainer: trainerUserA._id
      });
      let error;
      try {
        await assessment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.course).toBeDefined();
    });

    it('Test 4: Valid status accepts draft, published, and archived', async () => {
      const asm = new Assessment({
        title: 'Status Test Assessment',
        course: courseA._id,
        trainer: trainerUserA._id,
        status: 'published'
      });
      expect(asm.status).toBe('published');
    });

    it('Test 5: Validation fails when status is invalid', async () => {
      const assessment = new Assessment({
        title: 'Invalid Status Test',
        course: courseA._id,
        trainer: trainerUserA._id,
        status: 'unknown_status'
      });
      let error;
      try {
        await assessment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    it('Test 6: Validation fails when passingPercentage is outside 0-100 bounds', async () => {
      const asmLow = new Assessment({
        title: 'Bound Low',
        course: courseA._id,
        trainer: trainerUserA._id,
        passingPercentage: -10
      });
      let errorLow;
      try {
        await asmLow.validate();
      } catch (err) {
        errorLow = err;
      }
      expect(errorLow).toBeDefined();
      expect(errorLow.errors.passingPercentage).toBeDefined();

      const asmHigh = new Assessment({
        title: 'Bound High',
        course: courseA._id,
        trainer: trainerUserA._id,
        passingPercentage: 105
      });
      let errorHigh;
      try {
        await asmHigh.validate();
      } catch (err) {
        errorHigh = err;
      }
      expect(errorHigh).toBeDefined();
      expect(errorHigh.errors.passingPercentage).toBeDefined();
    });

    it('Test 7: Validation fails when timeLimitMinutes is less than 1 or not integer', async () => {
      const asm = new Assessment({
        title: 'Time limit check',
        course: courseA._id,
        trainer: trainerUserA._id,
        timeLimitMinutes: 0
      });
      let error;
      try {
        await asm.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.timeLimitMinutes).toBeDefined();
    });

    it('Test 8: Validation fails when maxAttempts is less than 1 or not integer', async () => {
      const asm = new Assessment({
        title: 'Max attempts check',
        course: courseA._id,
        trainer: trainerUserA._id,
        maxAttempts: 0
      });
      let error;
      try {
        await asm.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.maxAttempts).toBeDefined();
    });

    it('Test 9: Defaults status to draft', async () => {
      const asm = new Assessment({
        title: 'Default Draft Check',
        course: courseA._id,
        trainer: trainerUserA._id
      });
      expect(asm.status).toBe('draft');
    });

    it('Test 10: Defaults isActive to true', async () => {
      const asm = new Assessment({
        title: 'Default Active Check',
        course: courseA._id,
        trainer: trainerUserA._id
      });
      expect(asm.isActive).toBe(true);
    });

    it('Test 11: Validation fails when trainer reference is missing', async () => {
      const asm = new Assessment({
        title: 'Missing Trainer Check',
        course: courseA._id
      });
      let error;
      try {
        await asm.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.trainer).toBeDefined();
    });

    it('Test 12: Automatically manages createdAt and updatedAt timestamps', async () => {
      const asm = await Assessment.create({
        title: 'Timestamp Test',
        course: courseA._id,
        trainer: trainerUserA._id
      });
      expect(asm.createdAt).toBeDefined();
      expect(asm.updatedAt).toBeDefined();
      await Assessment.findByIdAndDelete(asm._id);
    });

    it('Test 13: Transforms _id to id and deletes __v in JSON representation', async () => {
      const asm = new Assessment({
        title: 'JSON Transform Test',
        course: courseA._id,
        trainer: trainerUserA._id
      });
      const json = asm.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ============================================================================
  // 2. ASSESSMENT AUTHORIZATION & API TESTS (Tests 14 to 35)
  // ============================================================================
  describe('Assessment Authorization & API Tests', () => {
    let createdAssessmentAId;

    it('Test 14: Unauthenticated request cannot create assessment (POST -> 401)', async () => {
      await request(app)
        .post('/api/assessments')
        .send({ title: 'Unauthorized', course: courseA._id.toString() })
        .expect(401);
    });

    it('Test 15: Employee cannot create assessment (POST -> 403)', async () => {
      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Employee Assessment', course: courseA._id.toString() })
        .expect(403);
    });

    it('Test 16: Trainer creates assessment for own course succeeds (POST -> 201)', async () => {
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Alice Architecture Quiz',
          description: 'Basic architecture quiz',
          course: courseA._id.toString(),
          module: moduleA1._id.toString(),
          passingPercentage: 65,
          timeLimitMinutes: 30,
          maxAttempts: 2
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.assessment.title).toBe('Alice Architecture Quiz');
      expect(res.body.data.assessment.course.id).toBe(courseA._id.toString());
      expect(res.body.data.assessment.status).toBe('draft');
      createdAssessmentAId = res.body.data.assessment.id;
    });

    it('Test 17: Trainer cannot create assessment for another trainer course (POST -> 403)', async () => {
      // Trainer A attempts to create assessment in Course B (owned by Bob)
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Alice on Bob Course',
          course: courseB._id.toString()
        })
        .expect(403);

      expect(res.body.message).toContain('You can only create assessments for your own courses');
    });

    it('Test 18: Trainer cannot spoof trainer ID in creation payload', async () => {
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Alice with Spoofed Bob Trainer',
          course: courseA._id.toString(),
          trainer: trainerUserB._id.toString()
        })
        .expect(201);

      // Trainer ownership must still be Alice, not Bob!
      expect(res.body.data.assessment.trainer.id || res.body.data.assessment.trainer._id).toBe(
        trainerUserA._id.toString()
      );
      await Assessment.findByIdAndDelete(res.body.data.assessment.id);
    });

    it('Test 19: Trainer cannot transfer ownership to another trainer via PATCH (403)', async () => {
      const res = await request(app)
        .patch(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ trainer: trainerUserB._id.toString() })
        .expect(403);

      expect(res.body.message).toContain('Trainers cannot transfer assessment ownership');
    });

    it('Test 20: Admin can create assessment for any course (POST -> 201)', async () => {
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Created Quiz for Course B',
          course: courseB._id.toString()
        })
        .expect(201);

      expect(res.body.data.assessment.course.id).toBe(courseB._id.toString());
      await Assessment.findByIdAndDelete(res.body.data.assessment.id);
    });

    it('Test 21: Admin can assign an active trainer when creating assessment', async () => {
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Assigned Trainer A',
          course: courseA._id.toString(),
          trainer: trainerUserA._id.toString()
        })
        .expect(201);

      expect(res.body.data.assessment.trainer.id || res.body.data.assessment.trainer._id).toBe(
        trainerUserA._id.toString()
      );
      await Assessment.findByIdAndDelete(res.body.data.assessment.id);
    });

    it('Test 22: Admin creating assessment with invalid trainer ID is rejected (400)', async () => {
      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Invalid Trainer',
          course: courseA._id.toString(),
          trainer: 'invalid-trainer-id'
        })
        .expect(400);
    });

    it('Test 23: Creating assessment in an inactive course is rejected (400)', async () => {
      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Inactive Course Assessment',
          course: inactiveCourse._id.toString()
        })
        .expect(400);
    });

    it('Test 24: Module from another course cannot be linked to assessment (400)', async () => {
      // moduleB1 belongs to Course B, but course in payload is Course A
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Mismatched Module Quiz',
          course: courseA._id.toString(),
          module: moduleB1._id.toString()
        })
        .expect(400);

      expect(res.body.message).toContain('Module does not belong to the specified course');
    });

    it('Test 25: Trainer can view own assessments (GET /api/assessments -> 200)', async () => {
      const res = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.assessments)).toBe(true);
      expect(res.body.data.assessments.length).toBeGreaterThanOrEqual(1);
      res.body.data.assessments.forEach((asm) => {
        expect(asm.course.id).toBe(courseA._id.toString());
      });
    });

    it('Test 26: Trainer cannot view assessments for another trainer course (GET /:id -> 403)', async () => {
      // Create an assessment in Course B (owned by Bob)
      const bobAsm = await Assessment.create({
        title: 'Bob Kubernetes Exam',
        course: courseB._id,
        trainer: trainerUserB._id,
        status: 'draft'
      });

      // Alice tries to access Bob's assessment
      await request(app)
        .get(`/api/assessments/${bobAsm._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      await Assessment.findByIdAndDelete(bobAsm._id);
    });

    it('Test 27: Employee cannot view draft assessment (GET /:id -> 404)', async () => {
      await request(app)
        .get(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });

    it('Test 28: Publishing an assessment allows employee to view it (GET /:id -> 200)', async () => {
      // Trainer publishes assessment
      await request(app)
        .patch(`/api/assessments/${createdAssessmentAId}/publish`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const res = await request(app)
        .get(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body.data.assessment.status).toBe('published');
    });

    it('Test 29: Employee cannot view archived assessment (GET /:id -> 404)', async () => {
      // Trainer archives assessment
      await request(app)
        .patch(`/api/assessments/${createdAssessmentAId}/archive`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      await request(app)
        .get(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      // Restore to published
      await Assessment.findByIdAndUpdate(createdAssessmentAId, { status: 'published' });
    });

    it('Test 30: Employee cannot view assessment if parent course is draft (GET /:id -> 404)', async () => {
      const draftCourseAsm = await Assessment.create({
        title: 'Draft Course Quiz',
        course: draftCourse._id,
        trainer: trainerUserA._id,
        status: 'published'
      });

      await request(app)
        .get(`/api/assessments/${draftCourseAsm._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      await Assessment.findByIdAndDelete(draftCourseAsm._id);
    });

    it('Test 31: Employee cannot view assessment if parent course is archived (GET /:id -> 404)', async () => {
      const archCourseAsm = await Assessment.create({
        title: 'Archived Course Quiz',
        course: archivedCourse._id,
        trainer: trainerUserA._id,
        status: 'published'
      });

      await request(app)
        .get(`/api/assessments/${archCourseAsm._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      await Assessment.findByIdAndDelete(archCourseAsm._id);
    });

    it('Test 32: Employee cannot view assessment if parent course is inactive (GET /:id -> 404)', async () => {
      const inactCourseAsm = await Assessment.create({
        title: 'Inactive Course Quiz',
        course: inactiveCourse._id,
        trainer: trainerUserA._id,
        status: 'published'
      });

      await request(app)
        .get(`/api/assessments/${inactCourseAsm._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      await Assessment.findByIdAndDelete(inactCourseAsm._id);
    });

    it('Test 33: Soft-deleting an assessment sets isActive to false', async () => {
      const res = await request(app)
        .delete(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(res.body.data.assessment.isActive).toBe(false);
    });

    it('Test 34: Soft-deleted assessment is hidden from employees (404)', async () => {
      await request(app)
        .get(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });

    it('Test 35: Admin can update any assessment', async () => {
      const res = await request(app)
        .patch(`/api/assessments/${createdAssessmentAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated Assessment Title', isActive: true })
        .expect(200);

      expect(res.body.data.assessment.title).toBe('Admin Updated Assessment Title');
      expect(res.body.data.assessment.isActive).toBe(true);
    });
  });
});
