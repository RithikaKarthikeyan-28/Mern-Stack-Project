const request = require('supertest');
const app = require('../src/app');

describe('Health Endpoint Tests', () => {
  describe('GET /api/health', () => {
    it('should return HTTP 200, success true, and correct health message', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'SkillTrack API is running'
      });
    });
  });
});
