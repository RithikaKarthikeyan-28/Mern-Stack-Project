const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const config = require('../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Authentication API & Middleware Tests (Phase 4)', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // REGISTRATION API TESTS (Tests 8 - 12)
  // ==========================================
  describe('Registration API (POST /api/auth/register)', () => {
    // Test 8 — Successful registration returns HTTP 201
    it('Test 8: Successful registration returns HTTP 201', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Smith',
          email: 'alice@example.com',
          password: 'Password123'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('alice@example.com');
      expect(response.body.data.user.name).toBe('Alice Smith');
    });

    // Test 9 — Registration response does not contain password
    it('Test 9: Registration response does not contain plaintext password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Jones',
          email: 'bob@example.com',
          password: 'MySecretPassword123'
        })
        .expect(201);

      expect(response.body.data.user.password).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('MySecretPassword123');
    });

    // Test 10 — Registration response does not contain password hash
    it('Test 10: Registration response does not contain password hash', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          password: 'Password123'
        })
        .expect(201);

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(response.body)).not.toMatch(/\$2[ab]\$\d+\$/);
    });

    // Test 11 — Duplicate email returns an appropriate client error
    it('Test 11: Duplicate email returns an appropriate client error', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'Password123'
        })
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'DUPLICATE@example.com',
          password: 'Password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already registered/i);
    });

    // Test 12 — Invalid registration input is rejected
    it('Test 12: Invalid registration input is rejected with HTTP 400', async () => {
      // Missing name
      const resMissingName = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'Password123'
        })
        .expect(400);
      expect(resMissingName.body.success).toBe(false);

      // Invalid email
      const resBadEmail = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Valid Name',
          email: 'not-an-email',
          password: 'Password123'
        })
        .expect(400);
      expect(resBadEmail.body.success).toBe(false);

      // Short password (< 8 chars)
      const resShortPass = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Valid Name',
          email: 'valid@example.com',
          password: 'short'
        })
        .expect(400);
      expect(resShortPass.body.success).toBe(false);
      expect(resShortPass.body.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/at least 8 characters/i)])
      );
    });
  });

  // ==========================================
  // LOGIN API TESTS (Tests 13 - 18)
  // ==========================================
  describe('Login API (POST /api/auth/login)', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login User',
        email: 'login@example.com',
        password: 'CorrectPassword123'
      });
    });

    // Test 13 — Successful login returns HTTP 200
    it('Test 13: Successful login returns HTTP 200', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
    });

    // Test 14 — Successful login returns JWT token
    it('Test 14: Successful login returns valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPassword123'
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('token');
      expect(typeof response.body.data.token).toBe('string');

      const decoded = jwt.verify(response.body.data.token, config.jwtSecret);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role', 'employee');
    });

    // Test 15 — Correct credentials authenticate successfully
    it('Test 15: Correct credentials authenticate successfully with normalized email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '  LOGIN@EXAMPLE.COM  ',
          password: 'CorrectPassword123'
        })
        .expect(200);

      expect(response.body.data.user.email).toBe('login@example.com');
    });

    // Test 16 — Wrong password returns HTTP 401
    it('Test 16: Wrong password returns HTTP 401 with generic error message', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    // Test 17 — Unknown email returns HTTP 401
    it('Test 17: Unknown email returns HTTP 401 informing user to create account', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Account not found|Invalid email/i);
    });

    // Test 18 — Inactive user cannot log in
    it('Test 18: Inactive user cannot log in and returns HTTP 401', async () => {
      await User.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        password: 'Password123',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/inactive/i);
    });
  });

  // ==========================================
  // MIDDLEWARE TESTS (Tests 19 - 23)
  // ==========================================
  describe('Authentication Middleware (authMiddleware)', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Middleware User',
        email: 'middleware@example.com',
        password: 'Password123'
      });

      validToken = jwt.sign(
        { userId: testUser._id.toString(), role: testUser.role },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
    });

    // Test 19 — Missing Authorization header returns HTTP 401
    it('Test 19: Missing Authorization header returns HTTP 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/missing/i);
    });

    // Test 20 — Malformed Authorization header returns HTTP 401
    it('Test 20: Malformed Authorization header returns HTTP 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Basic ${validToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid authorization format/i);
    });

    // Test 21 — Invalid JWT returns HTTP 401
    it('Test 21: Invalid JWT returns HTTP 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer this.is.an.invalid.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid or expired/i);
    });

    // Test 22 — Valid JWT authenticates request
    it('Test 22: Valid JWT authenticates request successfully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('middleware@example.com');
    });

    // Test 23 — Expired JWT returns HTTP 401
    it('Test 23: Expired JWT returns HTTP 401', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString(), role: testUser.role },
        config.jwtSecret,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid or expired/i);
    });
  });

  // ==========================================
  // /me ENDPOINT TESTS (Tests 24 - 28)
  // ==========================================
  describe('Current User Endpoint (GET /api/auth/me)', () => {
    let authUser;
    let token;

    beforeEach(async () => {
      authUser = await User.create({
        name: 'Profile Tester',
        email: 'profile@example.com',
        password: 'Password123'
      });

      token = jwt.sign(
        { userId: authUser._id.toString(), role: authUser.role },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
    });

    // Test 24 — Valid JWT returns HTTP 200
    it('Test 24: Valid JWT returns HTTP 200', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
    });

    // Test 25 — /me response contains safe user information
    it('Test 25: /me response contains safe user information', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const { user } = response.body.data;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name', 'Profile Tester');
      expect(user).toHaveProperty('email', 'profile@example.com');
      expect(user).toHaveProperty('role', 'employee');
      expect(user).toHaveProperty('isActive', true);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });

    // Test 26 — /me response does not expose password
    it('Test 26: /me response does not expose password', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('Password123');
    });

    // Test 27 — /me response does not expose password hash
    it('Test 27: /me response does not expose password hash', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toMatch(/\$2[ab]\$\d+\$/);
    });

    // Test 28 — /me without token returns HTTP 401
    it('Test 28: /me without token returns HTTP 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/authorization header is missing/i);
    });
  });
});
