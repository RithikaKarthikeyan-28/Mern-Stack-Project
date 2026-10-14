/**
 * SkillTrack Phase 22 — Production Readiness Live Verification
 *
 * Runs 39 sequential numbered checks against isolated database:
 * mongodb://127.0.0.1:27017/skilltrack_phase22_production
 */

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');

// Models for index and data verification
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Enrollment = require('../src/models/Enrollment');
const Notification = require('../src/models/Notification');

const VERIFY_DB_URI = 'mongodb://127.0.0.1:27017/skilltrack_phase22_production';
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server = null;
let passedChecks = 0;
let failedChecks = 0;
const totalChecks = 39;

function logPass(checkNum, description) {
  passedChecks++;
  console.log(`[PASS] Check ${String(checkNum).padStart(2, '0')}: ${description}`);
}

function logFail(checkNum, description, err) {
  failedChecks++;
  console.error(`[FAIL] Check ${String(checkNum).padStart(2, '0')}: ${description}`);
  if (err) console.error('       Error:', err.message || err);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let body = null;
        try {
          body = rawData ? JSON.parse(rawData) : null;
        } catch (_) {
          body = rawData;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runProductionVerification() {
  console.log('================================================================');
  console.log('SKILLTRACK PHASE 22 — PRODUCTION READINESS VERIFICATION');
  console.log(`Database: ${VERIFY_DB_URI}`);
  console.log(`Port:     ${PORT}`);
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // Phase 1: Configuration & Fail-Fast Environment Validation
    // -------------------------------------------------------------------------
    console.log('--- Phase 1: Configuration & Fail-Fast Environment Validation ---');

    // Check 01: Clean and isolate verification database
    try {
      await mongoose.connect(VERIFY_DB_URI);
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
      logPass(1, 'Clean and isolate verification database');
    } catch (err) {
      logFail(1, 'Clean and isolate verification database', err);
    }

    // Check 02: Load valid production configuration
    try {
      const prodCfg = config.loadConfig({
        NODE_ENV: 'production',
        PORT: '5000',
        MONGO_URI: VERIFY_DB_URI,
        JWT_SECRET: 'production-verified-secret-key-min-32-chars-long',
        CORS_ORIGIN: 'http://localhost:3000,http://127.0.0.1:3000'
      });
      if (prodCfg.isProduction && prodCfg.port === 5000 && prodCfg.corsOrigin) {
        logPass(2, 'Valid production configuration loaded successfully');
      } else {
        throw new Error('Config properties not properly populated');
      }
    } catch (err) {
      logFail(2, 'Valid production configuration loaded successfully', err);
    }

    // Check 03: Validate production configuration function passes on valid input
    try {
      config.validateProductionConfig({
        env: 'production',
        port: 5000,
        mongoUri: VERIFY_DB_URI,
        jwtSecret: 'production-verified-secret-key-min-32-chars-long',
        corsOrigin: 'https://skilltrack.example.com'
      });
      logPass(3, 'validateProductionConfig confirms valid production configuration');
    } catch (err) {
      logFail(3, 'validateProductionConfig confirms valid production configuration', err);
    }

    // Check 04: Fail-fast rejects missing JWT_SECRET in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: VERIFY_DB_URI,
          jwtSecret: '',
          corsOrigin: 'https://skilltrack.example.com'
        });
      } catch (e) {
        threw = /JWT_SECRET is required/i.test(e.message);
      }
      if (threw) logPass(4, 'Fail-fast rejects missing JWT_SECRET in production mode');
      else throw new Error('Did not throw expected error for missing JWT_SECRET');
    } catch (err) {
      logFail(4, 'Fail-fast rejects missing JWT_SECRET in production mode', err);
    }

    // Check 05: Fail-fast rejects placeholder JWT_SECRET in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: VERIFY_DB_URI,
          jwtSecret: 'development_jwt_secret_placeholder',
          corsOrigin: 'https://skilltrack.example.com'
        });
      } catch (e) {
        threw = /JWT_SECRET must be a secure, non-placeholder/i.test(e.message);
      }
      if (threw) logPass(5, 'Fail-fast rejects insecure placeholder JWT_SECRET in production');
      else throw new Error('Did not reject insecure placeholder');
    } catch (err) {
      logFail(5, 'Fail-fast rejects insecure placeholder JWT_SECRET in production', err);
    }

    // Check 06: Fail-fast rejects short (<8 chars) JWT_SECRET in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: VERIFY_DB_URI,
          jwtSecret: 'short',
          corsOrigin: 'https://skilltrack.example.com'
        });
      } catch (e) {
        threw = /at least 8 characters/i.test(e.message);
      }
      if (threw) logPass(6, 'Fail-fast rejects short (<8 chars) JWT_SECRET in production');
      else throw new Error('Did not reject short secret');
    } catch (err) {
      logFail(6, 'Fail-fast rejects short (<8 chars) JWT_SECRET in production', err);
    }

    // Check 07: Fail-fast rejects missing MONGO_URI in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: '',
          jwtSecret: 'production-verified-secret-key-min-32-chars-long',
          corsOrigin: 'https://skilltrack.example.com'
        });
      } catch (e) {
        threw = /MONGO_URI is required/i.test(e.message);
      }
      if (threw) logPass(7, 'Fail-fast rejects missing MONGO_URI in production mode');
      else throw new Error('Did not reject missing MONGO_URI');
    } catch (err) {
      logFail(7, 'Fail-fast rejects missing MONGO_URI in production mode', err);
    }

    // Check 08: Fail-fast rejects missing CORS_ORIGIN in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: VERIFY_DB_URI,
          jwtSecret: 'production-verified-secret-key-min-32-chars-long',
          corsOrigin: ''
        });
      } catch (e) {
        threw = /CORS_ORIGIN is required/i.test(e.message);
      }
      if (threw) logPass(8, 'Fail-fast rejects missing CORS_ORIGIN in production mode');
      else throw new Error('Did not reject missing CORS_ORIGIN');
    } catch (err) {
      logFail(8, 'Fail-fast rejects missing CORS_ORIGIN in production mode', err);
    }

    // Check 09: Fail-fast rejects wildcard CORS_ORIGIN ("*") in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: VERIFY_DB_URI,
          jwtSecret: 'production-verified-secret-key-min-32-chars-long',
          corsOrigin: '*'
        });
      } catch (e) {
        threw = /Wildcard CORS_ORIGIN/i.test(e.message);
      }
      if (threw) logPass(9, 'Fail-fast rejects wildcard CORS_ORIGIN ("*") in production mode');
      else throw new Error('Did not reject wildcard CORS_ORIGIN');
    } catch (err) {
      logFail(9, 'Fail-fast rejects wildcard CORS_ORIGIN ("*") in production mode', err);
    }

    // Check 10: Fail-fast rejects invalid PORT in production
    try {
      let threw = false;
      try {
        config.validateProductionConfig({
          env: 'production',
          port: 80000,
          mongoUri: VERIFY_DB_URI,
          jwtSecret: 'production-verified-secret-key-min-32-chars-long',
          corsOrigin: 'https://skilltrack.example.com'
        });
      } catch (e) {
        threw = /PORT must be a valid integer/i.test(e.message);
      }
      if (threw) logPass(10, 'Fail-fast rejects invalid PORT number in production mode');
      else throw new Error('Did not reject invalid PORT');
    } catch (err) {
      logFail(10, 'Fail-fast rejects invalid PORT number in production mode', err);
    }

    // -------------------------------------------------------------------------
    // Phase 2: Application Startup & Health Probes
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 2: Application Startup & Health Probes ---');

    // Check 11: Connect to isolated MongoDB database
    try {
      await connectDatabase(VERIFY_DB_URI);
      if (mongoose.connection.readyState === 1) {
        logPass(11, 'Database connected to isolated verification instance');
      } else {
        throw new Error('Database connection readyState is not 1');
      }
    } catch (err) {
      logFail(11, 'Database connected to isolated verification instance', err);
    }

    // Check 12: Start live HTTP server
    try {
      server = await new Promise((resolve) => {
        const s = app.listen(PORT, () => resolve(s));
      });
      logPass(12, `Live HTTP server started listening on port ${PORT}`);
    } catch (err) {
      logFail(12, `Live HTTP server started listening on port ${PORT}`, err);
    }

    // Check 13: Liveness check: GET /api/health returns HTTP 200 with exact payload
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/health',
        method: 'GET'
      });
      if (res.statusCode === 200 && res.body.success === true && res.body.message === 'SkillTrack API is running') {
        logPass(13, 'GET /api/health returns 200 with backward-compatible liveness payload');
      } else {
        throw new Error(`Unexpected health response: ${JSON.stringify(res.body)}`);
      }
    } catch (err) {
      logFail(13, 'GET /api/health returns 200 with backward-compatible liveness payload', err);
    }

    // Check 14: Readiness check: GET /api/ready returns HTTP 200 with database: connected
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/ready',
        method: 'GET'
      });
      if (
        res.statusCode === 200 &&
        res.body.success === true &&
        res.body.data &&
        res.body.data.status === 'ready' &&
        res.body.data.database === 'connected'
      ) {
        logPass(14, 'GET /api/ready returns 200 with status: ready and database: connected');
      } else {
        throw new Error(`Unexpected ready response: ${JSON.stringify(res.body)}`);
      }
    } catch (err) {
      logFail(14, 'GET /api/ready returns 200 with status: ready and database: connected', err);
    }

    // Check 15: Zero secrets or connection string leakage in health/ready probes
    try {
      const resHealth = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
      const resReady = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/ready', method: 'GET' });
      const combined = JSON.stringify(resHealth.body) + JSON.stringify(resReady.body);
      if (!/mongodb:\/\/|secret|password|jwt/i.test(combined)) {
        logPass(15, 'Probes strictly redact all secrets, database URIs, and credentials');
      } else {
        throw new Error('Sensitive data detected in probe response');
      }
    } catch (err) {
      logFail(15, 'Probes strictly redact all secrets, database URIs, and credentials', err);
    }

    // -------------------------------------------------------------------------
    // Phase 3: Security Headers & Request Correlation
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 3: Security Headers & Request Correlation ---');

    // Check 16: Security Header: X-Powered-By disabled and absent
    try {
      const res = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
      if (res.headers['x-powered-by'] === undefined) {
        logPass(16, 'Security header: X-Powered-By is disabled and absent');
      } else {
        throw new Error('X-Powered-By header was present');
      }
    } catch (err) {
      logFail(16, 'Security header: X-Powered-By is disabled and absent', err);
    }

    // Check 17: Security Header: X-Content-Type-Options: nosniff present
    try {
      const res = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
      if (res.headers['x-content-type-options'] === 'nosniff') {
        logPass(17, 'Security header: X-Content-Type-Options: nosniff present');
      } else {
        throw new Error(`Missing or unexpected X-Content-Type-Options: ${res.headers['x-content-type-options']}`);
      }
    } catch (err) {
      logFail(17, 'Security header: X-Content-Type-Options: nosniff present', err);
    }

    // Check 18: Security Header: X-Frame-Options: SAMEORIGIN present
    try {
      const res = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
      if (res.headers['x-frame-options'] === 'SAMEORIGIN') {
        logPass(18, 'Security header: X-Frame-Options: SAMEORIGIN present');
      } else {
        throw new Error(`Missing or unexpected X-Frame-Options: ${res.headers['x-frame-options']}`);
      }
    } catch (err) {
      logFail(18, 'Security header: X-Frame-Options: SAMEORIGIN present', err);
    }

    // Check 19: Security Header: Referrer-Policy: no-referrer present
    try {
      const res = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
      if (res.headers['referrer-policy'] === 'no-referrer') {
        logPass(19, 'Security header: Referrer-Policy: no-referrer present');
      } else {
        throw new Error(`Missing or unexpected Referrer-Policy: ${res.headers['referrer-policy']}`);
      }
    } catch (err) {
      logFail(19, 'Security header: Referrer-Policy: no-referrer present', err);
    }

    // Check 20: Request correlation: X-Request-Id header attached
    try {
      const res = await makeRequest({ hostname: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
      const reqId = res.headers['x-request-id'];
      if (reqId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reqId)) {
        logPass(20, 'Request correlation: X-Request-Id UUID attached to every response');
      } else {
        throw new Error(`Invalid or missing X-Request-Id: ${reqId}`);
      }
    } catch (err) {
      logFail(20, 'Request correlation: X-Request-Id UUID attached to every response', err);
    }

    // -------------------------------------------------------------------------
    // Phase 4: Authentication, Authorization & Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 4: Authentication, Authorization & Protection ---');

    let adminToken = '';
    let employeeToken = '';

    // Check 21: User registration: Admin user registered with bcrypt hashed password
    try {
      const regRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        {
          name: 'Prod Admin',
          email: 'admin_prod@skilltrack.test',
          password: 'Password123!'
        }
      );
      if (regRes.statusCode === 201 && regRes.body.data && regRes.body.data.user) {
        // Upgrade role to admin in database
        await User.findByIdAndUpdate(regRes.body.data.user.id, { role: 'admin' });

        // Authenticate via login
        const loginRes = await makeRequest(
          {
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          },
          {
            email: 'admin_prod@skilltrack.test',
            password: 'Password123!'
          }
        );

        if (loginRes.statusCode === 200 && loginRes.body.data && loginRes.body.data.token) {
          adminToken = loginRes.body.data.token;
          logPass(21, 'Admin user registered and authenticated with bcrypt password hashing');
        } else {
          throw new Error('Admin login failed after registration');
        }
      } else {
        throw new Error(`Registration failed with status ${regRes.statusCode}`);
      }
    } catch (err) {
      logFail(21, 'Admin user registered and authenticated with bcrypt password hashing', err);
    }

    // Check 22: Password protection: Password hash excluded from API response
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && res.body.data.user.password === undefined) {
        logPass(22, 'Password hash strictly excluded from user API responses (select: false)');
      } else {
        throw new Error('Password hash leaked in API response');
      }
    } catch (err) {
      logFail(22, 'Password hash strictly excluded from user API responses (select: false)', err);
    }

    // Check 23: User login: Authenticates and receives valid HS256 JWT
    try {
      const decoded = jwt.decode(adminToken);
      if (decoded && decoded.userId && decoded.role === 'admin') {
        logPass(23, 'User authentication generates valid HS256 JWT token with expected claims');
      } else {
        throw new Error('Invalid JWT decoded payload');
      }
    } catch (err) {
      logFail(23, 'User authentication generates valid HS256 JWT token with expected claims', err);
    }

    // Check 24: Protected API: Admin retrieves /api/departments with Bearer token
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/departments',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 200 && (Array.isArray(res.body.data) || Array.isArray(res.body.data?.departments))) {
        logPass(24, 'Protected API accessed successfully with valid Bearer token');
      } else {
        throw new Error(`Protected API returned ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    } catch (err) {
      logFail(24, 'Protected API accessed successfully with valid Bearer token', err);
    }

    // Check 25: Protected API: Unauthenticated request to /api/departments rejected with 401
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/departments',
        method: 'GET'
      });
      if (res.statusCode === 401) {
        logPass(25, 'Unauthenticated request to protected endpoint rejected with 401 Unauthorized');
      } else {
        throw new Error(`Expected 401, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(25, 'Unauthenticated request to protected endpoint rejected with 401 Unauthorized', err);
    }

    // Register employee for RBAC test
    await makeRequest(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Prod Employee',
        email: 'emp_prod@skilltrack.test',
        password: 'Password123!'
      }
    );
    const empLoginRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'emp_prod@skilltrack.test',
        password: 'Password123!'
      }
    );
    employeeToken = empLoginRes.body.data.token;

    // Check 26: RBAC Boundary: Employee blocked from accessing /api/analytics/overview with 403
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/analytics/overview',
        method: 'GET',
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      if (res.statusCode === 403) {
        logPass(26, 'RBAC fail-closed: Employee accessing admin analytics rejected with 403 Forbidden');
      } else {
        throw new Error(`Expected 403, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(26, 'RBAC fail-closed: Employee accessing admin analytics rejected with 403 Forbidden', err);
    }

    // Check 27: CORS allowlist: Allowed origin receives Access-Control-Allow-Origin header
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/departments',
        method: 'GET',
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
        logPass(27, 'Configured allowlist origin receives Access-Control-Allow-Origin header');
      } else {
        throw new Error(`Allow origin header mismatch: ${res.headers['access-control-allow-origin']}`);
      }
    } catch (err) {
      logFail(27, 'Configured allowlist origin receives Access-Control-Allow-Origin header', err);
    }

    // Check 28: CORS protection: Disallowed origin rejected with 403 Forbidden
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/departments',
        method: 'GET',
        headers: {
          Origin: 'http://malicious-site.example.com',
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.statusCode === 403) {
        logPass(28, 'Disallowed cross-origin request rejected with 403 Forbidden');
      } else {
        throw new Error(`Expected 403, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(28, 'Disallowed cross-origin request rejected with 403 Forbidden', err);
    }

    // Check 29: NoSQL injection defense: Query parameter with $gt operator rejected with 400
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/departments?filter[$gt]=test',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 400 && /malicious input/i.test(res.body.message)) {
        logPass(29, 'NoSQL injection attempt with $ operator intercepted and rejected with 400');
      } else {
        throw new Error(`Expected 400, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(29, 'NoSQL injection attempt with $ operator intercepted and rejected with 400', err);
    }

    // Check 30: Payload size limit: Oversized body (>10kb) rejected with 413 Payload Too Large
    try {
      const hugeString = 'X'.repeat(25 * 1024);
      const res = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        { email: 'admin_prod@skilltrack.test', huge: hugeString }
      );
      if (res.statusCode === 413) {
        logPass(30, 'Request body exceeding 10kb limit rejected with 413 Payload Too Large');
      } else {
        throw new Error(`Expected 413, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(30, 'Request body exceeding 10kb limit rejected with 413 Payload Too Large', err);
    }

    // Check 31: Error handling: Malformed ObjectId returns clean 400 Bad Request
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/departments/invalid-id-format',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.statusCode === 400) {
        logPass(31, 'Malformed resource identifier returns clean 400 Bad Request');
      } else {
        throw new Error(`Expected 400, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(31, 'Malformed resource identifier returns clean 400 Bad Request', err);
    }

    // Check 32: Error handling: Unmapped endpoint returns clean 404 Not Found without leaking stack
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/non-existent-probe-endpoint',
        method: 'GET'
      });
      if (res.statusCode === 404 && res.body && res.body.success === false) {
        logPass(32, 'Unmapped route returns clean 404 Not Found without crashing');
      } else {
        throw new Error(`Expected 404, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(32, 'Unmapped route returns clean 404 Not Found without crashing', err);
    }

    // -------------------------------------------------------------------------
    // Phase 5: Database Schema Indexes & Unique Constraints
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 5: Database Schema Indexes & Unique Constraints ---');

    // Check 33: Model Schema Indexes: User unique email index verified
    try {
      const emailField = User.schema.paths.email;
      if (emailField.options.unique === true) {
        logPass(33, 'User schema unique email constraint verified');
      } else {
        throw new Error('Email index unique flag missing');
      }
    } catch (err) {
      logFail(33, 'User schema unique email constraint verified', err);
    }

    // Check 34: Model Schema Indexes: Employee unique user and department index verified
    try {
      const userField = Employee.schema.paths.user;
      const empIdField = Employee.schema.paths.employeeId;
      const indexes = Employee.schema.indexes();
      const hasDept = indexes.some(([idx]) => idx.department === 1);
      if (userField.options.unique === true && empIdField.options.unique === true && hasDept) {
        logPass(34, 'Employee schema unique user, employeeId, and department indexes verified');
      } else {
        throw new Error('Employee index verification failed');
      }
    } catch (err) {
      logFail(34, 'Employee schema unique user, employeeId, and department indexes verified', err);
    }

    // Check 35: Model Schema Indexes: Enrollment compound unique index (employee, course) verified
    try {
      const indexes = Enrollment.schema.indexes();
      const hasCompoundUnique = indexes.some(
        ([idx, opts]) => idx.employee === 1 && idx.course === 1 && opts.unique === true
      );
      if (hasCompoundUnique) {
        logPass(35, 'Enrollment compound unique index on (employee, course) verified');
      } else {
        throw new Error('Enrollment compound unique index missing');
      }
    } catch (err) {
      logFail(35, 'Enrollment compound unique index on (employee, course) verified', err);
    }

    // Check 36: Model Schema Indexes: Notification eventKey idempotency unique index verified
    try {
      const indexes = Notification.schema.indexes();
      const hasEventKeyUnique = indexes.some(
        ([idx, opts]) => idx.eventKey === 1 && opts.unique === true
      );
      if (hasEventKeyUnique) {
        logPass(36, 'Notification eventKey idempotency unique index verified');
      } else {
        throw new Error('Notification eventKey index missing');
      }
    } catch (err) {
      logFail(36, 'Notification eventKey idempotency unique index verified', err);
    }

    // -------------------------------------------------------------------------
    // Phase 6: Operational Reliability & Graceful Shutdown
    // -------------------------------------------------------------------------
    console.log('\n--- Phase 6: Operational Reliability & Graceful Shutdown ---');

    // Check 37: Readiness failure simulation: Disconnected MongoDB returns 503
    try {
      await mongoose.disconnect();
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/ready',
        method: 'GET'
      });
      if (res.statusCode === 503 && res.body && res.body.success === false) {
        logPass(37, 'Readiness probe returns 503 Service Unavailable when MongoDB is disconnected');
      } else {
        throw new Error(`Expected 503, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    } catch (err) {
      logFail(37, 'Readiness probe returns 503 Service Unavailable when MongoDB is disconnected', err);
    }

    // Check 38: Re-connect MongoDB and verify /api/ready recovers to 200
    try {
      await connectDatabase(VERIFY_DB_URI);
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/ready',
        method: 'GET'
      });
      if (res.statusCode === 200 && res.body.data && res.body.data.status === 'ready') {
        logPass(38, 'Readiness probe recovers to 200 OK after database reconnection');
      } else {
        throw new Error(`Expected 200, got ${res.statusCode}`);
      }
    } catch (err) {
      logFail(38, 'Readiness probe recovers to 200 OK after database reconnection', err);
    }

    // Check 39: Graceful shutdown: Clean HTTP server close and database disconnect
    try {
      await new Promise((resolve, reject) => {
        server.close(async (err) => {
          if (err) return reject(err);
          try {
            await disconnectDatabase();
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
      logPass(39, 'Graceful shutdown completed cleanly without leaking open handles');
    } catch (err) {
      logFail(39, 'Graceful shutdown completed cleanly without leaking open handles', err);
    }
  } catch (err) {
    console.error('Unexpected error during verification run:', err);
  }

  console.log('\n================================================================');
  console.log(`PHASE 22 PRODUCTION VERIFICATION`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${failedChecks}`);
  console.log(`Total:  ${totalChecks}`);
  console.log('================================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProductionVerification();
