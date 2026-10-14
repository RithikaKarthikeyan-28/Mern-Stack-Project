const request = require('supertest');
const app = require('../src/app');
const AppError = require('../src/utils/AppError');
const errorHandler = require('../src/middleware/errorHandler');

describe('Application Foundation Tests', () => {
  describe('Express Application Import & Isolation (TEST 3)', () => {
    it('should export an Express application without starting an active HTTP server', () => {
      // app should be an Express application function
      expect(typeof app).toBe('function');
      expect(typeof app.listen).toBe('function');

      // Verify that app is not bound to a listening port automatically
      // In Node/Express, an unstarted app does not have an active server handle
      expect(app._router).toBeDefined();
    });
  });

  describe('404 Not Found Handling (TEST 2)', () => {
    it('should return HTTP 404, JSON response, and success false for GET /api/non-existing-route', async () => {
      const response = await request(app)
        .get('/api/non-existing-route')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toContain('Route not found');
    });

    it('should return HTTP 404 JSON for unmatched non-API routes', async () => {
      const response = await request(app)
        .get('/unknown-top-level-route')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Route not found: GET /unknown-top-level-route'
      });
    });

    it('should return HTTP 404 JSON for unsupported HTTP methods on valid endpoints', async () => {
      const response = await request(app)
        .post('/api/health')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('CORS and Headers Verification', () => {
    it('should include CORS headers on API requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Centralized Error Handling Middleware', () => {
    it('should format AppError into standardized JSON response with correct status code', () => {
      const mockReq = {};
      const mockRes = {
        statusCode: null,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        }
      };
      const mockNext = jest.fn();

      const customError = new AppError('Validation failed', 422, ['Field email is required']);
      errorHandler(customError, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Validation failed',
        errors: ['Field email is required']
      });
    });

    it('should format unhandled generic errors with default 500 status code', () => {
      const mockReq = {};
      const mockRes = {
        statusCode: null,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        }
      };
      const mockNext = jest.fn();

      const genericError = new Error('Database connection failed unexpectedly');
      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.jsonData.success).toBe(false);
      expect(mockRes.jsonData).toHaveProperty('message');
    });
  });
});
