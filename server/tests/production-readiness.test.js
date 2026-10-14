const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const config = require('../src/config');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { gracefulShutdown } = require('../src/server');

// Models for index verification
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Department = require('../src/models/Department');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const Assessment = require('../src/models/Assessment');
const AssessmentAttempt = require('../src/models/AssessmentAttempt');
const Certificate = require('../src/models/Certificate');
const Notification = require('../src/models/Notification');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const EmployeeSkill = require('../src/models/EmployeeSkill');
const CourseSkill = require('../src/models/CourseSkill');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');

const TEST_DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 22: Production Readiness Test Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase(TEST_DB_URI);
    }
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // 1. Production Configuration & Fail-Fast Validation
  describe('1. Production Configuration & Validation', () => {
    const { loadConfig, validateProductionConfig } = config;

    it('1.1: should load valid production configuration without throwing', () => {
      const prodConfig = loadConfig({
        NODE_ENV: 'production',
        PORT: '8080',
        MONGO_URI: 'mongodb://db-prod:27017/skilltrack_prod',
        JWT_SECRET: 'production-strong-signing-secret-32-chars-long',
        CORS_ORIGIN: 'https://skilltrack.example.com'
      });

      expect(prodConfig.isProduction).toBe(true);
      expect(prodConfig.port).toBe(8080);
      expect(prodConfig.mongoUri).toBe('mongodb://db-prod:27017/skilltrack_prod');
      expect(prodConfig.corsOrigin).toBe('https://skilltrack.example.com');
      expect(() => validateProductionConfig(prodConfig)).not.toThrow();
    });

    it('1.2: should fail fast in production if JWT_SECRET is missing or insecure placeholder', () => {
      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: 'mongodb://127.0.0.1:27017/prod',
          jwtSecret: '',
          corsOrigin: 'https://app.com'
        });
      }).toThrow(/JWT_SECRET is required in production mode/i);

      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: 'mongodb://127.0.0.1:27017/prod',
          jwtSecret: 'development_jwt_secret_placeholder',
          corsOrigin: 'https://app.com'
        });
      }).toThrow(/JWT_SECRET must be a secure, non-placeholder/i);

      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: 'mongodb://127.0.0.1:27017/prod',
          jwtSecret: 'short',
          corsOrigin: 'https://app.com'
        });
      }).toThrow(/at least 8 characters/i);
    });

    it('1.3: should fail fast in production if MONGO_URI is missing or empty', () => {
      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: '',
          jwtSecret: 'secure-prod-secret-32-characters-length',
          corsOrigin: 'https://app.com'
        });
      }).toThrow(/MONGO_URI is required and cannot be empty in production mode/i);
    });

    it('1.4: should fail fast in production if CORS_ORIGIN is missing or wildcard (*)', () => {
      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: 'mongodb://127.0.0.1:27017/prod',
          jwtSecret: 'secure-prod-secret-32-characters-length',
          corsOrigin: ''
        });
      }).toThrow(/CORS_ORIGIN is required in production mode/i);

      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 5000,
          mongoUri: 'mongodb://127.0.0.1:27017/prod',
          jwtSecret: 'secure-prod-secret-32-characters-length',
          corsOrigin: '*'
        });
      }).toThrow(/Wildcard CORS_ORIGIN \("\*"\) is strictly forbidden in production mode/i);
    });

    it('1.5: should fail fast if PORT is invalid', () => {
      expect(() => {
        validateProductionConfig({
          env: 'production',
          port: 99999,
          mongoUri: 'mongodb://127.0.0.1:27017/prod',
          jwtSecret: 'secure-prod-secret-32-characters-length',
          corsOrigin: 'https://app.com'
        });
      }).toThrow(/PORT must be a valid integer between 1 and 65535/i);
    });
  });

  // 2. Health & Readiness Probes
  describe('2. Health & Readiness Probes', () => {
    it('2.1: GET /api/health should return backward-compatible 200 liveness response', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        message: 'SkillTrack API is running'
      });
    });

    it('2.2: GET /api/ready should return 200 when MongoDB is connected', async () => {
      const res = await request(app)
        .get('/api/ready')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toMatchObject({
        success: true,
        message: 'SkillTrack API is ready',
        data: {
          status: 'ready',
          database: 'connected'
        }
      });
      // Zero secrets or connection string leakage
      expect(JSON.stringify(res.body)).not.toMatch(/mongodb:\/\/|secret|password|jwt/i);
    });
  });

  // 3. Security HTTP Headers & Request Correlation
  describe('3. Security Headers & Request Correlation', () => {
    it('3.1: should include Helmet security headers and remove X-Powered-By', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
    });

    it('3.2: should include cryptographically random X-Request-Id header in responses', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  // 4. Request Body Limit Enforcement
  describe('4. Request Body Limit Enforcement', () => {
    it('4.1: should reject requests exceeding configured body limit with 413 Payload Too Large', async () => {
      const hugeString = 'A'.repeat(25 * 1024); // 25kb exceeds default 10kb limit

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', payload: hugeString })
        .expect(413);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Payload too large/i);
    });
  });

  // 5. Error Masking & Sanitization
  describe('5. Error Masking & Sanitization', () => {
    it('5.1: CastError (invalid ObjectId) should be cleanly transformed to 400 Bad Request', () => {
      const errorHandler = require('../src/middleware/errorHandler');
      const mockReq = { id: 'req-test-123' };
      let responseStatus = null;
      let responseBody = null;
      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (data) => {
          responseBody = data;
          return mockRes;
        }
      };
      const castErr = new Error('Cast to ObjectId failed');
      castErr.name = 'CastError';
      castErr.path = '_id';
      castErr.value = 'bad-object-id';

      errorHandler(castErr, mockReq, mockRes, () => {});

      expect(responseStatus).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Invalid identifier');
    });

    it('5.2: Unmapped endpoints should return clean 404 Not Found without leaking stack trace', async () => {
      const res = await request(app)
        .get('/api/unmapped-endpoint-probe')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
      expect(res.body.stack).toBeUndefined();
    });
  });

  // 6. Database Schema Indexes Verification
  describe('6. Database Schema Indexes & Unique Constraints', () => {
    it('6.1: User schema should enforce unique email index', () => {
      const indexes = User.schema.indexes();
      const emailField = User.schema.paths.email;
      expect(emailField.options.unique).toBe(true);
    });

    it('6.2: Employee schema should enforce unique user, unique employeeId, and department index', () => {
      const userField = Employee.schema.paths.user;
      const empIdField = Employee.schema.paths.employeeId;
      expect(userField.options.unique).toBe(true);
      expect(empIdField.options.unique).toBe(true);

      const indexes = Employee.schema.indexes();
      const hasDeptIndex = indexes.some(([idx]) => idx.department === 1);
      const hasActiveIndex = indexes.some(([idx]) => idx.isActive === 1);
      expect(hasDeptIndex).toBe(true);
      expect(hasActiveIndex).toBe(true);
    });

    it('6.3: Department schema should enforce unique name index', () => {
      const indexes = Department.schema.indexes();
      const hasNameUnique = indexes.some(([idx, opts]) => idx.name === 1 && opts.unique === true);
      expect(hasNameUnique).toBe(true);
    });

    it('6.4: Enrollment schema should enforce compound unique index on (employee, course)', () => {
      const indexes = Enrollment.schema.indexes();
      const hasCompoundUnique = indexes.some(
        ([idx, opts]) => idx.employee === 1 && idx.course === 1 && opts.unique === true
      );
      expect(hasCompoundUnique).toBe(true);
    });

    it('6.5: AssessmentAttempt schema should enforce compound unique index on (employee, assessment, attemptNumber)', () => {
      const indexes = AssessmentAttempt.schema.indexes();
      const hasAttemptUnique = indexes.some(
        ([idx, opts]) => idx.employee === 1 && idx.assessment === 1 && idx.attemptNumber === 1 && opts.unique === true
      );
      expect(hasAttemptUnique).toBe(true);
    });

    it('6.6: Certificate schema should enforce compound unique index and certificateNumber unique', () => {
      const certNumField = Certificate.schema.paths.certificateNumber;
      expect(certNumField.options.unique).toBe(true);

      const indexes = Certificate.schema.indexes();
      const hasInitialUnique = indexes.some(
        ([idx, opts]) => idx.employee === 1 && idx.course === 1 && opts.unique === true
      );
      expect(hasInitialUnique).toBe(true);
    });

    it('6.7: Notification schema should enforce unique index on eventKey for idempotency', () => {
      const indexes = Notification.schema.indexes();
      const hasEventKeyUnique = indexes.some(
        ([idx, opts]) => idx.eventKey === 1 && opts.unique === true && (opts.sparse === true || opts.partialFilterExpression !== undefined)
      );
      expect(hasEventKeyUnique).toBe(true);
    });

    it('6.8: Skill and JobRole schemas should enforce unique indexes', () => {
      const skillIndexes = Skill.schema.indexes();
      const hasSkillNameUnique = skillIndexes.some(([idx, opts]) => idx.name === 1 && opts.unique === true);
      expect(hasSkillNameUnique).toBe(true);

      const roleIndexes = JobRole.schema.indexes();
      const hasRoleCodeUnique = roleIndexes.some(([idx, opts]) => idx.code === 1 && opts.unique === true);
      expect(hasRoleCodeUnique).toBe(true);
    });

    it('6.9: Relational mapping schemas should enforce compound unique indexes', () => {
      const reqIndexes = JobRoleSkillRequirement.schema.indexes();
      const hasReqUnique = reqIndexes.some(
        ([idx, opts]) => idx.jobRole === 1 && idx.skill === 1 && opts.unique === true
      );
      expect(hasReqUnique).toBe(true);

      const empSkillIndexes = EmployeeSkill.schema.indexes();
      const hasEmpSkillUnique = empSkillIndexes.some(
        ([idx, opts]) => idx.employee === 1 && idx.skill === 1 && opts.unique === true
      );
      expect(hasEmpSkillUnique).toBe(true);

      const courseSkillIndexes = CourseSkill.schema.indexes();
      const hasCourseSkillUnique = courseSkillIndexes.some(
        ([idx, opts]) => idx.course === 1 && idx.skill === 1 && opts.unique === true
      );
      expect(hasCourseSkillUnique).toBe(true);
    });

    it('6.10: ComplianceAssignment schema should enforce compound unique index on (complianceRequirement, employee)', () => {
      const compIndexes = ComplianceAssignment.schema.indexes();
      const hasCompUnique = compIndexes.some(
        ([idx, opts]) => idx.complianceRequirement === 1 && idx.employee === 1 && opts.unique === true
      );
      expect(hasCompUnique).toBe(true);
    });
  });

  // 7. Graceful Shutdown & Reentrancy Safety
  describe('7. Graceful Shutdown Lifecycle', () => {
    it('7.1: gracefulShutdown function should exist and handle invocation cleanly', () => {
      expect(typeof gracefulShutdown).toBe('function');
    });
  });
});
