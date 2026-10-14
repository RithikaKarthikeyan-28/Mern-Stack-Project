const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');
const User = require('../src/models/User');
const config = require('../src/config');
const {
  validateCreateLesson,
  validateUpdateLesson
} = require('../src/validators/lesson.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Lesson Management Tests (Phase 8)', () => {
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

  let moduleA1;
  let moduleA2;
  let moduleB1;
  let draftModule;
  let archivedModule;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Lesson.syncIndexes();
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});

    // Seed test users
    adminUser = await User.create({
      name: 'Lesson Admin',
      email: 'les_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'les_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'les_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Lesson Employee',
      email: 'les_employee@example.com',
      password: 'Password123',
      role: 'employee'
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

    // Seed courses
    courseA = await Course.create({
      title: 'Full Stack Node React',
      description: 'Course owned by Alice for lesson tests.',
      category: 'Web',
      level: 'intermediate',
      duration: 30,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Python Backend Engineering',
      description: 'Course owned by Bob for lesson tests.',
      category: 'Backend',
      level: 'advanced',
      duration: 40,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Draft State Course',
      description: 'Draft course not yet public.',
      category: 'DevOps',
      level: 'beginner',
      duration: 15,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedCourse = await Course.create({
      title: 'Archived State Course',
      description: 'Historical archived course.',
      category: 'Legacy',
      level: 'intermediate',
      duration: 50,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });

    // Seed modules
    moduleA1 = await Module.create({
      course: courseA._id,
      title: 'React Fundamentals',
      order: 1,
      isActive: true
    });

    moduleA2 = await Module.create({
      course: courseA._id,
      title: 'React Hooks & State',
      order: 2,
      isActive: true
    });

    moduleB1 = await Module.create({
      course: courseB._id,
      title: 'FastAPI Fundamentals',
      order: 1,
      isActive: true
    });

    draftModule = await Module.create({
      course: draftCourse._id,
      title: 'Draft Module',
      order: 1,
      isActive: true
    });

    archivedModule = await Module.create({
      course: archivedCourse._id,
      title: 'Archived Module',
      order: 1,
      isActive: true
    });
  });

  afterAll(async () => {
    await Lesson.deleteMany({});
    await Module.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // LESSON MODEL TESTS (Tests 43 - 51)
  // ==========================================
  describe('Lesson Model Tests', () => {
    afterEach(async () => {
      await Lesson.deleteMany({});
    });

    // Test 43: valid lesson
    it('Test 43: Creates a lesson with valid fields', async () => {
      const lesson = await Lesson.create({
        module: moduleA1._id,
        title: 'Introduction to JSX',
        content: 'JSX is a syntax extension for JavaScript.',
        contentType: 'text',
        order: 1
      });

      expect(lesson._id).toBeDefined();
      expect(lesson.title).toBe('Introduction to JSX');
      expect(lesson.contentType).toBe('text');
      expect(lesson.order).toBe(1);
      expect(lesson.isActive).toBe(true);
    });

    // Test 44: missing module
    it('Test 44: Validation fails when module reference is missing', async () => {
      await expect(
        Lesson.create({
          title: 'Orphan Lesson',
          content: 'No module reference supplied.',
          contentType: 'text',
          order: 1
        })
      ).rejects.toThrow(/Module reference is required/i);
    });

    // Test 45: missing title
    it('Test 45: Validation fails when title is missing', async () => {
      await expect(
        Lesson.create({
          module: moduleA1._id,
          content: 'Some lesson content text.',
          contentType: 'text',
          order: 1
        })
      ).rejects.toThrow(/Lesson title is required/i);
    });

    // Test 46: missing content
    it('Test 46: Validation fails when content is missing', async () => {
      await expect(
        Lesson.create({
          module: moduleA1._id,
          title: 'Empty Content Lesson',
          contentType: 'text',
          order: 1
        })
      ).rejects.toThrow(/Lesson content is required/i);
    });

    // Test 47: invalid contentType
    it('Test 47: Validation fails when contentType is invalid', async () => {
      await expect(
        Lesson.create({
          module: moduleA1._id,
          title: 'Invalid Content Type Lesson',
          content: 'Valid content body.',
          contentType: 'audio', // Invalid
          order: 1
        })
      ).rejects.toThrow(/Content type must be one of/i);
    });

    // Test 48: invalid order
    it('Test 48: Validation fails when order is non-integer or < 1', async () => {
      await expect(
        Lesson.create({
          module: moduleA1._id,
          title: 'Zero Order Lesson',
          content: 'Content text.',
          contentType: 'text',
          order: 0
        })
      ).rejects.toThrow(/Lesson order must be an integer of at least 1/i);
    });

    // Test 49: default isActive
    it('Test 49: Defaults isActive to true', async () => {
      const lesson = await Lesson.create({
        module: moduleA1._id,
        title: 'Default Active Lesson',
        content: 'Content text.',
        contentType: 'text',
        order: 1
      });

      expect(lesson.isActive).toBe(true);
    });

    // Test 50: timestamps
    it('Test 50: Automatically manages createdAt and updatedAt timestamps', async () => {
      const lesson = await Lesson.create({
        module: moduleA1._id,
        title: 'Timestamped Lesson',
        content: 'Content text.',
        contentType: 'text',
        order: 1
      });

      expect(lesson.createdAt).toBeDefined();
      expect(lesson.updatedAt).toBeDefined();
    });

    // Test 51: module reference and JSON transform
    it('Test 51: Transforms _id to id and deletes __v in JSON representation', async () => {
      const lesson = await Lesson.create({
        module: moduleA1._id,
        title: 'JSON Representation Lesson',
        content: 'Content text.',
        contentType: 'text',
        order: 1
      });

      const json = lesson.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ==========================================
  // LESSON VALIDATION TESTS (Tests 52 - 59)
  // ==========================================
  describe('Lesson Validation Unit Tests', () => {
    // Test 52: valid text lesson
    it('Test 52: validateCreateLesson passes with valid text lesson payload', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'Valid Text Lesson',
          content: 'Text content body.',
          contentType: 'text',
          order: 1
        });
      }).not.toThrow();
    });

    // Test 53: valid video lesson
    it('Test 53: validateCreateLesson passes with valid video lesson payload', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'Valid Video Lesson',
          content: 'Video lecture notes.',
          contentType: 'video',
          resourceUrl: 'https://example.com/videos/lesson1.mp4',
          order: 1
        });
      }).not.toThrow();
    });

    // Test 54: valid link lesson
    it('Test 54: validateCreateLesson passes with valid link lesson payload', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'External Resource Link',
          content: 'Read the official React documentation.',
          contentType: 'link',
          resourceUrl: 'https://react.dev',
          order: 1
        });
      }).not.toThrow();
    });

    // Test 55: invalid contentType
    it('Test 55: validateCreateLesson rejects invalid contentType', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'Invalid Type',
          content: 'Some text.',
          contentType: 'interactive',
          order: 1
        });
      }).toThrow(/Content type must be one of/);
    });

    // Test 56: link without resourceUrl
    it('Test 56: validateCreateLesson rejects link content type without resourceUrl', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'Missing Link URL',
          content: 'Documentation notes.',
          contentType: 'link',
          order: 1
        });
      }).toThrow(/Resource URL is required for link content type/);
    });

    // Test 57: invalid resourceUrl
    it('Test 57: validateCreateLesson rejects invalid URL format in resourceUrl', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'Malformed URL Lesson',
          content: 'Some notes.',
          contentType: 'link',
          resourceUrl: 'not-a-valid-http-url',
          order: 1
        });
      }).toThrow(/Resource URL must be a valid HTTP or HTTPS URL/);
    });

    // Test 58: invalid order
    it('Test 58: validateCreateLesson rejects non-integer or zero order', () => {
      expect(() => {
        validateCreateLesson({
          module: new mongoose.Types.ObjectId().toString(),
          title: 'Zero Order Lesson',
          content: 'Some content.',
          contentType: 'text',
          order: 0
        });
      }).toThrow(/Lesson order must be an integer of at least 1/);
    });

    // Test 59: empty update
    it('Test 59: validateUpdateLesson rejects empty update payload', () => {
      expect(() => {
        validateUpdateLesson({});
      }).toThrow(/At least one field must be provided for update/);
    });
  });

  // ==========================================
  // LESSON API TESTS (Tests 60 - 84)
  // ==========================================
  describe('Lesson API & RBAC Integration Tests', () => {
    let lesAlice1Id;
    let lesAlice2Id;
    let lesBob1Id;

    beforeEach(async () => {
      await Lesson.deleteMany({});

      const l1 = await Lesson.create({
        module: moduleA1._id,
        title: 'Alice Lesson 1',
        content: 'Detailed explanation of React components.',
        contentType: 'text',
        order: 1,
        isActive: true
      });
      lesAlice1Id = l1._id.toString();

      const l2 = await Lesson.create({
        module: moduleA1._id,
        title: 'Alice Lesson 2',
        content: 'Props and component tree hierarchy.',
        contentType: 'text',
        order: 2,
        isActive: true
      });
      lesAlice2Id = l2._id.toString();

      const lB = await Lesson.create({
        module: moduleB1._id,
        title: 'Bob Python Lesson 1',
        content: 'Type hints in modern Python.',
        contentType: 'text',
        order: 1,
        isActive: true
      });
      lesBob1Id = lB._id.toString();
    });

    // Test 60: unauthenticated POST -> 401
    it('Test 60: Unauthenticated request cannot create lesson (POST -> 401)', async () => {
      const response = await request(app)
        .post(`/api/modules/${moduleA1._id.toString()}/lessons`)
        .send({
          title: 'Unauthenticated Lesson',
          content: 'Content text.',
          contentType: 'text',
          order: 3
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Test 61: employee POST -> 403
    it('Test 61: Employee cannot create lesson (POST -> 403)', async () => {
      const response = await request(app)
        .post(`/api/modules/${moduleA1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Employee Lesson',
          content: 'Forbidden content.',
          contentType: 'text',
          order: 3
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 62: trainer creates lesson in own module -> 201
    it('Test 62: Trainer can create lesson in their own module (POST -> 201)', async () => {
      const response = await request(app)
        .post(`/api/modules/${moduleA1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'State and Lifecycle',
          content: 'Understanding how local state renders components.',
          contentType: 'text',
          order: 3
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe('State and Lifecycle');
      expect(response.body.data.lesson.order).toBe(3);
    });

    // Test 63: trainer cannot create lesson in another trainer's module -> 403
    it("Test 63: Trainer cannot create lesson in another trainer's module (POST -> 403)", async () => {
      // Alice attempts to create lesson in Bob's module
      const response = await request(app)
        .post(`/api/modules/${moduleB1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Unauthorized Lesson by Alice',
          content: 'Content.',
          contentType: 'text',
          order: 2
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/only create lessons in your own courses/i);
    });

    // Test 64: admin creates lesson -> 201
    it('Test 64: Admin can create lesson in any module (POST -> 201)', async () => {
      const response = await request(app)
        .post(`/api/modules/${moduleB1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Created Lesson',
          content: 'Content added by administrator.',
          contentType: 'text',
          order: 2
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe('Admin Created Lesson');
    });

    // Test 65: duplicate lesson order -> 409
    it('Test 65: Duplicate lesson order in same module returns 409 Conflict', async () => {
      const response = await request(app)
        .post(`/api/modules/${moduleA1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Duplicate Order Lesson',
          content: 'Content.',
          contentType: 'text',
          order: 1 // Already taken by lesAlice1Id
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists in the module/i);
    });

    // Test 66: trainer gets own lessons
    it('Test 66: Trainer can view lessons of their own module (GET /api/modules/:moduleId/lessons -> 200)', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleA1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lessons.length).toBe(2);
      expect(response.body.data.lessons[0].order).toBe(1);
      expect(response.body.data.lessons[1].order).toBe(2);
    });

    // Test 67: trainer cannot access another trainer's lesson
    it("Test 67: Trainer cannot view another trainer's lessons (GET -> 403)", async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleB1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 68: employee gets published active lessons
    it('Test 68: Employee can view lessons of an active published course module (GET -> 200)', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleA1._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lessons.length).toBe(2);
    });

    // Test 69: employee cannot see inactive lesson
    it('Test 69: Employee cannot view inactive lesson (GET /api/lessons/:id -> 404)', async () => {
      await Lesson.findByIdAndUpdate(lesAlice1Id, { isActive: false });

      const response = await request(app)
        .get(`/api/lessons/${lesAlice1Id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/lesson not found/i);
    });

    // Test 70: employee cannot see draft course lesson
    it('Test 70: Employee cannot view lessons of a draft course module (GET -> 404)', async () => {
      const response = await request(app)
        .get(`/api/modules/${draftModule._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/module not found/i);
    });

    // Test 71: employee cannot see archived course lesson
    it('Test 71: Employee cannot view lessons of an archived course module (GET -> 404)', async () => {
      const response = await request(app)
        .get(`/api/modules/${archivedModule._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/module not found/i);
    });

    // Test 72: invalid lesson ID format -> 400
    it('Test 72: Invalid lesson ID format returns 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/lessons/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid lesson id format/i);
    });

    // Test 73: nonexistent lesson ID -> 404
    it('Test 73: Nonexistent lesson ID returns 404 Not Found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/lessons/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/lesson not found/i);
    });

    // Test 74: trainer updates own lesson
    it('Test 74: Trainer can update their own lesson (PATCH /api/lessons/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/lessons/${lesAlice1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Alice Updated Lesson Title',
          content: 'Updated content with additional examples.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe('Alice Updated Lesson Title');
    });

    // Test 75: trainer cannot update another trainer's lesson
    it("Test 75: Trainer cannot update another trainer's lesson (PATCH /api/lessons/:id -> 403)", async () => {
      const response = await request(app)
        .patch(`/api/lessons/${lesBob1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Unauthorized Modification'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/you can only update lessons in your own courses/i);
    });

    // Test 76: trainer cannot change module reference
    it('Test 76: Cannot change module reference of a lesson (PATCH /api/lessons/:id -> 400)', async () => {
      const response = await request(app)
        .patch(`/api/lessons/${lesAlice1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          module: moduleA2._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/cannot change module reference/i);
    });

    // Test 77: duplicate lesson order on update -> 409
    it('Test 77: Updating lesson order to an existing order in same module returns 409 Conflict', async () => {
      const response = await request(app)
        .patch(`/api/lessons/${lesAlice2Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          order: 1 // Already taken by lesAlice1Id
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists in the module/i);
    });

    // Test 78: admin updates lesson
    it('Test 78: Admin can update any lesson (PATCH /api/lessons/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/lessons/${lesBob1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Overridden Lesson'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe('Admin Overridden Lesson');
    });

    // Test 79: trainer deletes own lesson
    it('Test 79: Trainer can soft-delete their own lesson (DELETE /api/lessons/:id -> 200)', async () => {
      const response = await request(app)
        .delete(`/api/lessons/${lesAlice1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.isActive).toBe(false);
    });

    // Test 80: trainer cannot delete another trainer's lesson
    it("Test 80: Trainer cannot delete another trainer's lesson (DELETE /api/lessons/:id -> 403)", async () => {
      const response = await request(app)
        .delete(`/api/lessons/${lesBob1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/you can only delete lessons in your own courses/i);
    });

    // Test 81: admin deletes lesson
    it('Test 81: Admin can soft-delete any lesson (DELETE /api/lessons/:id -> 200)', async () => {
      const response = await request(app)
        .delete(`/api/lessons/${lesBob1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.isActive).toBe(false);
    });

    // Test 82: soft deletion verified
    it('Test 82: Soft deletion sets lesson isActive to false', async () => {
      const inDbBefore = await Lesson.findById(lesAlice2Id);
      expect(inDbBefore.isActive).toBe(true);

      await request(app)
        .delete(`/api/lessons/${lesAlice2Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const inDbAfter = await Lesson.findById(lesAlice2Id);
      expect(inDbAfter.isActive).toBe(false);
    });

    // Test 83: lesson remains in database
    it('Test 83: Soft-deleted lesson remains stored in database', async () => {
      await request(app)
        .delete(`/api/lessons/${lesAlice2Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const inDb = await Lesson.findById(lesAlice2Id);
      expect(inDb).not.toBeNull();
    });

    // Test 84: employee cannot bypass visibility with isActive filter
    it('Test 84: Employee cannot bypass visibility rule using isActive=false query parameter', async () => {
      await Lesson.findByIdAndUpdate(lesAlice1Id, { isActive: false });

      const response = await request(app)
        .get(`/api/modules/${moduleA1._id.toString()}/lessons?isActive=false`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.data.lessons.every((l) => l.isActive === true)).toBe(true);
      expect(response.body.data.lessons.some((l) => l.id === lesAlice1Id)).toBe(false);
    });
  });

  // ==========================================
  // INTEGRATION TESTS: FULL HIERARCHY (Tests 85 - 96)
  // ==========================================
  describe('Full Content Hierarchy & Visibility Integration Tests', () => {
    let hierarchyCourse;
    let hierarchyModule;
    let hierarchyLesson;

    beforeAll(async () => {
      hierarchyCourse = await Course.create({
        title: 'Full Stack Integration Course',
        description: 'Complete course testing end-to-end hierarchy and visibility.',
        category: 'Engineering',
        level: 'intermediate',
        duration: 35,
        trainer: trainerUserA._id,
        status: 'published',
        isActive: true
      });

      hierarchyModule = await Module.create({
        course: hierarchyCourse._id,
        title: 'Hierarchy Module 1',
        order: 1,
        isActive: true
      });

      hierarchyLesson = await Lesson.create({
        module: hierarchyModule._id,
        title: 'Hierarchy Lesson 1',
        content: 'End-to-end lesson content.',
        contentType: 'text',
        order: 1,
        isActive: true
      });
    });

    // Test 85: create course -> module -> lesson
    it('Test 85: End-to-end creation flow for Course -> Module -> Lesson succeeds', async () => {
      // 1. Create course
      const courseRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Docker and Kubernetes Course',
          description: 'Containers and orchestration in production environments.',
          category: 'DevOps',
          level: 'advanced',
          duration: 40
        })
        .expect(201);
      const newCourseId = courseRes.body.data.course.id;

      // 2. Create module
      const moduleRes = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          course: newCourseId,
          title: 'Container Fundamentals',
          order: 1
        })
        .expect(201);
      const newModuleId = moduleRes.body.data.module.id;

      // 3. Create lesson
      const lessonRes = await request(app)
        .post(`/api/modules/${newModuleId}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Building Docker Images',
          content: 'Writing efficient Dockerfile directives and multi-stage builds.',
          contentType: 'text',
          order: 1
        })
        .expect(201);

      expect(lessonRes.body.data.lesson.title).toBe('Building Docker Images');
    });

    // Test 86: ordering integrity within module
    it('Test 86: Lessons in module are ordered strictly ascending by order', async () => {
      const response = await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}/lessons`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const orders = response.body.data.lessons.map((l) => l.order);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThan(orders[i - 1]);
      }
    });

    // Test 87: ordering integrity within course
    it('Test 87: Modules in course are ordered strictly ascending by order', async () => {
      const response = await request(app)
        .get(`/api/courses/${hierarchyCourse._id.toString()}/modules`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const orders = response.body.data.modules.map((m) => m.order);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThan(orders[i - 1]);
      }
    });

    // Test 88: retrieve course modules with correct parent reference
    it('Test 88: Module retrieval populates parent course title and status', async () => {
      const response = await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.data.module.course.title).toBe('Full Stack Integration Course');
      expect(response.body.data.module.course.status).toBe('published');
    });

    // Test 89: retrieve module lessons with correct parent reference
    it('Test 89: Lesson retrieval populates parent module title and order', async () => {
      const response = await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.data.lesson.module.title).toBe('Hierarchy Module 1');
      expect(response.body.data.lesson.module.order).toBe(1);
    });

    // Test 90: single lesson retrieval populates full parent hierarchy
    it('Test 90: Single lesson retrieval populates both module and course references', async () => {
      const response = await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.data.lesson.module.course.title).toBe('Full Stack Integration Course');
    });

    // Test 91: employee visibility chain - visible when all active and published
    it('Test 91: Employee can view lesson when course is active/published and module/lesson are active', async () => {
      const response = await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.data.lesson.id).toBe(hierarchyLesson._id.toString());
    });

    // Test 92: inactive course hides child modules and lessons
    it('Test 92: Setting parent course isActive=false hides modules and lessons from employee (404)', async () => {
      await Course.findByIdAndUpdate(hierarchyCourse._id, { isActive: false });

      // Module lookup fails
      await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      // Lesson lookup fails
      await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      // Restore
      await Course.findByIdAndUpdate(hierarchyCourse._id, { isActive: true });
    });

    // Test 93: draft course hides child modules and lessons
    it('Test 93: Changing course to draft hides modules and lessons from employee (404)', async () => {
      await Course.findByIdAndUpdate(hierarchyCourse._id, { status: 'draft' });

      await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      // Restore
      await Course.findByIdAndUpdate(hierarchyCourse._id, { status: 'published' });
    });

    // Test 94: archived course hides child modules and lessons
    it('Test 94: Changing course to archived hides modules and lessons from employee (404)', async () => {
      await Course.findByIdAndUpdate(hierarchyCourse._id, { status: 'archived' });

      await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      // Restore
      await Course.findByIdAndUpdate(hierarchyCourse._id, { status: 'published' });
    });

    // Test 95: inactive module hides child lessons
    it('Test 95: Setting module isActive=false hides its child lessons from employee (404)', async () => {
      await Module.findByIdAndUpdate(hierarchyModule._id, { isActive: false });

      await request(app)
        .get(`/api/lessons/${hierarchyLesson._id.toString()}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      // Restore
      await Module.findByIdAndUpdate(hierarchyModule._id, { isActive: true });
    });

    // Test 96: filtering lessons by contentType and isActive for admin
    it('Test 96: Admin can filter lessons by contentType and isActive status', async () => {
      await Lesson.create({
        module: hierarchyModule._id,
        title: 'Video Demo Lesson',
        content: 'Demo video walkthrough.',
        contentType: 'video',
        resourceUrl: 'https://example.com/demo.mp4',
        order: 2,
        isActive: false
      });

      const videoRes = await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}/lessons?contentType=video`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(videoRes.body.data.lessons.length).toBe(1);
      expect(videoRes.body.data.lessons[0].contentType).toBe('video');

      const inactiveRes = await request(app)
        .get(`/api/modules/${hierarchyModule._id.toString()}/lessons?isActive=false`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(inactiveRes.body.data.lessons.length).toBe(1);
      expect(inactiveRes.body.data.lessons[0].isActive).toBe(false);
    });
  });
});
