/**
 * Phase 21 Integration Test Suite: Workflow 2 — Complete Learning Workflow
 * Tests:
 * 1. Hierarchy: Course -> Module -> Lessons
 * 2. Enrollment in published course & duplicate enrollment rejection
 * 3. Rejection of enrollment into draft / archived courses
 * 4. Step-by-step progress tracking: PATCH /api/enrollments/:id/progress
 * 5. Server-side progress percentage calculation (client cannot inject progress)
 * 6. Enrollment completion: 100% progress, status = 'completed', completedAt populated
 * 7. Inactive lesson handling in calculation
 * 8. Role-based visibility: employee self-service and trainer course scoping
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Department = require('../../src/models/Department');
const Employee = require('../../src/models/Employee');
const Course = require('../../src/models/Course');
const Module = require('../../src/models/Module');
const Lesson = require('../../src/models/Lesson');
const Enrollment = require('../../src/models/Enrollment');
const config = require('../../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 2 Integration: Complete Learning Workflow', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser;
  let employeeDoc;
  let department;

  let publishedCourse;
  let moduleDoc;
  let lesson1;
  let lesson2;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  beforeEach(async () => {
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Seed users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin.learn@skilltrack.test',
      password: 'AdminPassword123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Trainer User',
      email: 'trainer.learn@skilltrack.test',
      password: 'TrainerPassword123!',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Employee Learner',
      email: 'emp.learn@skilltrack.test',
      password: 'EmpPassword123!',
      role: 'employee'
    });

    department = await Department.create({
      name: 'Software Engineering',
      description: 'Engineering Dept'
    });

    employeeDoc = await Employee.create({
      user: employeeUser._id,
      employeeId: 'EMP-LRN-001',
      department: department._id,
      designation: 'Junior Developer'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    trainerToken = jwt.sign(
      { userId: trainerUser._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // 2. Trainer creates course hierarchy
    publishedCourse = await Course.create({
      title: 'Full Stack Node.js & React',
      description: 'Master full stack development from backend to frontend',
      category: 'technical',
      level: 'intermediate',
      duration: 40,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    moduleDoc = await Module.create({
      course: publishedCourse._id,
      title: 'Module 1: Express REST APIs',
      description: 'Building REST endpoints',
      order: 1,
      isActive: true
    });

    lesson1 = await Lesson.create({
      module: moduleDoc._id,
      title: 'Lesson 1.1: Express Routing',
      contentType: 'text',
      content: 'Express routing overview',
      duration: 15,
      order: 1,
      isActive: true
    });

    lesson2 = await Lesson.create({
      module: moduleDoc._id,
      title: 'Lesson 1.2: Middleware & Error Handling',
      contentType: 'text',
      content: 'Middleware patterns in Express',
      duration: 20,
      order: 2,
      isActive: true
    });
  });

  afterAll(async () => {
    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('2.1: Full learning lifecycle: enrollment -> progress -> 100% completion', async () => {
    // Step 1: Employee enrolls in the published course
    const enrollRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ course: publishedCourse._id.toString() })
      .expect(201);

    expect(enrollRes.body.success).toBe(true);
    const enrollmentId = enrollRes.body.data.enrollment.id || enrollRes.body.data.enrollment._id;
    expect(enrollRes.body.data.enrollment.status).toBe('enrolled');
    expect(enrollRes.body.data.enrollment.progressPercentage).toBe(0);

    // Step 2: Duplicate enrollment attempt is rejected with 409
    await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ course: publishedCourse._id.toString() })
      .expect(409);

    // Step 3: Employee retrieves their enrollment list
    const myEnrollRes = await request(app)
      .get('/api/enrollments/me')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(myEnrollRes.body.data.enrollments.length).toBe(1);
    expect(myEnrollRes.body.data.enrollments[0].id || myEnrollRes.body.data.enrollments[0]._id).toBe(enrollmentId);

    // Step 4: Complete Lesson 1
    const progress1Res = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        lessonId: lesson1._id.toString(),
        completed: true
      })
      .expect(200);

    expect(progress1Res.body.success).toBe(true);
    const p1Data = progress1Res.body.data.enrollment;
    // 1 of 2 lessons completed = 50%
    expect(p1Data.progressPercentage).toBe(50);
    expect(p1Data.status).toBe('in_progress');
    expect(p1Data.startedAt).toBeDefined();
    expect(p1Data.completedAt).toBeNull();

    // Step 5: Verify client cannot inject arbitrary progress percentage (rejected with 400)
    const tamperRes = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        lessonId: lesson1._id.toString(),
        completed: true,
        progressPercentage: 100 // Client injection attempt
      })
      .expect(400);

    expect(tamperRes.body.success).toBe(false);
    expect(tamperRes.body.message).toMatch(/Direct submission of progress percentage/i);

    // Step 6: Complete Lesson 2 (Final lesson)
    const progress2Res = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/progress`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        lessonId: lesson2._id.toString(),
        completed: true
      })
      .expect(200);

    expect(progress2Res.body.success).toBe(true);
    const p2Data = progress2Res.body.data.enrollment;
    // 2 of 2 lessons completed = 100%
    expect(p2Data.progressPercentage).toBe(100);
    expect(p2Data.status).toBe('completed');
    expect(p2Data.completedAt).toBeDefined();

    // Step 7: Trainer can view enrollments for their course
    const trainerViewRes = await request(app)
      .get(`/api/enrollments?course=${publishedCourse._id}`)
      .set('Authorization', `Bearer ${trainerToken}`)
      .expect(200);

    expect(trainerViewRes.body.data.enrollments.length).toBe(1);
    expect(trainerViewRes.body.data.enrollments[0].id || trainerViewRes.body.data.enrollments[0]._id).toBe(enrollmentId);
  });

  it('2.2: Enrollment validation & inactive lesson handling', async () => {
    // 1. Enrollment in draft course is rejected with 404
    const draftCourse = await Course.create({
      title: 'Draft Unreleased Course',
      description: 'Draft course description',
      category: 'technical',
      level: 'beginner',
      duration: 10,
      trainer: trainerUser._id,
      status: 'draft',
      isActive: true
    });

    await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ course: draftCourse._id.toString() })
      .expect(404);

    // 2. Inactive lesson does not count toward required active lessons
    const courseWithInactiveLesson = await Course.create({
      title: 'Modular Course with Inactive Content',
      description: 'Course testing inactive lessons',
      category: 'technical',
      level: 'beginner',
      duration: 15,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    const mod2 = await Module.create({
      course: courseWithInactiveLesson._id,
      title: 'Module with Inactive Lesson',
      order: 1,
      isActive: true
    });

    const activeLesson = await Lesson.create({
      module: mod2._id,
      title: 'Active Lesson',
      contentType: 'text',
      content: 'Content',
      duration: 10,
      order: 1,
      isActive: true
    });

    // Inactive lesson in same module
    await Lesson.create({
      module: mod2._id,
      title: 'Deprecated Lesson',
      contentType: 'text',
      content: 'Deprecated content',
      duration: 10,
      order: 2,
      isActive: false
    });

    const enrRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ course: courseWithInactiveLesson._id.toString() })
      .expect(201);

    const enrId = enrRes.body.data.enrollment.id || enrRes.body.data.enrollment._id;

    // Completing the single active lesson should achieve 100% completion
    const progRes = await request(app)
      .patch(`/api/enrollments/${enrId}/progress`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        lessonId: activeLesson._id.toString(),
        completed: true
      })
      .expect(200);

    expect(progRes.body.data.enrollment.progressPercentage).toBe(100);
    expect(progRes.body.data.enrollment.status).toBe('completed');
  });
});
