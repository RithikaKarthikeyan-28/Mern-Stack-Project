const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const config = require('../../src/config');
const User = require('../../src/models/User');
const Department = require('../../src/models/Department');
const Employee = require('../../src/models/Employee');
const Skill = require('../../src/models/Skill');
const JobRole = require('../../src/models/JobRole');
const JobRoleSkillRequirement = require('../../src/models/JobRoleSkillRequirement');
const EmployeeSkill = require('../../src/models/EmployeeSkill');
const Course = require('../../src/models/Course');
const CourseSkill = require('../../src/models/CourseSkill');
const Enrollment = require('../../src/models/Enrollment');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Workflow 6 & 7 Integration: Skills Gap Analysis & Course Recommendations', () => {
  let adminToken;
  let trainerToken;
  let employeeToken;
  let foreignEmployeeToken;

  let adminUser;
  let trainerUser;
  let employeeUser;
  let foreignEmployeeUser;
  let department;
  let employeeDoc;
  let foreignEmployeeDoc;

  let skillNode;
  let skillDocker;
  let skillDb;
  let jobRoleDoc;

  let courseA; // Valid candidate (published, active)
  let courseB; // Draft course (excluded)
  let courseC; // Inactive course (excluded)
  let courseD; // Only covers non-gap skill (excluded)
  let courseE; // Completed course (excluded)

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    try {
      await Skill.collection.dropIndexes();
      await JobRole.collection.dropIndexes();
      await JobRoleSkillRequirement.collection.dropIndexes();
      await EmployeeSkill.collection.dropIndexes();
      await CourseSkill.collection.dropIndexes();
    } catch (e) {
      // ignore
    }
    await Skill.syncIndexes();
    await JobRole.syncIndexes();
    await JobRoleSkillRequirement.syncIndexes();
    await EmployeeSkill.syncIndexes();
    await CourseSkill.syncIndexes();

    await CourseSkill.deleteMany({});
    await EmployeeSkill.deleteMany({});
    await JobRoleSkillRequirement.deleteMany({});
    await JobRole.deleteMany({});
    await Skill.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    // 1. Department
    department = await Department.create({
      name: 'Cloud & Systems Engineering',
      description: 'Department for skills and growth pathways'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Skills Admin',
      email: 'skills.admin@skilltrack.test',
      password: 'Password123!',
      role: 'admin'
    });

    trainerUser = await User.create({
      name: 'Skills Trainer',
      email: 'skills.trainer@skilltrack.test',
      password: 'Password123!',
      role: 'trainer'
    });

    employeeUser = await User.create({
      name: 'Alice Engineer',
      email: 'alice.engineer@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    foreignEmployeeUser = await User.create({
      name: 'Bob Peer',
      email: 'bob.peer@skilltrack.test',
      password: 'Password123!',
      role: 'employee'
    });

    // 3. Tokens
    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    trainerToken = jwt.sign(
      { userId: trainerUser._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    employeeToken = jwt.sign(
      { userId: employeeUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    foreignEmployeeToken = jwt.sign(
      { userId: foreignEmployeeUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // 4. Employee Profiles
    const emp1Res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: employeeUser._id.toString(),
        employeeId: 'EMP-SKILL-01',
        department: department._id.toString(),
        designation: 'Associate Backend Engineer',
        phone: '9888877771'
      })
      .expect(201);
    employeeDoc = emp1Res.body.data.employee;

    const emp2Res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: foreignEmployeeUser._id.toString(),
        employeeId: 'EMP-SKILL-02',
        department: department._id.toString(),
        designation: 'Junior Developer',
        phone: '9888877772'
      })
      .expect(201);
    foreignEmployeeDoc = emp2Res.body.data.employee;

    // 5. Skills Catalog
    const s1Res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Node.js Backend Architecture',
        category: 'technical',
        description: 'Server-side Node.js mastery'
      })
      .expect(201);
    skillNode = s1Res.body.data.skill;

    const s2Res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Docker & Containerization',
        category: 'devops',
        description: 'Container runtimes and Dockerfile best practices'
      })
      .expect(201);
    skillDocker = s2Res.body.data.skill;

    const s3Res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Distributed Database Systems',
        category: 'database',
        description: 'Relational and NoSQL distributed databases'
      })
      .expect(201);
    skillDb = s3Res.body.data.skill;

    // 6. Job Role (with required code property)
    const roleRes = await request(app)
      .post('/api/job-roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Senior Systems Architect',
        code: 'ROLE-SSA-01',
        description: 'Core engineering leadership role',
        department: department._id.toString()
      })
      .expect(201);
    jobRoleDoc = roleRes.body.data.jobRole;

    const jobRoleId = jobRoleDoc._id || jobRoleDoc.id;

    // 7. Role Requirements
    // Skill 1 (Node): required 'advanced', mandatory
    await request(app)
      .post(`/api/job-roles/${jobRoleId}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skillNode._id || skillNode.id,
        requiredLevel: 'advanced',
        mandatory: true,
        weight: 50
      })
      .expect(201);

    // Skill 2 (Docker): required 'intermediate', optional
    await request(app)
      .post(`/api/job-roles/${jobRoleId}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skillDocker._id || skillDocker.id,
        requiredLevel: 'intermediate',
        mandatory: false,
        weight: 25
      })
      .expect(201);

    // Skill 3 (Database): required 'intermediate', mandatory
    await request(app)
      .post(`/api/job-roles/${jobRoleId}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skillDb._id || skillDb.id,
        requiredLevel: 'intermediate',
        mandatory: true,
        weight: 25
      })
      .expect(201);

    // 8. Employee Skill Proficiencies
    const empId = employeeDoc._id || employeeDoc.id;
    // Skill 1 (Node): employee has 'intermediate' (below 'advanced' requirement) -> BELOW_REQUIRED
    await request(app)
      .post(`/api/employees/${empId}/skills`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skillNode._id || skillNode.id,
        proficiencyLevel: 'intermediate'
      })
      .expect(201);

    // Skill 2 (Docker): employee has 'intermediate' (matches requirement) -> MEETS_REQUIRED
    await request(app)
      .post(`/api/employees/${empId}/skills`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skillDocker._id || skillDocker.id,
        proficiencyLevel: 'intermediate'
      })
      .expect(201);

    // Skill 3 (Database): employee has NO record -> MISSING
  });

  afterAll(async () => {
    await CourseSkill.deleteMany({});
    await EmployeeSkill.deleteMany({});
    await JobRoleSkillRequirement.deleteMany({});
    await JobRole.deleteMany({});
    await Skill.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Workflow 6: Skills Catalog, Proficiency Tracking, and Deterministic Gap Analysis', () => {
    it('6.1: Deterministic Gap Analysis identifies MEETS_REQUIRED, BELOW_REQUIRED, and MISSING', async () => {
      const jobRoleId = jobRoleDoc._id || jobRoleDoc.id;

      // 1. Employee queries own skill gap
      const gapRes = await request(app)
        .get(`/api/employees/me/skill-gap/${jobRoleId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(gapRes.body.success).toBe(true);
      const data = gapRes.body.data;

      // Validate summary metrics
      expect(data.summary.totalRequirements).toBe(3);
      expect(data.summary.meetsRequiredSkills).toBe(1);      // Docker
      expect(data.summary.belowRequiredSkills).toBe(1);      // Node
      expect(data.summary.missingSkills).toBe(1);            // Database
      expect(data.summary.mandatoryRequirements).toBe(2);    // Node + Database
      expect(data.summary.mandatoryRequirementsMet).toBe(0); // None of the 2 mandatory are met yet

      // Validate individual gap items
      const gaps = data.gaps;
      const nodeGap = gaps.find((g) => g.skill.name === 'Node.js Backend Architecture');
      expect(nodeGap.status).toBe('BELOW_REQUIRED');
      expect(nodeGap.currentLevel).toBe('intermediate');
      expect(nodeGap.requiredLevel).toBe('advanced');
      expect(nodeGap.mandatory).toBe(true);

      const dockerGap = gaps.find((g) => g.skill.name === 'Docker & Containerization');
      expect(dockerGap.status).toBe('MEETS_REQUIRED');
      expect(dockerGap.currentLevel).toBe('intermediate');
      expect(dockerGap.requiredLevel).toBe('intermediate');
      expect(dockerGap.mandatory).toBe(false);

      const dbGap = gaps.find((g) => g.skill.name === 'Distributed Database Systems');
      expect(dbGap.status).toBe('MISSING');
      expect(dbGap.currentLevel).toBeNull();
      expect(dbGap.requiredLevel).toBe('intermediate');
      expect(dbGap.mandatory).toBe(true);

      // 2. Admin queries employee's skill gap
      const empId = employeeDoc._id || employeeDoc.id;
      const adminGapRes = await request(app)
        .get(`/api/employees/${empId}/skill-gap/${jobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminGapRes.body.data.summary.totalRequirements).toBe(3);

      // 3. IDOR / Role defense: Foreign employee cannot query another employee's skill gap
      await request(app)
        .get(`/api/employees/${empId}/skill-gap/${jobRoleId}`)
        .set('Authorization', `Bearer ${foreignEmployeeToken}`)
        .expect(403);
    });
  });

  describe('Workflow 7: Recommendation Engine, Filtering, and Exclusion Rules', () => {
    beforeAll(async () => {
      const trainerId = trainerUser._id;
      const nodeSkillId = skillNode._id || skillNode.id;
      const dockerSkillId = skillDocker._id || skillDocker.id;
      const dbSkillId = skillDb._id || skillDb.id;
      const empId = employeeDoc._id || employeeDoc.id;

      // Course A: Published & Active, covers Node at 'advanced' (gap skill) & DB at 'intermediate' (gap skill) -> PRIME CANDIDATE
      courseA = await Course.create({
        title: 'Mastering Advanced Node & Distributed DBs',
        description: 'Deep dive into advanced Node architecture and databases',
        category: 'technical',
        level: 'advanced',
        duration: 40,
        trainer: trainerId,
        status: 'published',
        isActive: true
      });
      await request(app)
        .post(`/api/courses/${courseA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skill: nodeSkillId, coverageLevel: 'advanced', coverageWeight: 60 })
        .expect(201);
      await request(app)
        .post(`/api/courses/${courseA._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skill: dbSkillId, coverageLevel: 'intermediate', coverageWeight: 40 })
        .expect(201);

      // Course B: Draft (covers DB) -> MUST BE EXCLUDED
      courseB = await Course.create({
        title: 'Unreleased Draft Database Course',
        description: 'Draft database concepts',
        category: 'database',
        level: 'intermediate',
        duration: 15,
        trainer: trainerId,
        status: 'draft',
        isActive: true
      });
      await request(app)
        .post(`/api/courses/${courseB._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skill: dbSkillId, coverageLevel: 'intermediate', coverageWeight: 50 })
        .expect(201);

      // Course C: Created active to map skill, then deactivated -> MUST BE EXCLUDED
      courseC = await Course.create({
        title: 'Deprecated Node Architecture Course',
        description: 'Inactive course',
        category: 'technical',
        level: 'advanced',
        duration: 20,
        trainer: trainerId,
        status: 'published',
        isActive: true
      });
      await request(app)
        .post(`/api/courses/${courseC._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skill: nodeSkillId, coverageLevel: 'advanced', coverageWeight: 50 })
        .expect(201);
      // Now deactivate course C
      await Course.findByIdAndUpdate(courseC._id, { isActive: false });

      // Course D: Published & Active, but ONLY covers Docker (non-gap skill) -> MUST BE EXCLUDED
      courseD = await Course.create({
        title: 'Containerization Mastery with Docker',
        description: 'Docker fundamentals and containers',
        category: 'devops',
        level: 'intermediate',
        duration: 10,
        trainer: trainerId,
        status: 'published',
        isActive: true
      });
      await request(app)
        .post(`/api/courses/${courseD._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skill: dockerSkillId, coverageLevel: 'intermediate', coverageWeight: 100 })
        .expect(201);

      // Course E: Published & Active (covers DB), but employee has ALREADY COMPLETED it -> MUST BE EXCLUDED
      courseE = await Course.create({
        title: 'Introductory Relational Databases',
        description: 'Basic SQL and schemas',
        category: 'database',
        level: 'beginner',
        duration: 10,
        trainer: trainerId,
        status: 'published',
        isActive: true
      });
      await request(app)
        .post(`/api/courses/${courseE._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skill: dbSkillId, coverageLevel: 'beginner', coverageWeight: 50 })
        .expect(201);

      // Create completed enrollment for Course E
      await Enrollment.create({
        employee: empId,
        course: courseE._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
        isActive: true
      });
    });

    it('7.1: Course recommendations strictly adhere to candidate matching and exclusion rules', async () => {
      const jobRoleId = jobRoleDoc._id || jobRoleDoc.id;

      // 1. Employee fetches recommendations
      const recRes = await request(app)
        .get(`/api/employees/me/recommendations/${jobRoleId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(recRes.body.success).toBe(true);
      const data = recRes.body.data;

      // Summary checks
      expect(data.summary.totalGapSkills).toBe(2); // Node and Database

      const recs = data.recommendations;
      expect(recs.length).toBeGreaterThanOrEqual(1);

      // Verify Course A is recommended
      const courseAIdStr = courseA._id.toString();
      const recA = recs.find((r) => r.course._id === courseAIdStr || r.course.id === courseAIdStr);
      expect(recA).toBeDefined();
      expect(recA.score).toBeGreaterThan(0);
      expect(recA.matchedSkills.length).toBe(2); // Covers both Node and Database gaps

      // Verify EXCLUSIONS:
      const returnedCourseIds = recs.map((r) => (r.course._id || r.course.id).toString());

      // Course B (Draft) must NOT be returned
      expect(returnedCourseIds).not.toContain(courseB._id.toString());

      // Course C (Inactive) must NOT be returned
      expect(returnedCourseIds).not.toContain(courseC._id.toString());

      // Course D (Only covers non-gap skill Docker) must NOT be returned
      expect(returnedCourseIds).not.toContain(courseD._id.toString());

      // Course E (Already completed) must NOT be returned
      expect(returnedCourseIds).not.toContain(courseE._id.toString());

      // 2. Admin fetches recommendations for employee
      const empId = employeeDoc._id || employeeDoc.id;
      const adminRecRes = await request(app)
        .get(`/api/employees/${empId}/recommendations/${jobRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminRecRes.body.data.summary.totalGapSkills).toBe(2);
      expect(adminRecRes.body.data.recommendations.length).toBeGreaterThanOrEqual(1);

      // 3. Mandatory filter: Querying ?mandatoryOnly=true returns only recommendations for mandatory skills
      const mandRes = await request(app)
        .get(`/api/employees/me/recommendations/${jobRoleId}?mandatoryOnly=true`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(mandRes.body.success).toBe(true);
      expect(mandRes.body.data.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
