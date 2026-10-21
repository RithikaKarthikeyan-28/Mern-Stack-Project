const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const Assessment = require('../src/models/Assessment');
const Question = require('../src/models/Question');
const AssessmentAttempt = require('../src/models/AssessmentAttempt');
const Notification = require('../src/models/Notification');
const Certificate = require('../src/models/Certificate');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Automatic Lesson Progress Flow & Assessment Unlock (17 Scenarios)', () => {
  let adminToken, trainerToken, employee1Token, employee2Token;
  let adminUser, trainerUser, employee1User, employee2User;
  let department, employee1Doc, employee2Doc;
  let course1, module1, module2, lesson1, lesson2, lesson3, lesson4;
  let assessment1, question1;
  let enrollment1;

  let course2, module2_1, lesson2_1, assessment2, enrollment2;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Enrollment.syncIndexes();

    await Notification.deleteMany({});
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
      name: 'Software Engineering Core',
      description: 'Department for testing progression and unlock'
    });

    // 2. Users & Employees
    adminUser = await User.create({
      name: 'Admin Supervisor',
      email: 'admin.flow@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Instructor One',
      email: 'trainer.flow@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employee1User = await User.create({
      name: 'Student Learner 1',
      email: 'learner1.flow@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    employee1Doc = await Employee.create({
      user: employee1User._id,
      department: department._id,
      jobRole: 'Software Engineer',
      employeeId: 'EMP-FLOW-001',
      skills: []
    });

    employee2User = await User.create({
      name: 'Student Learner 2',
      email: 'learner2.flow@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    employee2Doc = await Employee.create({
      user: employee2User._id,
      department: department._id,
      jobRole: 'Frontend Developer',
      employeeId: 'EMP-FLOW-002',
      skills: []
    });

    // 3. JWT Tokens
    const signToken = (user) =>
      jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '2h' }
      );

    adminToken = signToken(adminUser);
    trainerToken = signToken(trainerUser);
    employee1Token = signToken(employee1User);
    employee2Token = signToken(employee2User);

    // 4. Course 1 with 4 lessons across 2 modules
    course1 = await Course.create({
      title: 'Full Stack Engineering Specialization',
      description: 'Comprehensive guide to building full stack systems',
      category: 'Software Engineering',
      duration: 25,
      department: department._id,
      trainer: trainerUser._id,
      level: 'intermediate',
      status: 'published',
      isActive: true
    });

    module1 = await Module.create({
      course: course1._id,
      title: 'Module 1: Backend Architecture',
      order: 1,
      isActive: true
    });

    lesson1 = await Lesson.create({
      module: module1._id,
      title: 'Lesson 1.1: Express and REST APIs',
      content: 'Core principles of designing RESTful web services in Express.',
      contentType: 'text',
      order: 1,
      isActive: true
    });

    lesson2 = await Lesson.create({
      module: module1._id,
      title: 'Lesson 1.2: MongoDB and Data Modeling',
      content: 'Mongoose schemas, indexes, and document relationships.',
      contentType: 'text',
      order: 2,
      isActive: true
    });

    module2 = await Module.create({
      course: course1._id,
      title: 'Module 2: Client Architecture',
      order: 2,
      isActive: true
    });

    lesson3 = await Lesson.create({
      module: module2._id,
      title: 'Lesson 2.1: React State Management',
      content: 'Context API, reducers, and unidirectional data flow.',
      contentType: 'text',
      order: 1,
      isActive: true
    });

    lesson4 = await Lesson.create({
      module: module2._id,
      title: 'Lesson 2.2: Automated Integration Testing',
      content: 'Vitest, React Testing Library, and API test suites.',
      contentType: 'text',
      order: 2,
      isActive: true
    });

    // Assessment for Course 1
    assessment1 = await Assessment.create({
      title: 'Full Stack Engineering Certification Exam',
      description: 'End-of-course technical assessment',
      course: course1._id,
      trainer: trainerUser._id,
      status: 'published',
      passingPercentage: 60,
      timeLimitMinutes: 45,
      requiresCourseCompletion: true,
      isActive: true
    });

    question1 = await Question.create({
      assessment: assessment1._id,
      questionText: 'Which HTTP status code signifies resource creation?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: '200 OK' },
        { key: 'B', text: '201 Created' },
        { key: 'C', text: '204 No Content' },
        { key: 'D', text: '400 Bad Request' }
      ],
      correctAnswers: ['B'],
      marks: 10,
      order: 1,
      isActive: true
    });

    // Enrollment for Employee 1 in Course 1
    enrollment1 = await Enrollment.create({
      employee: employee1Doc._id,
      course: course1._id,
      status: 'enrolled',
      progressPercentage: 0,
      completedLessons: [],
      isActive: true
    });

    // 5. Course 2 (for incomplete prerequisite verification)
    course2 = await Course.create({
      title: 'Cloud DevOps Fundamentals',
      description: 'CI/CD and infrastructure basics overview course',
      category: 'Cloud Engineering',
      duration: 15,
      department: department._id,
      trainer: trainerUser._id,
      level: 'beginner',
      status: 'published',
      isActive: true
    });

    module2_1 = await Module.create({
      course: course2._id,
      title: 'Module 1: Docker Basics',
      order: 1,
      isActive: true
    });

    lesson2_1 = await Lesson.create({
      module: module2_1._id,
      title: 'Lesson 1: Containers',
      content: 'Introduction to Docker containers and images.',
      contentType: 'text',
      order: 1,
      isActive: true
    });

    assessment2 = await Assessment.create({
      title: 'Cloud DevOps Certification Exam',
      description: 'Assessment requiring course completion',
      course: course2._id,
      trainer: trainerUser._id,
      status: 'published',
      passingPercentage: 70,
      requiresCourseCompletion: true,
      isActive: true
    });

    await Question.create({
      assessment: assessment2._id,
      questionText: 'What tool packages applications into containers?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Docker' },
        { key: 'B', text: 'Vagrant' }
      ],
      correctAnswers: ['A'],
      marks: 10,
      order: 1,
      isActive: true
    });

    enrollment2 = await Enrollment.create({
      employee: employee2Doc._id,
      course: course2._id,
      status: 'enrolled',
      progressPercentage: 0,
      completedLessons: [],
      isActive: true
    });
  });

  afterAll(async () => {
    await Notification.deleteMany({});
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

  // Scenario 1: Enrolled employee completes valid lesson
  it('1. enrolled employee can complete a valid lesson', async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson1._id.toString(),
        isCompleted: true,
        moduleId: module1._id.toString(),
        courseId: course1._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enrollment).toBeDefined();
    expect(res.body.data.enrollment.completedLessons).toHaveLength(1);
  });

  // Scenario 2: Lesson completion is persisted in MongoDB
  it('2. lesson completion is persisted in MongoDB', async () => {
    const inDb = await Enrollment.findById(enrollment1._id);
    expect(inDb).not.toBeNull();
    const hasLesson = inDb.completedLessons.some(
      (id) => id.toString() === lesson1._id.toString()
    );
    expect(hasLesson).toBe(true);
  });

  // Scenario 3: CompletedAt timestamp is recorded when course reaches 100%
  it('3. completedAt timestamp is recorded when course completion is reached', async () => {
    // Current enrollment is at 1 of 4 (25%), completedAt should be null
    let inDb = await Enrollment.findById(enrollment1._id);
    expect(inDb.completedAt).toBeNull();
  });

  // Scenario 4: Validates lesson belongs to requested course and module
  it('4. validates lesson belongs to requested course and module', async () => {
    // Lesson 1 belongs to module 1, but we pass module 2
    const resMismatchedModule = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson1._id.toString(),
        isCompleted: true,
        moduleId: module2._id.toString(),
        courseId: course1._id.toString()
      });

    expect(resMismatchedModule.status).toBe(400);
    expect(resMismatchedModule.body.success).toBe(false);
    expect(resMismatchedModule.body.message).toMatch(/Lesson does not belong to the specified module/i);

    // Mismatched courseId
    const resMismatchedCourse = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson1._id.toString(),
        isCompleted: true,
        moduleId: module1._id.toString(),
        courseId: course2._id.toString()
      });

    expect(resMismatchedCourse.status).toBe(400);
    expect(resMismatchedCourse.body.message).toMatch(/does not match the specified course|Specified courseId does not match/i);
  });

  // Scenario 5: Non-enrolled employee cannot complete lesson on this enrollment
  it('5. non-enrolled employee cannot complete lesson on another enrollment (403 or 404)', async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee2Token}`)
      .send({
        lessonId: lesson2._id.toString(),
        isCompleted: true,
        moduleId: module1._id.toString(),
        courseId: course1._id.toString()
      });

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // Scenario 6: Unauthenticated request rejected (401)
  it('6. unauthenticated request is rejected with 401', async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .send({
        lessonId: lesson2._id.toString(),
        isCompleted: true
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Scenario 7: Changing employee ID in body cannot tamper with another employee progress
  it('7. changing employee ID in body cannot tamper with progress', async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson2._id.toString(),
        isCompleted: true,
        employee: employee2Doc._id.toString(),
        employeeId: employee2Doc._id.toString()
      });

    expect(res.status).toBe(200);
    // Verify enrollment still belongs strictly to employee1Doc
    const inDb = await Enrollment.findById(enrollment1._id);
    expect(inDb.employee.toString()).toBe(employee1Doc._id.toString());
  });

  // Scenario 8: Duplicate completion calls for same lesson do not create duplicates
  it('8. duplicate completion calls for same lesson do not create duplicates', async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson1._id.toString(),
        isCompleted: true,
        moduleId: module1._id.toString(),
        courseId: course1._id.toString()
      });

    expect(res.status).toBe(200);

    const inDb = await Enrollment.findById(enrollment1._id);
    const l1Occurrences = inDb.completedLessons.filter(
      (id) => id.toString() === lesson1._id.toString()
    );
    expect(l1Occurrences).toHaveLength(1);
  });

  // Scenario 9: Recalculates progress percentage accurately based on active lessons
  it('9. calculates progress percentage accurately dynamically based on active lessons', async () => {
    const res = await request(app)
      .get(`/api/enrollments/${enrollment1._id}`)
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    const enr = res.body.data.enrollment;
    expect(enr.totalLessons).toBe(4);
    expect(enr.completedLessonsCount).toBe(2); // lesson1 and lesson2
    expect(enr.progressPercentage).toBe(50);
  });

  // Scenario 10: 1 of 4 lessons = 25%
  it('10. 1 of 4 lessons completed produces 25% progress and in_progress status', async () => {
    // Reset to only lesson 1
    await Enrollment.findByIdAndUpdate(enrollment1._id, {
      completedLessons: [lesson1._id],
      progressPercentage: 25,
      status: 'in_progress',
      completedAt: null
    });

    const res = await request(app)
      .get(`/api/enrollments/${enrollment1._id}`)
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.enrollment.progressPercentage).toBe(25);
    expect(res.body.data.enrollment.status).toBe('in_progress');
  });

  // Scenario 11: 2 of 4 lessons = 50%
  it('11. 2 of 4 lessons completed produces 50% progress', async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson2._id.toString(),
        isCompleted: true,
        moduleId: module1._id.toString(),
        courseId: course1._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.data.enrollment.progressPercentage).toBe(50);
    expect(res.body.data.enrollment.status).toBe('in_progress');
  });

  // Scenario 12: 4 of 4 lessons = 100% and status becomes completed
  it('12. 4 of 4 lessons completed produces 100% and status completed with completedAt timestamp', async () => {
    // Complete lesson 3
    await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson3._id.toString(),
        isCompleted: true,
        moduleId: module2._id.toString(),
        courseId: course1._id.toString()
      });

    // Complete final lesson 4
    const resFinal = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: lesson4._id.toString(),
        isCompleted: true,
        moduleId: module2._id.toString(),
        courseId: course1._id.toString()
      });

    expect(resFinal.status).toBe(200);
    expect(resFinal.body.data.enrollment.progressPercentage).toBe(100);
    expect(resFinal.body.data.enrollment.status).toBe('completed');
    expect(resFinal.body.data.enrollment.completedAt).not.toBeNull();

    const inDb = await Enrollment.findById(enrollment1._id);
    expect(inDb.status).toBe('completed');
    expect(inDb.progressPercentage).toBe(100);
    expect(inDb.completedAt).toBeInstanceOf(Date);
  });

  // Scenario 13: Assessment is locked while lessons remain incomplete
  it('13. assessment is locked while lessons remain incomplete', async () => {
    // Enrollment 2 has 0 of 1 lessons completed
    const res = await request(app)
      .get(`/api/assessments/course/${course2._id}`)
      .set('Authorization', `Bearer ${employee2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasAssessment).toBe(true);
    expect(res.body.data.isEligible).toBe(false);
    expect(res.body.data.reason).toMatch(/complete all course lessons|complete 100% of the course lessons/i);
  });

  // Scenario 14: Assessment is unlocked once 100% of lessons are completed
  it('14. assessment is unlocked once 100% of lessons are completed', async () => {
    // Enrollment 1 has completed all 4 lessons
    const res = await request(app)
      .get(`/api/assessments/course/${course1._id}`)
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasAssessment).toBe(true);
    expect(res.body.data.isEligible).toBe(true);
    expect(res.body.data.assessment.id).toBe(assessment1._id.toString());
  });

  // Scenario 15: Direct API request to start assessment rejected if course is incomplete
  it('15. direct API request to start assessment is rejected (403) if course is incomplete', async () => {
    // Employee 2 attempts to start assessment 2 without completing lesson 2_1
    const res = await request(app)
      .post(`/api/assessments/${assessment2._id}/attempts`)
      .set('Authorization', `Bearer ${employee2Token}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/complete all course lessons|complete 100% of the course lessons/i);
  });

  // Scenario 16: Invalid lesson ID or mismatched module/course ID rejected
  it('16. invalid lesson ID is rejected with 400', async () => {
    const resInvalidId = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: 'non-existent-id-string',
        isCompleted: true
      });

    expect(resInvalidId.status).toBe(400);

    const nonExistentObjectId = new mongoose.Types.ObjectId();
    const resNotFound = await request(app)
      .patch(`/api/enrollments/${enrollment1._id}/progress`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        lessonId: nonExistentObjectId.toString(),
        isCompleted: true
      });

    expect(resNotFound.status).toBe(400);
    expect(resNotFound.body.message).toMatch(/Lesson not found or inactive/i);
  });

  // Scenario 17: Preserves existing progress on subsequent calls
  it('17. preserves existing progress on subsequent calls and queries', async () => {
    const res = await request(app)
      .get(`/api/enrollments/${enrollment1._id}`)
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.enrollment.completedLessons).toHaveLength(4);
    expect(res.body.data.enrollment.progressPercentage).toBe(100);
    expect(res.body.data.enrollment.status).toBe('completed');
  });
});
