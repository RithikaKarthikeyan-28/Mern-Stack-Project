const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const User = require('../src/models/User');
const config = require('../src/config');
const {
  validateCreateModule,
  validateUpdateModule
} = require('../src/validators/module.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Module Management Tests (Phase 8)', () => {
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

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Module.syncIndexes();
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});

    // Seed test users
    adminUser = await User.create({
      name: 'Module Admin',
      email: 'mod_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'mod_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'mod_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Module Employee',
      email: 'mod_employee@example.com',
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
      title: 'Alice React Course',
      description: 'Course owned by Alice for module tests.',
      category: 'Frontend',
      level: 'intermediate',
      duration: 20,
      trainer: trainerUserA._id,
      status: 'published',
      isActive: true
    });

    courseB = await Course.create({
      title: 'Bob Python Course',
      description: 'Course owned by Bob for module tests.',
      category: 'Backend',
      level: 'beginner',
      duration: 30,
      trainer: trainerUserB._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Draft Course',
      description: 'Unpublished draft course.',
      category: 'Testing',
      level: 'beginner',
      duration: 10,
      trainer: trainerUserA._id,
      status: 'draft',
      isActive: true
    });

    archivedCourse = await Course.create({
      title: 'Archived Course',
      description: 'Old course that is archived.',
      category: 'Legacy',
      level: 'advanced',
      duration: 50,
      trainer: trainerUserA._id,
      status: 'archived',
      isActive: true
    });
  });

  afterAll(async () => {
    await Module.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // MODULE MODEL TESTS (Tests 1 - 8)
  // ==========================================
  describe('Module Model Tests', () => {
    afterEach(async () => {
      await Module.deleteMany({});
    });

    // Test 1: valid module
    it('Test 1: Creates a module with valid fields', async () => {
      const mod = await Module.create({
        course: courseA._id,
        title: 'Component Architecture',
        description: 'Building modular React components',
        order: 1
      });

      expect(mod._id).toBeDefined();
      expect(mod.title).toBe('Component Architecture');
      expect(mod.order).toBe(1);
      expect(mod.isActive).toBe(true);
    });

    // Test 2: missing course
    it('Test 2: Validation fails when course reference is missing', async () => {
      await expect(
        Module.create({
          title: 'Orphan Module',
          order: 1
        })
      ).rejects.toThrow(/Course reference is required/i);
    });

    // Test 3: missing title
    it('Test 3: Validation fails when title is missing', async () => {
      await expect(
        Module.create({
          course: courseA._id,
          order: 1
        })
      ).rejects.toThrow(/Module title is required/i);
    });

    // Test 4: short title
    it('Test 4: Validation fails when title is shorter than 3 characters', async () => {
      await expect(
        Module.create({
          course: courseA._id,
          title: 'AB',
          order: 1
        })
      ).rejects.toThrow(/Module title must be at least 3 characters long/i);
    });

    // Test 5: invalid order
    it('Test 5: Validation fails when order is not an integer >= 1', async () => {
      await expect(
        Module.create({
          course: courseA._id,
          title: 'Invalid Order Module',
          order: 0
        })
      ).rejects.toThrow(/Module order must be an integer of at least 1/i);

      await expect(
        Module.create({
          course: courseA._id,
          title: 'Float Order Module',
          order: 1.5
        })
      ).rejects.toThrow(/Module order must be an integer of at least 1/i);
    });

    // Test 6: default isActive
    it('Test 6: Defaults isActive to true', async () => {
      const mod = await Module.create({
        course: courseA._id,
        title: 'Active Default Module',
        order: 1
      });

      expect(mod.isActive).toBe(true);
    });

    // Test 7: timestamps
    it('Test 7: Includes createdAt and updatedAt timestamps', async () => {
      const mod = await Module.create({
        course: courseA._id,
        title: 'Timestamped Module',
        order: 1
      });

      expect(mod.createdAt).toBeDefined();
      expect(mod.updatedAt).toBeDefined();
    });

    // Test 8: course reference and JSON transform
    it('Test 8: Transforms _id to id and deletes __v in JSON representation', async () => {
      const mod = await Module.create({
        course: courseA._id,
        title: 'JSON Transform Module',
        order: 1
      });

      const json = mod.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ==========================================
  // MODULE VALIDATION TESTS (Tests 9 - 15)
  // ==========================================
  describe('Module Validation Unit Tests', () => {
    // Test 9: valid create
    it('Test 9: validateCreateModule passes with valid payload', () => {
      expect(() => {
        validateCreateModule({
          course: new mongoose.Types.ObjectId().toString(),
          title: 'Valid Module Title',
          description: 'Valid description text.',
          order: 1
        });
      }).not.toThrow();
    });

    // Test 10: missing course
    it('Test 10: validateCreateModule rejects missing course', () => {
      expect(() => {
        validateCreateModule({
          title: 'Valid Module Title',
          order: 1
        });
      }).toThrow(/Course ID is required/);
    });

    // Test 11: invalid course ID
    it('Test 11: validateCreateModule rejects invalid course ObjectId', () => {
      expect(() => {
        validateCreateModule({
          course: 'invalid-course-id',
          title: 'Valid Module Title',
          order: 1
        });
      }).toThrow(/Invalid Course ID format/);
    });

    // Test 12: missing title
    it('Test 12: validateCreateModule rejects missing or empty title', () => {
      expect(() => {
        validateCreateModule({
          course: new mongoose.Types.ObjectId().toString(),
          title: '   ',
          order: 1
        });
      }).toThrow(/Module title is required/);
    });

    // Test 13: invalid title length
    it('Test 13: validateCreateCourse rejects short title', () => {
      expect(() => {
        validateCreateModule({
          course: new mongoose.Types.ObjectId().toString(),
          title: 'AB',
          order: 1
        });
      }).toThrow(/Module title must be at least 3 characters long/);
    });

    // Test 14: invalid order
    it('Test 14: validateCreateModule rejects non-integer or zero order', () => {
      expect(() => {
        validateCreateModule({
          course: new mongoose.Types.ObjectId().toString(),
          title: 'Valid Title',
          order: 0
        });
      }).toThrow(/Module order must be an integer of at least 1/);
    });

    // Test 15: empty update
    it('Test 15: validateUpdateModule rejects empty update payload', () => {
      expect(() => {
        validateUpdateModule({});
      }).toThrow(/At least one field must be provided for update/);
    });
  });

  // ==========================================
  // MODULE API TESTS (Tests 16 - 42)
  // ==========================================
  describe('Module API & RBAC Integration Tests', () => {
    let modAlice1Id;
    let modAlice2Id;
    let modBob1Id;

    beforeEach(async () => {
      await Module.deleteMany({});

      const m1 = await Module.create({
        course: courseA._id,
        title: 'Alice Module 1',
        description: 'First module in Alice course',
        order: 1,
        isActive: true
      });
      modAlice1Id = m1._id.toString();

      const m2 = await Module.create({
        course: courseA._id,
        title: 'Alice Module 2',
        description: 'Second module in Alice course',
        order: 2,
        isActive: true
      });
      modAlice2Id = m2._id.toString();

      const mB = await Module.create({
        course: courseB._id,
        title: 'Bob Module 1',
        description: 'First module in Bob course',
        order: 1,
        isActive: true
      });
      modBob1Id = mB._id.toString();
    });

    // Test 16: unauthenticated POST -> 401
    it('Test 16: Unauthenticated request cannot create module (POST /api/modules -> 401)', async () => {
      const response = await request(app)
        .post('/api/modules')
        .send({
          course: courseA._id.toString(),
          title: 'Unauthenticated Module',
          order: 3
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Test 17: employee POST -> 403
    it('Test 17: Employee cannot create module (POST /api/modules -> 403)', async () => {
      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          course: courseA._id.toString(),
          title: 'Employee Forbidden Module',
          order: 3
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 18: trainer creates module in own course -> 201
    it('Test 18: Trainer can create module in their own course (POST /api/modules -> 201)', async () => {
      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          course: courseA._id.toString(),
          title: 'State Management with Redux',
          description: 'Deep dive into Redux Toolkit',
          order: 3
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module.title).toBe('State Management with Redux');
      expect(response.body.data.module.order).toBe(3);
    });

    // Test 19: trainer cannot create module in another trainer's course -> 403
    it("Test 19: Trainer cannot create module in another trainer's course (POST /api/modules -> 403)", async () => {
      // Alice tries to add a module to Bob's course
      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          course: courseB._id.toString(),
          title: 'Unauthorized Module in Bob Course',
          order: 2
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/only create modules in your own courses/i);
    });

    // Test 20: admin creates module -> 201
    it('Test 20: Admin can create module in any course (POST /api/modules -> 201)', async () => {
      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: courseB._id.toString(),
          title: 'Admin Created Python Module',
          order: 2
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module.title).toBe('Admin Created Python Module');
    });

    // Test 21: duplicate module order -> 409
    it('Test 21: Duplicate module order in same course returns 409 Conflict', async () => {
      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          course: courseA._id.toString(),
          title: 'Conflicting Order Module',
          order: 1 // Already taken by modAlice1Id
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists in the course/i);
    });

    // Test 22: trainer gets own modules
    it('Test 22: Trainer can get modules of their own course (GET /api/courses/:courseId/modules -> 200)', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseA._id.toString()}/modules`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules.length).toBe(2);
      expect(response.body.data.modules[0].order).toBe(1);
      expect(response.body.data.modules[1].order).toBe(2);
    });

    // Test 23: trainer cannot access another trainer's course modules
    it("Test 23: Trainer cannot view another trainer's course modules (GET /api/courses/:courseId/modules -> 403)", async () => {
      const response = await request(app)
        .get(`/api/courses/${courseB._id.toString()}/modules`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 24: employee gets published course modules
    it('Test 24: Employee can view modules of an active published course (GET /api/courses/:courseId/modules -> 200)', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseA._id.toString()}/modules`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules.length).toBe(2);
    });

    // Test 25: employee cannot see inactive module
    it('Test 25: Employee cannot view inactive module (GET /api/modules/:id -> 404)', async () => {
      await Module.findByIdAndUpdate(modAlice1Id, { isActive: false });

      const response = await request(app)
        .get(`/api/modules/${modAlice1Id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/module not found/i);
    });

    // Test 26: employee cannot see draft course module
    it('Test 26: Employee cannot view modules of a draft course (GET /api/courses/:courseId/modules -> 404)', async () => {
      const response = await request(app)
        .get(`/api/courses/${draftCourse._id.toString()}/modules`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/course not found/i);
    });

    // Test 27: employee cannot see archived course module
    it('Test 27: Employee cannot view modules of an archived course (GET /api/courses/:courseId/modules -> 404)', async () => {
      const response = await request(app)
        .get(`/api/courses/${archivedCourse._id.toString()}/modules`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/course not found/i);
    });

    // Test 28: admin gets modules
    it('Test 28: Admin can view modules for any course (GET /api/courses/:courseId/modules -> 200)', async () => {
      const response = await request(app)
        .get(`/api/courses/${courseB._id.toString()}/modules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modules.length).toBe(1);
    });

    // Test 29: invalid module ID format -> 400
    it('Test 29: Invalid module ID format returns 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/modules/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid module id format/i);
    });

    // Test 30: nonexistent module ID -> 404
    it('Test 30: Nonexistent module ID returns 404 Not Found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/modules/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/module not found/i);
    });

    // Test 31: trainer updates own module
    it('Test 31: Trainer can update their own module (PATCH /api/modules/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/modules/${modAlice1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Alice Updated Module Title',
          description: 'Updated description text'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module.title).toBe('Alice Updated Module Title');
    });

    // Test 32: trainer cannot update another trainer's module
    it("Test 32: Trainer cannot update another trainer's module (PATCH /api/modules/:id -> 403)", async () => {
      const response = await request(app)
        .patch(`/api/modules/${modBob1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Unauthorized Update by Alice'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/you can only update modules in your own courses/i);
    });

    // Test 33: trainer cannot change course reference
    it('Test 33: Cannot change course reference of a module (PATCH /api/modules/:id -> 400)', async () => {
      const response = await request(app)
        .patch(`/api/modules/${modAlice1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          course: courseB._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/cannot change course reference/i);
    });

    // Test 34: duplicate order on update -> 409
    it('Test 34: Updating module order to an existing order in same course returns 409 Conflict', async () => {
      const response = await request(app)
        .patch(`/api/modules/${modAlice2Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          order: 1 // Already used by modAlice1Id
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists in the course/i);
    });

    // Test 35: admin updates module
    it('Test 35: Admin can update any module (PATCH /api/modules/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/modules/${modBob1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Overridden Module Title'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module.title).toBe('Admin Overridden Module Title');
    });

    // Test 36: trainer deletes own module
    it('Test 36: Trainer can soft-delete their own module (DELETE /api/modules/:id -> 200)', async () => {
      const response = await request(app)
        .delete(`/api/modules/${modAlice1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module.isActive).toBe(false);
    });

    // Test 37: trainer cannot delete another trainer's module
    it("Test 37: Trainer cannot delete another trainer's module (DELETE /api/modules/:id -> 403)", async () => {
      const response = await request(app)
        .delete(`/api/modules/${modBob1Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/you can only delete modules in your own courses/i);
    });

    // Test 38: admin deletes module
    it('Test 38: Admin can soft-delete any module (DELETE /api/modules/:id -> 200)', async () => {
      const response = await request(app)
        .delete(`/api/modules/${modBob1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module.isActive).toBe(false);
    });

    // Test 39: soft deletion verified
    it('Test 39: Soft deletion sets isActive to false', async () => {
      const inDbBefore = await Module.findById(modAlice2Id);
      expect(inDbBefore.isActive).toBe(true);

      await request(app)
        .delete(`/api/modules/${modAlice2Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const inDbAfter = await Module.findById(modAlice2Id);
      expect(inDbAfter.isActive).toBe(false);
    });

    // Test 40: module remains in database
    it('Test 40: Deleted module remains stored in database', async () => {
      await request(app)
        .delete(`/api/modules/${modAlice2Id}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      const inDb = await Module.findById(modAlice2Id);
      expect(inDb).not.toBeNull();
    });

    // Test 41: filtering by isActive
    it('Test 41: Admin can filter modules by isActive status', async () => {
      await Module.findByIdAndUpdate(modAlice1Id, { isActive: false });

      const activeRes = await request(app)
        .get(`/api/courses/${courseA._id.toString()}/modules?isActive=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(activeRes.body.data.modules.length).toBe(1);

      const inactiveRes = await request(app)
        .get(`/api/courses/${courseA._id.toString()}/modules?isActive=false`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(inactiveRes.body.data.modules.length).toBe(1);
    });

    // Test 42: employee cannot bypass visibility with isActive filter
    it('Test 42: Employee cannot bypass visibility rule using isActive=false query parameter', async () => {
      await Module.findByIdAndUpdate(modAlice1Id, { isActive: false });

      const response = await request(app)
        .get(`/api/courses/${courseA._id.toString()}/modules?isActive=false`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      // Must strictly only return active modules
      expect(response.body.data.modules.every((m) => m.isActive === true)).toBe(true);
      expect(response.body.data.modules.some((m) => m.id === modAlice1Id)).toBe(false);
    });
  });
});
