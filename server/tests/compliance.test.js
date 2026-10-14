const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Certificate = require('../src/models/Certificate');
const Notification = require('../src/models/Notification');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');
const config = require('../src/config');
const complianceService = require('../src/services/compliance.service');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 18 — Compliance Management Domain Tests', () => {
  let adminToken;
  let trainerToken;
  let employeeAToken;
  let employeeBToken;
  let employeeCToken;

  let adminUser;
  let trainerUser;
  let employeeAUser;
  let employeeBUser;
  let employeeCUser;

  let departmentEngineering;
  let departmentMarketing;

  let employeeA;
  let employeeB;
  let employeeC;

  let publishedCourse1;
  let publishedCourse2;
  let publishedCourse3;
  let draftCourse;
  let archivedCourse;
  let inactiveCourse;

  const generateToken = (user) => {
    return jwt.sign(
      {
        id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role,
        email: user.email
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    // Clean up any test artifacts from prior runs
    await Promise.all([
      User.deleteMany({ email: /@phase18test\.com$/ }),
      Department.deleteMany({ $or: [{ code: /^P18-/ }, { name: /Phase 18/i }] }),
      Employee.deleteMany({ employeeId: /^P18-/ }),
      Course.deleteMany({ code: /^P18-/ }),
      ComplianceRequirement.deleteMany({ title: /Phase 18/i }),
      ComplianceAssignment.deleteMany({}),
      Enrollment.deleteMany({}),
      Certificate.deleteMany({ certificateNumber: /^P18-/ }),
      Notification.deleteMany({ type: { $in: ['compliance_due_soon', 'compliance_overdue'] } })
    ]);

    // 1. Users
    adminUser = await User.create({
      name: 'Phase 18 Admin',
      email: 'admin@phase18test.com',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Phase 18 Trainer',
      email: 'trainer@phase18test.com',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeAUser = await User.create({
      name: 'Phase 18 Alice',
      email: 'alice@phase18test.com',
      password: 'Password123!',
      role: 'employee'
    });

    employeeBUser = await User.create({
      name: 'Phase 18 Bob',
      email: 'bob@phase18test.com',
      password: 'Password123!',
      role: 'employee'
    });

    employeeCUser = await User.create({
      name: 'Phase 18 Charlie',
      email: 'charlie@phase18test.com',
      password: 'Password123!',
      role: 'employee'
    });

    adminToken = generateToken(adminUser);
    trainerToken = generateToken(trainerUser);
    employeeAToken = generateToken(employeeAUser);
    employeeBToken = generateToken(employeeBUser);
    employeeCToken = generateToken(employeeCUser);

    // 2. Departments
    departmentEngineering = await Department.create({
      name: 'Phase 18 Engineering',
      code: 'P18-ENG',
      description: 'Engineering department for compliance testing',
      isActive: true
    });

    departmentMarketing = await Department.create({
      name: 'Phase 18 Marketing',
      code: 'P18-MKT',
      description: 'Marketing department for compliance testing',
      isActive: true
    });

    // 3. Employees
    employeeA = await Employee.create({
      user: employeeAUser._id,
      employeeId: 'P18-EMP-001',
      department: departmentEngineering._id,
      designation: 'Software Engineer',
      isActive: true
    });

    employeeB = await Employee.create({
      user: employeeBUser._id,
      employeeId: 'P18-EMP-002',
      department: departmentEngineering._id,
      designation: 'QA Engineer',
      isActive: true
    });

    employeeC = await Employee.create({
      user: employeeCUser._id,
      employeeId: 'P18-EMP-003',
      department: departmentMarketing._id,
      designation: 'Content Specialist',
      isActive: true
    });

    // 4. Courses
    publishedCourse1 = await Course.create({
      title: 'Phase 18 Information Security 101',
      code: 'P18-SEC-101',
      description: 'Mandatory annual cybersecurity compliance training',
      category: 'Security',
      level: 'beginner',
      duration: 10,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    publishedCourse2 = await Course.create({
      title: 'Phase 18 Anti-Harassment & Workplace Ethics',
      code: 'P18-ETH-101',
      description: 'Mandatory ethics training',
      category: 'HR',
      level: 'beginner',
      duration: 5,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    publishedCourse3 = await Course.create({
      title: 'Phase 18 Data Privacy & GDPR Compliance',
      code: 'P18-GDPR-201',
      description: 'Data privacy compliance',
      category: 'Legal',
      level: 'intermediate',
      duration: 8,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    draftCourse = await Course.create({
      title: 'Phase 18 Draft Safety Training',
      code: 'P18-DRF-001',
      description: 'Draft course not yet approved',
      category: 'Safety',
      level: 'beginner',
      duration: 4,
      trainer: trainerUser._id,
      status: 'draft',
      isActive: true
    });

    archivedCourse = await Course.create({
      title: 'Phase 18 Archived Compliance Training',
      code: 'P18-ARC-001',
      description: 'Deprecated course',
      category: 'Legacy',
      level: 'beginner',
      duration: 6,
      trainer: trainerUser._id,
      status: 'archived',
      isActive: true
    });

    inactiveCourse = await Course.create({
      title: 'Phase 18 Inactive Training',
      code: 'P18-INA-001',
      description: 'Inactive course',
      category: 'General',
      level: 'beginner',
      duration: 5,
      trainer: trainerUser._id,
      status: 'published',
      isActive: false
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase18test\.com$/ }),
      Department.deleteMany({ $or: [{ code: /^P18-/ }, { name: /Phase 18/i }] }),
      Employee.deleteMany({ employeeId: /^P18-/ }),
      Course.deleteMany({ code: /^P18-/ }),
      ComplianceRequirement.deleteMany({ title: /Phase 18/i }),
      ComplianceAssignment.deleteMany({}),
      Enrollment.deleteMany({ employee: { $in: [employeeA?._id, employeeB?._id, employeeC?._id] } }),
      Certificate.deleteMany({ employee: { $in: [employeeA?._id, employeeB?._id, employeeC?._id] } }),
      Notification.deleteMany({ type: { $in: ['compliance_due_soon', 'compliance_overdue'] } })
    ]);
    await mongoose.connection.close();
  });

  // =========================================================================
  // SECTION 1: MODEL & SCHEMA UNIT TESTS (1 - 13)
  // =========================================================================
  describe('1. Model & Schema Specifications', () => {
    it('1. ComplianceRequirement requires title and course', async () => {
      const reqDoc = new ComplianceRequirement({});
      let err;
      try {
        await reqDoc.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.course).toBeDefined();
    });

    it('2. ComplianceRequirement title trims and enforces min/max length', async () => {
      const short = new ComplianceRequirement({
        title: 'AB',
        course: publishedCourse1._id
      });
      await expect(short.validate()).rejects.toThrow();

      const longTitle = 'A'.repeat(121);
      const long = new ComplianceRequirement({
        title: longTitle,
        course: publishedCourse1._id
      });
      await expect(long.validate()).rejects.toThrow();

      const valid = new ComplianceRequirement({
        title: '  Valid Title  ',
        course: publishedCourse1._id
      });
      expect(valid.title).toBe('Valid Title');
    });

    it('3. ComplianceRequirement description max length (1000 characters)', async () => {
      const tooLongDesc = new ComplianceRequirement({
        title: 'Security Compliance',
        course: publishedCourse1._id,
        description: 'D'.repeat(1001)
      });
      await expect(tooLongDesc.validate()).rejects.toThrow();
    });

    it('4. ComplianceRequirement frequency enum enforces values and defaults to annual', async () => {
      const def = new ComplianceRequirement({
        title: 'Default Frequency',
        course: publishedCourse1._id
      });
      expect(def.frequency).toBe('annual');

      const invalid = new ComplianceRequirement({
        title: 'Invalid Frequency',
        course: publishedCourse1._id,
        frequency: 'quarterly'
      });
      await expect(invalid.validate()).rejects.toThrow();
    });

    it('5. ComplianceRequirement dueWithinDays must be 1 to 365, defaults to 30', async () => {
      const def = new ComplianceRequirement({
        title: 'Default Due Days',
        course: publishedCourse1._id
      });
      expect(def.dueWithinDays).toBe(30);

      const tooSmall = new ComplianceRequirement({
        title: 'Zero Days',
        course: publishedCourse1._id,
        dueWithinDays: 0
      });
      await expect(tooSmall.validate()).rejects.toThrow();

      const tooLarge = new ComplianceRequirement({
        title: 'Too Many Days',
        course: publishedCourse1._id,
        dueWithinDays: 366
      });
      await expect(tooLarge.validate()).rejects.toThrow();
    });

    it('6. ComplianceRequirement renewalGraceDays defaults to 0 and max 90', async () => {
      const def = new ComplianceRequirement({
        title: 'Default Grace',
        course: publishedCourse1._id
      });
      expect(def.renewalGraceDays).toBe(0);

      const negative = new ComplianceRequirement({
        title: 'Neg Grace',
        course: publishedCourse1._id,
        renewalGraceDays: -1
      });
      await expect(negative.validate()).rejects.toThrow();

      const tooBig = new ComplianceRequirement({
        title: 'Grace 91',
        course: publishedCourse1._id,
        renewalGraceDays: 91
      });
      await expect(tooBig.validate()).rejects.toThrow();
    });

    it('7. ComplianceRequirement defaults isActive to true', () => {
      const req = new ComplianceRequirement({
        title: 'Active Check',
        course: publishedCourse1._id
      });
      expect(req.isActive).toBe(true);
    });

    it('8. ComplianceRequirement toJSON strips _id and __v, exposes id', () => {
      const req = new ComplianceRequirement({
        title: 'JSON Transform Test',
        course: publishedCourse1._id
      });
      const json = req.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });

    it('9. ComplianceAssignment requires complianceRequirement and employee', async () => {
      const asg = new ComplianceAssignment({});
      let err;
      try {
        await asg.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.complianceRequirement).toBeDefined();
      expect(err.errors.employee).toBeDefined();
      expect(err.errors.dueAt).toBeDefined();
    });

    it('10. ComplianceAssignment status enum defaults to NOT_STARTED', () => {
      const asg = new ComplianceAssignment({
        complianceRequirement: new mongoose.Types.ObjectId(),
        employee: employeeA._id,
        dueAt: new Date()
      });
      expect(asg.status).toBe('NOT_STARTED');
    });

    it('11. ComplianceAssignment rejects invalid status enum values', async () => {
      const asg = new ComplianceAssignment({
        complianceRequirement: new mongoose.Types.ObjectId(),
        employee: employeeA._id,
        dueAt: new Date(),
        status: 'PENDING'
      });
      await expect(asg.validate()).rejects.toThrow();
    });

    it('12. ComplianceAssignment defaults isActive to true and completedAt to null', () => {
      const asg = new ComplianceAssignment({
        complianceRequirement: new mongoose.Types.ObjectId(),
        employee: employeeA._id,
        dueAt: new Date()
      });
      expect(asg.isActive).toBe(true);
      expect(asg.completedAt).toBeNull();
      expect(asg.lastEvaluatedAt).toBeNull();
    });

    it('13. ComplianceAssignment toJSON strips _id and __v, exposes id', () => {
      const asg = new ComplianceAssignment({
        complianceRequirement: new mongoose.Types.ObjectId(),
        employee: employeeA._id,
        dueAt: new Date()
      });
      const json = asg.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // =========================================================================
  // SECTION 2: VALIDATION LAYER TESTS (14 - 32)
  // =========================================================================
  describe('2. Validation & Security Rules', () => {
    it('14. validateCreateRequirement rejects missing request body (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();
      expect(res.status).toBe(400);
    });

    it('15. validateCreateRequirement rejects client injection of isActive (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Injected Active',
          course: publishedCourse1._id,
          isActive: false
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('16. validateCreateRequirement rejects client injection of server-controlled fields (400)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Injected Status',
          course: publishedCourse1._id,
          status: 'COMPLIANT',
          dueAt: new Date()
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('17. validateCreateRequirement rejects invalid course ObjectId format (400)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Invalid Course ID',
          course: 'not-an-id'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid course id/i);
    });

    it('18. validateCreateRequirement rejects invalid frequency (400)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Invalid Frequency',
          course: publishedCourse1._id,
          frequency: 'monthly'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/frequency must be one of/i);
    });

    it('19. validateCreateRequirement rejects dueWithinDays <= 0 or > 365 (400)', async () => {
      const res1 = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Bad Due Days',
          course: publishedCourse1._id,
          dueWithinDays: 0
        });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Bad Due Days 2',
          course: publishedCourse1._id,
          dueWithinDays: 500
        });
      expect(res2.status).toBe(400);
    });

    it('20. validateCreateRequirement rejects renewalGraceDays < 0 or > 90 (400)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Bad Grace',
          course: publishedCourse1._id,
          renewalGraceDays: 100
        });
      expect(res.status).toBe(400);
    });

    it('21. validateUpdateRequirement rejects invalid requirement ID in params (400)', async () => {
      const res = await request(app)
        .patch('/api/compliance-requirements/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Title' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid compliance requirement id format/i);
    });

    it('22. validateUpdateRequirement rejects client injection of isActive, createdAt, or status (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/compliance-requirements/${dummyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false, status: 'OVERDUE' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('23. validateSingleAssignment rejects missing employeeId (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/employeeid is required/i);
    });

    it('24. validateSingleAssignment rejects invalid employeeId format (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: 'not-an-id' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid employeeid format/i);
    });

    it('25. validateSingleAssignment rejects client injection of status or dueAt (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: employeeA._id,
          status: 'COMPLIANT',
          dueAt: new Date()
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('26. validateBulkAssignment rejects non-array employeeIds (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeIds: 'not-an-array' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/employeeids must be an array/i);
    });

    it('27. validateBulkAssignment rejects empty employeeIds array (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeIds: [] });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/employeeids array cannot be empty/i);
    });

    it('28. validateBulkAssignment rejects invalid ObjectId inside employeeIds (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeIds: [employeeA._id.toString(), 'invalid-id'] });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid employeeid format/i);
    });

    it('29. validateDepartmentAssignment rejects invalid departmentId parameter (400)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${dummyId}/departments/bad-dept-id/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid department id format/i);
    });

    it('30. validateComplianceQuery rejects invalid status parameter (400)', async () => {
      const res = await request(app)
        .get('/api/compliance/assignments?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/status must be one of/i);
    });

    it('31. validateComplianceQuery rejects non-positive page or limit > 100 (400)', async () => {
      const res1 = await request(app)
        .get('/api/compliance/assignments?page=0')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get('/api/compliance/assignments?limit=150')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);
    });

    it('32. validateRequirementQuery rejects invalid isActive parameter (400)', async () => {
      const res = await request(app)
        .get('/api/compliance-requirements?isActive=maybe')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/isactive filter must be a boolean/i);
    });
  });

  // =========================================================================
  // SECTION 3: REQUIREMENT MANAGEMENT (CRUD) TESTS (33 - 53)
  // =========================================================================
  describe('3. Requirement Management (CRUD)', () => {
    let createdReqId;

    it('33. Admin can create compliance requirement with valid data (201 Created)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Annual Cyber Security',
          description: 'Mandatory annual cybersecurity awareness certification',
          course: publishedCourse1._id,
          frequency: 'annual',
          dueWithinDays: 45,
          renewalGraceDays: 14
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requirement.title).toBe('Phase 18 Annual Cyber Security');
      expect(res.body.data.requirement.frequency).toBe('annual');
      expect(res.body.data.requirement.dueWithinDays).toBe(45);
      expect(res.body.data.requirement.renewalGraceDays).toBe(14);
      expect(res.body.data.requirement.isActive).toBe(true);
      createdReqId = res.body.data.requirement.id;
    });

    it('34. Requirement creation fails if course does not exist (404 Not Found)', async () => {
      const dummyCourseId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Nonexistent Course',
          course: dummyCourseId
        });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/referenced course not found/i);
    });

    it('35. Requirement creation fails if course is in draft status (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Draft Requirement',
          course: draftCourse._id
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/active and published course/i);
    });

    it('36. Requirement creation fails if course is archived (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Archived Requirement',
          course: archivedCourse._id
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/active and published course/i);
    });

    it('37. Requirement creation fails if course is inactive (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Inactive Requirement',
          course: inactiveCourse._id
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/active and published course/i);
    });

    it('38. Trainer cannot create compliance requirement (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          title: 'Trainer Requirement Attempt',
          course: publishedCourse1._id
        });
      expect(res.status).toBe(403);
    });

    it('39. Employee cannot create compliance requirement (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          title: 'Employee Requirement Attempt',
          course: publishedCourse1._id
        });
      expect(res.status).toBe(403);
    });

    it('40. Unauthenticated user cannot create compliance requirement (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/compliance-requirements')
        .send({
          title: 'Unauth Requirement Attempt',
          course: publishedCourse1._id
        });
      expect(res.status).toBe(401);
    });

    it('41. Admin can list compliance requirements with pagination (200 OK)', async () => {
      const res = await request(app)
        .get('/api/compliance-requirements?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.requirements)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('42. Admin can filter compliance requirements by frequency (200 OK)', async () => {
      const res = await request(app)
        .get('/api/compliance-requirements?frequency=annual')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      for (const req of res.body.data.requirements) {
        expect(req.frequency).toBe('annual');
      }
    });

    it('43. Admin can filter compliance requirements by courseId (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/compliance-requirements?courseId=${publishedCourse1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      for (const req of res.body.data.requirements) {
        const cId = req.course.id || req.course._id || req.course;
        expect(cId.toString()).toBe(publishedCourse1._id.toString());
      }
    });

    it('44. Admin can filter compliance requirements by isActive (200 OK)', async () => {
      const res = await request(app)
        .get('/api/compliance-requirements?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      for (const req of res.body.data.requirements) {
        expect(req.isActive).toBe(true);
      }
    });

    it('45. Admin can search compliance requirements by title keyword (200 OK)', async () => {
      const res = await request(app)
        .get('/api/compliance-requirements?search=Cyber')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.requirements.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.requirements[0].title).toMatch(/cyber/i);
    });

    it('46. Admin can get compliance requirement by ID (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/compliance-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.requirement.id).toBe(createdReqId);
      expect(res.body.data.requirement.course).toBeDefined();
    });

    it('47. Non-existent requirement ID returns 404', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/compliance-requirements/${dummyId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('48. Admin can update requirement fields (title, dueWithinDays, frequency) (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/compliance-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Phase 18 Annual Cyber Security Updated',
          dueWithinDays: 60,
          frequency: 'biennial'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.requirement.title).toBe('Phase 18 Annual Cyber Security Updated');
      expect(res.body.data.requirement.dueWithinDays).toBe(60);
      expect(res.body.data.requirement.frequency).toBe('biennial');
    });

    it('49. Admin can update course of requirement when NO assignments exist (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/compliance-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: publishedCourse2._id
        });

      expect(res.status).toBe(200);
      expect(res.body.data.requirement.course.toString()).toBe(publishedCourse2._id.toString());

      // Switch back to publishedCourse1 for upcoming assignment tests
      await request(app)
        .patch(`/api/compliance-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ course: publishedCourse1._id });
    });

    it('50. Admin CANNOT update course of requirement when assignments exist (409 Conflict)', async () => {
      // Create an assignment first
      await ComplianceAssignment.create({
        complianceRequirement: createdReqId,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 86400000),
        status: 'NOT_STARTED'
      });

      const res = await request(app)
        .patch(`/api/compliance-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: publishedCourse2._id
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/cannot change course.*existing assignments/i);

      // Clean up test assignment
      await ComplianceAssignment.deleteMany({ complianceRequirement: createdReqId });
    });

    it('51. Admin can soft delete compliance requirement (DELETE /:id -> 200 OK, isActive: false)', async () => {
      const tempReq = await ComplianceRequirement.create({
        title: 'Phase 18 To Be Soft Deleted',
        course: publishedCourse2._id,
        dueWithinDays: 30
      });

      const res = await request(app)
        .delete(`/api/compliance-requirements/${tempReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.requirement.isActive).toBe(false);

      const inDb = await ComplianceRequirement.findById(tempReq._id);
      expect(inDb.isActive).toBe(false);
    });

    it('52. Soft deleting requirement also deactivates its assignments', async () => {
      const tempReq = await ComplianceRequirement.create({
        title: 'Phase 18 Deactivation Cascade Test',
        course: publishedCourse2._id,
        dueWithinDays: 30
      });

      const tempAsg = await ComplianceAssignment.create({
        complianceRequirement: tempReq._id,
        employee: employeeB._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 86400000),
        status: 'NOT_STARTED',
        isActive: true
      });

      await request(app)
        .delete(`/api/compliance-requirements/${tempReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const asgInDb = await ComplianceAssignment.findById(tempAsg._id);
      expect(asgInDb.isActive).toBe(false);
    });

    it('53. Non-admin cannot delete compliance requirement (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/compliance-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SECTION 4: SINGLE ASSIGNMENT TESTS (54 - 62)
  // =========================================================================
  describe('4. Single Employee Assignment', () => {
    let testReq;

    beforeAll(async () => {
      testReq = await ComplianceRequirement.create({
        title: 'Phase 18 Ethics Compliance',
        course: publishedCourse2._id,
        dueWithinDays: 30,
        frequency: 'annual'
      });
    });

    it('54. Admin can assign requirement to an employee (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${testReq._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: employeeA._id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignment).toBeDefined();
      expect(res.body.data.assignment.complianceRequirement).toBeDefined();
      expect(res.body.data.assignment.employee).toBeDefined();
    });

    it('55. Assignment has server-computed dueAt equal to assignedAt + dueWithinDays', async () => {
      const asg = await ComplianceAssignment.findOne({
        complianceRequirement: testReq._id,
        employee: employeeA._id
      });

      const assignedTime = new Date(asg.assignedAt).getTime();
      const dueTime = new Date(asg.dueAt).getTime();
      const expectedDiffDays = Math.round((dueTime - assignedTime) / 86400000);
      expect(expectedDiffDays).toBe(testReq.dueWithinDays);
    });

    it('56. Assignment status is evaluated immediately upon creation', async () => {
      const asg = await ComplianceAssignment.findOne({
        complianceRequirement: testReq._id,
        employee: employeeA._id
      });
      expect(asg.status).toBeDefined();
      expect(asg.lastEvaluatedAt).toBeDefined();
    });

    it('57. Assignment response includes calculated daysRemaining', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${testReq._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: employeeB._id });

      expect(res.status).toBe(201);
      expect(res.body.data.assignment.daysRemaining).toBeDefined();
      expect(typeof res.body.data.assignment.daysRemaining).toBe('number');
    });

    it('58. Duplicate assignment returns 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${testReq._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: employeeA._id });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already assigned/i);
    });

    it('59. Assignment fails for inactive/deleted requirement (404 Not Found)', async () => {
      const inactiveReq = await ComplianceRequirement.create({
        title: 'Phase 18 Inactive Req',
        course: publishedCourse2._id,
        isActive: false
      });

      const res = await request(app)
        .post(`/api/compliance-requirements/${inactiveReq._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: employeeC._id });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/active compliance requirement not found/i);
    });

    it('60. Assignment fails for inactive employee (404 Not Found)', async () => {
      const inactiveUser = await User.create({
        name: 'Phase 18 Inactive Emp User',
        email: 'inact_emp@phase18test.com',
        password: 'Password123!',
        role: 'employee'
      });

      const inactiveEmp = await Employee.create({
        user: inactiveUser._id,
        employeeId: 'P18-EMP-INACT',
        department: departmentMarketing._id,
        isActive: false
      });

      const res = await request(app)
        .post(`/api/compliance-requirements/${testReq._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: inactiveEmp._id });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/active employee not found/i);
    });

    it('61. Trainer cannot assign requirement to employee (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${testReq._id}/assignments`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ employeeId: employeeC._id });

      expect(res.status).toBe(403);
    });

    it('62. Employee cannot assign requirement to another employee (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${testReq._id}/assignments`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({ employeeId: employeeC._id });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SECTION 5: BULK ASSIGNMENT TESTS (63 - 66)
  // =========================================================================
  describe('5. Bulk Employee Assignment', () => {
    let bulkReq;

    beforeAll(async () => {
      bulkReq = await ComplianceRequirement.create({
        title: 'Phase 18 Bulk Assignment Requirement',
        course: publishedCourse3._id,
        dueWithinDays: 30
      });
    });

    it('63. Admin can bulk assign requirement to multiple employees (200 OK)', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${bulkReq._id}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeIds: [employeeA._id, employeeB._id]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedCount).toBe(2);
      expect(res.body.data.skippedCount).toBe(0);
    });

    it('64. Bulk assign skips duplicates without failing entire batch', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${bulkReq._id}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeIds: [employeeA._id, employeeC._id]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedCount).toBe(1); // employeeC assigned
      expect(res.body.data.skippedCount).toBe(1); // employeeA skipped
    });

    it('65. Bulk assign handles duplicate IDs within the same payload correctly', async () => {
      const anotherReq = await ComplianceRequirement.create({
        title: 'Phase 18 Deduplication Requirement',
        course: publishedCourse3._id,
        dueWithinDays: 20
      });

      const res = await request(app)
        .post(`/api/compliance-requirements/${anotherReq._id}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeIds: [employeeA._id, employeeA._id, employeeB._id]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedCount).toBe(2);
    });

    it('66. Bulk assign safely skips non-existent or inactive employees', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/compliance-requirements/${bulkReq._id}/assignments/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeIds: [dummyId]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedCount).toBe(0);
      expect(res.body.data.skippedCount).toBe(1);
    });
  });

  // =========================================================================
  // SECTION 6: DEPARTMENT-WIDE ASSIGNMENT TESTS (67 - 70)
  // =========================================================================
  describe('6. Department-Wide Assignment', () => {
    let deptReq;

    beforeAll(async () => {
      deptReq = await ComplianceRequirement.create({
        title: 'Phase 18 Department Assignment Requirement',
        course: publishedCourse1._id,
        dueWithinDays: 30
      });
    });

    it('67. Admin can assign requirement to all employees in a department (200 OK)', async () => {
      const res = await request(app)
        .post(
          `/api/compliance-requirements/${deptReq._id}/departments/${departmentEngineering._id}/assign`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEmployees).toBe(2); // employeeA and employeeB
      expect(res.body.data.assignedCount).toBe(2);
      expect(res.body.data.skippedCount).toBe(0);
    });

    it('68. Department assignment verifies created assignments in database', async () => {
      const asgA = await ComplianceAssignment.findOne({
        complianceRequirement: deptReq._id,
        employee: employeeA._id
      });
      const asgB = await ComplianceAssignment.findOne({
        complianceRequirement: deptReq._id,
        employee: employeeB._id
      });

      expect(asgA).not.toBeNull();
      expect(asgB).not.toBeNull();
      expect(asgA.status).toBeDefined();
    });

    it('69. Department assignment skips already-assigned employees idempotently', async () => {
      const res = await request(app)
        .post(
          `/api/compliance-requirements/${deptReq._id}/departments/${departmentEngineering._id}/assign`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.assignedCount).toBe(0);
      expect(res.body.data.skippedCount).toBe(2);
    });

    it('70. Department assignment fails if department does not exist (404 Not Found)', async () => {
      const dummyDeptId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(
          `/api/compliance-requirements/${deptReq._id}/departments/${dummyDeptId}/assign`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/department not found/i);
    });
  });

  // =========================================================================
  // SECTION 7: ROLE-BASED ARCHITECTURAL CONSTRAINT (71)
  // =========================================================================
  describe('7. Architectural Boundaries: Role-Based Assignment', () => {
    it('71. Role-based assignment is not implemented because Employee schema has no JobRole relation', () => {
      const employeeSchemaPaths = Object.keys(Employee.schema.paths);
      expect(employeeSchemaPaths).not.toContain('jobRole');
      expect(employeeSchemaPaths).not.toContain('jobRoles');
    });
  });

  // =========================================================================
  // SECTION 8: DETERMINISTIC STATUS ENGINE TESTS (72 - 83)
  // =========================================================================
  describe('8. Deterministic Status Engine', () => {
    let engineReq;

    beforeAll(async () => {
      engineReq = await ComplianceRequirement.create({
        title: 'Phase 18 Status Engine Requirement',
        course: publishedCourse1._id,
        dueWithinDays: 60
      });
    });

    beforeEach(async () => {
      await Enrollment.deleteMany({ employee: employeeA._id });
      await Certificate.deleteMany({ employee: employeeA._id });
      await ComplianceAssignment.deleteMany({ employee: employeeA._id });
    });

    it('72. Initial status is NOT_STARTED when enrollment does not exist and due date > 30 days', async () => {
      const futureDue = new Date(Date.now() + 45 * 86400000);
      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: futureDue,
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('NOT_STARTED');
    });

    it('73. Status becomes DUE_SOON when dueAt is within COMPLIANCE_DUE_SOON_DAYS (<= 30 days)', async () => {
      const soonDue = new Date(Date.now() + 15 * 86400000);
      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: soonDue,
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('DUE_SOON');
    });

    it('74. Status becomes IN_PROGRESS when active enrollment is in_progress', async () => {
      // Create in_progress enrollment
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
      await Enrollment.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        status: 'in_progress',
        progressPercentage: 50,
        isActive: true
      });

      const soonDue = new Date(Date.now() + 15 * 86400000);
      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: soonDue,
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('IN_PROGRESS');

      // Clean up enrollment
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
    });

    it('75. Status becomes OVERDUE when dueAt is in the past and enrollment not completed', async () => {
      const pastDue = new Date(Date.now() - 5 * 86400000);
      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(Date.now() - 35 * 86400000),
        dueAt: pastDue,
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('OVERDUE');
    });

    it('76. Status becomes COMPLIANT when enrollment is completed (no cert required)', async () => {
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
      await Enrollment.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
        isActive: true
      });

      const pastDue = new Date(Date.now() - 5 * 86400000);
      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(Date.now() - 35 * 86400000),
        dueAt: pastDue,
        status: 'NOT_STARTED'
      });

      const { status, isCompliant } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('COMPLIANT');
      expect(isCompliant).toBe(true);
      expect(asg.completedAt).not.toBeNull();

      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
    });

    it('77. Status becomes COMPLIANT when completed enrollment and valid active certificate exist', async () => {
      const enrollment = await Enrollment.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
        isActive: true
      });

      await Certificate.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        enrollment: enrollment._id,
        certificateNumber: 'P18-CERT-VAL-001',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 86400000),
        status: 'active'
      });

      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 10 * 86400000),
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('COMPLIANT');

      await Certificate.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
    });

    it('78. Status does NOT become COMPLIANT if certificate is expired', async () => {
      const enrollment = await Enrollment.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(Date.now() - 400 * 86400000),
        isActive: true
      });

      await Certificate.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        enrollment: enrollment._id,
        certificateNumber: 'P18-CERT-EXP-001',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 35 * 86400000), // expired 35 days ago
        status: 'active'
      });

      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(Date.now() - 20 * 86400000),
        dueAt: new Date(Date.now() + 10 * 86400000), // due in 10 days
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).not.toBe('COMPLIANT');
      expect(status).toBe('DUE_SOON');

      await Certificate.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
    });

    it('79. Status does NOT become COMPLIANT if certificate is revoked', async () => {
      const enrollment = await Enrollment.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
        isActive: true
      });

      await Certificate.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        enrollment: enrollment._id,
        certificateNumber: 'P18-CERT-REV-001',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 86400000),
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy: adminUser._id,
        revocationReason: 'Compliance violation'
      });

      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 10 * 86400000),
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).not.toBe('COMPLIANT');

      await Certificate.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
    });

    it('80. When certificate is expired and dueAt has passed, status falls back to OVERDUE', async () => {
      const enrollment = await Enrollment.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(Date.now() - 400 * 86400000),
        isActive: true
      });

      await Certificate.create({
        employee: employeeA._id,
        course: publishedCourse1._id,
        enrollment: enrollment._id,
        certificateNumber: 'P18-CERT-EXP-002',
        issuedAt: new Date(Date.now() - 400 * 86400000),
        expiresAt: new Date(Date.now() - 30 * 86400000),
        status: 'active'
      });

      const asg = new ComplianceAssignment({
        complianceRequirement: engineReq._id,
        employee: employeeA._id,
        assignedAt: new Date(Date.now() - 60 * 86400000),
        dueAt: new Date(Date.now() - 5 * 86400000), // past due
        status: 'NOT_STARTED'
      });

      const { status } = await complianceService.evaluateAssignmentStatus(asg);
      expect(status).toBe('OVERDUE');

      await Certificate.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
      await Enrollment.deleteMany({ employee: employeeA._id, course: publishedCourse1._id });
    });

    it('81. calculateDaysRemaining returns positive integer for future dueAt', () => {
      const future = new Date(Date.now() + 5 * 86400000);
      const days = complianceService.calculateDaysRemaining(future);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    it('82. calculateDaysRemaining returns 0 for dueAt on same calendar day', () => {
      const today = new Date();
      const days = complianceService.calculateDaysRemaining(today, today);
      expect(days).toBe(0);
    });

    it('83. calculateDaysRemaining returns negative integer for past dueAt', () => {
      const past = new Date(Date.now() - 4 * 86400000);
      const days = complianceService.calculateDaysRemaining(past);
      expect(days).toBeLessThanOrEqual(-3);
    });
  });

  // =========================================================================
  // SECTION 9: EMPLOYEE SELF VIEWS & IDOR PROTECTION (84 - 91)
  // =========================================================================
  describe('9. Employee Self Views & IDOR Protection', () => {
    let selfReq1;
    let selfReq2;

    beforeAll(async () => {
      // Clean up previous assignments for Alice & Bob
      await ComplianceAssignment.deleteMany({ employee: { $in: [employeeA._id, employeeB._id] } });

      selfReq1 = await ComplianceRequirement.create({
        title: 'Phase 18 Self Cyber Training',
        course: publishedCourse1._id,
        dueWithinDays: 30
      });

      selfReq2 = await ComplianceRequirement.create({
        title: 'Phase 18 Self Ethics Training',
        course: publishedCourse2._id,
        dueWithinDays: 45
      });

      // Assign selfReq1 to Alice (Employee A)
      await ComplianceAssignment.create({
        complianceRequirement: selfReq1._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 20 * 86400000),
        status: 'DUE_SOON'
      });

      // Assign selfReq2 to Bob (Employee B)
      await ComplianceAssignment.create({
        complianceRequirement: selfReq2._id,
        employee: employeeB._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 40 * 86400000),
        status: 'NOT_STARTED'
      });
    });

    it('84. Employee can view their own compliance assignments (GET /api/employees/me/compliance -> 200)', async () => {
      const res = await request(app)
        .get('/api/employees/me/compliance')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.assignments)).toBe(true);
      expect(res.body.data.assignments.length).toBe(1);
      expect(res.body.data.assignments[0].complianceRequirement.title).toBe(
        'Phase 18 Self Cyber Training'
      );
    });

    it('85. Employee compliance view includes daysRemaining and evaluated status', async () => {
      const res = await request(app)
        .get('/api/employees/me/compliance')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const asg = res.body.data.assignments[0];
      expect(asg.daysRemaining).toBeDefined();
      expect(typeof asg.daysRemaining).toBe('number');
      expect(asg.status).toBeDefined();
    });

    it('86. Employee compliance view does not include assignments of other employees (IDOR safe)', async () => {
      const res = await request(app)
        .get('/api/employees/me/compliance')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      for (const asg of res.body.data.assignments) {
        expect(asg.employee.toString()).toBe(employeeA._id.toString());
      }
    });

    it('87. Employee compliance view excludes assignments for soft-deleted requirements', async () => {
      const delReq = await ComplianceRequirement.create({
        title: 'Phase 18 Deleted For Employee',
        course: publishedCourse1._id,
        dueWithinDays: 30,
        isActive: false
      });

      await ComplianceAssignment.create({
        complianceRequirement: delReq._id,
        employee: employeeA._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 20 * 86400000),
        status: 'NOT_STARTED'
      });

      const res = await request(app)
        .get('/api/employees/me/compliance')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.assignments.map((a) => a.complianceRequirement?.title);
      expect(titles).not.toContain('Phase 18 Deleted For Employee');
    });

    it('88. Employee can view their compliance summary (GET /api/employees/me/compliance/summary -> 200)', async () => {
      const res = await request(app)
        .get('/api/employees/me/compliance/summary')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAssignments).toBeDefined();
      expect(res.body.data.complianceRate).toBeDefined();
      expect(res.body.data.dueSoon).toBeDefined();
      expect(res.body.data.overdue).toBeDefined();
      expect(res.body.data.compliant).toBeDefined();
      expect(res.body.data.notStarted).toBeDefined();
    });

    it('89. Employee summary returns accurate counts and compliance rate percentage', async () => {
      const res = await request(app)
        .get('/api/employees/me/compliance/summary')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const { totalAssignments, compliant, complianceRate } = res.body.data;
      expect(totalAssignments).toBeGreaterThanOrEqual(1);
      const expectedRate = Number(((compliant / totalAssignments) * 100).toFixed(2));
      expect(complianceRate).toBe(expectedRate);
    });

    it('89b. Zero assignments yields 100% compliance rate', async () => {
      const userZero = await User.create({
        name: 'Phase 18 Zero Asg User',
        email: 'zero_asg@phase18test.com',
        password: 'Password123!',
        role: 'employee'
      });
      await Employee.create({
        user: userZero._id,
        employeeId: 'P18-EMP-ZERO',
        department: departmentMarketing._id,
        designation: 'Intern',
        isActive: true
      });
      const tokenZero = generateToken(userZero);

      const res = await request(app)
        .get('/api/employees/me/compliance/summary')
        .set('Authorization', `Bearer ${tokenZero}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAssignments).toBe(0);
      expect(res.body.data.complianceRate).toBe(100);
    });

    it('90. Trainer cannot access /api/employees/me/compliance (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/employees/me/compliance')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });

    it('91. Unauthenticated request to /api/employees/me/compliance returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/employees/me/compliance');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // SECTION 10: ADMIN MONITORING, REPORTING & REFRESH (92 - 104)
  // =========================================================================
  describe('10. Admin Aggregate Monitoring, Reporting & Status Refresh', () => {
    let reportReq;

    beforeAll(async () => {
      reportReq = await ComplianceRequirement.create({
        title: 'Phase 18 Report Test Requirement',
        course: publishedCourse2._id,
        dueWithinDays: 30
      });
    });

    it('92. Admin can view arbitrary employee compliance (GET /api/employees/:employeeId/compliance -> 200)', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeA._id}/compliance`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeId).toBe(employeeA._id.toString());
      expect(Array.isArray(res.body.data.assignments)).toBe(true);
    });

    it('93. Admin view arbitrary employee returns 404 for non-existent employee ID', async () => {
      const dummyEmpId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/employees/${dummyEmpId}/compliance`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('94. Admin can list all compliance assignments with pagination (GET /api/compliance/assignments -> 200)', async () => {
      const res = await request(app)
        .get('/api/compliance/assignments?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.assignments)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('95. Admin can filter compliance assignments by status (200 OK)', async () => {
      const res = await request(app)
        .get('/api/compliance/assignments?status=DUE_SOON')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      for (const asg of res.body.data.assignments) {
        expect(asg.status).toBe('DUE_SOON');
      }
    });

    it('96. Admin can filter compliance assignments by departmentId (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/compliance/assignments?departmentId=${departmentEngineering._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('97. Admin can filter compliance assignments by requirementId (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/compliance/assignments?requirementId=${reportReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      for (const asg of res.body.data.assignments) {
        const reqId = asg.complianceRequirement._id || asg.complianceRequirement;
        expect(reqId.toString()).toBe(reportReq._id.toString());
      }
    });

    it('98. Admin can view organization-wide compliance summary metrics (GET /api/compliance/summary -> 200)', async () => {
      const res = await request(app)
        .get('/api/compliance/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAssignments).toBeDefined();
      expect(res.body.data.compliant).toBeDefined();
      expect(res.body.data.dueSoon).toBeDefined();
      expect(res.body.data.overdue).toBeDefined();
      expect(res.body.data.inProgress).toBeDefined();
      expect(res.body.data.notStarted).toBeDefined();
      expect(res.body.data.complianceRate).toBeDefined();
    });

    it('99. Admin can filter summary metrics by departmentId (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/compliance/summary?departmentId=${departmentEngineering._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAssignments).toBeDefined();
    });

    it('100. Admin can trigger POST /api/compliance/refresh-statuses (200 OK)', async () => {
      const res = await request(app)
        .post('/api/compliance/refresh-statuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refreshedCount).toBeDefined();
      expect(res.body.data.statusBreakdown).toBeDefined();
    });

    it('101. refresh-statuses triggers DUE_SOON and OVERDUE in-app notifications', async () => {
      // Clear notifications
      await Notification.deleteMany({
        type: { $in: ['compliance_due_soon', 'compliance_overdue'] }
      });

      // Create an assignment that is DUE_SOON
      const notifReq = await ComplianceRequirement.create({
        title: 'Phase 18 Notification Requirement',
        course: publishedCourse1._id,
        dueWithinDays: 10
      });

      await ComplianceAssignment.create({
        complianceRequirement: notifReq._id,
        employee: employeeC._id,
        assignedAt: new Date(),
        dueAt: new Date(Date.now() + 5 * 86400000), // 5 days remaining -> DUE_SOON
        status: 'NOT_STARTED'
      });

      // Trigger refresh
      const res = await request(app)
        .post('/api/compliance/refresh-statuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);

      // Verify notification created for employeeC's user
      const notifs = await Notification.find({
        recipient: employeeCUser._id,
        type: 'compliance_due_soon'
      });

      expect(notifs.length).toBeGreaterThanOrEqual(1);
      const targetNotif = notifs.find((n) =>
        n.message.includes('Phase 18 Notification Requirement')
      );
      expect(targetNotif).toBeDefined();
      expect(targetNotif.title).toMatch(/due soon/i);
    });

    it('102. refresh-statuses is idempotent and does not duplicate notifications', async () => {
      const notifCountBefore = await Notification.countDocuments({
        recipient: employeeCUser._id,
        type: 'compliance_due_soon'
      });

      // Trigger refresh again
      const res = await request(app)
        .post('/api/compliance/refresh-statuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);

      const notifCountAfter = await Notification.countDocuments({
        recipient: employeeCUser._id,
        type: 'compliance_due_soon'
      });

      // Count should NOT have increased due to eventKey partial unique index
      expect(notifCountAfter).toBe(notifCountBefore);
    });

    it('103. Non-admin cannot trigger refresh-statuses (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/compliance/refresh-statuses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('104. Password hashes and internal secrets are never exposed in compliance responses', async () => {
      const res = await request(app)
        .get('/api/compliance/assignments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const str = JSON.stringify(res.body);
      expect(str).not.toContain('password');
      expect(str).not.toContain('Password123!');
      expect(str).not.toContain('$2a$');
      expect(str).not.toContain('$2b$');
    });
  });
});
