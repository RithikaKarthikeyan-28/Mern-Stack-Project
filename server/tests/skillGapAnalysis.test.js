const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const EmployeeSkill = require('../src/models/EmployeeSkill');
const config = require('../src/config');
const { compareProficiency } = require('../src/utils/proficiency');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 16 — Skill Gap Analysis Tests', () => {
  let adminToken;
  let trainerToken;
  let employeeAToken;
  let employeeBToken;

  let adminUser;
  let trainerUser;
  let employeeAUser;
  let employeeBUser;

  let department;
  let employeeProfileA;
  let employeeProfileB;
  let inactiveEmployeeUser;
  let inactiveEmployeeProfile;

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
      User.deleteMany({ email: /@phase16test\.com$/ }),
      Department.deleteMany({ name: /Phase 16/ }),
      Employee.deleteMany({ employeeId: /^P16-EMP/ }),
      Skill.deleteMany({ name: /Phase 16/i }),
      JobRole.deleteMany({ code: /^P16-/ }),
      JobRoleSkillRequirement.deleteMany({}),
      EmployeeSkill.deleteMany({})
    ]);

    // Create department
    department = await Department.create({
      name: 'Phase 16 Engineering',
      code: 'P16-ENG'
    });

    // Create users
    adminUser = await User.create({
      name: 'Admin Phase16',
      email: 'admin@phase16test.com',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });

    trainerUser = await User.create({
      name: 'Trainer Phase16',
      email: 'trainer@phase16test.com',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });

    employeeAUser = await User.create({
      name: 'Employee A Phase16',
      email: 'employeeA@phase16test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    employeeBUser = await User.create({
      name: 'Employee B Phase16',
      email: 'employeeB@phase16test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    inactiveEmployeeUser = await User.create({
      name: 'Inactive Employee Phase16',
      email: 'inactive@phase16test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: false
    });

    // Create employee profiles
    employeeProfileA = await Employee.create({
      user: employeeAUser._id,
      employeeId: 'P16-EMP-001',
      department: department._id,
      designation: 'Software Engineer',
      isActive: true
    });

    employeeProfileB = await Employee.create({
      user: employeeBUser._id,
      employeeId: 'P16-EMP-002',
      department: department._id,
      designation: 'Frontend Engineer',
      isActive: true
    });

    inactiveEmployeeProfile = await Employee.create({
      user: inactiveEmployeeUser._id,
      employeeId: 'P16-EMP-INACT',
      department: department._id,
      designation: 'Ex-Engineer',
      isActive: false
    });

    adminToken = generateToken(adminUser);
    trainerToken = generateToken(trainerUser);
    employeeAToken = generateToken(employeeAUser);
    employeeBToken = generateToken(employeeBUser);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase16test\.com$/ }),
      Department.deleteMany({ name: /Phase 16/ }),
      Employee.deleteMany({ employeeId: /^P16-EMP/ }),
      Skill.deleteMany({ name: /Phase 16/i }),
      JobRole.deleteMany({ code: /^P16-/ }),
      JobRoleSkillRequirement.deleteMany({}),
      EmployeeSkill.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. EMPLOYEE SKILL DOMAIN TESTS
  // ==========================================
  describe('Employee Skill Data Management', () => {
    let testSkill1;
    let testSkill2;
    let inactiveSkill;
    let createdEmployeeSkillId;

    beforeAll(async () => {
      testSkill1 = await Skill.create({
        name: 'Phase 16 React',
        category: 'Frontend'
      });

      testSkill2 = await Skill.create({
        name: 'Phase 16 Node.js',
        category: 'Backend'
      });

      inactiveSkill = await Skill.create({
        name: 'Phase 16 Inactive Skill',
        category: 'Old',
        isActive: false
      });
    });

    it('1. Admin creates employee skill successfully (201)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill1._id.toString(),
          proficiencyLevel: 'intermediate'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeSkill).toBeDefined();
      expect(res.body.data.employeeSkill.proficiencyLevel).toBe('intermediate');
      expect(res.body.data.employeeSkill.skill.name).toBe('Phase 16 React');
      expect(res.body.data.employeeSkill.isActive).toBe(true);
      createdEmployeeSkillId = res.body.data.employeeSkill.id;
    });

    it('2. Trainer cannot create employee skill (403)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(403);
    });

    it('3. Employee cannot create employee skill (403)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(403);
    });

    it('4. Unauthenticated creation rejected (401)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(401);
    });

    it('5. Nonexistent employee rejected (404)', async () => {
      const fakeEmpId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/employees/${fakeEmpId}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/employee not found/i);
    });

    it('6. Inactive employee rejected (400)', async () => {
      const res = await request(app)
        .post(`/api/employees/${inactiveEmployeeProfile._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive employee/i);
    });

    it('7. Nonexistent skill rejected (404)', async () => {
      const fakeSkillId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: fakeSkillId.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/skill not found/i);
    });

    it('8. Inactive skill rejected (400)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: inactiveSkill._id.toString(),
          proficiencyLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive skill/i);
    });

    it('9. Invalid proficiency rejected (400)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'superstar'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid proficiency level/i);
    });

    it('10. Duplicate employee + skill rejected (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill1._id.toString(),
          proficiencyLevel: 'advanced'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already assigned/i);
    });

    it('11. Admin can update proficiency (200)', async () => {
      const res = await request(app)
        .patch(`/api/employee-skills/${createdEmployeeSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proficiencyLevel: 'advanced'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.employeeSkill.proficiencyLevel).toBe('advanced');
    });

    it('12. Non-admin cannot update proficiency (403)', async () => {
      const res = await request(app)
        .patch(`/api/employee-skills/${createdEmployeeSkillId}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          proficiencyLevel: 'expert'
        });

      expect(res.status).toBe(403);
    });

    it('13. Reject client modification of employee reference (400)', async () => {
      const fakeEmp = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/employee-skills/${createdEmployeeSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee: fakeEmp.toString(),
          proficiencyLevel: 'intermediate'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client modification/i);
    });

    it('14. Reject client modification of skill reference (400)', async () => {
      const fakeSkill = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/employee-skills/${createdEmployeeSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: fakeSkill.toString(),
          proficiencyLevel: 'intermediate'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client modification/i);
    });

    it('15. Admin can soft-delete employee skill (200)', async () => {
      const toDelete = await EmployeeSkill.create({
        employee: employeeProfileB._id,
        skill: testSkill2._id,
        proficiencyLevel: 'beginner'
      });

      const res = await request(app)
        .delete(`/api/employee-skills/${toDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify soft deletion
      const inDb = await EmployeeSkill.findById(toDelete._id);
      expect(inDb.isActive).toBe(false);
    });

    it('16. Inactive employee skill remains in DB', async () => {
      const inactiveSkills = await EmployeeSkill.find({ isActive: false });
      expect(inactiveSkills.length).toBeGreaterThanOrEqual(1);
    });

    it('17. Normal employee skill listing excludes inactive records for non-admin', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileB._id}/skills`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(200);
      const activeIds = res.body.data.employeeSkills.map((s) => s.id);
      expect(activeIds).toEqual([]);
    });

    it('18. Employee self endpoint returns own skills', async () => {
      const res = await request(app)
        .get('/api/employees/me/skills')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employeeSkills).toBeInstanceOf(Array);
      expect(res.body.data.employeeSkills.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.employeeSkills[0].skill.name).toBe('Phase 16 React');
    });

    it('19. Employee cannot access another employee skills through self endpoint', async () => {
      // Employee B should only see Employee B's skills, not Employee A's skills
      const res = await request(app)
        .get('/api/employees/me/skills')
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(200);
      const skillNames = res.body.data.employeeSkills.map((s) => s.skill.name);
      expect(skillNames).not.toContain('Phase 16 React');
    });

    it('20. Protected-field injection on creation rejected (400)', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeProfileA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: testSkill2._id.toString(),
          proficiencyLevel: 'beginner',
          isActive: false
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });
  });

  // ==========================================
  // 2. SKILL LEVEL COMPARISON TESTS
  // ==========================================
  describe('Centralized Skill Level Ordering & Comparison', () => {
    it('21. beginner < intermediate', () => {
      const comp = compareProficiency('beginner', 'intermediate');
      expect(comp.below).toBe(true);
      expect(comp.meets).toBe(false);
      expect(comp.status).toBe('BELOW_REQUIRED');
      expect(comp.currentRank).toBe(1);
      expect(comp.requiredRank).toBe(2);
    });

    it('22. intermediate < advanced', () => {
      const comp = compareProficiency('intermediate', 'advanced');
      expect(comp.below).toBe(true);
      expect(comp.status).toBe('BELOW_REQUIRED');
      expect(comp.currentRank).toBe(2);
      expect(comp.requiredRank).toBe(3);
    });

    it('23. advanced < expert', () => {
      const comp = compareProficiency('advanced', 'expert');
      expect(comp.below).toBe(true);
      expect(comp.status).toBe('BELOW_REQUIRED');
      expect(comp.currentRank).toBe(3);
      expect(comp.requiredRank).toBe(4);
    });

    it('24. equal levels compare correctly (meets = true)', () => {
      for (const level of ['beginner', 'intermediate', 'advanced', 'expert']) {
        const comp = compareProficiency(level, level);
        expect(comp.meets).toBe(true);
        expect(comp.below).toBe(false);
        expect(comp.missing).toBe(false);
        expect(comp.status).toBe('MEETS_REQUIRED');
        expect(comp.diff).toBe(0);
      }
    });

    it('25. expert satisfies all lower requirements', () => {
      for (const req of ['beginner', 'intermediate', 'advanced', 'expert']) {
        const comp = compareProficiency('expert', req);
        expect(comp.meets).toBe(true);
        expect(comp.status).toBe('MEETS_REQUIRED');
      }
    });

    it('26. beginner does not satisfy intermediate, advanced, or expert', () => {
      for (const req of ['intermediate', 'advanced', 'expert']) {
        const comp = compareProficiency('beginner', req);
        expect(comp.meets).toBe(false);
        expect(comp.below).toBe(true);
        expect(comp.status).toBe('BELOW_REQUIRED');
      }
    });

    it('27. proficiency comparison does not use alphabetical ordering', () => {
      // In alphabetical sort: 'advanced' < 'beginner' (a < b)
      // But in proficiency: 'advanced' > 'beginner' (3 > 1)
      const comp = compareProficiency('advanced', 'beginner');
      expect(comp.meets).toBe(true);
      expect(comp.status).toBe('MEETS_REQUIRED');

      // In alphabetical sort: 'expert' < 'intermediate' (e < i)
      // But in proficiency: 'expert' > 'intermediate' (4 > 2)
      const comp2 = compareProficiency('expert', 'intermediate');
      expect(comp2.meets).toBe(true);
      expect(comp2.status).toBe('MEETS_REQUIRED');
    });
  });

  // ==========================================
  // 3. GAP ANALYSIS CLASSIFICATION & RULES
  // ==========================================
  describe('Skill Gap Analysis Evaluation Rules', () => {
    let targetRole;
    let skillReqA;
    let skillReqB;
    let skillReqC;
    let skillReqD;
    let inactiveRole;
    let inactiveSkillRef;
    let inactiveRequirementDoc;

    beforeAll(async () => {
      targetRole = await JobRole.create({
        name: 'Phase 16 Fullstack Architect',
        code: 'P16-FS-ARCH'
      });

      skillReqA = await Skill.create({
        name: 'Phase 16 TypeScript',
        category: 'Language'
      });

      skillReqB = await Skill.create({
        name: 'Phase 16 GraphQL',
        category: 'API'
      });

      skillReqC = await Skill.create({
        name: 'Phase 16 Docker Containers',
        category: 'DevOps'
      });

      skillReqD = await Skill.create({
        name: 'Phase 16 Kubernetes Cluster',
        category: 'Cloud'
      });

      // Active Requirements
      // Requirement A: TypeScript - advanced, mandatory, weight 10
      await JobRoleSkillRequirement.create({
        jobRole: targetRole._id,
        skill: skillReqA._id,
        requiredLevel: 'advanced',
        mandatory: true,
        weight: 10
      });

      // Requirement B: GraphQL - intermediate, mandatory, weight 5
      await JobRoleSkillRequirement.create({
        jobRole: targetRole._id,
        skill: skillReqB._id,
        requiredLevel: 'intermediate',
        mandatory: true,
        weight: 5
      });

      // Requirement C: Docker - intermediate, optional, weight 3
      await JobRoleSkillRequirement.create({
        jobRole: targetRole._id,
        skill: skillReqC._id,
        requiredLevel: 'intermediate',
        mandatory: false,
        weight: 3
      });

      // Requirement D: Kubernetes - advanced, optional, weight 2
      await JobRoleSkillRequirement.create({
        jobRole: targetRole._id,
        skill: skillReqD._id,
        requiredLevel: 'advanced',
        mandatory: false,
        weight: 2
      });

      // Inactive requirement for targetRole
      const extraSkill = await Skill.create({
        name: 'Phase 16 Extra Skill',
        category: 'Misc'
      });
      inactiveRequirementDoc = await JobRoleSkillRequirement.create({
        jobRole: targetRole._id,
        skill: extraSkill._id,
        requiredLevel: 'beginner',
        isActive: false
      });

      // Requirement referencing inactive skill
      inactiveSkillRef = await Skill.create({
        name: 'Phase 16 Inactive Skill In Req',
        category: 'Misc',
        isActive: false
      });
      await JobRoleSkillRequirement.create({
        jobRole: targetRole._id,
        skill: inactiveSkillRef._id,
        requiredLevel: 'beginner'
      });

      // Inactive job role
      inactiveRole = await JobRole.create({
        name: 'Phase 16 Deprecated Role',
        code: 'P16-DEPR',
        isActive: false
      });

      // Assign skills to employeeProfileA:
      // - TypeScript: expert (higher than advanced -> MEETS_REQUIRED)
      // - GraphQL: beginner (lower than intermediate -> BELOW_REQUIRED)
      // - Docker: intermediate (equal to intermediate -> MEETS_REQUIRED)
      // - Kubernetes: none (MISSING)
      await EmployeeSkill.deleteMany({ employee: employeeProfileA._id });
      await EmployeeSkill.create({
        employee: employeeProfileA._id,
        skill: skillReqA._id,
        proficiencyLevel: 'expert'
      });
      await EmployeeSkill.create({
        employee: employeeProfileA._id,
        skill: skillReqB._id,
        proficiencyLevel: 'beginner'
      });
      await EmployeeSkill.create({
        employee: employeeProfileA._id,
        skill: skillReqC._id,
        proficiencyLevel: 'intermediate'
      });
    });

    it('28. Employee with no skills receives MISSING for all requirements', async () => {
      // Employee B has no skills assigned
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalRequirements).toBe(4);
      expect(res.body.data.summary.missingSkills).toBe(4);
      expect(res.body.data.summary.meetsRequiredSkills).toBe(0);
      expect(res.body.data.summary.belowRequiredSkills).toBe(0);
      res.body.data.gaps.forEach((gap) => {
        expect(gap.status).toBe('MISSING');
        expect(gap.currentLevel).toBeNull();
        expect(gap.currentLevelRank).toBeNull();
      });
    });

    it('29. Matching level returns MEETS_REQUIRED', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const dockerGap = res.body.data.gaps.find((g) => g.skill.name === 'Phase 16 Docker Containers');
      expect(dockerGap).toBeDefined();
      expect(dockerGap.requiredLevel).toBe('intermediate');
      expect(dockerGap.currentLevel).toBe('intermediate');
      expect(dockerGap.status).toBe('MEETS_REQUIRED');
    });

    it('30. Higher level returns MEETS_REQUIRED', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const tsGap = res.body.data.gaps.find((g) => g.skill.name === 'Phase 16 TypeScript');
      expect(tsGap).toBeDefined();
      expect(tsGap.requiredLevel).toBe('advanced');
      expect(tsGap.currentLevel).toBe('expert');
      expect(tsGap.status).toBe('MEETS_REQUIRED');
    });

    it('31. Lower level returns BELOW_REQUIRED', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const gqlGap = res.body.data.gaps.find((g) => g.skill.name === 'Phase 16 GraphQL');
      expect(gqlGap).toBeDefined();
      expect(gqlGap.requiredLevel).toBe('intermediate');
      expect(gqlGap.currentLevel).toBe('beginner');
      expect(gqlGap.status).toBe('BELOW_REQUIRED');
    });

    it('32. Multiple requirements analyzed correctly for employee A', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gaps.length).toBe(4);
    });

    it('33. Optional requirements preserved', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const optionalGaps = res.body.data.gaps.filter((g) => !g.mandatory);
      expect(optionalGaps.length).toBe(2);
    });

    it('34. Mandatory requirements preserved', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const mandatoryGaps = res.body.data.gaps.filter((g) => g.mandatory);
      expect(mandatoryGaps.length).toBe(2);
    });

    it('35. Inactive requirement excluded from analysis', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const reqIds = res.body.data.gaps.map((g) => g.requirementId.toString());
      expect(reqIds).not.toContain(inactiveRequirementDoc._id.toString());
    });

    it('36. Inactive skill referenced by requirement excluded from analysis', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const skillIds = res.body.data.gaps.map((g) => g.skill._id.toString());
      expect(skillIds).not.toContain(inactiveSkillRef._id.toString());
    });

    it('37. Inactive employee skill treated as absent (becomes MISSING)', async () => {
      // Soft-delete employee A's Docker skill
      await EmployeeSkill.updateOne(
        { employee: employeeProfileA._id, skill: skillReqC._id },
        { isActive: false }
      );

      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const dockerGap = res.body.data.gaps.find((g) => g.skill.name === 'Phase 16 Docker Containers');
      expect(dockerGap.status).toBe('MISSING');
      expect(dockerGap.currentLevel).toBeNull();

      // Restore active state
      await EmployeeSkill.updateOne(
        { employee: employeeProfileA._id, skill: skillReqC._id },
        { isActive: true }
      );
    });

    it('38. Inactive job role rejected (404)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${inactiveRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/job role not found/i);
    });

    it('39. Inactive employee rejected (404)', async () => {
      const res = await request(app)
        .get(`/api/employees/${inactiveEmployeeProfile._id}/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/employee not found/i);
    });
  });

  // ==========================================
  // 4. SUMMARY METRICS TESTS
  // ==========================================
  describe('Summary Metrics Verification', () => {
    let targetRole;

    beforeAll(async () => {
      // Find fullstack architect role
      targetRole = await JobRole.findOne({ code: 'P16-FS-ARCH' });
    });

    it('40. totalRequirements calculated correctly', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.totalRequirements).toBe(4);
    });

    it('41. mandatoryRequirements calculated correctly', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.mandatoryRequirements).toBe(2);
    });

    it('42. optionalRequirements calculated correctly', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.optionalRequirements).toBe(2);
    });

    it('43. missingSkills calculated correctly', async () => {
      // Employee A is missing Kubernetes
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.missingSkills).toBe(1);
    });

    it('44. belowRequiredSkills calculated correctly', async () => {
      // Employee A is below required for GraphQL
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.belowRequiredSkills).toBe(1);
    });

    it('45. meetsRequiredSkills calculated correctly', async () => {
      // Employee A meets TypeScript and Docker
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.meetsRequiredSkills).toBe(2);
    });

    it('46. mandatoryGaps calculated correctly', async () => {
      // Mandatory requirements are TypeScript (meets) and GraphQL (below) -> 1 gap
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.mandatoryGaps).toBe(1);
    });

    it('47. optionalGaps calculated correctly', async () => {
      // Optional requirements are Docker (meets) and Kubernetes (missing) -> 1 gap
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.optionalGaps).toBe(1);
    });

    it('48. mandatoryRequirementsMet calculated correctly', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.mandatoryRequirementsMet).toBe(1);
    });

    it('49. mandatoryRequirementsGap calculated correctly', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.mandatoryRequirementsGap).toBe(1);
    });

    it('50. overallMatchPercentage calculated correctly (2/4 = 50%)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.overallMatchPercentage).toBe(50);
    });

    it('51. mandatoryMatchPercentage calculated correctly (1/2 = 50%)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.mandatoryMatchPercentage).toBe(50);
    });

    it('52. zero requirements returns 100% overall match', async () => {
      const emptyRole = await JobRole.create({
        name: 'Phase 16 Empty Job Role',
        code: 'P16-EMPTY'
      });

      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${emptyRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalRequirements).toBe(0);
      expect(res.body.data.summary.overallMatchPercentage).toBe(100);
    });

    it('53. zero mandatory requirements returns 100% mandatory match', async () => {
      const optionalOnlyRole = await JobRole.create({
        name: 'Phase 16 Optional Only Role',
        code: 'P16-OPT-ONLY'
      });

      const skill = await Skill.create({
        name: 'Phase 16 Optional Skill',
        category: 'General'
      });

      await JobRoleSkillRequirement.create({
        jobRole: optionalOnlyRole._id,
        skill: skill._id,
        requiredLevel: 'beginner',
        mandatory: false
      });

      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${optionalOnlyRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.mandatoryRequirements).toBe(0);
      expect(res.body.data.summary.mandatoryMatchPercentage).toBe(100);
    });

    it('54. weightedMatchPercentage calculated correctly', async () => {
      // For employee A on targetRole:
      // Requirements weights: TS (10), GraphQL (5), Docker (3), K8s (2) -> Total weight = 20
      // Meets: TS (10) + Docker (3) = 13
      // Weighted match = (13 / 20) * 100 = 65%
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.body.data.summary.weightedMatchPercentage).toBe(65);
    });

    it('55. zero total weight returns 100%', async () => {
      const zeroWeightRole = await JobRole.create({
        name: 'Phase 16 Zero Weight Role',
        code: 'P16-ZERO-WT'
      });

      const skill = await Skill.create({
        name: 'Phase 16 Zero Weight Skill',
        category: 'General'
      });

      await JobRoleSkillRequirement.create({
        jobRole: zeroWeightRole._id,
        skill: skill._id,
        requiredLevel: 'beginner',
        weight: 0
      });

      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${zeroWeightRole._id}`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.weightedMatchPercentage).toBe(100);
    });
  });

  // ==========================================
  // 5. SECURITY & IDOR PROTECTION TESTS
  // ==========================================
  describe('Security & IDOR Protection', () => {
    let targetRole;

    beforeAll(async () => {
      targetRole = await JobRole.findOne({ code: 'P16-FS-ARCH' });
    });

    it('56. Employee self endpoint cannot analyze another employee', async () => {
      // Employee B calling self endpoint gets Employee B data, not Employee A
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee.employeeId).toBe('P16-EMP-002');
      expect(res.body.data.employee.employeeId).not.toBe('P16-EMP-001');
    });

    it('57. Employee cannot access admin arbitrary employee endpoint (403)', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileB._id}/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(403);
    });

    it('58. Trainer cannot access admin arbitrary employee endpoint (403)', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileA._id}/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });

    it('59. Admin can analyze arbitrary active employee (200)', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileA._id}/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee.employeeId).toBe('P16-EMP-001');
    });

    it('60. Invalid employee ID returns 400', async () => {
      const res = await request(app)
        .get(`/api/employees/invalid-emp-id/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid employee id/i);
    });

    it('61. Invalid role ID returns 400', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileA._id}/skill-gap/invalid-role-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid job role id/i);
    });

    it('62. Nonexistent employee returns 404', async () => {
      const fakeEmpId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/employees/${fakeEmpId}/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/employee not found/i);
    });

    it('63. Nonexistent role returns 404', async () => {
      const fakeRoleId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/employees/${employeeProfileA._id}/skill-gap/${fakeRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/job role not found/i);
    });

    it('64. Client cannot inject currentLevel', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?currentLevel=expert`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('65. Client cannot inject status', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?overallMatchPercentage=100`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('66. Client cannot inject percentages', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?mandatoryMatchPercentage=100`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });

    it('67. Client cannot inject summary metrics', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?summary=fake`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/client injection/i);
    });
  });

  // ==========================================
  // 6. FILTERING & DETERMINISTIC ORDERING TESTS
  // ==========================================
  describe('Filtering & Deterministic Ordering', () => {
    let targetRole;

    beforeAll(async () => {
      targetRole = await JobRole.findOne({ code: 'P16-FS-ARCH' });
    });

    it('68. status=MISSING filter works', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?status=MISSING`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gaps.length).toBe(1);
      expect(res.body.data.gaps[0].status).toBe('MISSING');
      // Full summary metrics remain intact
      expect(res.body.data.summary.totalRequirements).toBe(4);
    });

    it('69. status=BELOW_REQUIRED filter works', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?status=BELOW_REQUIRED`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gaps.length).toBe(1);
      expect(res.body.data.gaps[0].status).toBe('BELOW_REQUIRED');
    });

    it('70. status=MEETS_REQUIRED filter works', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?status=MEETS_REQUIRED`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gaps.length).toBe(2);
      res.body.data.gaps.forEach((g) => {
        expect(g.status).toBe('MEETS_REQUIRED');
      });
    });

    it('71. mandatory=true filter works', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?mandatory=true`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gaps.length).toBe(2);
      res.body.data.gaps.forEach((g) => {
        expect(g.mandatory).toBe(true);
      });
    });

    it('72. mandatory=false filter works', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?mandatory=false`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gaps.length).toBe(2);
      res.body.data.gaps.forEach((g) => {
        expect(g.mandatory).toBe(false);
      });
    });

    it('73. Invalid status rejected (400)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?status=EXCELLENT`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid status filter/i);
    });

    it('74. Invalid mandatory value rejected (400)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}?mandatory=notabool`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid mandatory filter/i);
    });

    it('75. Gaps are returned in deterministic order (mandatory first, requiredLevelRank desc, skill name asc)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const gaps = res.body.data.gaps;
      expect(gaps.length).toBe(4);

      // 1. First two gaps must be mandatory=true
      expect(gaps[0].mandatory).toBe(true);
      expect(gaps[1].mandatory).toBe(true);
      // 2. Last two gaps must be mandatory=false
      expect(gaps[2].mandatory).toBe(false);
      expect(gaps[3].mandatory).toBe(false);

      // Mandatory order: TS is advanced (3), GraphQL is intermediate (2) -> TS first
      expect(gaps[0].skill.name).toBe('Phase 16 TypeScript');
      expect(gaps[1].skill.name).toBe('Phase 16 GraphQL');

      // Optional order: K8s is advanced (3), Docker is intermediate (2) -> K8s first
      expect(gaps[2].skill.name).toBe('Phase 16 Kubernetes Cluster');
      expect(gaps[3].skill.name).toBe('Phase 16 Docker Containers');
    });

    it('76. Response does not expose user password, tokens, or sensitive fields', async () => {
      const res = await request(app)
        .get(`/api/employees/me/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee.password).toBeUndefined();
      expect(res.body.data.employee.user).toBeUndefined();
    });
  });
});
