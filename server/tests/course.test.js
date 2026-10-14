const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Course = require('../src/models/Course');
const User = require('../src/models/User');
const config = require('../src/config');
const {
  validateCreateCourse,
  validateUpdateCourse
} = require('../src/validators/course.validator');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Course Management Tests (Phase 7)', () => {
  let adminToken;
  let trainerTokenA;
  let trainerTokenB;
  let employeeToken;

  let adminUser;
  let trainerUserA;
  let trainerUserB;
  let employeeUser;
  let inactiveTrainerUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Course.syncIndexes();
    await User.deleteMany({});
    await Course.deleteMany({});

    // Seed test users
    adminUser = await User.create({
      name: 'Course Admin',
      email: 'course_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    trainerUserA = await User.create({
      name: 'Trainer Alice',
      email: 'trainer_alice@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    trainerUserB = await User.create({
      name: 'Trainer Bob',
      email: 'trainer_bob@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Course Employee',
      email: 'course_employee@example.com',
      password: 'Password123',
      role: 'employee'
    });

    inactiveTrainerUser = await User.create({
      name: 'Inactive Trainer',
      email: 'inactive_trainer@example.com',
      password: 'Password123',
      role: 'trainer',
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
    await Course.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // A. COURSE MODEL TESTS (Tests 1 - 13)
  // ==========================================
  describe('A. Course Model Tests', () => {
    afterEach(async () => {
      await Course.deleteMany({});
    });

    // Test 1: valid course creation
    it('Test 1: Creates a course with valid fields', async () => {
      const course = await Course.create({
        title: 'Full Stack Web Development',
        description: 'Comprehensive course on modern MERN stack development.',
        category: 'Software Engineering',
        level: 'intermediate',
        duration: 40,
        trainer: trainerUserA._id
      });

      expect(course._id).toBeDefined();
      expect(course.title).toBe('Full Stack Web Development');
      expect(course.description).toContain('MERN stack');
      expect(course.level).toBe('intermediate');
      expect(course.duration).toBe(40);
      expect(course.status).toBe('draft');
      expect(course.isActive).toBe(true);
    });

    // Test 2: required title
    it('Test 2: Validation fails when title is missing', async () => {
      await expect(
        Course.create({
          description: 'Valid course description text.',
          category: 'DevOps',
          level: 'beginner',
          duration: 10,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course title is required/i);
    });

    // Test 3: required description
    it('Test 3: Validation fails when description is missing', async () => {
      await expect(
        Course.create({
          title: 'Docker Fundamentals',
          category: 'DevOps',
          level: 'beginner',
          duration: 10,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course description is required/i);
    });

    // Test 4: required category
    it('Test 4: Validation fails when category is missing', async () => {
      await expect(
        Course.create({
          title: 'Kubernetes in Practice',
          description: 'In-depth guide to orchestrating containers with Kubernetes.',
          level: 'advanced',
          duration: 25,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course category is required/i);
    });

    // Test 5: required level
    it('Test 5: Validation fails when level is missing', async () => {
      await expect(
        Course.create({
          title: 'Node.js Microservices',
          description: 'Building microservices with Node.js and Express.',
          category: 'Backend',
          duration: 15,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course level is required/i);
    });

    // Test 6: required duration
    it('Test 6: Validation fails when duration is missing', async () => {
      await expect(
        Course.create({
          title: 'Python for Beginners',
          description: 'Introductory course on programming with Python 3.',
          category: 'Programming',
          level: 'beginner',
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course duration is required/i);
    });

    // Test 7: required trainer
    it('Test 7: Validation fails when trainer is missing', async () => {
      await expect(
        Course.create({
          title: 'Data Science with R',
          description: 'Practical data science applications and statistical analysis.',
          category: 'Data Science',
          level: 'intermediate',
          duration: 20
        })
      ).rejects.toThrow(/Trainer is required/i);
    });

    // Test 8: invalid level enum
    it('Test 8: Rejects invalid course level value', async () => {
      await expect(
        Course.create({
          title: 'Deep Learning Specialization',
          description: 'Neural networks, computer vision, and NLP deep dive.',
          category: 'Artificial Intelligence',
          level: 'expert', // Invalid level
          duration: 30,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course level must be one of/i);
    });

    // Test 9: invalid duration (non-integer or < 1)
    it('Test 9: Rejects non-integer or zero duration', async () => {
      await expect(
        Course.create({
          title: 'Agile Methodologies',
          description: 'Agile and Scrum framework essentials for engineering teams.',
          category: 'Methodology',
          level: 'beginner',
          duration: 0,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course duration must be an integer of at least 1 hour/i);

      await expect(
        Course.create({
          title: 'Scrum Master Essentials',
          description: 'Comprehensive Scrum Master preparation and ceremonies.',
          category: 'Methodology',
          level: 'beginner',
          duration: 2.5,
          trainer: trainerUserA._id
        })
      ).rejects.toThrow(/Course duration must be an integer of at least 1 hour/i);
    });

    // Test 10: timestamps
    it('Test 10: Automatically manages createdAt and updatedAt timestamps', async () => {
      const course = await Course.create({
        title: 'Cybersecurity Fundamentals',
        description: 'Network security, cryptography, and defense mechanisms.',
        category: 'Security',
        level: 'beginner',
        duration: 12,
        trainer: trainerUserA._id
      });

      expect(course.createdAt).toBeDefined();
      expect(course.updatedAt).toBeDefined();
    });

    // Test 11: default status is draft
    it('Test 11: Defaults status to draft', async () => {
      const course = await Course.create({
        title: 'Cloud Architecture AWS',
        description: 'Designing resilient architectures on Amazon Web Services.',
        category: 'Cloud',
        level: 'intermediate',
        duration: 18,
        trainer: trainerUserA._id
      });

      expect(course.status).toBe('draft');
    });

    // Test 12: default isActive is true
    it('Test 12: Defaults isActive to true', async () => {
      const course = await Course.create({
        title: 'UI/UX Design Systems',
        description: 'Creating scalable design systems in Figma and code.',
        category: 'Design',
        level: 'intermediate',
        duration: 16,
        trainer: trainerUserA._id
      });

      expect(course.isActive).toBe(true);
    });

    // Test 13: trainer reference and JSON transform
    it('Test 13: Transforms _id to id and deletes __v in JSON representation', async () => {
      const course = await Course.create({
        title: 'GraphQL API Design',
        description: 'Schema design, resolvers, and subscriptions with Apollo.',
        category: 'Backend',
        level: 'advanced',
        duration: 22,
        trainer: trainerUserA._id
      });

      const json = course.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ==========================================
  // B. COURSE VALIDATION TESTS (Tests 14 - 27)
  // ==========================================
  describe('B. Course Validation Unit Tests', () => {
    // Test 14: valid create payload
    it('Test 14: validateCreateCourse passes with complete valid payload', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Course Title',
          description: 'This is a sufficiently long and descriptive course summary.',
          category: 'Web',
          level: 'beginner',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).not.toThrow();
    });

    // Test 15: missing title
    it('Test 15: validateCreateCourse rejects missing or whitespace-only title', () => {
      expect(() => {
        validateCreateCourse({
          title: '   ',
          description: 'Valid description text that is long enough.',
          category: 'Web',
          level: 'beginner',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course title is required/);
    });

    // Test 16: short title
    it('Test 16: validateCreateCourse rejects title shorter than 3 characters', () => {
      expect(() => {
        validateCreateCourse({
          title: 'AB',
          description: 'Valid description text that is long enough.',
          category: 'Web',
          level: 'beginner',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course title must be at least 3 characters long/);
    });

    // Test 17: missing description
    it('Test 17: validateCreateCourse rejects missing description', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          category: 'Web',
          level: 'beginner',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course description is required/);
    });

    // Test 18: short description
    it('Test 18: validateCreateCourse rejects description shorter than 10 characters', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          description: 'Too short',
          category: 'Web',
          level: 'beginner',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course description must be at least 10 characters long/);
    });

    // Test 19: missing category
    it('Test 19: validateCreateCourse rejects missing category', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          description: 'Valid description text that is long enough.',
          level: 'beginner',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course category is required/);
    });

    // Test 20: invalid level
    it('Test 20: validateCreateCourse rejects invalid level enum', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          description: 'Valid description text that is long enough.',
          category: 'Web',
          level: 'master',
          duration: 10,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course level must be one of/);
    });

    // Test 21: missing duration
    it('Test 21: validateCreateCourse rejects missing duration', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          description: 'Valid description text that is long enough.',
          category: 'Web',
          level: 'beginner',
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course duration is required/);
    });

    // Test 22: invalid duration
    it('Test 22: validateCreateCourse rejects non-integer or negative duration', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          description: 'Valid description text that is long enough.',
          category: 'Web',
          level: 'beginner',
          duration: -5,
          trainer: new mongoose.Types.ObjectId().toString()
        });
      }).toThrow(/Course duration must be an integer of at least 1 hour/);
    });

    // Test 23: invalid trainer ID
    it('Test 23: validateCreateCourse rejects invalid trainer ObjectId', () => {
      expect(() => {
        validateCreateCourse({
          title: 'Valid Title',
          description: 'Valid description text that is long enough.',
          category: 'Web',
          level: 'beginner',
          duration: 10,
          trainer: 'invalid-id'
        });
      }).toThrow(/Invalid Trainer ID format/);
    });

    // Test 24: missing trainer
    it('Test 24: validateCreateCourse rejects missing trainer when required', () => {
      expect(() => {
        validateCreateCourse(
          {
            title: 'Valid Title',
            description: 'Valid description text that is long enough.',
            category: 'Web',
            level: 'beginner',
            duration: 10
          },
          { requireTrainer: true }
        );
      }).toThrow(/Trainer ID is required/);
    });

    // Test 25: empty update payload
    it('Test 25: validateUpdateCourse rejects empty update payload', () => {
      expect(() => {
        validateUpdateCourse({});
      }).toThrow(/At least one field must be provided for update/);
    });

    // Test 26: invalid update field
    it('Test 26: validateUpdateCourse rejects invalid fields during update', () => {
      expect(() => {
        validateUpdateCourse({ level: 'invalid-level' });
      }).toThrow(/Course level must be one of/);
    });

    // Test 27: invalid status
    it('Test 27: validateUpdateCourse rejects invalid status value', () => {
      expect(() => {
        validateUpdateCourse({ status: 'completed' });
      }).toThrow(/Status must be one of/);
    });
  });

  // ==========================================
  // C. COURSE API & RBAC TESTS (Tests 28 - 60)
  // ==========================================
  describe('C. Course API & RBAC Integration Tests', () => {
    let testCourseAId;
    let testCourseBId;
    let publishedCourseId;
    let archivedCourseId;

    beforeEach(async () => {
      await Course.deleteMany({});

      const courseA = await Course.create({
        title: 'Course By Trainer Alice',
        description: 'Detailed description of Trainer Alice course.',
        category: 'Engineering',
        level: 'intermediate',
        duration: 20,
        trainer: trainerUserA._id,
        status: 'draft',
        isActive: true
      });
      testCourseAId = courseA._id.toString();

      const courseB = await Course.create({
        title: 'Course By Trainer Bob',
        description: 'Detailed description of Trainer Bob course.',
        category: 'Data Science',
        level: 'advanced',
        duration: 35,
        trainer: trainerUserB._id,
        status: 'draft',
        isActive: true
      });
      testCourseBId = courseB._id.toString();

      const pubCourse = await Course.create({
        title: 'Public Published Course',
        description: 'Published course accessible to employees and learners.',
        category: 'Engineering',
        level: 'beginner',
        duration: 15,
        trainer: trainerUserA._id,
        status: 'published',
        isActive: true
      });
      publishedCourseId = pubCourse._id.toString();

      const archCourse = await Course.create({
        title: 'Historical Archived Course',
        description: 'Archived course kept for historical reference.',
        category: 'Compliance',
        level: 'beginner',
        duration: 5,
        trainer: trainerUserA._id,
        status: 'archived',
        isActive: true
      });
      archivedCourseId = archCourse._id.toString();
    });

    // Test 28: unauthenticated POST -> 401
    it('Test 28: Unauthenticated request cannot create course (POST /api/courses -> 401)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          title: 'Unauthenticated Course',
          description: 'Should fail with 401 status.',
          category: 'Security',
          level: 'beginner',
          duration: 10
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Test 29: employee POST -> 403
    it('Test 29: Employee cannot create course (POST /api/courses -> 403)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Unauthorized Employee Course',
          description: 'Employee is forbidden from creating courses.',
          category: 'Security',
          level: 'beginner',
          duration: 10
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 30: trainer POST -> 201
    it('Test 30: Trainer can create course (POST /api/courses -> 201)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'TypeScript for Node.js Developers',
          description: 'Deep dive into TypeScript in scalable Node applications.',
          category: 'Engineering',
          level: 'intermediate',
          duration: 25
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe('TypeScript for Node.js Developers');
      expect(response.body.data.course.trainer.name).toBe('Trainer Alice');
    });

    // Test 31: admin POST -> 201
    it('Test 31: Admin can create course for an assigned trainer (POST /api/courses -> 201)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Created Course',
          description: 'Course created by system administrator assigning Trainer B.',
          category: 'Management',
          level: 'beginner',
          duration: 12,
          trainer: trainerUserB._id.toString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.trainer.id.toString()).toBe(trainerUserB._id.toString());
    });

    // Test 32: trainer-created course owner is forced to authenticated trainer
    it('Test 32: Trainer-created course owner is forced to authenticated trainer ID', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Ownership Invariant Course',
          description: 'Course created by Trainer Alice must belong to Alice.',
          category: 'Engineering',
          level: 'beginner',
          duration: 10
        })
        .expect(201);

      expect(response.body.data.course.trainer.id.toString()).toBe(trainerUserA._id.toString());
    });

    // Test 33: trainer cannot spoof another trainer as owner
    it('Test 33: Trainer cannot spoof another trainer as owner in request body', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Spoof Attempt Course',
          description: 'Trainer Alice tries to set owner to Trainer Bob.',
          category: 'Engineering',
          level: 'beginner',
          duration: 10,
          trainer: trainerUserB._id.toString() // Spoofed ID
        })
        .expect(201);

      // Ownership must remain Trainer Alice
      expect(response.body.data.course.trainer.id.toString()).toBe(trainerUserA._id.toString());
    });

    // Test 34: employee GET list -> 200
    it('Test 34: Employee can list courses (GET /api/courses -> 200)', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.courses)).toBe(true);
    });

    // Test 35: employee only sees published active courses
    it('Test 35: Employee list contains only active published courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      const courses = response.body.data.courses;
      expect(courses.length).toBe(1);
      expect(courses[0].id).toBe(publishedCourseId);
      expect(courses[0].status).toBe('published');
      expect(courses[0].isActive).toBe(true);
    });

    // Test 36: employee cannot see draft
    it('Test 36: Employee cannot view draft course by ID (GET /api/courses/:id -> 404)', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/course not found/i);
    });

    // Test 37: employee cannot see archived
    it('Test 37: Employee cannot view archived course by ID (GET /api/courses/:id -> 404)', async () => {
      const response = await request(app)
        .get(`/api/courses/${archivedCourseId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/course not found/i);
    });

    // Test 38: employee cannot see inactive
    it('Test 38: Employee cannot view inactive course even if published (GET /api/courses/:id -> 404)', async () => {
      await Course.findByIdAndUpdate(publishedCourseId, { isActive: false });

      const response = await request(app)
        .get(`/api/courses/${publishedCourseId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/course not found/i);
    });

    // Test 39: admin GET list
    it('Test 39: Admin can list courses of all statuses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(4);
    });

    // Test 40: trainer GET list
    it('Test 40: Trainer can list courses across statuses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(4);
    });

    // Test 41: GET by ID
    it('Test 41: Admin/Trainer can view single course by ID (GET /api/courses/:id -> 200)', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe('Course By Trainer Alice');
    });

    // Test 42: invalid course ID
    it('Test 42: Invalid course ID format returns 400 Bad Request', async () => {
      const response = await request(app)
        .get('/api/courses/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid course id format/i);
    });

    // Test 43: nonexistent course
    it('Test 43: Nonexistent course ID returns 404 Not Found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/courses/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/course not found/i);
    });

    // Test 44: admin update
    it('Test 44: Admin can update any course details (PATCH /api/courses/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Renamed Course',
          duration: 50
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe('Admin Renamed Course');
      expect(response.body.data.course.duration).toBe(50);
    });

    // Test 45: trainer update own course
    it('Test 45: Trainer can update their own course (PATCH /api/courses/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          description: 'Updated description by author Trainer Alice.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.description).toBe(
        'Updated description by author Trainer Alice.'
      );
    });

    // Test 46: trainer cannot update another trainer's course
    it("Test 46: Trainer cannot update another trainer's course (PATCH /api/courses/:id -> 403)", async () => {
      // Trainer A attempts to update Trainer B's course
      const response = await request(app)
        .patch(`/api/courses/${testCourseBId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          title: 'Unauthorized Modification Attempt'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/you can only update courses you own/i);
    });

    // Test 47: trainer cannot transfer course ownership
    it('Test 47: Trainer cannot transfer course ownership to another trainer (PATCH -> 403)', async () => {
      const response = await request(app)
        .patch(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .send({
          trainer: trainerUserB._id.toString()
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/cannot transfer course ownership/i);
    });

    // Test 48: admin can change trainer
    it('Test 48: Admin can reassign course to another valid trainer (PATCH -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainer: trainerUserB._id.toString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.trainer.id.toString()).toBe(trainerUserB._id.toString());
    });

    // Test 49: trainer cannot delete
    it('Test 49: Trainer cannot delete course (DELETE /api/courses/:id -> 403)', async () => {
      const response = await request(app)
        .delete(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${trainerTokenA}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 50: employee cannot delete
    it('Test 50: Employee cannot delete course (DELETE /api/courses/:id -> 403)', async () => {
      const response = await request(app)
        .delete(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 51: admin soft deletes course
    it('Test 51: Admin can soft delete course (DELETE /api/courses/:id -> 200)', async () => {
      const response = await request(app)
        .delete(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.isActive).toBe(false);
    });

    // Test 52: deleted course remains in database
    it('Test 52: Soft-deleted course remains stored in database', async () => {
      await request(app)
        .delete(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const inDb = await Course.findById(testCourseAId);
      expect(inDb).not.toBeNull();
    });

    // Test 53: deleted course has isActive false
    it('Test 53: Soft-deleted course in database has isActive === false', async () => {
      await request(app)
        .delete(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const inDb = await Course.findById(testCourseAId);
      expect(inDb.isActive).toBe(false);
    });

    // Test 54: admin can still retrieve inactive course
    it('Test 54: Admin can retrieve inactive courses via query filtering', async () => {
      await request(app)
        .delete(`/api/courses/${testCourseAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/courses?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.some((c) => c.id === testCourseAId)).toBe(true);
    });

    // Test 55: filtering by category
    it('Test 55: Filters courses by category', async () => {
      const response = await request(app)
        .get('/api/courses?category=Compliance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(1);
      expect(response.body.data.courses[0].category).toBe('Compliance');
    });

    // Test 56: filtering by level
    it('Test 56: Filters courses by level', async () => {
      const response = await request(app)
        .get('/api/courses?level=advanced')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(1);
      expect(response.body.data.courses[0].level).toBe('advanced');
    });

    // Test 57: filtering by status
    it('Test 57: Filters courses by status', async () => {
      const response = await request(app)
        .get('/api/courses?status=published')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(1);
      expect(response.body.data.courses[0].status).toBe('published');
    });

    // Test 58: filtering by trainer
    it('Test 58: Filters courses by trainer', async () => {
      const response = await request(app)
        .get(`/api/courses?trainer=${trainerUserB._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(1);
      expect(response.body.data.courses[0].title).toBe('Course By Trainer Bob');
    });

    // Test 59: filtering by isActive
    it('Test 59: Filters courses by isActive status', async () => {
      await Course.findByIdAndUpdate(testCourseAId, { isActive: false });

      const activeRes = await request(app)
        .get('/api/courses?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(activeRes.body.data.courses.length).toBe(3);

      const inactiveRes = await request(app)
        .get('/api/courses?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(inactiveRes.body.data.courses.length).toBe(1);
    });

    // Test 60: combined filters
    it('Test 60: Filters courses using combined query parameters', async () => {
      const response = await request(app)
        .get('/api/courses?category=Engineering&level=beginner')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.courses.length).toBe(1);
      expect(response.body.data.courses[0].title).toBe('Public Published Course');
    });
  });
});
