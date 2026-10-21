/**
 * Demo Data, Department Cleanup, and Authentication Integration Tests
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const EmployeeSkill = require('../src/models/EmployeeSkill');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');
const seedIntegratedLearning = require('../src/seeds/integratedLearningSeeder');

describe('Department Cleanup, Demo Data, and Registration/Login Flow', () => {
  beforeAll(async () => {
    // Seed fresh data to verify seeder and DB state
    await seedIntegratedLearning();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('1. Department Cleanup', () => {
    it('only the 10 mandated technical departments exist (DevOps and Engineering removed)', async () => {
      const activeDepts = await Department.find({ isActive: true });
      const deptNames = activeDepts.map((d) => d.name);

      expect(deptNames).not.toContain('DevOps');
      expect(deptNames).not.toContain('Engineering');
      expect(activeDepts.length).toBe(10);
    });

    it('public departments endpoint (/api/auth/departments) returns the 10 active departments', async () => {
      const res = await request(app).get('/api/auth/departments').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.departments.length).toBe(10);
      const names = res.body.data.departments.map((d) => d.name);
      expect(names).not.toContain('DevOps');
      expect(names).not.toContain('Engineering');
      expect(names).toContain('Full-Stack Development — MongoDB and MERN');
      expect(names).toContain('Java Programming');
    });
  });

  describe('2. Fictional Employee Roster', () => {
    it('13 realistic fictional employees exist with unique IDs and valid department references', async () => {
      const employees = await Employee.find().populate('user', 'name email role').populate('department', 'name');
      const fictionalEmployees = employees.filter((e) => e.employeeId && e.employeeId.startsWith('EMP-1'));

      expect(fictionalEmployees.length).toBe(13);
      for (const emp of fictionalEmployees) {
        expect(emp.employeeId).toMatch(/^EMP-1\d{3}$/);
        expect(emp.user).toBeDefined();
        expect(emp.user.name).toBeTruthy();
        expect(emp.department).toBeDefined();
        expect(emp.department.name).toBeTruthy();
        expect(emp.department.name).not.toBe('DevOps');
        expect(emp.department.name).not.toBe('Engineering');
      }
    });

    it('employee names match consistently in User and Employee models', async () => {
      const priya = await Employee.findOne({ employeeId: 'EMP-1001' }).populate('user');
      expect(priya.user.name).toBe('Priya Patel');
      expect(priya.user.email).toBe('employee@skilltrack.demo');

      const kavita = await Employee.findOne({ employeeId: 'EMP-1002' }).populate('user');
      expect(kavita.user.name).toBe('Kavita Rao');
      expect(kavita.user.email).toBe('kavita.rao@example.com');
    });
  });

  describe('3. Skills and Skill Gaps', () => {
    it('skills, benchmark job roles, and employee skills are populated in database', async () => {
      const skillCount = await Skill.countDocuments({ isActive: true });
      const jobRoleCount = await JobRole.countDocuments({ isActive: true });
      const empSkillCount = await EmployeeSkill.countDocuments({ isActive: true });

      expect(skillCount).toBe(12);
      expect(jobRoleCount).toBe(4);
      expect(empSkillCount).toBeGreaterThanOrEqual(20);
    });

    it('Priya Patel has skills and skill gaps against Full-Stack MERN Developer role', async () => {
      const priya = await Employee.findOne({ employeeId: 'EMP-1001' });
      const priyaSkills = await EmployeeSkill.find({ employee: priya._id }).populate('skill', 'name');
      const skillNames = priyaSkills.map((s) => s.skill.name);

      expect(skillNames).toContain('JavaScript (ES6+)');
      expect(skillNames).toContain('React.js Framework');
      expect(skillNames).toContain('MongoDB & NoSQL Architecture');
    });
  });

  describe('4. Pre-populated Compliance Data', () => {
    it('compliance requirements and assignments cover all 5 operational statuses', async () => {
      const reqCount = await ComplianceRequirement.countDocuments({ isActive: true });
      expect(reqCount).toBe(4);

      const assignments = await ComplianceAssignment.find({ isActive: true });
      expect(assignments.length).toBeGreaterThanOrEqual(10);

      const statuses = new Set(assignments.map((a) => a.status));
      expect(statuses.has('COMPLIANT')).toBe(true);
      expect(statuses.has('DUE_SOON')).toBe(true);
      expect(statuses.has('OVERDUE')).toBe(true);
      expect(statuses.has('IN_PROGRESS')).toBe(true);
      expect(statuses.has('NOT_STARTED')).toBe(true);
    });
  });

  describe('5. Registration and Login Flow', () => {
    const testNewEmail = `new.learner.${Date.now()}@example.com`;
    let sampleDeptId;

    beforeAll(async () => {
      const dept = await Department.findOne({ isActive: true });
      sampleDeptId = dept._id.toString();
    });

    it('registering a new employee account succeeds and creates employee profile', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Samantha Reed',
          email: testNewEmail,
          password: 'Password123!',
          department: sampleDeptId
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testNewEmail);
      expect(res.body.data.user.role).toBe('employee');
      expect(res.body.data.user.password).toBeUndefined();

      // Verify employee profile was created
      const emp = await Employee.findOne({ user: res.body.data.user.id });
      expect(emp).toBeDefined();
      expect(emp.department.toString()).toBe(sampleDeptId);
    });

    it('registering the same email twice fails with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Samantha',
          email: testNewEmail,
          password: 'Password123!',
          department: sampleDeptId
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('public registration ignores role escalation and forces employee role', async () => {
      const adminAttemptEmail = `escalation.${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: adminAttemptEmail,
          password: 'Password123!',
          role: 'admin',
          department: sampleDeptId
        })
        .expect(201);

      expect(res.body.data.user.role).toBe('employee');
    });

    it('newly registered account can log in successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testNewEmail,
          password: 'Password123!'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testNewEmail);
      expect(res.body.data.user.role).toBe('employee');
    });

    it('unregistered email returns 401 informing user to create account', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.ghost.user@example.com',
          password: 'SomePassword123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Account not found\. Please create an account first\./i);
    });

    it('registered user with incorrect password is rejected with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testNewEmail,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('existing seed Admin account can log in', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@skilltrack.demo',
          password: 'Password123!'
        })
        .expect(200);

      expect(res.body.data.user.role).toBe('admin');
    });

    it('existing seed Trainer account can log in', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'trainer@skilltrack.demo',
          password: 'Password123!'
        })
        .expect(200);

      expect(res.body.data.user.role).toBe('trainer');
    });

    it('existing seed Employee account can log in', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@skilltrack.demo',
          password: 'Password123!'
        })
        .expect(200);

      expect(res.body.data.user.role).toBe('employee');
    });
  });
});
