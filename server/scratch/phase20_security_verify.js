/**
 * Phase 20 — Security Hardening Live Integration Verification
 * Runs 50 live assertions against isolated MongoDB database:
 * skilltrack_phase20_security_verify
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const config = require('../src/config');

const VERIFY_DB_URI = 'mongodb://127.0.0.1:27017/skilltrack_phase20_security_verify';
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;
let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (!condition) {
    console.error(`❌ Check ${totalChecks} FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedChecks++;
  console.log(`✅ Check ${totalChecks} PASSED: ${message}`);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof Buffer) && typeof body !== 'string') {
    body = JSON.stringify(body);
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: body || undefined
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('SKILLTRACK PHASE 20 — SECURITY HARDENING VERIFICATION');
  console.log('====================================================\n');

  // Connect to isolated verification database
  await mongoose.connect(VERIFY_DB_URI);
  await User.deleteMany({});
  await Department.deleteMany({});

  // Start HTTP server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Live verification server listening at ${BASE_URL}\n`);

  try {
    // ----------------------------------------------------
    // Section 1: Configuration Enforcement (Checks 1 - 4)
    // ----------------------------------------------------
    console.log('--- Section 1: Secure Configuration Enforcement ---');
    const validProd = config.loadConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'super_secure_prod_secret_2026!',
      CORS_ORIGIN: 'https://skilltrack.live'
    });
    assert(validProd.isProduction === true && validProd.port === 5000, 'Valid production config accepted');

    let threwMissingJwt = false;
    try {
      config.loadConfig({ NODE_ENV: 'production', JWT_SECRET: '' });
    } catch (e) {
      threwMissingJwt = /jwt_secret is required in production/i.test(e.message);
    }
    assert(threwMissingJwt, 'Config rejects missing JWT_SECRET in production');

    let threwPlaceholder = false;
    try {
      config.loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'development_jwt_secret_placeholder' });
    } catch (e) {
      threwPlaceholder = /must be a secure, non-placeholder secret/i.test(e.message);
    }
    assert(threwPlaceholder, 'Config rejects insecure placeholder JWT_SECRET in production');

    let threwWildcardCors = false;
    try {
      config.loadConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'super_secure_prod_secret_2026!',
        CORS_ORIGIN: '*'
      });
    } catch (e) {
      threwWildcardCors = /wildcard cors_origin.*not allowed in production/i.test(e.message);
    }
    assert(threwWildcardCors, 'Config rejects wildcard CORS_ORIGIN in production');

    // ----------------------------------------------------
    // Section 2: HTTP Security Headers & Correlation (Checks 5 - 10)
    // ----------------------------------------------------
    console.log('\n--- Section 2: HTTP Security Headers & Correlation ---');
    const headerRes1 = await request('/api/auth/me');
    assert(headerRes1.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff header present');
    assert(
      headerRes1.headers.get('x-frame-options') === 'SAMEORIGIN' ||
        headerRes1.headers.get('x-frame-options') === 'DENY',
      'X-Frame-Options header present'
    );
    assert(headerRes1.headers.get('referrer-policy') === 'no-referrer', 'Referrer-Policy: no-referrer header present');
    assert(headerRes1.headers.get('x-powered-by') === null, 'X-Powered-By header disabled and absent');
    const reqId1 = headerRes1.headers.get('x-request-id');
    assert(reqId1 && reqId1.length > 10, 'X-Request-Id correlation header present');

    const headerRes2 = await request('/api/auth/me');
    const reqId2 = headerRes2.headers.get('x-request-id');
    assert(reqId2 && reqId2 !== reqId1, 'Subsequent request receives unique correlation ID');

    // ----------------------------------------------------
    // Section 3: CORS Hardening (Checks 11 - 17)
    // ----------------------------------------------------
    console.log('\n--- Section 3: CORS Hardening ---');
    const corsRes1 = await request('/api/auth/me', {
      headers: { Origin: 'http://localhost:3000' }
    });
    assert(corsRes1.headers.get('access-control-allow-origin') === 'http://localhost:3000', 'Allowed origin localhost:3000 receives Allow-Origin header');

    const corsRes2 = await request('/api/auth/me', {
      headers: { Origin: 'http://127.0.0.1:3000' }
    });
    assert(corsRes2.headers.get('access-control-allow-origin') === 'http://127.0.0.1:3000', 'Allowed origin 127.0.0.1:3000 receives Allow-Origin header');

    const corsRes3 = await request('/api/auth/me', {
      headers: { Origin: 'http://attacker-evil.com' }
    });
    assert(corsRes3.status === 403, 'Disallowed origin receives 403 Forbidden');
    assert(corsRes3.headers.get('access-control-allow-origin') === null, 'Disallowed origin is NOT reflected in Allow-Origin header');

    const corsPreflightAllowed = await request('/api/departments', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert(corsPreflightAllowed.status === 204, 'Preflight OPTIONS from allowed origin returns 204');

    const corsPreflightDenied = await request('/api/departments', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil-attacker.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert(corsPreflightDenied.status === 403, 'Preflight OPTIONS from disallowed origin returns 403');

    const corsNoOrigin = await request('/api/auth/me');
    assert(corsNoOrigin.status === 401, 'Request without Origin header (curl/mobile) proceeds to auth check');

    // Seed Admin & Employee for Authenticated Checks
    const adminUser = await User.create({
      name: 'Verify Admin',
      email: 'admin@verify.test',
      password: 'AdminPassword123!',
      role: 'admin'
    });
    const adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: adminUser.role },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const employeeUser = await User.create({
      name: 'Verify Employee',
      email: 'employee@verify.test',
      password: 'EmployeePassword123!',
      role: 'employee'
    });
    const employeeToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: employeeUser.role },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // ----------------------------------------------------
    // Section 4: NoSQL Injection & Prototype Pollution Defense (Checks 18 - 30)
    // ----------------------------------------------------
    console.log('\n--- Section 4: NoSQL Injection & Input Sanitization Defense ---');
    const nosql1 = await request('/api/departments?filter[$gt]=1', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(nosql1.status === 400 && /malicious input|nosql/i.test(nosql1.data.message), 'Query param with $ operator rejected with 400');

    const nosql2 = await request('/api/departments?$where=true', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(nosql2.status === 400, 'Query param with $where rejected with 400');

    const nosql3 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { $gt: { name: 'Injection' } }
    });
    assert(nosql3.status === 400, 'Body with root $gt operator rejected with 400');

    const nosql4 = await request('/api/auth/login', {
      method: 'POST',
      body: { email: { $ne: null }, password: 'Password123!' }
    });
    assert(nosql4.status === 400, 'Body with nested $ne in login rejected with 400');

    const nosql5 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { 'user.role': 'admin' }
    });
    assert(nosql5.status === 400, 'Body with dot-path key (user.role) rejected with 400');

    const nosql6 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { metadata: { 'deep.nested.path': 'value' } }
    });
    assert(nosql6.status === 400, 'Body with deep nested dot-path key rejected with 400');

    const nosql7 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { items: [{ $regex: '.*' }] }
    });
    assert(nosql7.status === 400, 'Body with operator inside nested array rejected with 400');

    const nosql8 = await request('/api/departments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: '{"__proto__": {"isAdmin": true}, "name": "Dept Proto"}'
    });
    assert(nosql8.status === 400, 'Body with __proto__ pollution attempt rejected with 400');

    const nosql9 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { constructor: { prototype: { isAdmin: true } }, name: 'Dept Ctor' }
    });
    assert(nosql9.status === 400, 'Body with constructor pollution attempt rejected with 400');

    const nosql10 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { prototype: { isAdmin: true }, name: 'Dept ProtoKey' }
    });
    assert(nosql10.status === 400, 'Body with prototype key pollution attempt rejected with 400');

    const nosql11 = await request('/api/departments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'name[$gt]=Admin'
    });
    assert(nosql11.status === 400, 'URL-encoded body with $ operator rejected with 400');

    const nosql12 = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Finance Dept', description: 'Budget of $2,000,000 allocated' }
    });
    assert(nosql12.status === 201 && nosql12.data.data.department.description.includes('$2,000,000'), 'Legitimate string value containing $ is accepted');

    const nosql13 = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Valid User', email: 'valid.user.name@verify.test', password: 'Password123!' }
    });
    assert(nosql13.status === 201 && nosql13.data.data.user.email === 'valid.user.name@verify.test', 'Legitimate string value containing . (email) is accepted');

    // ----------------------------------------------------
    // Section 5: Authentication & JWT Hardening (Checks 31 - 42)
    // ----------------------------------------------------
    console.log('\n--- Section 5: Authentication & JWT Hardening ---');
    const auth1 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert(auth1.status === 200 && auth1.data.data.user.email === employeeUser.email, 'HS256 signed JWT authenticates successfully');

    const headerNone = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payloadNone = Buffer.from(JSON.stringify({ userId: employeeUser._id.toString(), role: 'admin' })).toString('base64url');
    const noneToken = `${headerNone}.${payloadNone}.`;
    const auth2 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${noneToken}` }
    });
    assert(auth2.status === 401, 'Token signed with alg "none" rejected with 401');

    const headerRs = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const rsToken = `${headerRs}.${payloadNone}.${Buffer.from('fakesig').toString('base64url')}`;
    const auth3 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${rsToken}` }
    });
    assert(auth3.status === 401, 'Token claiming alg "RS256" rejected with 401');

    const tamperedParts = employeeToken.split('.');
    const tamperedToken = `${tamperedParts[0]}.${tamperedParts[1]}.${tamperedParts[2].slice(0, -4)}zzzz`;
    const auth4 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    assert(auth4.status === 401, 'Tampered JWT signature rejected with 401');

    const expiredToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: employeeUser.role },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '-10s' }
    );
    const auth5 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(auth5.status === 401, 'Expired JWT rejected with 401');

    const wrongKeyToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: employeeUser.role },
      'wrong_key_attacker',
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const auth6 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${wrongKeyToken}` }
    });
    assert(auth6.status === 401, 'Token signed with wrong key rejected with 401');

    const auth7 = await request('/api/auth/me');
    assert(auth7.status === 401, 'Missing Authorization header rejected with 401');

    const auth8 = await request('/api/auth/me', {
      headers: { Authorization: `Basic ${Buffer.from('admin:pass').toString('base64')}` }
    });
    assert(auth8.status === 401, 'Basic Authorization scheme rejected with 401');

    const auth9 = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer ' }
    });
    assert(auth9.status === 401, 'Empty Bearer token rejected with 401');

    const auth10 = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer invalid.not.a.token' }
    });
    assert(auth10.status === 401, 'Malformed token string rejected with 401');

    const emptyClaimToken = jwt.sign({}, config.jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });
    const auth11 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${emptyClaimToken}` }
    });
    assert(auth11.status === 401, 'Empty payload claim rejected with 401');

    const inactiveUser = await User.create({
      name: 'Inactive Guy',
      email: 'inactive.verify@test.com',
      password: 'Password123!',
      isActive: false
    });
    const inactiveToken = jwt.sign(
      { userId: inactiveUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const auth12 = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${inactiveToken}` }
    });
    assert(auth12.status === 401, 'Inactive user token rejected with 401');

    // ----------------------------------------------------
    // Section 6: Password Security (Checks 43 - 47)
    // ----------------------------------------------------
    console.log('\n--- Section 6: Password Security ---');
    const userInDb = await User.findById(adminUser._id).select('+password');
    assert(userInDb.password && userInDb.password.startsWith('$2') && parseInt(userInDb.password.split('$')[2], 10) >= 10, 'Password hash uses bcrypt with >= 10 salt rounds');

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Reg Check', email: 'regcheck@verify.test', password: 'SecretPassword123!' }
    });
    assert(regRes.status === 201 && regRes.data.data.user.password === undefined && regRes.data.data.user.passwordHash === undefined, 'Registration response omits plaintext password and hash');

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'regcheck@verify.test', password: 'SecretPassword123!' }
    });
    assert(loginRes.status === 200 && loginRes.data.data.user.password === undefined && loginRes.data.data.user.passwordHash === undefined, 'Login response omits plaintext password and hash');

    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${loginRes.data.data.token}` }
    });
    assert(meRes.status === 200 && meRes.data.data.user.password === undefined && meRes.data.data.user.passwordHash === undefined, '/me response omits plaintext password and hash');

    const injRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Inj Check',
        email: 'injcheck@verify.test',
        password: 'ValidPassword123!',
        passwordHash: '$2a$10$arbitraryInjectedHashString'
      }
    });
    const injUser = await User.findOne({ email: 'injcheck@verify.test' }).select('+password');
    const compareOk = await injUser.comparePassword('ValidPassword123!');
    assert(injRes.status === 201 && compareOk === true, 'Client passwordHash injection ignored; password hashed via bcrypt');

    // ----------------------------------------------------
    // Section 7: Body Size Limits, Error Handling & RBAC (Checks 48 - 50)
    // ----------------------------------------------------
    console.log('\n--- Section 7: Body Size Limits, Error Handling & RBAC ---');
    const oversizedBody = { name: 'Oversized Dept', description: 'X'.repeat(20 * 1024) };
    const limitRes = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: oversizedBody
    });
    assert(limitRes.status === 413 && /payload too large/i.test(limitRes.data.message), 'Payload exceeding 10kb bodyLimit rejected with 413 Payload Too Large');

    const invalidIdRes = await request('/api/departments/malformed-id-12345', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invalidIdRes.status === 400 && /invalid.*(?:id|identifier)/i.test(invalidIdRes.data.message), 'Malformed ObjectId handled with 400 Bad Request');

    const rbacRes = await request('/api/departments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: { name: 'Unauthorized Dept' }
    });
    assert(rbacRes.status === 403 && /permission|access denied|forbidden/i.test(rbacRes.data.message), 'RBAC fail-closed: Employee cannot access Admin department management (403)');

    console.log('\n====================================================');
    console.log(`VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED`);
    console.log('====================================================\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await User.deleteMany({});
    await Department.deleteMany({});
    await mongoose.connection.close();
  }
}

runVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed with error:', err);
    process.exit(1);
  });
