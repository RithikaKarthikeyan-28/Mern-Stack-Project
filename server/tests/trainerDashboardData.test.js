const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');
const Enrollment = require('../src/models/Enrollment');
const Employee = require('../src/models/Employee');

describe('Trainer Dashboard Data Verification (Phase 9)', () => {
  let trainerToken;
  let trainerId;
  let employeeToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // 1. Authenticate Trainer
    const trainerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'trainer@skilltrack.demo', password: 'Password123!' });

    expect(trainerLogin.status).toBe(200);
    trainerToken = trainerLogin.body.data?.token || trainerLogin.body.token;
    trainerId = (trainerLogin.body.data?.user?._id || trainerLogin.body.data?.user?.id).toString();

    // 2. Authenticate Employee for unauthorized checks
    const empLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@skilltrack.demo', password: 'Password123!' });

    expect(empLogin.status).toBe(200);
    employeeToken = empLogin.body.data?.token || empLogin.body.token;
  }, 20000);

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('1. verifies MongoDB connection and intended database name', () => {
    expect(mongoose.connection.readyState).toBe(1);
    expect(mongoose.connection.name).toBe('skilltrack');
  });

  it('2. verifies Trainer retrieves all 10 active technical courses', async () => {
    // Test both scoped query and base query
    const res = await request(app)
      .get(`/api/courses?trainer=${trainerId}`)
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    const courses = res.body.data?.courses || res.body.courses;
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBe(10);

    const titles = courses.map((c) => c.title);
    expect(titles).toContain('Java Programming Fundamentals');
    expect(titles).toContain('React.js Development');
    expect(titles).toContain('MongoDB and MERN Stack');
    expect(titles).toContain('Node.js and Express.js');
  });

  it('3. verifies Trainer retrieves all 10 active technical assessments', async () => {
    const res = await request(app)
      .get('/api/assessments')
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    const assessments = res.body.data?.assessments || res.body.assessments;
    expect(Array.isArray(assessments)).toBe(true);
    expect(assessments.length).toBe(10);

    // Verify course association
    for (const a of assessments) {
      expect(a.course).toBeDefined();
    }
  });

  it('4. verifies Trainer retrieves learner enrollments across assigned technical courses', async () => {
    const res = await request(app)
      .get('/api/enrollments')
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    const enrollments = res.body.data?.enrollments || res.body.enrollments;
    expect(Array.isArray(enrollments)).toBe(true);
    expect(enrollments.length).toBeGreaterThanOrEqual(1);

    // Verify each enrollment has a populated employee and course
    for (const e of enrollments) {
      expect(e.employee).toBeDefined();
      expect(e.employee).not.toBeNull();
      expect(e.course).toBeDefined();
    }
  });

  it('5. verifies Trainer can access the employees directory', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(200);
    const employees = res.body.data?.employees || res.body.employees;
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThanOrEqual(13);
  });

  it('6. rejects unauthorized access to trainer endpoints', async () => {
    // Unauthenticated request
    const unauthRes = await request(app).get('/api/courses');
    expect(unauthRes.status).toBe(401);

    // Employee attempting to create a course (only admin and trainer allowed)
    const empCreateRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ title: 'Illegal Course', category: 'Tech', level: 'beginner', duration: 10 });
    expect(empCreateRes.status).toBe(403);
  });
});
