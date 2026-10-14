const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const config = require('../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Employee Management & Self-Profile Tests (Phase 6)', () => {
  let adminToken;
  let trainerToken;
  let employeeUser1;
  let employeeToken1;
  let employeeUser2;
  let employeeToken2;
  let activeDepartment;
  let inactiveDepartment;
  let inactiveUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await Employee.syncIndexes();
    await User.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});

    // Seed test users
    const adminUser = await User.create({
      name: 'Emp Admin',
      email: 'emp_admin@example.com',
      password: 'Password123',
      role: 'admin'
    });

    const trainerUser = await User.create({
      name: 'Emp Trainer',
      email: 'emp_trainer@example.com',
      password: 'Password123',
      role: 'trainer'
    });

    employeeUser1 = await User.create({
      name: 'Emp One',
      email: 'emp_one@example.com',
      password: 'Password123',
      role: 'employee'
    });

    employeeUser2 = await User.create({
      name: 'Emp Two',
      email: 'emp_two@example.com',
      password: 'Password123',
      role: 'employee'
    });

    inactiveUser = await User.create({
      name: 'Inactive Person',
      email: 'inactive@example.com',
      password: 'Password123',
      role: 'employee',
      isActive: false
    });

    // Seed test departments
    activeDepartment = await Department.create({
      name: 'Core Engineering',
      description: 'Core dev department',
      isActive: true
    });

    inactiveDepartment = await Department.create({
      name: 'Deprecated Dept',
      description: 'Inactive department',
      isActive: false
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

    employeeToken1 = jwt.sign(
      { userId: employeeUser1._id.toString(), role: employeeUser1.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    employeeToken2 = jwt.sign(
      { userId: employeeUser2._id.toString(), role: employeeUser2.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // EMPLOYEE MODEL UNIT TESTS (Tests 7 - 14)
  // ==========================================
  describe('Employee Model Unit Tests', () => {
    let dummyUser;
    let dummyDept;

    beforeAll(async () => {
      await Employee.syncIndexes();
      dummyUser = await User.create({
        name: 'Model Dummy',
        email: 'model_dummy@example.com',
        password: 'Password123'
      });
      dummyDept = await Department.create({
        name: 'Model Test Dept'
      });
    });

    afterEach(async () => {
      await Employee.deleteMany({});
    });

    afterAll(async () => {
      await User.deleteOne({ _id: dummyUser._id });
      await Department.deleteOne({ _id: dummyDept._id });
    });

    // Test 7: Successful creation with valid fields
    it('Test 7: Creates an employee with valid fields', async () => {
      const emp = await Employee.create({
        user: dummyUser._id,
        employeeId: 'EMP-001',
        department: dummyDept._id,
        designation: 'Senior Engineer',
        phone: '+1234567890',
        dateOfJoining: new Date('2025-01-15')
      });

      expect(emp._id).toBeDefined();
      expect(emp.employeeId).toBe('EMP-001');
      expect(emp.designation).toBe('Senior Engineer');
      expect(emp.isActive).toBe(true);
    });

    // Test 8: Required user reference
    it('Test 8: Validation fails when user reference is missing', async () => {
      await expect(
        Employee.create({
          employeeId: 'EMP-002',
          department: dummyDept._id
        })
      ).rejects.toThrow();
    });

    // Test 9: Required department reference
    it('Test 9: Validation fails when department reference is missing', async () => {
      await expect(
        Employee.create({
          user: dummyUser._id,
          employeeId: 'EMP-003'
        })
      ).rejects.toThrow();
    });

    // Test 10: Required employeeId
    it('Test 10: Validation fails when employeeId is missing', async () => {
      await expect(
        Employee.create({
          user: dummyUser._id,
          department: dummyDept._id
        })
      ).rejects.toThrow();
    });

    // Test 11: Unique employeeId constraint
    it('Test 11: Duplicate employeeId is rejected by unique index', async () => {
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'Password123'
      });

      await Employee.create({
        user: dummyUser._id,
        employeeId: 'EMP-DUP-1',
        department: dummyDept._id
      });

      await expect(
        Employee.create({
          user: anotherUser._id,
          employeeId: 'EMP-DUP-1',
          department: dummyDept._id
        })
      ).rejects.toThrow();

      await User.deleteOne({ _id: anotherUser._id });
    });

    // Test 12: Unique user reference (one profile per user)
    it('Test 12: Duplicate user reference is rejected by unique index', async () => {
      await Employee.create({
        user: dummyUser._id,
        employeeId: 'EMP-UNIQ-A',
        department: dummyDept._id
      });

      await expect(
        Employee.create({
          user: dummyUser._id,
          employeeId: 'EMP-UNIQ-B',
          department: dummyDept._id
        })
      ).rejects.toThrow();
    });

    // Test 13: Default isActive is true
    it('Test 13: Sets isActive to true by default', async () => {
      const emp = await Employee.create({
        user: dummyUser._id,
        employeeId: 'EMP-ACTIVE',
        department: dummyDept._id
      });

      expect(emp.isActive).toBe(true);
    });

    // Test 14: Timestamps and JSON transformations
    it('Test 14: Includes timestamps and transforms _id to id in JSON output', async () => {
      const emp = await Employee.create({
        user: dummyUser._id,
        employeeId: 'EMP-JSON',
        department: dummyDept._id
      });

      expect(emp.createdAt).toBeDefined();
      expect(emp.updatedAt).toBeDefined();

      const json = emp.toJSON();
      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  // ==========================================
  // EMPLOYEE API TESTS (Tests 28 - 46)
  // ==========================================
  describe('Employee API Integration Tests', () => {
    let createdEmpId;

    beforeEach(async () => {
      await Employee.deleteMany({});
      const emp = await Employee.create({
        user: employeeUser1._id,
        employeeId: 'SKILL-1001',
        department: activeDepartment._id,
        designation: 'Software Developer',
        phone: '1234567890'
      });
      createdEmpId = emp._id.toString();
    });

    // Test 28: Admin can create employee profile
    it('Test 28: Admin can create employee profile (POST /api/employees -> 201)', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1002',
          department: activeDepartment._id.toString(),
          designation: 'Product Analyst',
          phone: '9876543210'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.employeeId).toBe('SKILL-1002');
      expect(response.body.data.employee.user.name).toBe('Emp Two');
      expect(response.body.data.employee.department.name).toBe('Core Engineering');
    });

    // Test 29: Trainer cannot create employee profile
    it('Test 29: Trainer cannot create employee profile (POST /api/employees -> 403)', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1003',
          department: activeDepartment._id.toString()
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 30: Employee cannot create employee profile
    it('Test 30: Employee cannot create employee profile (POST /api/employees -> 403)', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken1}`)
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1004',
          department: activeDepartment._id.toString()
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 31: Unauthenticated request cannot create employee profile
    it('Test 31: Unauthenticated request cannot create employee profile (POST /api/employees -> 401)', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1005',
          department: activeDepartment._id.toString()
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Test 32: Creation fails when target user does not exist
    it('Test 32: Creation fails with 404 when target user does not exist', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: fakeUserId,
          employeeId: 'SKILL-1006',
          department: activeDepartment._id.toString()
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/user not found/i);
    });

    // Test 33: Creation fails when target department does not exist
    it('Test 33: Creation fails with 404 when target department does not exist', async () => {
      const fakeDeptId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1007',
          department: fakeDeptId
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/department not found/i);
    });

    // Test 34: Creation fails when target user is inactive
    it('Test 34: Creation fails with 400 when target user is inactive', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: inactiveUser._id.toString(),
          employeeId: 'SKILL-1008',
          department: activeDepartment._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/inactive user/i);
    });

    // Test 35: Creation fails when target department is inactive
    it('Test 35: Creation fails with 400 when target department is inactive', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1009',
          department: inactiveDepartment._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/inactive department/i);
    });

    // Test 36: Creation fails with duplicate employeeId
    it('Test 36: Creation fails with 400 when employeeId is already in use', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: employeeUser2._id.toString(),
          employeeId: 'SKILL-1001', // Already belongs to employeeUser1
          department: activeDepartment._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already in use/i);
    });

    // Test 37: Creation fails when user already has an employee profile
    it('Test 37: Creation fails with 400 when user already has an employee profile', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: employeeUser1._id.toString(), // Already has createdEmpId
          employeeId: 'SKILL-9999',
          department: activeDepartment._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists for this user/i);
    });

    // Test 38: Creation fails with invalid ObjectId format
    it('Test 38: Creation fails with 400 when user or department ID is malformed', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: 'not-a-valid-id',
          employeeId: 'SKILL-5000',
          department: activeDepartment._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/validation failed/i);
    });

    // Test 39: Admin can list employees with populated user and department
    it('Test 39: Admin can list employees with populated user & department (GET /api/employees -> 200)', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.employees)).toBe(true);
      const emp = response.body.data.employees.find((e) => e.employeeId === 'SKILL-1001');
      expect(emp).toBeDefined();
      expect(emp.user.name).toBe('Emp One');
      expect(emp.department.name).toBe('Core Engineering');
    });

    // Test 40: Trainer can list employees
    it('Test 40: Trainer can list all employees (GET /api/employees -> 200)', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.employees)).toBe(true);
    });

    // Test 41: Employee cannot list all employees
    it('Test 41: Employee cannot list all employees (GET /api/employees -> 403)', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken1}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 42: Admin/Trainer can filter employees by department or isActive
    it('Test 42: Admin and Trainer can filter employees by department or isActive', async () => {
      const response = await request(app)
        .get(`/api/employees?department=${activeDepartment._id.toString()}&isActive=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employees.length).toBeGreaterThanOrEqual(1);
    });

    // Test 43: Admin and Trainer can get single employee by ID
    it('Test 43: Admin and Trainer can get single employee by ID (GET /api/employees/:id -> 200)', async () => {
      const adminRes = await request(app)
        .get(`/api/employees/${createdEmpId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.employee.employeeId).toBe('SKILL-1001');

      const trainerRes = await request(app)
        .get(`/api/employees/${createdEmpId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(trainerRes.body.success).toBe(true);
    });

    // Test 44: Admin can update employee profile
    it('Test 44: Admin can update employee profile (PATCH /api/employees/:id -> 200)', async () => {
      const response = await request(app)
        .patch(`/api/employees/${createdEmpId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          designation: 'Staff Software Engineer',
          phone: '555-4321'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.designation).toBe('Staff Software Engineer');
      expect(response.body.data.employee.phone).toBe('555-4321');
    });

    // Test 45: Updating employee cannot reassign user reference
    it('Test 45: Updating employee cannot reassign user reference (PATCH /api/employees/:id -> 400)', async () => {
      const response = await request(app)
        .patch(`/api/employees/${createdEmpId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: employeeUser2._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/validation failed/i);
    });

    // Test 46: Trainer cannot update employee profile
    it('Test 46: Trainer cannot update employee profile (PATCH /api/employees/:id -> 403)', async () => {
      const response = await request(app)
        .patch(`/api/employees/${createdEmpId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          designation: 'Unauthorized Change'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });
  });

  // ==========================================
  // SOFT DELETION & SELF-PROFILE TESTS (Tests 47 - 52)
  // ==========================================
  describe('Employee Soft Deletion & Self-Profile Tests', () => {
    let empIdForDeletion;

    beforeEach(async () => {
      await Employee.deleteMany({});
      const emp = await Employee.create({
        user: employeeUser1._id,
        employeeId: 'SKILL-SELF-1',
        department: activeDepartment._id,
        designation: 'Frontend Engineer',
        phone: '111-222-3333'
      });
      empIdForDeletion = emp._id.toString();
    });

    // Test 47: Admin can soft delete employee
    it('Test 47: Admin can soft delete employee (DELETE /api/employees/:id -> 200, isActive: false)', async () => {
      const response = await request(app)
        .delete(`/api/employees/${empIdForDeletion}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.isActive).toBe(false);

      const inDb = await Employee.findById(empIdForDeletion);
      expect(inDb.isActive).toBe(false);
    });

    // Test 48: Trainer cannot soft delete employee
    it('Test 48: Trainer cannot soft delete employee (DELETE /api/employees/:id -> 403)', async () => {
      const response = await request(app)
        .delete(`/api/employees/${empIdForDeletion}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 49: Authenticated user (employee) can retrieve own profile
    it('Test 49: Authenticated user can retrieve own employee profile (GET /api/employees/me -> 200)', async () => {
      const response = await request(app)
        .get('/api/employees/me')
        .set('Authorization', `Bearer ${employeeToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.employeeId).toBe('SKILL-SELF-1');
      expect(response.body.data.employee.user.name).toBe('Emp One');
      expect(response.body.data.employee.department.name).toBe('Core Engineering');
    });

    // Test 50: Authenticated user without an employee profile receives 404
    it('Test 50: Authenticated user without an employee profile receives 404 (GET /api/employees/me -> 404)', async () => {
      // employeeUser2 does not have an employee document
      const response = await request(app)
        .get('/api/employees/me')
        .set('Authorization', `Bearer ${employeeToken2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/employee profile not found/i);
    });

    // Test 51: Unauthenticated request to /api/employees/me returns 401
    it('Test 51: Unauthenticated request to /api/employees/me returns 401', async () => {
      const response = await request(app)
        .get('/api/employees/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Test 52: Self-profile response safely omits password/hash fields
    it('Test 52: Self-profile response safely omits password hash and sensitive fields', async () => {
      const response = await request(app)
        .get('/api/employees/me')
        .set('Authorization', `Bearer ${employeeToken1}`)
        .expect(200);

      expect(response.body.data.employee.user.password).toBeUndefined();
      expect(response.body.data.employee.user.__v).toBeUndefined();
      expect(response.body.data.employee.department.__v).toBeUndefined();
    });
  });
});
