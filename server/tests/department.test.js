const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Department = require('../src/models/Department');
const User = require('../src/models/User');
const config = require('../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Department Management Tests (Phase 6)', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Department.syncIndexes();
    await User.deleteMany({});
    await Department.deleteMany({});

    // Seed test users once
    const adminUser = await User.create({
      name: 'Department Admin',
      email: 'dept_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    const trainerUser = await User.create({
      name: 'Department Trainer',
      email: 'dept_trainer@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    const employeeUser = await User.create({
      name: 'Department Employee',
      email: 'dept_employee@example.com',
      password: 'Password123',
      role: 'employee'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: adminUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    trainerToken = jwt.sign(
      { userId: trainerUser._id.toString(), role: trainerUser.role },
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
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // DEPARTMENT MODEL UNIT TESTS (Tests 1 - 6)
  // ==========================================
  describe('Department Model Unit Tests', () => {
    beforeAll(async () => {
      await Department.syncIndexes();
    });

    afterEach(async () => {
      await Department.deleteMany({});
    });

    // Test 1: Successful creation with valid fields
    it('Test 1: Creates a department with valid name and description', async () => {
      const dept = await Department.create({
        name: 'Engineering',
        description: 'Software development department'
      });

      expect(dept._id).toBeDefined();
      expect(dept.name).toBe('Engineering');
      expect(dept.description).toBe('Software development department');
      expect(dept.isActive).toBe(true);
    });

    // Test 2: Required name validation
    it('Test 2: Validation fails when department name is missing or empty', async () => {
      await expect(Department.create({ description: 'No name' })).rejects.toThrow();
      await expect(Department.create({ name: '   ', description: 'Empty name' })).rejects.toThrow();
    });

    // Test 3: Name length validation
    it('Test 3: Validation fails when department name is too short (<2 chars) or too long (>100 chars)', async () => {
      await expect(Department.create({ name: 'A' })).rejects.toThrow();
      await expect(Department.create({ name: 'A'.repeat(101) })).rejects.toThrow();
    });

    // Test 4: Name trimming and duplicate prevention
    it('Test 4: Automatically trims whitespace and rejects duplicate names', async () => {
      await Department.create({ name: '  Human Resources  ' });

      // Creating exact or case-equivalent duplicate should fail via index or schema
      await expect(
        Department.create({ name: 'Human Resources' })
      ).rejects.toThrow();
    });

    // Test 5: Default isActive is true
    it('Test 5: Sets isActive to true by default', async () => {
      const dept = await Department.create({ name: 'Finance' });
      expect(dept.isActive).toBe(true);
    });

    // Test 6: Timestamps and JSON transformations
    it('Test 6: Includes createdAt, updatedAt and transforms _id to id in JSON output', async () => {
      const dept = await Department.create({ name: 'Marketing' });
      expect(dept.createdAt).toBeDefined();
      expect(dept.updatedAt).toBeDefined();

      const json = dept.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ==========================================
  // DEPARTMENT API TESTS (Tests 15 - 27)
  // ==========================================
  describe('Department API Integration Tests', () => {
    let testDeptId;

    beforeEach(async () => {
      await Department.deleteMany({});
      const dept = await Department.create({
        name: 'Product Design',
        description: 'UI/UX and Product Team'
      });
      testDeptId = dept._id.toString();
    });

    // Test 15: Admin can create department
    it('Test 15: Admin can create department (POST /api/departments -> 201)', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Quality Assurance',
          description: 'Testing and automation team'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.department.name).toBe('Quality Assurance');
      expect(response.body.data.department.isActive).toBe(true);
    });

    // Test 16: Creation fails with duplicate department name
    it('Test 16: Creation fails with 400 when department name already exists', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'product design' // Case-insensitive duplicate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists/i);
    });

    // Test 17: Creation fails with missing/invalid department name
    it('Test 17: Creation fails with 400 when name is missing or invalid', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: ' '
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/validation failed/i);
    });

    // Test 18: Trainer cannot create department
    it('Test 18: Trainer cannot create department (POST /api/departments -> 403)', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Operations'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 19: Employee cannot create department
    it('Test 19: Employee cannot create department (POST /api/departments -> 403)', async () => {
      const response = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Security'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 20: Unauthenticated request cannot create department
    it('Test 20: Unauthenticated request cannot create department (POST /api/departments -> 401)', async () => {
      const response = await request(app)
        .post('/api/departments')
        .send({
          name: 'Legal'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Test 21: Admin can list departments
    it('Test 21: Admin can list all departments (GET /api/departments -> 200)', async () => {
      const response = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.departments)).toBe(true);
      expect(response.body.data.departments.length).toBeGreaterThanOrEqual(1);
    });

    // Test 22: Trainer can list departments
    it('Test 22: Trainer can list all departments (GET /api/departments -> 200)', async () => {
      const response = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.departments)).toBe(true);
    });

    // Test 23: Employee cannot list departments
    it('Test 23: Employee cannot list departments (GET /api/departments -> 403)', async () => {
      const response = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 24: Admin or Trainer can get department by ID
    it('Test 24: Admin and Trainer can retrieve a department by ID (GET /api/departments/:id -> 200)', async () => {
      const adminRes = await request(app)
        .get(`/api/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.department.name).toBe('Product Design');

      const trainerRes = await request(app)
        .get(`/api/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(trainerRes.body.success).toBe(true);
    });

    // Test 25: Admin can update department
    it('Test 25: Admin can update department details (PATCH /api/departments/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product Design & Research',
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.department.name).toBe('Product Design & Research');
      expect(response.body.data.department.description).toBe('Updated description');
    });

    // Test 26: Trainer cannot update department
    it('Test 26: Trainer cannot update department (PATCH /api/departments/:id -> 403)', async () => {
      const response = await request(app)
        .patch(`/api/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Trainer Renamed Dept'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 27: Admin can soft delete department
    it('Test 27: Admin can soft delete department (DELETE /api/departments/:id -> 200, isActive: false)', async () => {
      const response = await request(app)
        .delete(`/api/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.department.isActive).toBe(false);

      // Verify in database that it still exists but isActive is false
      const inDb = await Department.findById(testDeptId);
      expect(inDb).not.toBeNull();
      expect(inDb.isActive).toBe(false);
    });
  });
});
