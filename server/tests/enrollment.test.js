const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const config = require('../src/config');
const {
  validateCreateEnrollment,
  validateUpdateEnrollmentStatus,
  validateProgressUpdate
} = require('../src/validators/enrollment.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Enrollment & Progress Tracking Tests (Phase 9)', () => {
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
  let inactiveEmployeeProfile;

  let courseA;
  let courseB;
  let draftCourse;
  let archivedCourse;
  let inactiveCourse;
  let emptyCourse;

  let moduleA1;
  let moduleA2;
  let lessonA1;
  let lessonA2;
  let lessonA3;
  let moduleB1;
  let lessonB1;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Enrollment.syncIndexes();

    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // Seed test department
    department = await Department.create({
      name: 'Engineering Dev',
      description: 'Software Engineering Department'
    });

    // Seed test users
    adminUser = await User.create({
      name: 'Enroll Admin',
      email: 'enr_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'enr_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'enr_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUserA = await User.create({
      name: 'Employee Charlie',
      email: 'enr_charlie@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeUserB = await User.create({
      name: 'Employee Diana',
      email: 'enr_diana@example.com',
      password: 'Password123',
      role: 'employee'
    });

    const inactiveUser = await User.create({
      name: 'Inactive User',
      email: 'enr_inactive@example.com',
      password: 'Password123',
      role: 'employee'
    });

    // Seed employee profiles
    employeeProfileA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-ENR-001',
      department: department._id,
      designation: 'Backend Developer'
    });

    employeeProfileB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-ENR-002',
      department: department._id,
      designation: 'Frontend Developer'
    });

    inactiveEmployeeProfile = await Employee.create({
      user: inactiveUser._id,
      employeeId: 'EMP-ENR-INACTIVE',
      department: department._id,
      designation: 'Archived Dev',
      isActive: false
    });

    // Seed courses
    courseA = await Course.create({
      title: 'Distributed Architecture with Node.js',
      description: 'Deep dive into microservices, consistency, and resilience.',
      category: 'Backend',
      level: 'advanced',
      duration: 30,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Cloud DevOps Pipelines',
      description: 'Continuous integration and container orchestration.',
      category: 'DevOps',
      level: 'intermediate',
      duration: 25,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Draft Security Fundamentals',
      description: 'Course in preparation stage.',
      category: 'Security',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedCourse = await Course.create({
      title: 'Legacy Monolith Architecture',
      description: 'Archived deprecated course.',
      category: 'Legacy',
      level: 'advanced',
      duration: 15,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });

    inactiveCourse = await Course.create({
      title: 'Inactive System Design',
      description: 'Soft-deleted course.',
      category: 'Design',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: false
    });

    emptyCourse = await Course.create({
      title: 'Course Without Lessons',
      description: 'Published course that has zero active lessons.',
      category: 'General',
      level: 'beginner',
      duration: 5,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    // Seed modules and lessons for Course A
    moduleA1 = await Module.create({
      course: courseA._id,
      title: 'Module A1: Microservice Communication',
      description: 'RPC and message passing',
      order: 1
    });

    moduleA2 = await Module.create({
      course: courseA._id,
      title: 'Module A2: Data Consistency Patterns',
      description: 'Saga pattern and outbox pattern',
      order: 2
    });

    lessonA1 = await Lesson.create({
      module: moduleA1._id,
      title: 'Lesson A1.1: Event Driven Architecture',
      content: 'Core principles of publish-subscribe and event streaming.',
      contentType: 'text',
      order: 1
    });

    lessonA2 = await Lesson.create({
      module: moduleA1._id,
      title: 'Lesson A1.2: Kafka Message Broker Walkthrough',
      content: 'Hands-on video guide to partitions and consumer groups.',
      contentType: 'video',
      resourceUrl: 'https://example.com/videos/kafka-walkthrough.mp4',
      order: 2
    });

    lessonA3 = await Lesson.create({
      module: moduleA2._id,
      title: 'Lesson A2.1: Saga Orchestration vs Choreography',
      content: 'Comparing saga implementations for distributed transactions.',
      contentType: 'text',
      order: 1
    });

    // Seed module and lesson for Course B
    moduleB1 = await Module.create({
      course: courseB._id,
      title: 'Module B1: Docker Containers',
      description: 'Container fundamentals',
      order: 1
    });

    lessonB1 = await Lesson.create({
      module: moduleB1._id,
      title: 'Lesson B1.1: Dockerfile Optimization',
      content: 'Multi-stage builds and minimal base images.',
      contentType: 'text',
      order: 1
    });

    // Generate JWT tokens
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
    employeeTokenA = jwt.sign(
      { userId: employeeUserA._id.toString(), role: employeeUserA.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeTokenB = jwt.sign(
      { userId: employeeUserB._id.toString(), role: employeeUserB.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await Enrollment.deleteMany({});
    await mongoose.disconnect();
  });

  // ============================================================================
  // 1. MODEL TESTS (Tests 1 to 13)
  // ============================================================================
  describe('Enrollment Model Tests', () => {
    it('Test 1: Creates an enrollment with valid fields', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id,
        status: 'enrolled',
        progressPercentage: 0
      });
      const saved = await enrollment.save();
      expect(saved._id).toBeDefined();
      expect(saved.status).toBe('enrolled');
      expect(saved.progressPercentage).toBe(0);
      await Enrollment.findByIdAndDelete(saved._id);
    });

    it('Test 2: Validation fails when employee reference is missing', async () => {
      const enrollment = new Enrollment({
        course: courseA._id,
        status: 'enrolled'
      });
      let error;
      try {
        await enrollment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.employee).toBeDefined();
    });

    it('Test 3: Validation fails when course reference is missing', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        status: 'enrolled'
      });
      let error;
      try {
        await enrollment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.course).toBeDefined();
    });

    it('Test 4: Validation fails when status is invalid', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id,
        status: 'pending_approval'
      });
      let error;
      try {
        await enrollment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    it('Test 5: Validation fails when progressPercentage is below 0', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id,
        progressPercentage: -5
      });
      let error;
      try {
        await enrollment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.progressPercentage).toBeDefined();
    });

    it('Test 6: Validation fails when progressPercentage is above 100', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id,
        progressPercentage: 110
      });
      let error;
      try {
        await enrollment.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.progressPercentage).toBeDefined();
    });

    it('Test 7: Defaults status to enrolled', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      expect(enrollment.status).toBe('enrolled');
    });

    it('Test 8: Defaults progressPercentage to 0', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      expect(enrollment.progressPercentage).toBe(0);
    });

    it('Test 9: Defaults completedLessons to an empty array', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      expect(enrollment.completedLessons).toBeDefined();
      expect(Array.isArray(enrollment.completedLessons)).toBe(true);
      expect(enrollment.completedLessons.length).toBe(0);
    });

    it('Test 10: Defaults isActive to true', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      expect(enrollment.isActive).toBe(true);
    });

    it('Test 11: Automatically manages createdAt and updatedAt timestamps', async () => {
      const enrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: courseB._id
      });
      expect(enrollment.createdAt).toBeDefined();
      expect(enrollment.updatedAt).toBeDefined();
      await Enrollment.findByIdAndDelete(enrollment._id);
    });

    it('Test 12: Enforces compound unique index on { employee: 1, course: 1 }', async () => {
      await Enrollment.create({
        employee: employeeProfileA._id,
        course: courseA._id
      });

      let duplicateError;
      try {
        await Enrollment.create({
          employee: employeeProfileA._id,
          course: courseA._id
        });
      } catch (err) {
        duplicateError = err;
      }
      expect(duplicateError).toBeDefined();
      expect(duplicateError.code).toBe(11000);

      // Clean up
      await Enrollment.deleteMany({ employee: employeeProfileA._id });
    });

    it('Test 13: Transforms _id to id and deletes __v in JSON representation', async () => {
      const enrollment = new Enrollment({
        employee: employeeProfileA._id,
        course: courseA._id
      });
      const json = enrollment.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ============================================================================
  // 2. VALIDATION UNIT TESTS (Tests 14 to 22)
  // ============================================================================
  describe('Enrollment Validation Unit Tests', () => {
    it('Test 14: validateCreateEnrollment passes with valid course ID for employee self-enrollment', () => {
      expect(() => {
        validateCreateEnrollment({ course: courseA._id.toString() }, true);
      }).not.toThrow();
    });

    it('Test 15: validateCreateEnrollment rejects missing or empty course ID', () => {
      expect(() => {
        validateCreateEnrollment({}, true);
      }).toThrow('Course ID is required');
    });

    it('Test 16: validateCreateEnrollment rejects invalid course ID format', () => {
      expect(() => {
        validateCreateEnrollment({ course: 'not-an-id' }, true);
      }).toThrow('Invalid Course ID format');
    });

    it('Test 17: validateCreateEnrollment rejects employee ID provided during employee self-enrollment', () => {
      expect(() => {
        validateCreateEnrollment(
          { course: courseA._id.toString(), employee: employeeProfileA._id.toString() },
          true
        );
      }).toThrow('Employees cannot specify an employee ID for self-enrollment');
    });

    it('Test 18: validateCreateEnrollment passes for admin when valid course and employee IDs are provided', () => {
      expect(() => {
        validateCreateEnrollment(
          { course: courseA._id.toString(), employee: employeeProfileA._id.toString() },
          false
        );
      }).not.toThrow();
    });

    it('Test 19: validateCreateEnrollment rejects admin enrollment when employee ID is missing or invalid', () => {
      expect(() => {
        validateCreateEnrollment({ course: courseA._id.toString() }, false);
      }).toThrow('Employee ID is required for administrative enrollment');

      expect(() => {
        validateCreateEnrollment(
          { course: courseA._id.toString(), employee: 'invalid-id' },
          false
        );
      }).toThrow('Invalid Employee ID format');
    });

    it('Test 20: validateCreateEnrollment rejects client-submitted progressPercentage or completedLessons', () => {
      expect(() => {
        validateCreateEnrollment(
          { course: courseA._id.toString(), progressPercentage: 50 },
          true
        );
      }).toThrow('Cannot directly set progress percentage');

      expect(() => {
        validateCreateEnrollment(
          { course: courseA._id.toString(), completedLessons: [lessonA1._id.toString()] },
          true
        );
      }).toThrow('Cannot directly set completed lessons');
    });

    it('Test 21: validateUpdateEnrollmentStatus accepts valid status and rejects invalid or missing status', () => {
      expect(() => {
        validateUpdateEnrollmentStatus({ status: 'in_progress' });
      }).not.toThrow();

      expect(() => {
        validateUpdateEnrollmentStatus({});
      }).toThrow('At least one field must be provided for update');

      expect(() => {
        validateUpdateEnrollmentStatus({ status: 'invalid_status' });
      }).toThrow('Status must be one of: enrolled, in_progress, completed, dropped');
    });

    it('Test 22: validateProgressUpdate validates lessonId format, completed boolean, and rejects tampering', () => {
      expect(() => {
        validateProgressUpdate({ lessonId: lessonA1._id.toString(), completed: true });
      }).not.toThrow();

      expect(() => {
        validateProgressUpdate({ lessonId: 'bad-id', completed: true });
      }).toThrow('Invalid Lesson ID format');

      expect(() => {
        validateProgressUpdate({ lessonId: lessonA1._id.toString(), completed: 'yes' });
      }).toThrow('Completed status must be a boolean');

      expect(() => {
        validateProgressUpdate({
          lessonId: lessonA1._id.toString(),
          completed: true,
          progressPercentage: 80
        });
      }).toThrow('Direct submission of progress percentage or completed lessons is not allowed');
    });
  });

  // ============================================================================
  // 3. ENROLLMENT API & AUTHORIZATION TESTS (Tests 23 to 36)
  // ============================================================================
  describe('Enrollment API & Authorization Tests', () => {
    it('Test 23: Unauthenticated request cannot create enrollment (POST /api/enrollments -> 401)', async () => {
      await request(app)
        .post('/api/enrollments')
        .send({ course: courseA._id.toString() })
        .expect(401);
    });

    it('Test 24: Employee self-enrolls into a published active course (POST /api/enrollments -> 201)', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ course: courseA._id.toString() })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.enrollment.status).toBe('enrolled');
      expect(res.body.data.enrollment.progressPercentage).toBe(0);
      expect(res.body.data.enrollment.course.id).toBe(courseA._id.toString());
      expect(res.body.data.enrollment.employee.id).toBe(employeeProfileA._id.toString());
    });

    it('Test 25: Employee cannot specify another employee in self-enrollment payload', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({
          course: courseA._id.toString(),
          employee: employeeProfileA._id.toString()
        })
        .expect(400);

      expect(res.body.message).toContain('Employees cannot specify an employee ID for self-enrollment');
    });

    it('Test 26: Employee cannot enroll in a draft course (returns 404 Not Found)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ course: draftCourse._id.toString() })
        .expect(404);
    });

    it('Test 27: Employee cannot enroll in an archived course (returns 404 Not Found)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ course: archivedCourse._id.toString() })
        .expect(404);
    });

    it('Test 28: Employee cannot enroll in an inactive course (returns 404 Not Found)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ course: inactiveCourse._id.toString() })
        .expect(404);
    });

    it('Test 29: Duplicate active enrollment returns 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ course: courseA._id.toString() })
        .expect(409);

      expect(res.body.message).toContain('Employee is already enrolled in this course');
    });

    it('Test 30: Trainer cannot self-enroll through POST /api/enrollments (returns 403 Forbidden)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({ course: courseA._id.toString() })
        .expect(403);
    });

    it('Test 31: Admin creates enrollment for an active employee into a published course (POST /api/enrollments -> 201)', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: courseB._id.toString(),
          employee: employeeProfileA._id.toString()
        })
        .expect(201);

      expect(res.body.data.enrollment.course.id).toBe(courseB._id.toString());
      expect(res.body.data.enrollment.employee.id).toBe(employeeProfileA._id.toString());
    });

    it('Test 32: Admin cannot enroll an inactive employee (returns 400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: courseA._id.toString(),
          employee: inactiveEmployeeProfile._id.toString()
        })
        .expect(400);

      expect(res.body.message).toContain('Cannot enroll an inactive employee');
    });

    it('Test 33: Admin cannot enroll a nonexistent employee (returns 404 Not Found)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: courseA._id.toString(),
          employee: fakeId
        })
        .expect(404);
    });

    it('Test 34: Admin cannot enroll into a draft course (returns 404 Not Found)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: draftCourse._id.toString(),
          employee: employeeProfileB._id.toString()
        })
        .expect(404);
    });

    it('Test 35: Admin cannot enroll into an archived course (returns 404 Not Found)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: archivedCourse._id.toString(),
          employee: employeeProfileB._id.toString()
        })
        .expect(404);
    });

    it('Test 36: Admin cannot enroll into an inactive course (returns 404 Not Found)', async () => {
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: inactiveCourse._id.toString(),
          employee: employeeProfileB._id.toString()
        })
        .expect(404);
    });
  });

  // ============================================================================
  // 4. VISIBILITY & QUERY TESTS (Tests 37 to 47)
  // ============================================================================
  describe('Enrollment Visibility & Query Tests', () => {
    let empAEnrollmentCourseA;

    beforeAll(async () => {
      empAEnrollmentCourseA = await Enrollment.findOne({
        employee: employeeProfileA._id,
        course: courseA._id
      });
    });

    it('Test 37: Employee retrieves own enrollments (GET /api/enrollments/me -> 200)', async () => {
      const res = await request(app)
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.enrollments)).toBe(true);
      // Charlie has 2 enrollments (course A and course B)
      expect(res.body.data.enrollments.length).toBe(2);
    });

    it('Test 38: Employee cannot retrieve another employee enrollment by ID (returns 404 Not Found)', async () => {
      // Diana attempts to read Charlie's enrollment
      await request(app)
        .get(`/api/enrollments/${empAEnrollmentCourseA._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .expect(404);
    });

    it('Test 39: Employee retrieves own enrollment for a specific course (GET /api/courses/:courseId/enrollment -> 200)', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseA._id.toString()}/enrollment`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.id).toBe(empAEnrollmentCourseA._id.toString());
      expect(res.body.data.enrollment.course.id).toBe(courseA._id.toString());
    });

    it('Test 40: Employee receives 404 when requesting enrollment for a course they are not enrolled in', async () => {
      // Diana is not enrolled in course A
      await request(app)
        .get(`/api/courses/${courseA._id.toString()}/enrollment`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .expect(404);
    });

    it('Test 41: Admin retrieves all enrollments across the system (GET /api/enrollments -> 200)', async () => {
      const res = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.enrollments.length).toBeGreaterThanOrEqual(2);
    });

    it('Test 42: Trainer retrieves only enrollments for courses they own (GET /api/enrollments -> 200)', async () => {
      // Trainer Alice owns Course A
      const res = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const enrollments = res.body.data.enrollments;
      expect(enrollments.length).toBe(1);
      expect(enrollments[0].course.id).toBe(courseA._id.toString());
    });

    it('Test 43: Trainer cannot retrieve enrollment for another trainer course (returns 403 Forbidden)', async () => {
      // Trainer Alice attempts to view enrollment for Course B (owned by Bob)
      const empAEnrollCourseB = await Enrollment.findOne({
        employee: employeeProfileA._id,
        course: courseB._id
      });

      await request(app)
        .get(`/api/enrollments/${empAEnrollCourseB._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);
    });

    it('Test 44: Filters enrollments by status (e.g. ?status=enrolled)', async () => {
      const res = await request(app)
        .get('/api/enrollments?status=enrolled')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      res.body.data.enrollments.forEach((e) => {
        expect(e.status).toBe('enrolled');
      });
    });

    it('Test 45: Filters enrollments by employee ID (?employee=...)', async () => {
      const res = await request(app)
        .get(`/api/enrollments?employee=${employeeProfileA._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.enrollments.length).toBe(2);
      res.body.data.enrollments.forEach((e) => {
        expect(e.employee.id).toBe(employeeProfileA._id.toString());
      });
    });

    it('Test 46: Filters enrollments by course ID (?course=...)', async () => {
      const res = await request(app)
        .get(`/api/enrollments?course=${courseA._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.enrollments.length).toBe(1);
      expect(res.body.data.enrollments[0].course.id).toBe(courseA._id.toString());
    });

    it('Test 47: Filters enrollments by isActive boolean flag (?isActive=true / false)', async () => {
      const res = await request(app)
        .get('/api/enrollments?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      res.body.data.enrollments.forEach((e) => {
        expect(e.isActive).toBe(true);
      });
    });
  });

  // ============================================================================
  // 5. PROGRESS & LESSON COMPLETION TESTS (Tests 48 to 70)
  // ============================================================================
  describe('Progress Calculation & Lesson Completion Tests', () => {
    let enrollment;

    beforeAll(async () => {
      enrollment = await Enrollment.findOne({
        employee: employeeProfileA._id,
        course: courseA._id
      });
    });

    it('Test 48: Completion of first lesson transitions status from enrolled to in_progress', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA1._id.toString(), completed: true })
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('in_progress');
    });

    it('Test 49: Completion of first lesson sets startedAt timestamp', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.startedAt).toBeDefined();
      expect(res.body.data.enrollment.startedAt).not.toBeNull();
    });

    it('Test 50: Progress percentage is calculated accurately based on active lessons', async () => {
      // Course A has 3 active lessons (lessonA1, lessonA2, lessonA3). 1/3 is ~33%
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(33);
    });

    it('Test 51: Completed lesson ID appears in completedLessons array', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      const completedIds = res.body.data.enrollment.completedLessons.map((l) => l.id || l);
      expect(completedIds).toContain(lessonA1._id.toString());
    });

    it('Test 52: Duplicate completion request for same lesson is idempotent', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA1._id.toString(), completed: true })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(33);
      expect(res.body.data.enrollment.completedLessons.length).toBe(1);
    });

    it('Test 53: Completing all active lessons sets progressPercentage to 100', async () => {
      // Complete lesson 2
      await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA2._id.toString(), completed: true })
        .expect(200);

      // Complete lesson 3
      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA3._id.toString(), completed: true })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(100);
    });

    it('Test 54: Reaching 100% progress transitions status to completed', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('completed');
    });

    it('Test 55: Reaching 100% progress sets completedAt timestamp', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.completedAt).toBeDefined();
      expect(res.body.data.enrollment.completedAt).not.toBeNull();
    });

    it('Test 56: Uncompleting a lesson decreases progressPercentage accordingly', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA3._id.toString(), completed: false })
        .expect(200);

      // 2 out of 3 = 67%
      expect(res.body.data.enrollment.progressPercentage).toBe(67);
    });

    it('Test 57: Dropping from 100% progress clears completedAt timestamp', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.completedAt).toBeNull();
    });

    it('Test 58: Dropping from 100% progress changes status to in_progress', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('in_progress');
    });

    it('Test 59: Uncompleting all lessons resets status to enrolled and progress to 0', async () => {
      await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA1._id.toString(), completed: false })
        .expect(200);

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonA2._id.toString(), completed: false })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(0);
      expect(res.body.data.enrollment.status).toBe('enrolled');
    });

    it('Test 60: Completing a lesson belonging to a different course is rejected (400 Bad Request)', async () => {
      // Attempting to complete lessonB1 (Course B) under enrollment for Course A
      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonB1._id.toString(), completed: true })
        .expect(400);

      expect(res.body.message).toContain('Lesson does not belong to the enrolled course');
    });

    it('Test 61: Completing an inactive lesson is rejected (400 Bad Request)', async () => {
      const inactiveLesson = await Lesson.create({
        module: moduleA1._id,
        title: 'Hidden Inactive Lesson',
        content: 'Content...',
        contentType: 'text',
        order: 99,
        isActive: false
      });

      await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: inactiveLesson._id.toString(), completed: true })
        .expect(400);

      await Lesson.findByIdAndDelete(inactiveLesson._id);
    });

    it('Test 62: Completing a lesson in an inactive module is rejected (400 Bad Request)', async () => {
      const inactiveModule = await Module.create({
        course: courseA._id,
        title: 'Inactive Module',
        order: 99,
        isActive: false
      });

      const lessonInInactiveModule = await Lesson.create({
        module: inactiveModule._id,
        title: 'Lesson in Inactive Module',
        content: 'Content...',
        contentType: 'text',
        order: 1
      });

      await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: lessonInInactiveModule._id.toString(), completed: true })
        .expect(400);

      await Lesson.findByIdAndDelete(lessonInInactiveModule._id);
      await Module.findByIdAndDelete(inactiveModule._id);
    });

    it('Test 63: Completing a lesson in a draft course is rejected (400 Bad Request)', async () => {
      // Create module and lesson in draftCourse
      const draftMod = await Module.create({
        course: draftCourse._id,
        title: 'Draft Module',
        order: 1
      });
      const draftLes = await Lesson.create({
        module: draftMod._id,
        title: 'Draft Lesson',
        content: 'Content...',
        contentType: 'text',
        order: 1
      });

      // Force create enrollment for draft course directly in DB to test progress protection
      const draftEnrollment = await Enrollment.create({
        employee: employeeProfileA._id,
        course: draftCourse._id
      });

      await request(app)
        .patch(`/api/enrollments/${draftEnrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: draftLes._id.toString(), completed: true })
        .expect(400);

      await Enrollment.findByIdAndDelete(draftEnrollment._id);
      await Lesson.findByIdAndDelete(draftLes._id);
      await Module.findByIdAndDelete(draftMod._id);
    });

    it('Test 64: Completing a lesson in an archived course is rejected (400 Bad Request)', async () => {
      const archMod = await Module.create({
        course: archivedCourse._id,
        title: 'Arch Module',
        order: 1
      });
      const archLes = await Lesson.create({
        module: archMod._id,
        title: 'Arch Lesson',
        content: 'Content...',
        contentType: 'text',
        order: 1
      });

      const archEnrollment = await Enrollment.create({
        employee: employeeProfileA._id,
        course: archivedCourse._id
      });

      await request(app)
        .patch(`/api/enrollments/${archEnrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: archLes._id.toString(), completed: true })
        .expect(400);

      await Enrollment.findByIdAndDelete(archEnrollment._id);
      await Lesson.findByIdAndDelete(archLes._id);
      await Module.findByIdAndDelete(archMod._id);
    });

    it('Test 65: Completing a lesson in an inactive course is rejected (400 Bad Request)', async () => {
      const inactMod = await Module.create({
        course: inactiveCourse._id,
        title: 'Inact Module',
        order: 1
      });
      const inactLes = await Lesson.create({
        module: inactMod._id,
        title: 'Inact Lesson',
        content: 'Content...',
        contentType: 'text',
        order: 1
      });

      const inactEnrollment = await Enrollment.create({
        employee: employeeProfileA._id,
        course: inactiveCourse._id
      });

      await request(app)
        .patch(`/api/enrollments/${inactEnrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: inactLes._id.toString(), completed: true })
        .expect(400);

      await Enrollment.findByIdAndDelete(inactEnrollment._id);
      await Lesson.findByIdAndDelete(inactLes._id);
      await Module.findByIdAndDelete(inactMod._id);
    });

    it('Test 66: Course with zero active lessons maintains 0% progress without division by zero', async () => {
      const zeroEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: emptyCourse._id
      });

      expect(zeroEnrollment.progressPercentage).toBe(0);
      await Enrollment.findByIdAndDelete(zeroEnrollment._id);
    });

    it('Test 67: Course with zero active lessons cannot transition to completed status', async () => {
      const zeroEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: emptyCourse._id,
        status: 'enrolled'
      });

      // No lessons exist to complete, status remains enrolled
      expect(zeroEnrollment.status).toBe('enrolled');
      expect(zeroEnrollment.progressPercentage).toBe(0);
      await Enrollment.findByIdAndDelete(zeroEnrollment._id);
    });

    it('Test 68: Dropped enrollment rejects progress updates (returns 400 Bad Request)', async () => {
      const droppedEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: courseA._id,
        status: 'dropped',
        isActive: false
      });

      const res = await request(app)
        .patch(`/api/enrollments/${droppedEnrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ lessonId: lessonA1._id.toString(), completed: true })
        .expect(400);

      expect(res.body.message).toContain('Cannot update progress on a dropped or inactive enrollment');
      await Enrollment.findByIdAndDelete(droppedEnrollment._id);
    });

    it('Test 69: Employee cannot manually submit progressPercentage in request body', async () => {
      await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          lessonId: lessonA1._id.toString(),
          completed: true,
          progressPercentage: 99
        })
        .expect(400);
    });

    it('Test 70: Employee cannot manually submit completedLessons in request body', async () => {
      await request(app)
        .patch(`/api/enrollments/${enrollment._id.toString()}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({
          lessonId: lessonA1._id.toString(),
          completed: true,
          completedLessons: [lessonA1._id.toString(), lessonA2._id.toString()]
        })
        .expect(400);
    });
  });

  // ============================================================================
  // 6. ADMIN / STATUS & DROPPED TESTS (Tests 71 to 80)
  // ============================================================================
  describe('Admin Status & Lifecycle Tests', () => {
    let lifecycleEnrollment;

    beforeAll(async () => {
      lifecycleEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: courseA._id
      });
    });

    afterAll(async () => {
      await Enrollment.findByIdAndDelete(lifecycleEnrollment._id);
    });

    it('Test 71: Admin updates enrollment status (PATCH /api/enrollments/:id/status -> 200)', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${lifecycleEnrollment._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('in_progress');
    });

    it('Test 72: Admin status update rejects invalid status value (400 Bad Request)', async () => {
      await request(app)
        .patch(`/api/enrollments/${lifecycleEnrollment._id.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'graduated' })
        .expect(400);
    });

    it('Test 73: Admin drops enrollment (DELETE /api/enrollments/:id -> 200)', async () => {
      const tempEnrollment = await Enrollment.create({
        employee: employeeProfileB._id,
        course: courseB._id
      });

      const res = await request(app)
        .delete(`/api/enrollments/${tempEnrollment._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('dropped');
      expect(res.body.data.enrollment.isActive).toBe(false);
      await Enrollment.findByIdAndDelete(tempEnrollment._id);
    });

    it('Test 74: Employee drops own enrollment (DELETE /api/enrollments/:id -> 200)', async () => {
      const res = await request(app)
        .delete(`/api/enrollments/${lifecycleEnrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('dropped');
      expect(res.body.data.enrollment.isActive).toBe(false);
    });

    it('Test 75: Employee cannot drop another employee enrollment (returns 404 Not Found)', async () => {
      await request(app)
        .delete(`/api/enrollments/${lifecycleEnrollment._id.toString()}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(404);
    });

    it('Test 76: Trainer cannot drop an enrollment (returns 403 Forbidden)', async () => {
      await request(app)
        .delete(`/api/enrollments/${lifecycleEnrollment._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);
    });

    it('Test 77: Dropped enrollment remains stored in database (soft drop)', async () => {
      const inDb = await Enrollment.findById(lifecycleEnrollment._id);
      expect(inDb).toBeDefined();
      expect(inDb).not.toBeNull();
    });

    it('Test 78: Dropped enrollment sets status to dropped and isActive to false in DB', async () => {
      const inDb = await Enrollment.findById(lifecycleEnrollment._id);
      expect(inDb.status).toBe('dropped');
      expect(inDb.isActive).toBe(false);
    });

    it('Test 79: Re-enrolling after drop reactivates the same enrollment record', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenB}`)
        .send({ course: courseA._id.toString() })
        .expect(201);

      expect(res.body.data.enrollment.id).toBe(lifecycleEnrollment._id.toString());
      expect(res.body.data.enrollment.status).toBe('enrolled');
      expect(res.body.data.enrollment.isActive).toBe(true);
    });

    it('Test 80: Reactivation resets progress to 0, completedLessons to empty, and clears timestamps', async () => {
      const inDb = await Enrollment.findById(lifecycleEnrollment._id);
      expect(inDb.progressPercentage).toBe(0);
      expect(inDb.completedLessons.length).toBe(0);
      expect(inDb.startedAt).toBeNull();
      expect(inDb.completedAt).toBeNull();
    });
  });

  // ============================================================================
  // 7. INTEGRATION TESTS (Tests 81 to 100)
  // ============================================================================
  describe('Full End-to-End Content Hierarchy & Integration Scenarios', () => {
    let e2eCourse;
    let e2eModule;
    let e2eLesson1;
    let e2eLesson2;
    let e2eLesson3;
    let e2eEnrollmentId;

    it('Test 81: End-to-end: Create published course with Trainer', async () => {
      e2eCourse = await Course.create({
        title: 'Full Stack Integration Pipeline',
        description: 'End-to-end comprehensive integration course.',
        category: 'FullStack',
        level: 'advanced',
        duration: 35,
        trainer: trainerUserA._id,
        status: 'published',
        isActive: true
      });
      expect(e2eCourse._id).toBeDefined();
    });

    it('Test 82: End-to-end: Create module under published course', async () => {
      e2eModule = await Module.create({
        course: e2eCourse._id,
        title: 'E2E Module 1: System Integration',
        description: 'Integration modules',
        order: 1
      });
      expect(e2eModule._id).toBeDefined();
    });

    it('Test 83: End-to-end: Create multiple active lessons under module', async () => {
      e2eLesson1 = await Lesson.create({
        module: e2eModule._id,
        title: 'E2E Lesson 1: Unit Setup',
        content: 'Setting up testing units and mocks.',
        contentType: 'text',
        order: 1
      });
      e2eLesson2 = await Lesson.create({
        module: e2eModule._id,
        title: 'E2E Lesson 2: API Contract Testing',
        content: 'Validating payload contracts with Supertest.',
        contentType: 'text',
        order: 2
      });
      e2eLesson3 = await Lesson.create({
        module: e2eModule._id,
        title: 'E2E Lesson 3: Database Isolation',
        content: 'Ensuring clean rollback and teardown.',
        contentType: 'text',
        order: 3
      });
      expect(e2eLesson1._id).toBeDefined();
      expect(e2eLesson2._id).toBeDefined();
      expect(e2eLesson3._id).toBeDefined();
    });

    it('Test 84: End-to-end: Employee enrolls into the course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ course: e2eCourse._id.toString() })
        .expect(201);

      e2eEnrollmentId = res.body.data.enrollment.id;
      expect(res.body.data.enrollment.status).toBe('enrolled');
      expect(res.body.data.enrollment.progressPercentage).toBe(0);
    });

    it('Test 85: End-to-end: Retrieve enrollment with populated course and employee fields', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.course.title).toBe('Full Stack Integration Pipeline');
      expect(res.body.data.enrollment.employee.employeeId).toBe('EMP-ENR-001');
      expect(res.body.data.enrollment.course.trainer.name).toBe('Trainer Alice');
    });

    it('Test 86: End-to-end: Complete lesson 1 and verify 33% progress', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${e2eEnrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: e2eLesson1._id.toString(), completed: true })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(33);
    });

    it('Test 87: End-to-end: Verify startedAt is set after lesson 1', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.startedAt).toBeDefined();
      expect(res.body.data.enrollment.startedAt).not.toBeNull();
    });

    it('Test 88: End-to-end: Complete lesson 2 and verify 67% progress', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${e2eEnrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: e2eLesson2._id.toString(), completed: true })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(67);
    });

    it('Test 89: End-to-end: Verify status is in_progress', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('in_progress');
      expect(res.body.data.enrollment.completedAt).toBeNull();
    });

    it('Test 90: End-to-end: Complete remaining lesson 3', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${e2eEnrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: e2eLesson3._id.toString(), completed: true })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(100);
    });

    it('Test 91: End-to-end: Verify 100% progress and completed status', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('completed');
      expect(res.body.data.enrollment.progressPercentage).toBe(100);
    });

    it('Test 92: End-to-end: Verify completedAt is populated with current date', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.completedAt).toBeDefined();
      expect(res.body.data.enrollment.completedAt).not.toBeNull();
    });

    it('Test 93: End-to-end: Uncomplete lesson 3 and verify progress drops to 67%', async () => {
      const res = await request(app)
        .patch(`/api/enrollments/${e2eEnrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: e2eLesson3._id.toString(), completed: false })
        .expect(200);

      expect(res.body.data.enrollment.progressPercentage).toBe(67);
    });

    it('Test 94: End-to-end: Verify status reverts to in_progress and completedAt is null', async () => {
      const res = await request(app)
        .get(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('in_progress');
      expect(res.body.data.enrollment.completedAt).toBeNull();
    });

    it('Test 95: End-to-end: Soft-delete an active lesson from the course', async () => {
      // Soft delete lesson 3 so only lesson 1 and 2 are active
      await Lesson.findByIdAndUpdate(e2eLesson3._id, { isActive: false });
      const updatedLesson = await Lesson.findById(e2eLesson3._id);
      expect(updatedLesson.isActive).toBe(false);
    });

    it('Test 96: End-to-end: Dynamic progress recalculates based only on remaining active lessons', async () => {
      // Trigger a progress recalculation by toggling lesson 2
      const res = await request(app)
        .patch(`/api/enrollments/${e2eEnrollmentId}/progress`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ lessonId: e2eLesson2._id.toString(), completed: true })
        .expect(200);

      // Total active lessons = 2 (lesson 1 & 2). Completed active = 2. 2/2 = 100%!
      expect(res.body.data.enrollment.progressPercentage).toBe(100);
      expect(res.body.data.enrollment.status).toBe('completed');
    });

    it('Test 97: End-to-end: Trainer sees course enrollments and employee progress', async () => {
      const res = await request(app)
        .get(`/api/enrollments?course=${e2eCourse._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(res.body.data.enrollments.length).toBe(1);
      expect(res.body.data.enrollments[0].employee.employeeId).toBe('EMP-ENR-001');
      expect(res.body.data.enrollments[0].progressPercentage).toBe(100);
    });

    it('Test 98: End-to-end: Second trainer cannot view enrollments for the first trainer course', async () => {
      const res = await request(app)
        .get(`/api/enrollments?course=${e2eCourse._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenB}`)
        .expect(200);

      // Scoped to trainer B's courses; course isn't owned by trainer B, returns empty list
      expect(res.body.data.enrollments.length).toBe(0);
    });

    it('Test 99: End-to-end: Employee drops enrollment and verifies dropped state', async () => {
      const res = await request(app)
        .delete(`/api/enrollments/${e2eEnrollmentId}`)
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .expect(200);

      expect(res.body.data.enrollment.status).toBe('dropped');
      expect(res.body.data.enrollment.isActive).toBe(false);
    });

    it('Test 100: End-to-end: Employee re-enrolls and verifies clean progress state', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${employeeTokenA}`)
        .send({ course: e2eCourse._id.toString() })
        .expect(201);

      expect(res.body.data.enrollment.id).toBe(e2eEnrollmentId);
      expect(res.body.data.enrollment.status).toBe('enrolled');
      expect(res.body.data.enrollment.progressPercentage).toBe(0);
      expect(res.body.data.enrollment.completedLessons.length).toBe(0);
      expect(res.body.data.enrollment.startedAt).toBeNull();
      expect(res.body.data.enrollment.completedAt).toBeNull();
    });
  });
});
