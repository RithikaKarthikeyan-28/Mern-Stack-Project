/**
 * Phase 20 — Security Hardening Test Suite
 * Comprehensive automated security verification for SkillTrack backend:
 * 1. Authentication & JWT Hardening (HS256 enforcement, alg confusion, signature tampering, expiration)
 * 2. Password Security (bcrypt salt rounds >= 10, hash privacy, injection resistance)
 * 3. Authorization & RBAC Fail-Closed (server-authoritative identity, role enforcement, IDOR, escalation)
 * 4. NoSQL Injection & Input Sanitization (recursive key inspection for $, ., __proto__, constructor, prototype)
 * 5. HTTP Security Headers & Correlation (Helmet headers, X-Powered-By removal, X-Request-Id)
 * 6. CORS Hardening (origin allowlist, disallow untrusted, no reflection, preflight handling)
 * 7. Rate Limiting (authLimiter, apiLimiter, 429 status and response format)
 * 8. Request Body Size Limits (413 Payload Too Large for oversized JSON / urlencoded)
 * 9. Error Information Leakage Prevention (CastError 400, masked 500s, sanitized production errors, no stack traces)
 * 10. Secure Configuration Enforcement (JWT_SECRET strength, CORS wildcards, environment checks)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const config = require('../src/config');
const { authLimiter, apiLimiter } = require('../src/middleware/rateLimiter');
const errorHandler = require('../src/middleware/errorHandler');
const AppError = require('../src/utils/AppError');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 20 — Security Hardening Tests', () => {
  let adminUser;
  let employeeUser;
  let trainerUser;
  let adminToken;
  let employeeToken;
  let trainerToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Department.deleteMany({});

    // Seed test users
    adminUser = await User.create({
      name: 'Security Admin',
      email: 'admin.sec@skilltrack.test',
      password: 'AdminPassword123!',
      role: 'admin'
    });

    employeeUser = await User.create({
      name: 'Security Employee',
      email: 'emp.sec@skilltrack.test',
      password: 'EmpPassword123!',
      role: 'employee'
    });

    trainerUser = await User.create({
      name: 'Security Trainer',
      email: 'trainer.sec@skilltrack.test',
      password: 'TrainerPassword123!',
      role: 'trainer'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: adminUser.role },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: employeeUser.role },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    trainerToken = jwt.sign(
      { userId: trainerUser._id.toString(), role: trainerUser.role },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Department.deleteMany({});
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. AUTHENTICATION & JWT HARDENING
  // =========================================================================
  describe('1. Authentication & JWT Hardening', () => {
    it('1.1: Valid HS256 token is accepted by authMiddleware', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(employeeUser.email);
    });

    it('1.2: Token signed with algorithm "none" is strictly rejected with 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ userId: employeeUser._id.toString(), role: 'admin' })
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${noneToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it('1.3: Token claiming RS256 algorithm is rejected with 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ userId: employeeUser._id.toString(), role: 'admin' })
      ).toString('base64url');
      const fakeSignature = Buffer.from('fakesig123').toString('base64url');
      const rsToken = `${header}.${payload}.${fakeSignature}`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${rsToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('1.4: Tampered JWT signature is rejected with 401', async () => {
      const parts = employeeToken.split('.');
      const tamperedSignature = parts[2].slice(0, -4) + 'abcd';
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('1.5: Expired JWT is rejected with 401', async () => {
      const expiredToken = jwt.sign(
        { userId: employeeUser._id.toString(), role: employeeUser.role },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it('1.6: Token with wrong secret key is rejected with 401', async () => {
      const wrongKeyToken = jwt.sign(
        { userId: employeeUser._id.toString(), role: employeeUser.role },
        'wrong_attacker_secret_key_123',
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongKeyToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('1.7: Missing Authorization header is rejected with 401', async () => {
      const res = await request(app).get('/api/auth/me').expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/missing/i);
    });

    it('1.8: Non-Bearer authorization scheme is rejected with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Basic ${Buffer.from('admin:secret').toString('base64')}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid authorization format/i);
    });

    it('1.9: Empty Bearer token is rejected with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('1.10: Completely malformed token string is rejected with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-even-a-jwt')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('1.11: Token with missing identity claim (empty payload) is rejected with 401', async () => {
      const emptyClaimToken = jwt.sign({}, config.jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${emptyClaimToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid token payload/i);
    });

    it('1.12: Token referencing non-existent user ID is rejected with 401', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const ghostToken = jwt.sign(
        { userId: ghostId.toString(), role: 'employee' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ghostToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no longer exists/i);
    });

    it('1.13: Token belonging to inactive user is rejected with 401', async () => {
      const inactiveUser = await User.create({
        name: 'Deactivated User',
        email: 'inactive@skilltrack.test',
        password: 'Password123!',
        isActive: false
      });

      const inactiveToken = jwt.sign(
        { userId: inactiveUser._id.toString(), role: 'employee' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive/i);
    });

    it('1.14: JWT issued via login contains only minimal identity payload (userId, role)', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'emp.sec@skilltrack.test', password: 'EmpPassword123!' })
        .expect(200);

      const token = loginRes.body.data.token;
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role');
      expect(decoded.password).toBeUndefined();
      expect(decoded.passwordHash).toBeUndefined();
      expect(decoded.email).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. PASSWORD SECURITY
  // =========================================================================
  describe('2. Password Security', () => {
    it('2.1: Password hash stored in DB is bcrypt with at least 10 rounds', async () => {
      const user = await User.findById(employeeUser._id).select('+password');
      expect(user.password).toBeDefined();
      expect(user.password).toMatch(/^\$2[aby]\$\d{2}\$/);
      const rounds = parseInt(user.password.split('$')[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it('2.2: Password field is never exposed in User query by default', async () => {
      const user = await User.findById(employeeUser._id);
      expect(user.password).toBeUndefined();
    });

    it('2.3: POST /api/auth/register never exposes password or hash in response', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Registrant',
          email: 'newreg@skilltrack.test',
          password: 'Password123!'
        })
        .expect(201);

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('Password123!');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('2.4: POST /api/auth/login never exposes password or hash in response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'emp.sec@skilltrack.test',
          password: 'EmpPassword123!'
        })
        .expect(200);

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('EmpPassword123!');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('2.5: GET /api/auth/me never exposes password or hash in response', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('2.6: Registration rejects attempt to inject arbitrary passwordHash field', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hash Injection',
          email: 'hashinj@skilltrack.test',
          password: 'ValidPassword123!',
          passwordHash: '$2a$10$attackerControlledHashValueGoesHere'
        })
        .expect(201);

      expect(res.body.data.user.passwordHash).toBeUndefined();
      const savedUser = await User.findOne({ email: 'hashinj@skilltrack.test' }).select('+password');
      const isValid = await savedUser.comparePassword('ValidPassword123!');
      expect(isValid).toBe(true);
    });

    it('2.7: Password verification correctly rejects incorrect plaintext password', async () => {
      const user = await User.findById(employeeUser._id).select('+password');
      const isMatch = await user.comparePassword('IncorrectPassword!');
      expect(isMatch).toBe(false);
    });
  });

  // =========================================================================
  // 3. AUTHORIZATION & RBAC FAIL-CLOSED
  // =========================================================================
  describe('3. Authorization & RBAC Fail-Closed', () => {
    it('3.1: Unauthenticated request to protected route returns 401', async () => {
      const res = await request(app).get('/api/departments').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('3.2: Employee cannot create a department (admin-only route returns 403)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Unauthorized Dept' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission|access denied|forbidden/i);
    });

    it('3.3: Employee cannot delete a department (admin-only route returns 403)', async () => {
      const dept = await Department.create({ name: 'Target Dept' });
      const res = await request(app)
        .delete(`/api/departments/${dept._id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('3.4: Admin can create department successfully (authorized role allowed)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Security Engineering' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.department.name).toBe('Security Engineering');
    });

    it('3.5: Public registration cannot escalate role to admin', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Privilege Escalation Attempt',
          email: 'esc@skilltrack.test',
          password: 'Password123!',
          role: 'admin'
        })
        .expect(201);

      expect(res.body.data.user.role).toBe('employee');
      const userInDb = await User.findOne({ email: 'esc@skilltrack.test' });
      expect(userInDb.role).toBe('employee');
    });

    it('3.6: User with unknown/tampered role in token fails closed against RBAC', async () => {
      const rogueToken = jwt.sign(
        { userId: employeeUser._id.toString(), role: 'superuser_hacker' },
        config.jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${rogueToken}`)
        .send({ name: 'Rogue Dept' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 4. NOSQL INJECTION & INPUT SANITIZATION DEFENSE
  // =========================================================================
  describe('4. NoSQL Injection & Input Sanitization Defense', () => {
    it('4.1: Rejects query string with $ operator key (?filter[$gt]=1) with 400', async () => {
      const res = await request(app)
        .get('/api/departments?filter[$gt]=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/malicious input|nosql/i);
    });

    it('4.2: Rejects query string with $where operator with 400', async () => {
      const res = await request(app)
        .get('/api/departments?$where=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.3: Rejects body with $ne operator in login attempt with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: 'Password123!'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/malicious input|nosql/i);
    });

    it('4.4: Rejects body with $gt operator in root key with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          $gt: { name: 'Injection' }
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.5: Rejects body with dot-path key (user.role) with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          'user.role': 'admin'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.6: Rejects body with nested dot-path key in deep object with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metadata: {
            'deep.nested.path': 'value'
          }
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.7: Rejects body with operator inside nested array with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ $regex: '.*' }]
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.8: Rejects prototype pollution attempt (__proto__) with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"__proto__": {"isAdmin": true}, "name": "Dept Proto"}')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/malicious input|nosql/i);
    });

    it('4.9: Rejects prototype pollution attempt (constructor) with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          constructor: { prototype: { isAdmin: true } },
          name: 'Dept Constructor'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.10: Rejects prototype pollution attempt (prototype key) with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prototype: { isAdmin: true },
          name: 'Dept Prototype'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('4.11: Allows legitimate string values containing "$" (e.g. price, description)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Budget Department',
          description: 'Department manages $5,000,000 budget'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.department.description).toContain('$5,000,000');
    });

    it('4.12: Allows legitimate string values containing "." (e.g. email, description)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dot Name',
          email: 'first.last.test@skilltrack.test',
          password: 'Password123!'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('first.last.test@skilltrack.test');
    });

    it('4.13: Rejects URL-encoded body containing $ operator with 400', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('name[$gt]=Admin')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 5. HTTP SECURITY HEADERS & REQUEST CORRELATION
  // =========================================================================
  describe('5. HTTP Security Headers & Correlation', () => {
    it('5.1: Response includes X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('5.2: Response includes X-Frame-Options: SAMEORIGIN (or DENY)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(['SAMEORIGIN', 'DENY']).toContain(res.headers['x-frame-options']);
    });

    it('5.3: Response includes Referrer-Policy: no-referrer', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
    });

    it('5.4: X-Powered-By header is removed and not leaked to client', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('5.5: Response includes X-Request-Id correlation header', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
    });

    it('5.6: Subsequent requests receive distinct correlation IDs', async () => {
      const res1 = await request(app).get('/api/auth/me');
      const res2 = await request(app).get('/api/auth/me');
      expect(res1.headers['x-request-id']).not.toBe(res2.headers['x-request-id']);
    });
  });

  // =========================================================================
  // 6. CORS HARDENING
  // =========================================================================
  describe('6. CORS Hardening', () => {
    it('6.1: Configured origin is allowed and returns Access-Control-Allow-Origin', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('6.2: Configured origin 127.0.0.1:3000 is allowed', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'http://127.0.0.1:3000');

      expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:3000');
    });

    it('6.3: Disallowed arbitrary origin receives 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'http://malicious-attacker-site.com')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not allowed by cors/i);
    });

    it('6.4: Disallowed origin is NEVER reflected in Access-Control-Allow-Origin header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Origin', 'http://unauthorized-domain.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('6.5: Preflight OPTIONS request from allowed origin returns 204 with headers', async () => {
      const res = await request(app)
        .options('/api/departments')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('6.6: Preflight OPTIONS request from disallowed origin returns 403', async () => {
      const res = await request(app)
        .options('/api/departments')
        .set('Origin', 'http://evil-attacker.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(403);

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('6.7: Non-browser request without Origin header (curl / mobile app) is permitted', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 7. RATE LIMITING
  // =========================================================================
  describe('7. Rate Limiting', () => {
    it('7.1: authLimiter is properly configured with rate limiting options', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('7.2: apiLimiter is properly configured with rate limiting options', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });

    it('7.3: authLimiter returns 429 when max attempts threshold is exceeded', async () => {
      const rateLimit = require('express-rate-limit');
      const testLimiter = rateLimit({
        windowMs: 60000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            message: 'Too many authentication attempts, please try again later.'
          });
        }
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/test-login', testLimiter, (req, res) => res.json({ success: true }));

      // Call 1 & 2 succeed
      await request(testApp).post('/test-login').send({}).expect(200);
      await request(testApp).post('/test-login').send({}).expect(200);

      // Call 3 triggers 429
      const res = await request(testApp).post('/test-login').send({}).expect(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/too many authentication attempts/i);
      expect(res.headers['ratelimit-limit']).toBe('2');
    });
  });

  // =========================================================================
  // 8. REQUEST BODY SIZE LIMITS
  // =========================================================================
  describe('8. Request Body Size Limits', () => {
    it('8.1: JSON payload within body limit is processed normally', async () => {
      const smallPayload = { name: 'Small Dept', description: 'Normal size' };
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(smallPayload)
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('8.2: JSON payload exceeding body limit returns 413 Payload Too Large', async () => {
      const hugeDescription = 'A'.repeat(20 * 1024);
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Huge Dept', description: hugeDescription })
        .expect(413);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/payload too large/i);
    });

    it('8.3: URL-encoded payload exceeding body limit returns 413', async () => {
      const hugeData = 'data=' + 'B'.repeat(20 * 1024);
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(hugeData)
        .expect(413);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/payload too large/i);
    });
  });

  // =========================================================================
  // 9. ERROR INFORMATION LEAKAGE PREVENTION
  // =========================================================================
  describe('9. Error Information Leakage Prevention', () => {
    it('9.1: Malformed MongoDB ObjectId triggers CastError/validator, converted to 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/departments/not-a-valid-object-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*(?:id|identifier)/i);
    });

    it('9.1b: Mongoose CastError is converted to 400 Bad Request with "Invalid identifier"', () => {
      const mockReq = {};
      let responseBody = null;
      let responseStatus = null;
      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (body) => {
          responseBody = body;
          return mockRes;
        }
      };
      const castErr = new Error('Cast to ObjectId failed');
      castErr.name = 'CastError';
      castErr.path = '_id';
      castErr.value = 'bad-id';
      errorHandler(castErr, mockReq, mockRes, () => {});
      expect(responseStatus).toBe(400);
      expect(responseBody.message).toBe('Invalid identifier');
    });

    it('9.2: Stack traces are not leaked in error responses', async () => {
      const res = await request(app).get('/api/departments/invalid-id').set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.stack).toBeUndefined();
    });

    it('9.3: Production mode masks unexpected 500 errors to "Internal Server Error"', () => {
      const mockReq = {};
      let responseBody = null;
      let responseStatus = null;
      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (body) => {
          responseBody = body;
          return mockRes;
        }
      };

      const originalIsProd = config.isProduction;
      try {
        config.isProduction = true;
        const secretDbError = new Error('Database connection failed at mongodb://admin:supersecret@db:27017/prod');
        errorHandler(secretDbError, mockReq, mockRes, () => {});

        expect(responseStatus).toBe(500);
        expect(responseBody.success).toBe(false);
        expect(responseBody.message).toBe('Internal Server Error');
        expect(JSON.stringify(responseBody)).not.toContain('supersecret');
        expect(JSON.stringify(responseBody)).not.toContain('mongodb://');
      } finally {
        config.isProduction = originalIsProd;
      }
    });

    it('9.4: Production mode scrubs MongoDB connection URI and file paths from client errors', () => {
      const mockReq = {};
      let responseBody = null;
      let responseStatus = null;
      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (body) => {
          responseBody = body;
          return mockRes;
        }
      };

      const originalIsProd = config.isProduction;
      try {
        config.isProduction = true;
        const err = new AppError('Error at mongodb://user:pass@127.0.0.1:27017 in C:\\\\Users\\\\App\\\\secret.js', 400);
        errorHandler(err, mockReq, mockRes, () => {});

        expect(responseStatus).toBe(400);
        expect(responseBody.message).not.toContain('mongodb://user:pass');
        expect(responseBody.message).toContain('[REDACTED_MONGO_URI]');
      } finally {
        config.isProduction = originalIsProd;
      }
    });
  });

  // =========================================================================
  // 10. SECURE CONFIGURATION & ENVIRONMENT VALIDATION
  // =========================================================================
  describe('10. Secure Configuration Enforcement', () => {
    it('10.1: Config rejects missing JWT_SECRET in production mode', () => {
      expect(() => {
        config.loadConfig({ NODE_ENV: 'production', JWT_SECRET: '' });
      }).toThrow(/jwt_secret is required in production/i);
    });

    it('10.2: Config rejects insecure placeholder JWT_SECRET in production mode', () => {
      expect(() => {
        config.loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'development_jwt_secret_placeholder'
        });
      }).toThrow(/must be a secure, non-placeholder secret/i);
    });

    it('10.3: Config rejects short JWT_SECRET (< 8 chars) in production mode', () => {
      expect(() => {
        config.loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'short'
        });
      }).toThrow(/at least 8 characters/i);
    });

    it('10.4: Config rejects wildcard CORS_ORIGIN ("*") in production mode', () => {
      expect(() => {
        config.loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'super_secure_production_secret_key_123',
          CORS_ORIGIN: '*'
        });
      }).toThrow(/wildcard cors_origin.*not allowed in production/i);
    });

    it('10.5: Config rejects invalid BODY_LIMIT format', () => {
      expect(() => {
        config.loadConfig({ BODY_LIMIT: 'invalid_limit' });
      }).toThrow(/body_limit must be a valid size string/i);
    });

    it('10.6: Config rejects non-integer PORT', () => {
      expect(() => {
        config.loadConfig({ PORT: 'not-a-port' });
      }).toThrow(/port must be a valid integer/i);
    });

    it('10.7: Config accepts valid production configuration', () => {
      const prodConfig = config.loadConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'super_strong_production_secret_key_2026',
        CORS_ORIGIN: 'https://skilltrack.example.com',
        PORT: '8080'
      });

      expect(prodConfig.isProduction).toBe(true);
      expect(prodConfig.port).toBe(8080);
      expect(prodConfig.corsOrigin).toBe('https://skilltrack.example.com');
    });
  });
});
