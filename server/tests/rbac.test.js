const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const config = require('../src/config');
const { authorizeRoles } = require('../src/middleware/roleMiddleware');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Role-Based Access Control (RBAC) Tests (Phase 5)', () => {
  // ==========================================
  // MIDDLEWARE UNIT TESTS (Tests 1 - 6)
  // ==========================================
  describe('authorizeRoles Middleware Unit Tests', () => {
    // Test 1 — authorizeRoles function exists
    it('Test 1: authorizeRoles exists and returns a middleware function', () => {
      expect(typeof authorizeRoles).toBe('function');
      const middleware = authorizeRoles('admin');
      expect(typeof middleware).toBe('function');
    });

    // Test 2 — Missing req.user returns 401
    it('Test 2: Missing req.user calls next with HTTP 401 AppError', () => {
      const middleware = authorizeRoles('admin');
      const req = {}; // No authenticated user attached
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/authentication required/i);
    });

    // Test 3 — Valid allowed role passes
    it('Test 3: Authenticated user with allowed role passes (next called without error)', () => {
      const middleware = authorizeRoles('admin');
      const req = { user: { id: 'user1', role: 'admin' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // called with no arguments
    });

    // Test 4 — Valid disallowed role returns 403
    it('Test 4: Authenticated user with disallowed role returns HTTP 403 AppError', () => {
      const middleware = authorizeRoles('admin');
      const req = { user: { id: 'user2', role: 'employee' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/access denied/i);
    });

    // Test 5 — Multiple allowed roles work
    it('Test 5: Multiple allowed roles allow permitted roles and reject disallowed roles', () => {
      const middleware = authorizeRoles('admin', 'trainer');
      const res = {};

      // Admin user
      const nextAdmin = jest.fn();
      middleware({ user: { role: 'admin' } }, res, nextAdmin);
      expect(nextAdmin).toHaveBeenCalledWith();

      // Trainer user
      const nextTrainer = jest.fn();
      middleware({ user: { role: 'trainer' } }, res, nextTrainer);
      expect(nextTrainer).toHaveBeenCalledWith();

      // Employee user
      const nextEmployee = jest.fn();
      middleware({ user: { role: 'employee' } }, res, nextEmployee);
      expect(nextEmployee).toHaveBeenCalledTimes(1);
      const err = nextEmployee.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });

    // Test 6 — Invalid configured role is rejected safely (fail-fast)
    it('Test 6: Configuration with invalid role throws error at setup time', () => {
      expect(() => {
        authorizeRoles('superadmin');
      }).toThrow(/Invalid role "superadmin" configured for authorization/);

      expect(() => {
        authorizeRoles();
      }).toThrow(/authorizeRoles requires at least one role/);
    });
  });

  // ==========================================
  // RBAC ROUTE INTEGRATION TESTS (Tests 7 - 20)
  // ==========================================
  describe('RBAC Route Integration Tests', () => {
    let adminToken;
    let trainerToken;
    let employeeToken;

    beforeAll(async () => {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI);
      }
      await User.deleteMany({});

      // Create test users once for integration suite
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password123',
        role: 'admin'
      });

      const trainer = await User.create({
        name: 'Trainer User',
        email: 'trainer@example.com',
        password: 'Password123',
        role: 'trainer'
      });

      const employee = await User.create({
        name: 'Employee User',
        email: 'employee@example.com',
        password: 'Password123',
        role: 'employee'
      });

      adminToken = jwt.sign(
        { userId: admin._id.toString(), role: admin.role },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      trainerToken = jwt.sign(
        { userId: trainer._id.toString(), role: trainer.role },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      employeeToken = jwt.sign(
        { userId: employee._id.toString(), role: employee.role },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
    });

    afterAll(async () => {
      await User.deleteMany({});
      await mongoose.connection.close();
    });

    // Test 7 — Admin can access admin endpoint
    it('Test 7: Admin can access /api/rbac/admin (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/rbac/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
      expect(response.body.data.role).toBe('admin');
    });

    // Test 8 — Trainer cannot access admin endpoint
    it('Test 8: Trainer cannot access /api/rbac/admin (HTTP 403)', async () => {
      const response = await request(app)
        .get('/api/rbac/admin')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 9 — Employee cannot access admin endpoint
    it('Test 9: Employee cannot access /api/rbac/admin (HTTP 403)', async () => {
      const response = await request(app)
        .get('/api/rbac/admin')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 10 — Trainer can access trainer endpoint
    it('Test 10: Trainer can access /api/rbac/trainer (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/rbac/trainer')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Trainer access granted');
      expect(response.body.data.role).toBe('trainer');
    });

    // Test 11 — Employee cannot access trainer endpoint
    it('Test 11: Employee cannot access /api/rbac/trainer (HTTP 403)', async () => {
      const response = await request(app)
        .get('/api/rbac/trainer')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 12 — Employee can access employee endpoint
    it('Test 12: Employee can access /api/rbac/employee (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/rbac/employee')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Employee access granted');
      expect(response.body.data.role).toBe('employee');
    });

    // Test 13 — Admin cannot access employee endpoint (explicit policy: employee-only)
    it('Test 13: Admin cannot access /api/rbac/employee under explicit employee-only policy (HTTP 403)', async () => {
      const response = await request(app)
        .get('/api/rbac/employee')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 14 — Admin can access admin-trainer endpoint
    it('Test 14: Admin can access /api/rbac/admin-trainer (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/rbac/admin-trainer')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin and Trainer access granted');
    });

    // Test 15 — Trainer can access admin-trainer endpoint
    it('Test 15: Trainer can access /api/rbac/admin-trainer (HTTP 200)', async () => {
      const response = await request(app)
        .get('/api/rbac/admin-trainer')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin and Trainer access granted');
    });

    // Test 16 — Employee cannot access admin-trainer endpoint
    it('Test 16: Employee cannot access /api/rbac/admin-trainer (HTTP 403)', async () => {
      const response = await request(app)
        .get('/api/rbac/admin-trainer')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/access denied/i);
    });

    // Test 17 — Missing JWT returns 401
    it('Test 17: Missing JWT on protected RBAC endpoint returns HTTP 401', async () => {
      const response = await request(app)
        .get('/api/rbac/admin')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/authorization header is missing/i);
    });

    // Test 18 — Invalid JWT returns 401
    it('Test 18: Invalid JWT on protected RBAC endpoint returns HTTP 401', async () => {
      const response = await request(app)
        .get('/api/rbac/admin')
        .set('Authorization', 'Bearer this.is.an.invalid.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid or expired/i);
    });

    // Test 19 — Expired JWT returns 401
    it('Test 19: Expired JWT on protected RBAC endpoint returns HTTP 401', async () => {
      const expiredToken = jwt.sign(
        { userId: 'fakeUserId', role: 'admin' },
        config.jwtSecret,
        { expiresIn: '-10s' }
      );

      const response = await request(app)
        .get('/api/rbac/admin')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid or expired/i);
    });

    // Test 20 — Privilege escalation prevention
    it('Test 20: Privilege escalation prevention - public registration ignores role payload and assigns employee', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Attempt',
          email: 'hacker@example.com',
          password: 'Password123',
          role: 'admin' // Attempting to self-promote to admin
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('employee');

      // Verify in database as well
      const savedUser = await User.findOne({ email: 'hacker@example.com' });
      expect(savedUser.role).toBe('employee');

      // Cleanup
      await User.deleteOne({ email: 'hacker@example.com' });
    });
  });
});
