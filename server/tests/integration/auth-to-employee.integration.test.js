/**
 * Phase 21 Integration Test Suite: Workflow 1 — Authentication -> Employee -> Department
 * Tests:
 * 1. Admin login & department management
 * 2. Employee registration with role enforcement (default 'employee', client cannot escalate)
 * 3. Department creation and employee profile linkage
 * 4. Safe employee profile retrieval (no password hash leakage)
 * 5. Self-service access (GET /api/employees/me) vs. unauthorized/cross-user access
 * 6. Input validation failure recovery & state integrity
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Department = require('../../src/models/Department');
const Employee = require('../../src/models/Employee');
const config = require('../../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 1 Integration: Authentication -> Employee -> Department', () => {
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  beforeEach(async () => {
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // Seed admin directly (public registration forces employee role)
    adminUser = await User.create({
      name: 'Integration Admin',
      email: 'admin.integration@skilltrack.test',
      password: 'AdminPassword123!',
      role: 'admin'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('1.1: Complete workflow from registration to employee-department association', async () => {
    // Step 1: Attempt registration with escalated role 'admin'
    const regEscRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Developer',
        email: 'jane.dev@skilltrack.test',
        password: 'Password123!',
        role: 'admin'
      })
      .expect(201);

    expect(regEscRes.body.success).toBe(true);
    // Role MUST remain employee despite client payload requesting admin
    expect(regEscRes.body.data.user.role).toBe('employee');
    const employeeUserId = regEscRes.body.data.user.id;

    // Verify password is never returned
    expect(regEscRes.body.data.user.password).toBeUndefined();
    expect(regEscRes.body.data.user.passwordHash).toBeUndefined();

    // Step 2: Employee logs in via API
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane.dev@skilltrack.test',
        password: 'Password123!'
      })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    const employeeToken = loginRes.body.data.token;
    expect(employeeToken).toBeDefined();

    // Step 3: Admin creates a department
    const deptRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Platform Engineering',
        description: 'Core infrastructure and platform engineering team'
      })
      .expect(201);

    expect(deptRes.body.success).toBe(true);
    const deptId = deptRes.body.data.department._id || deptRes.body.data.department.id;
    expect(deptId).toBeDefined();

    // Step 4: Admin creates employee profile linked to user and department
    const empCreateRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: employeeUserId,
        employeeId: 'EMP-2026-001',
        department: deptId,
        designation: 'Backend Software Engineer',
        phone: '1234567890'
      })
      .expect(201);

    expect(empCreateRes.body.success).toBe(true);
    const createdEmp = empCreateRes.body.data.employee;
    const empId = createdEmp._id || createdEmp.id;
    expect(empId).toBeDefined();

    // Step 5: Admin retrieves employee profile by ID
    const getEmpRes = await request(app)
      .get(`/api/employees/${empId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(getEmpRes.body.success).toBe(true);
    const fetchedEmp = getEmpRes.body.data.employee;
    expect(fetchedEmp.user._id || fetchedEmp.user.id).toBe(employeeUserId);
    expect(fetchedEmp.department._id || fetchedEmp.department.id).toBe(deptId);
    expect(fetchedEmp.designation).toBe('Backend Software Engineer');
    expect(fetchedEmp.isActive).toBe(true);
    // User object in employee response must not expose password
    expect(fetchedEmp.user.password).toBeUndefined();
    expect(fetchedEmp.user.passwordHash).toBeUndefined();

    // Step 6: Employee accesses self-service profile
    const selfRes = await request(app)
      .get('/api/employees/me')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(selfRes.body.success).toBe(true);
    expect(selfRes.body.data.employee._id || selfRes.body.data.employee.id).toBe(empId);

    // Step 7: Employee attempts unauthorized access
    // Employee cannot create a department (403)
    await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Unauthorized Dept' })
      .expect(403);

    // Employee cannot update employee profiles via admin endpoint (403)
    await request(app)
      .patch(`/api/employees/${empId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ designation: 'CTO' })
      .expect(403);

    // Unauthenticated request rejected (401)
    await request(app).get(`/api/employees/${empId}`).expect(401);
  });

  it('1.2: State integrity on failed department and employee creation', async () => {
    // Malformed department input rejected with 400
    const badDeptRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' })
      .expect(400);

    expect(badDeptRes.body.success).toBe(false);
    const deptsCount = await Department.countDocuments({});
    expect(deptsCount).toBe(0);

    // Missing required employeeId rejected with 400
    const missingIdRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: adminUser._id.toString(),
        department: new mongoose.Types.ObjectId().toString(),
        designation: 'Lead'
      })
      .expect(400);

    expect(missingIdRes.body.success).toBe(false);

    // Non-existent department rejected with 404
    const nonExistentDeptId = new mongoose.Types.ObjectId();
    const badEmpRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: adminUser._id.toString(),
        employeeId: 'EMP-NONEXISTENT',
        department: nonExistentDeptId.toString(),
        designation: 'Lead'
      })
      .expect(404);

    expect(badEmpRes.body.success).toBe(false);
    const empsCount = await Employee.countDocuments({});
    expect(empsCount).toBe(0);
  });
});
