const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const config = require('../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 15 — Skills & Job Role Requirements Tests', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser;

  const generateToken = (user) => {
    return jwt.sign(
      {
        id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role,
        email: user.email
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    // Clean test data
    await Promise.all([
      User.deleteMany({ email: /@phase15test\.com$/ }),
      Skill.deleteMany({ name: /Phase 15/i }),
      JobRole.deleteMany({ code: /^P15-/ }),
      JobRoleSkillRequirement.deleteMany({})
    ]);

    // Create test users
    adminUser = await User.create({
      name: 'Admin Phase15',
      email: 'admin@phase15test.com',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });

    trainerUser = await User.create({
      name: 'Trainer Phase15',
      email: 'trainer@phase15test.com',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });

    employeeUser = await User.create({
      name: 'Employee Phase15',
      email: 'employee@phase15test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    adminToken = generateToken(adminUser);
    trainerToken = generateToken(trainerUser);
    employeeToken = generateToken(employeeUser);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase15test\.com$/ }),
      Skill.deleteMany({ name: /Phase 15/i }),
      JobRole.deleteMany({ code: /^P15-/ }),
      JobRoleSkillRequirement.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. SKILL DOMAIN TESTS
  // ==========================================
  describe('Skill Management', () => {
    let createdSkillId;
    let inactiveSkillId;

    it('1. Admin should create a skill successfully with default proficiency levels', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Node.js Engineering',
          category: 'Backend Development',
          description: 'Server side JavaScript and asynchronous runtime'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skill).toBeDefined();
      expect(res.body.data.skill.name).toBe('Phase 15 Node.js Engineering');
      expect(res.body.data.skill.category).toBe('Backend Development');
      expect(res.body.data.skill.proficiencyLevels).toEqual([
        'beginner',
        'intermediate',
        'advanced',
        'expert'
      ]);
      expect(res.body.data.skill.isActive).toBe(true);
      expect(res.body.data.skill.id).toBeDefined();
      createdSkillId = res.body.data.skill.id;
    });

    it('2. Admin should create a skill with custom valid proficiency levels', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 React Architecture',
          category: 'Frontend Development',
          proficiencyLevels: ['intermediate', 'advanced']
        });

      expect(res.status).toBe(201);
      expect(res.body.data.skill.proficiencyLevels).toEqual(['intermediate', 'advanced']);
    });

    it('3. Non-admin (trainer) should be forbidden from creating skills (403)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Phase 15 Python Data Science',
          category: 'Data'
        });

      expect(res.status).toBe(403);
    });

    it('4. Non-admin (employee) should be forbidden from creating skills (403)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Phase 15 Golang Concurrency',
          category: 'Backend'
        });

      expect(res.status).toBe(403);
    });

    it('5. Unauthenticated user should receive 401 when creating a skill', async () => {
      const res = await request(app)
        .post('/api/skills')
        .send({
          name: 'Phase 15 Rust Systems',
          category: 'Systems'
        });

      expect(res.status).toBe(401);
    });

    it('6. Should reject duplicate skill name case-insensitively (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'phase 15 node.js engineering',
          category: 'Different Category'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('7. Should reject skill creation with missing name (400)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'Backend'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name is required/i);
    });

    it('8. Should reject skill creation with name < 2 characters (400)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
          category: 'Backend'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 2 characters/i);
    });

    it('9. Should reject skill creation with missing category (400)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Missing Category Skill'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/category is required/i);
    });

    it('10. Should reject skill creation with invalid proficiency levels (400)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Invalid Level Skill',
          category: 'QA',
          proficiencyLevels: ['beginner', 'master', 'ninja']
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid proficiency level/i);
    });

    it('11. Should reject skill creation with empty proficiencyLevels array (400)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Empty Levels Skill',
          category: 'DevOps',
          proficiencyLevels: []
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/non-empty array/i);
    });

    it('12. Should reject client injection of isActive on creation (400)', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Injected Skill',
          category: 'Security',
          isActive: false
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('13. Setup: create inactive skill directly in DB for visibility testing', async () => {
      const inactive = await Skill.create({
        name: 'Phase 15 Inactive Legacy Skill',
        category: 'Legacy',
        isActive: false
      });
      inactiveSkillId = inactive._id.toString();
      expect(inactiveSkillId).toBeDefined();
    });

    it('14. Employee listing skills should only see active skills', async () => {
      const res = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.skills).toBeInstanceOf(Array);
      const ids = res.body.data.skills.map((s) => s.id);
      expect(ids).toContain(createdSkillId);
      expect(ids).not.toContain(inactiveSkillId);
    });

    it('15. Trainer listing skills should only see active skills', async () => {
      const res = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.skills.map((s) => s.id);
      expect(ids).toContain(createdSkillId);
      expect(ids).not.toContain(inactiveSkillId);
    });

    it('16. Admin listing skills with isActive=false can see inactive skills', async () => {
      const res = await request(app)
        .get('/api/skills?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.skills.map((s) => s.id);
      expect(ids).toContain(inactiveSkillId);
    });

    it('17. Filter skills by category', async () => {
      const res = await request(app)
        .get('/api/skills?category=Frontend Development')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.skills.length).toBeGreaterThanOrEqual(1);
      res.body.data.skills.forEach((s) => {
        expect(s.category).toBe('Frontend Development');
      });
    });

    it('18. Skills pagination returns proper page, limit, total, totalPages', async () => {
      const res = await request(app)
        .get('/api/skills?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.skills.length).toBeLessThanOrEqual(2);
    });

    it('19. Get skill by ID succeeds for active skill across roles', async () => {
      for (const token of [adminToken, trainerToken, employeeToken]) {
        const res = await request(app)
          .get(`/api/skills/${createdSkillId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.skill.id).toBe(createdSkillId);
      }
    });

    it('20. Inactive skill returns 404 for employee and trainer', async () => {
      const resEmp = await request(app)
        .get(`/api/skills/${inactiveSkillId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(resEmp.status).toBe(404);

      const resTrn = await request(app)
        .get(`/api/skills/${inactiveSkillId}`)
        .set('Authorization', `Bearer ${trainerToken}`);
      expect(resTrn.status).toBe(404);
    });

    it('21. Inactive skill returns 200 for admin', async () => {
      const res = await request(app)
        .get(`/api/skills/${inactiveSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.skill.id).toBe(inactiveSkillId);
      expect(res.body.data.skill.isActive).toBe(false);
    });

    it('22. Get skill with non-existent ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/skills/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('23. Get skill with invalid ObjectId format returns 400', async () => {
      const res = await request(app)
        .get('/api/skills/invalid-id-format')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('24. Admin should update a skill successfully', async () => {
      const res = await request(app)
        .patch(`/api/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated Node.js and Microservices description',
          category: 'Fullstack'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.skill.description).toBe('Updated Node.js and Microservices description');
      expect(res.body.data.skill.category).toBe('Fullstack');
    });

    it('25. Updating skill with same name preserves skill without 409 conflict', async () => {
      const res = await request(app)
        .patch(`/api/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Node.js Engineering'
        });

      expect(res.status).toBe(200);
    });

    it('26. Reject update skill with conflicting name of another skill (409)', async () => {
      const res = await request(app)
        .patch(`/api/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'phase 15 react architecture'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('27. Non-admin cannot update a skill (403)', async () => {
      const res = await request(app)
        .patch(`/api/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ category: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('28. Reject update skill with client injection of isActive (400)', async () => {
      const res = await request(app)
        .patch(`/api/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client modification/i);
    });

    it('29. Soft delete skill sets isActive to false', async () => {
      const toDelete = await Skill.create({
        name: 'Phase 15 Skill To Soft Delete',
        category: 'Testing'
      });

      const res = await request(app)
        .delete(`/api/skills/${toDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const inDb = await Skill.findById(toDelete._id);
      expect(inDb.isActive).toBe(false);
    });

    it('30. Non-admin cannot delete a skill (403)', async () => {
      const res = await request(app)
        .delete(`/api/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });

    it('31. Delete non-existent skill returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/skills/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. JOB ROLE DOMAIN TESTS
  // ==========================================
  describe('Job Role Management', () => {
    let createdJobRoleId;
    let inactiveJobRoleId;

    it('32. Admin should create a job role successfully', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Senior Backend Engineer',
          code: 'p15-sr-be',
          description: 'Responsible for core scalable backend microservices'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobRole).toBeDefined();
      expect(res.body.data.jobRole.name).toBe('Phase 15 Senior Backend Engineer');
      // Code should be normalized to uppercase
      expect(res.body.data.jobRole.code).toBe('P15-SR-BE');
      expect(res.body.data.jobRole.isActive).toBe(true);
      createdJobRoleId = res.body.data.jobRole.id;
    });

    it('33. Non-admin (trainer) cannot create job role (403)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Phase 15 Lead Architect',
          code: 'P15-LEAD-ARCH'
        });

      expect(res.status).toBe(403);
    });

    it('34. Non-admin (employee) cannot create job role (403)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Phase 15 Lead Architect',
          code: 'P15-LEAD-ARCH'
        });

      expect(res.status).toBe(403);
    });

    it('35. Unauthenticated user cannot create job role (401)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .send({
          name: 'Phase 15 Lead Architect',
          code: 'P15-LEAD-ARCH'
        });

      expect(res.status).toBe(401);
    });

    it('36. Reject duplicate job role name (case-insensitive) (409)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'phase 15 senior backend engineer',
          code: 'P15-DIFF-CODE'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/name already exists/i);
    });

    it('37. Reject duplicate job role code (409)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Another Backend Role',
          code: 'P15-SR-BE'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/code already exists/i);
    });

    it('38. Reject job role creation with missing name (400)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'P15-NO-NAME'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name is required/i);
    });

    it('39. Reject job role creation with missing code (400)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 No Code Role'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/code is required/i);
    });

    it('40. Reject job role with name length < 2 or > 150 chars (400)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'X',
          code: 'P15-SHORT'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 2 characters/i);
    });

    it('41. Reject job role with client injection of isActive (400)', async () => {
      const res = await request(app)
        .post('/api/job-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Injected Role',
          code: 'P15-INJECT',
          isActive: false
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('42. Setup: create inactive job role directly in DB', async () => {
      const inactiveRole = await JobRole.create({
        name: 'Phase 15 Inactive Deprecated Role',
        code: 'P15-DEPR-ROLE',
        isActive: false
      });
      inactiveJobRoleId = inactiveRole._id.toString();
    });

    it('43. Employee listing job roles should only see active roles', async () => {
      const res = await request(app)
        .get('/api/job-roles')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.jobRoles.map((r) => r.id);
      expect(ids).toContain(createdJobRoleId);
      expect(ids).not.toContain(inactiveJobRoleId);
    });

    it('44. Trainer listing job roles should only see active roles', async () => {
      const res = await request(app)
        .get('/api/job-roles')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.jobRoles.map((r) => r.id);
      expect(ids).toContain(createdJobRoleId);
      expect(ids).not.toContain(inactiveJobRoleId);
    });

    it('45. Admin listing job roles with isActive=false can see inactive roles', async () => {
      const res = await request(app)
        .get('/api/job-roles?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.jobRoles.map((r) => r.id);
      expect(ids).toContain(inactiveJobRoleId);
    });

    it('46. Job roles pagination returns page, limit, total, totalPages', async () => {
      const res = await request(app)
        .get('/api/job-roles?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('47. Get job role by ID succeeds for active role across roles', async () => {
      for (const token of [adminToken, trainerToken, employeeToken]) {
        const res = await request(app)
          .get(`/api/job-roles/${createdJobRoleId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.jobRole.id).toBe(createdJobRoleId);
      }
    });

    it('48. Inactive job role returns 404 for employee/trainer and 200 for admin', async () => {
      const resEmp = await request(app)
        .get(`/api/job-roles/${inactiveJobRoleId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(resEmp.status).toBe(404);

      const resAdmin = await request(app)
        .get(`/api/job-roles/${inactiveJobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.jobRole.isActive).toBe(false);
    });

    it('49. Get job role with invalid ID format returns 400', async () => {
      const res = await request(app)
        .get('/api/job-roles/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('50. Get job role with non-existent ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/job-roles/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('51. Admin should update job role successfully', async () => {
      const res = await request(app)
        .patch(`/api/job-roles/${createdJobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 15 Principal Backend Engineer',
          code: 'p15-prin-be',
          description: 'Updated architecture and leadership role'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.jobRole.name).toBe('Phase 15 Principal Backend Engineer');
      expect(res.body.data.jobRole.code).toBe('P15-PRIN-BE');
    });

    it('52. Reject update job role with duplicate name of another role (409)', async () => {
      const anotherRole = await JobRole.create({
        name: 'Phase 15 QA Lead',
        code: 'P15-QA-LEAD'
      });

      const res = await request(app)
        .patch(`/api/job-roles/${createdJobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'phase 15 qa lead'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/name already exists/i);
    });

    it('53. Reject update job role with duplicate code of another role (409)', async () => {
      const res = await request(app)
        .patch(`/api/job-roles/${createdJobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'P15-QA-LEAD'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/code already exists/i);
    });

    it('54. Non-admin cannot update job role (403)', async () => {
      const res = await request(app)
        .patch(`/api/job-roles/${createdJobRoleId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacked Role' });

      expect(res.status).toBe(403);
    });

    it('55. Reject update job role with client injection (400)', async () => {
      const res = await request(app)
        .patch(`/api/job-roles/${createdJobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client modification/i);
    });

    it('56. Soft delete job role sets isActive to false', async () => {
      const toDelete = await JobRole.create({
        name: 'Phase 15 Role to Delete',
        code: 'P15-DEL-ROLE'
      });

      const res = await request(app)
        .delete(`/api/job-roles/${toDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const inDb = await JobRole.findById(toDelete._id);
      expect(inDb.isActive).toBe(false);
    });

    it('57. Non-admin cannot delete job role (403)', async () => {
      const res = await request(app)
        .delete(`/api/job-roles/${createdJobRoleId}`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 3. JOB ROLE SKILL REQUIREMENTS TESTS
  // ==========================================
  describe('Job Role Skill Requirements', () => {
    let testRole;
    let testSkill1;
    let testSkill2;
    let createdReqId;
    let inactiveReqId;

    beforeAll(async () => {
      testRole = await JobRole.create({
        name: 'Phase 15 Cloud Architect',
        code: 'P15-CLOUD-ARCH'
      });

      testSkill1 = await Skill.create({
        name: 'Phase 15 Kubernetes Orchestration',
        category: 'Cloud Infra'
      });

      testSkill2 = await Skill.create({
        name: 'Phase 15 Terraform Infrastructure',
        category: 'DevOps'
      });
    });

    it('58. Admin creates a skill requirement for a job role via nested route (201)', async () => {
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'advanced',
          mandatory: true,
          weight: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requirement).toBeDefined();
      expect(res.body.data.requirement.requiredLevel).toBe('advanced');
      expect(res.body.data.requirement.mandatory).toBe(true);
      expect(res.body.data.requirement.weight).toBe(5);
      // Verify populated skill and jobRole
      expect(res.body.data.requirement.skill.name).toBe('Phase 15 Kubernetes Orchestration');
      expect(res.body.data.requirement.jobRole.code).toBe('P15-CLOUD-ARCH');
      createdReqId = res.body.data.requirement.id;
    });

    it('59. Default mandatory is true and default weight is 1 when omitted', async () => {
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill2._id.toString(),
          requiredLevel: 'intermediate'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.requirement.mandatory).toBe(true);
      expect(res.body.data.requirement.weight).toBe(1);
    });

    it('60. Non-admin (trainer) cannot create requirement (403)', async () => {
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(403);
    });

    it('61. Non-admin (employee) cannot create requirement (403)', async () => {
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(403);
    });

    it('62. Unauthenticated user cannot create requirement (401)', async () => {
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(401);
    });

    it('63. Reject duplicate requirement for same job role + skill (compound unique) (409)', async () => {
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'expert'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('64. Reject requirement for non-existent job role (404)', async () => {
      const fakeRoleId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/job-roles/${fakeRoleId}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/job role not found/i);
    });

    it('65. Reject requirement for inactive job role (400)', async () => {
      const inactiveRole = await JobRole.create({
        name: 'Phase 15 Inactive Target Role',
        code: 'P15-INACT-ROLE',
        isActive: false
      });

      const res = await request(app)
        .post(`/api/job-roles/${inactiveRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill1._id.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive and cannot accept requirements/i);
    });

    it('66. Reject requirement for non-existent skill (404)', async () => {
      const fakeSkillId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: fakeSkillId.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/skill not found/i);
    });

    it('67. Reject requirement for inactive skill (400)', async () => {
      const inactiveSkill = await Skill.create({
        name: 'Phase 15 Inactive Target Skill',
        category: 'Old',
        isActive: false
      });

      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: inactiveSkill._id.toString(),
          requiredLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive and cannot be added/i);
    });

    it('68. Reject requirement with invalid requiredLevel (400)', async () => {
      const newSkill = await Skill.create({
        name: 'Phase 15 Fresh Skill',
        category: 'Test'
      });

      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: newSkill._id.toString(),
          requiredLevel: 'guru'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid required level/i);
    });

    it('69. Reject requirement with negative weight or weight > 100 (400)', async () => {
      const newSkill = await Skill.create({
        name: 'Phase 15 Weight Test Skill',
        category: 'Test'
      });

      const resNeg = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: newSkill._id.toString(),
          requiredLevel: 'beginner',
          weight: -5
        });
      expect(resNeg.status).toBe(400);

      const resBig = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: newSkill._id.toString(),
          requiredLevel: 'beginner',
          weight: 150
        });
      expect(resBig.status).toBe(400);
    });

    it('70. Reject client injection of isActive on create requirement (400)', async () => {
      const newSkill = await Skill.create({
        name: 'Phase 15 Injection Requirement Skill',
        category: 'Test'
      });

      const res = await request(app)
        .post(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: newSkill._id.toString(),
          requiredLevel: 'beginner',
          isActive: false
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('71. Setup: create inactive requirement directly in DB', async () => {
      const extraSkill = await Skill.create({
        name: 'Phase 15 Extra Inactive Req Skill',
        category: 'Test'
      });

      const inactReq = await JobRoleSkillRequirement.create({
        jobRole: testRole._id,
        skill: extraSkill._id,
        requiredLevel: 'beginner',
        isActive: false
      });
      inactiveReqId = inactReq._id.toString();
    });

    it('72. Get requirements for job role returns active requirements across roles', async () => {
      for (const token of [adminToken, trainerToken, employeeToken]) {
        const res = await request(app)
          .get(`/api/job-roles/${testRole._id}/requirements`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.requirements).toBeInstanceOf(Array);
        const ids = res.body.data.requirements.map((r) => r.id);
        expect(ids).toContain(createdReqId);
      }
    });

    it('73. Non-admin does not receive inactive requirements in list', async () => {
      const res = await request(app)
        .get(`/api/job-roles/${testRole._id}/requirements`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.requirements.map((r) => r.id);
      expect(ids).not.toContain(inactiveReqId);
    });

    it('74. Admin can query inactive requirements by passing isActive=false', async () => {
      const res = await request(app)
        .get(`/api/job-roles/${testRole._id}/requirements?isActive=false`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.requirements.map((r) => r.id);
      expect(ids).toContain(inactiveReqId);
    });

    it('75. Get requirements for inactive job role returns 404 for non-admin', async () => {
      const inactRole = await JobRole.create({
        name: 'Phase 15 Hidden Inactive Role',
        code: 'P15-HIDDEN-ROLE',
        isActive: false
      });

      const res = await request(app)
        .get(`/api/job-roles/${inactRole._id}/requirements`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });

    it('76. Get requirement by ID succeeds for active requirement', async () => {
      for (const token of [adminToken, trainerToken, employeeToken]) {
        const res = await request(app)
          .get(`/api/job-role-requirements/${createdReqId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.requirement.id).toBe(createdReqId);
        expect(res.body.data.requirement.skill).toBeDefined();
        expect(res.body.data.requirement.jobRole).toBeDefined();
      }
    });

    it('77. Inactive requirement by ID returns 404 for employee/trainer and 200 for admin', async () => {
      const resEmp = await request(app)
        .get(`/api/job-role-requirements/${inactiveReqId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(resEmp.status).toBe(404);

      const resAdmin = await request(app)
        .get(`/api/job-role-requirements/${inactiveReqId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.requirement.isActive).toBe(false);
    });

    it('78. Get requirement with invalid ID format returns 400', async () => {
      const res = await request(app)
        .get('/api/job-role-requirements/not-a-valid-oid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('79. Get requirement with non-existent ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/job-role-requirements/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('80. Admin updates requirement level, mandatory, and weight successfully', async () => {
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          requiredLevel: 'expert',
          mandatory: false,
          weight: 10
        });

      expect(res.status).toBe(200);
      expect(res.body.data.requirement.requiredLevel).toBe('expert');
      expect(res.body.data.requirement.mandatory).toBe(false);
      expect(res.body.data.requirement.weight).toBe(10);
    });

    it('81. Reject update requirement attempting to mutate jobRole reference (400)', async () => {
      const fakeRole = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          jobRole: fakeRole.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client modification/i);
    });

    it('82. Reject update requirement attempting to mutate skill reference (400)', async () => {
      const fakeSkill = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: fakeSkill.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client modification/i);
    });

    it('83. Reject update requirement by trainer (403)', async () => {
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ weight: 20 });

      expect(res.status).toBe(403);
    });

    it('84. Reject update requirement by employee (403)', async () => {
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ weight: 20 });

      expect(res.status).toBe(403);
    });

    it('85. Reject update requirement without auth (401)', async () => {
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .send({ weight: 20 });

      expect(res.status).toBe(401);
    });

    it('86. Reject update requirement with invalid proficiency level (400)', async () => {
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ requiredLevel: 'superman' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid required level/i);
    });

    it('87. Reject update requirement with weight > 100 (400)', async () => {
      const res = await request(app)
        .patch(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ weight: 200 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/between 0 and 100/i);
    });

    it('88. Soft delete requirement sets isActive to false', async () => {
      const deleteRole = await JobRole.create({
        name: 'Phase 15 Delete Req Test Role',
        code: 'P15-DEL-REQ-ROLE'
      });

      const deleteSkill = await Skill.create({
        name: 'Phase 15 Delete Req Test Skill',
        category: 'Test'
      });

      const toDeleteReq = await JobRoleSkillRequirement.create({
        jobRole: deleteRole._id,
        skill: deleteSkill._id,
        requiredLevel: 'intermediate'
      });

      const res = await request(app)
        .delete(`/api/job-role-requirements/${toDeleteReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const inDb = await JobRoleSkillRequirement.findById(toDeleteReq._id);
      expect(inDb.isActive).toBe(false);
    });

    it('89. Non-admin cannot delete requirement (403)', async () => {
      const res = await request(app)
        .delete(`/api/job-role-requirements/${createdReqId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('90. Delete non-existent requirement returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/job-role-requirements/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. QUERY VALIDATION & SECURITY
  // ==========================================
  describe('Query Validation & Security', () => {
    it('91. Skills query rejects invalid page/limit', async () => {
      const res = await request(app)
        .get('/api/skills?page=0&limit=-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('92. Job roles query rejects invalid page/limit', async () => {
      const res = await request(app)
        .get('/api/job-roles?page=invalid&limit=999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('93. Skills query rejects invalid isActive value', async () => {
      const res = await request(app)
        .get('/api/skills?isActive=maybe')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/boolean/i);
    });

    it('94. Job roles query rejects invalid isActive value', async () => {
      const res = await request(app)
        .get('/api/job-roles?isActive=123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/boolean/i);
    });
  });
});
