const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const CourseSkill = require('../src/models/CourseSkill');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const EmployeeSkill = require('../src/models/EmployeeSkill');
const Enrollment = require('../src/models/Enrollment');
const config = require('../src/config');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Phase 17 — Course Recommendation Engine Tests', () => {
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

  let skillJava;
  let skillPython;
  let skillReact;
  let skillDocker;
  let skillAWS;
  let inactiveSkill;

  let roleBackendDev;
  let roleFullstack;
  let inactiveJobRole;

  let courseJavaBasic;
  let courseJavaAdv;
  let coursePythonFull;
  let courseMultiCloud;
  let courseDockerIntro;
  let courseDraft;
  let courseArchived;
  let courseInactive;

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

    // Clean up any test artifacts from prior runs
    await Promise.all([
      User.deleteMany({ email: /@phase17test\.com$/ }),
      Department.deleteMany({ $or: [{ code: /^P17-/ }, { name: /Phase 17/i }] }),
      Employee.deleteMany({ employeeId: /^P17-EMP/ }),
      Course.deleteMany({ title: /^Phase 17/ }),
      Skill.deleteMany({ name: /^Phase 17/ }),
      JobRole.deleteMany({ code: /^P17-/ }),
      JobRoleSkillRequirement.deleteMany({}),
      EmployeeSkill.deleteMany({}),
      CourseSkill.deleteMany({}),
      Enrollment.deleteMany({})
    ]);

    // 1. Department
    department = await Department.create({
      name: 'Phase 17 Engineering',
      code: 'P17-ENG'
    });

    // 2. Users
    adminUser = await User.create({
      name: 'Admin Phase17',
      email: 'admin@phase17test.com',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });

    trainerUser = await User.create({
      name: 'Trainer Phase17',
      email: 'trainer@phase17test.com',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });

    employeeAUser = await User.create({
      name: 'Employee A Phase17',
      email: 'employeeA@phase17test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    employeeBUser = await User.create({
      name: 'Employee B Phase17',
      email: 'employeeB@phase17test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    // 3. Employee Profiles
    employeeProfileA = await Employee.create({
      user: employeeAUser._id,
      employeeId: 'P17-EMP-001',
      department: department._id,
      designation: 'Junior Developer',
      isActive: true
    });

    employeeProfileB = await Employee.create({
      user: employeeBUser._id,
      employeeId: 'P17-EMP-002',
      department: department._id,
      designation: 'Senior Developer',
      isActive: true
    });

    adminToken = generateToken(adminUser);
    trainerToken = generateToken(trainerUser);
    employeeAToken = generateToken(employeeAUser);
    employeeBToken = generateToken(employeeBUser);

    // 4. Skills
    skillJava = await Skill.create({
      name: 'Phase 17 Java',
      category: 'Backend',
      description: 'Java enterprise development',
      isActive: true
    });

    skillPython = await Skill.create({
      name: 'Phase 17 Python',
      category: 'Backend',
      description: 'Python scripting and web development',
      isActive: true
    });

    skillReact = await Skill.create({
      name: 'Phase 17 React',
      category: 'Frontend',
      description: 'React UI component development',
      isActive: true
    });

    skillDocker = await Skill.create({
      name: 'Phase 17 Docker',
      category: 'DevOps',
      description: 'Containerization and packaging',
      isActive: true
    });

    skillAWS = await Skill.create({
      name: 'Phase 17 AWS',
      category: 'Cloud',
      description: 'Amazon Web Services infrastructure',
      isActive: true
    });

    inactiveSkill = await Skill.create({
      name: 'Phase 17 Inactive Skill',
      category: 'Legacy',
      description: 'Deprecated skill',
      isActive: false
    });

    // 5. Job Roles
    roleBackendDev = await JobRole.create({
      name: 'Phase 17 Backend Engineer',
      code: 'P17-JR-BACKEND',
      description: 'Build robust backend services',
      isActive: true
    });

    roleFullstack = await JobRole.create({
      name: 'Phase 17 Fullstack Engineer',
      code: 'P17-JR-FULLSTACK',
      description: 'Full stack development',
      isActive: true
    });

    inactiveJobRole = await JobRole.create({
      name: 'Phase 17 Inactive Role',
      code: 'P17-JR-INACTIVE',
      description: 'Deprecated job role',
      isActive: false
    });

    // 6. Job Role Requirements for roleBackendDev:
    // - Java: mandatory=true, requiredLevel='advanced' (rank 3), weight=40
    // - Python: mandatory=true, requiredLevel='intermediate' (rank 2), weight=30
    // - Docker: mandatory=false, requiredLevel='intermediate' (rank 2), weight=20
    // - AWS: mandatory=false, requiredLevel='beginner' (rank 1), weight=10
    await JobRoleSkillRequirement.create([
      {
        jobRole: roleBackendDev._id,
        skill: skillJava._id,
        requiredLevel: 'advanced',
        mandatory: true,
        weight: 40
      },
      {
        jobRole: roleBackendDev._id,
        skill: skillPython._id,
        requiredLevel: 'intermediate',
        mandatory: true,
        weight: 30
      },
      {
        jobRole: roleBackendDev._id,
        skill: skillDocker._id,
        requiredLevel: 'intermediate',
        mandatory: false,
        weight: 20
      },
      {
        jobRole: roleBackendDev._id,
        skill: skillAWS._id,
        requiredLevel: 'beginner',
        mandatory: false,
        weight: 10
      }
    ]);

    // 7. Employee Skills:
    // Employee A:
    // - Java: currentLevel='beginner' -> BELOW_REQUIRED (diff = 3 - 1 = 2)
    // - Python: None -> MISSING (required intermediate)
    // - Docker: currentLevel='beginner' -> BELOW_REQUIRED (diff = 2 - 1 = 1)
    // - AWS: currentLevel='intermediate' -> EXCEEDED (rank 2 >= rank 1 -> MET)
    await EmployeeSkill.create([
      {
        employee: employeeProfileA._id,
        skill: skillJava._id,
        proficiencyLevel: 'beginner'
      },
      {
        employee: employeeProfileA._id,
        skill: skillDocker._id,
        proficiencyLevel: 'beginner'
      },
      {
        employee: employeeProfileA._id,
        skill: skillAWS._id,
        proficiencyLevel: 'intermediate'
      }
    ]);

    // 8. Courses
    courseJavaBasic = await Course.create({
      title: 'Phase 17 Java Basics',
      description: 'Fundamentals of Java programming',
      category: 'Backend',
      level: 'beginner',
      duration: 10,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    courseJavaAdv = await Course.create({
      title: 'Phase 17 Advanced Java Systems',
      description: 'Advanced concurrency and Spring Boot',
      category: 'Backend',
      level: 'advanced',
      duration: 25,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    coursePythonFull = await Course.create({
      title: 'Phase 17 Python Mastery',
      description: 'Comprehensive intermediate Python training',
      category: 'Backend',
      level: 'intermediate',
      duration: 15,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    courseMultiCloud = await Course.create({
      title: 'Phase 17 Multi-Cloud & DevOps Bootcamp',
      description: 'Docker containers and Python automation',
      category: 'DevOps',
      level: 'intermediate',
      duration: 30,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    courseDockerIntro = await Course.create({
      title: 'Phase 17 Docker Essentials',
      description: 'Docker basics for developers',
      category: 'DevOps',
      level: 'beginner',
      duration: 8,
      trainer: trainerUser._id,
      status: 'published',
      isActive: true
    });

    courseDraft = await Course.create({
      title: 'Phase 17 Draft Course',
      description: 'Unpublished course',
      category: 'DevOps',
      level: 'beginner',
      duration: 5,
      trainer: trainerUser._id,
      status: 'draft',
      isActive: true
    });

    courseArchived = await Course.create({
      title: 'Phase 17 Archived Course',
      description: 'Archived course',
      category: 'Backend',
      level: 'beginner',
      duration: 5,
      trainer: trainerUser._id,
      status: 'archived',
      isActive: true
    });

    courseInactive = await Course.create({
      title: 'Phase 17 Inactive Course',
      description: 'Deactivated course',
      category: 'Backend',
      level: 'beginner',
      duration: 5,
      trainer: trainerUser._id,
      status: 'published',
      isActive: false
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase17test\.com$/ }),
      Department.deleteMany({ $or: [{ code: /^P17-/ }, { name: /Phase 17/i }] }),
      Employee.deleteMany({ employeeId: /^P17-EMP/ }),
      Course.deleteMany({ title: /^Phase 17/ }),
      Skill.deleteMany({ name: /^Phase 17/ }),
      JobRole.deleteMany({ code: /^P17-/ }),
      JobRoleSkillRequirement.deleteMany({}),
      EmployeeSkill.deleteMany({}),
      CourseSkill.deleteMany({}),
      Enrollment.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  // =========================================================================
  // SUITE 1: CourseSkill Management & Admin CRUD (Tests 1–20)
  // =========================================================================
  describe('Suite 1: CourseSkill Management & Admin CRUD', () => {
    let createdMappingId;

    it('1. Admin successfully creates course skill mapping (POST /api/courses/:courseId/skills)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaAdv._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'advanced',
          coverageWeight: 80
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courseSkill).toBeDefined();
      expect(res.body.data.courseSkill.coverageLevel).toBe('advanced');
      expect(res.body.data.courseSkill.coverageWeight).toBe(80);
      expect(res.body.data.courseSkill.isActive).toBe(true);
      createdMappingId = res.body.data.courseSkill.id || res.body.data.courseSkill._id;
    });

    it('2. Admin cannot create duplicate course skill mapping (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaAdv._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'advanced',
          coverageWeight: 80
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('3. Non-admin (trainer) cannot create course skill mapping (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner',
          coverageWeight: 50
        });

      expect(res.status).toBe(403);
    });

    it('4. Non-admin (employee) cannot create course skill mapping (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner',
          coverageWeight: 50
        });

      expect(res.status).toBe(403);
    });

    it('5. Cannot create course skill mapping for non-existent course (404 Not Found)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/courses/${fakeId}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Course not found/i);
    });

    it('6. Cannot create course skill mapping for inactive course (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseInactive._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive course/i);
    });

    it('7. Cannot create course skill mapping for non-existent skill (404 Not Found)', async () => {
      const fakeSkillId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: fakeSkillId,
          coverageLevel: 'beginner'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Skill not found/i);
    });

    it('8. Cannot create course skill mapping for inactive skill (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: inactiveSkill._id,
          coverageLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive skill/i);
    });

    it('9. Validation rejects missing skillId/skill (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          coverageLevel: 'beginner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Skill.*required/i);
    });

    it('10. Validation rejects invalid coverageLevel (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'super-expert'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid coverage level/i);
    });

    it('11. Validation rejects coverageWeight < 0 or > 100 (400 Bad Request)', async () => {
      const res1 = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner',
          coverageWeight: -5
        });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner',
          coverageWeight: 105
        });
      expect(res2.status).toBe(400);
    });

    it('12. Validation rejects non-numeric coverageWeight (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseJavaBasic._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: skillJava._id,
          coverageLevel: 'beginner',
          coverageWeight: 'high'
        });

      expect(res.status).toBe(400);
    });

    it('13. Admin can list course skill mappings (GET /api/courses/:courseId/skills)', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseJavaAdv._id}/skills`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courseSkills).toBeInstanceOf(Array);
      expect(res.body.data.courseSkills.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('14. Employee can list course skill mappings for published active course', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseJavaAdv._id}/skills`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courseSkills).toBeDefined();
    });

    it('15. Employee cannot list course skills for draft/archived course (404 Not Found)', async () => {
      const res1 = await request(app)
        .get(`/api/courses/${courseDraft._id}/skills`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res1.status).toBe(404);

      const res2 = await request(app)
        .get(`/api/courses/${courseArchived._id}/skills`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res2.status).toBe(404);
    });

    it('16. Admin can update course skill mapping (PATCH /api/course-skills/:id)', async () => {
      const res = await request(app)
        .patch(`/api/course-skills/${createdMappingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          coverageLevel: 'expert',
          coverageWeight: 90
        });

      expect(res.status).toBe(200);
      expect(res.body.data.courseSkill.coverageLevel).toBe('expert');
      expect(res.body.data.courseSkill.coverageWeight).toBe(90);

      // Revert back to 'advanced' and 80 for subsequent recommendation testing
      await request(app)
        .patch(`/api/course-skills/${createdMappingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          coverageLevel: 'advanced',
          coverageWeight: 80
        });
    });

    it('17. Trainer/Employee cannot update course skill mapping (403 Forbidden)', async () => {
      const res1 = await request(app)
        .patch(`/api/course-skills/${createdMappingId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ coverageWeight: 50 });
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .patch(`/api/course-skills/${createdMappingId}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({ coverageWeight: 50 });
      expect(res2.status).toBe(403);
    });

    it('18. Update rejects invalid coverageLevel or out-of-range coverageWeight (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/course-skills/${createdMappingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ coverageWeight: 999 });

      expect(res.status).toBe(400);
    });

    it('19. Admin can soft-delete course skill mapping (DELETE /api/course-skills/:id)', async () => {
      // Create a temporary mapping to delete
      const tempCourse = await Course.create({
        title: 'Phase 17 Temp Course for Deletion',
        description: 'Temporary course description',
        category: 'Backend',
        level: 'beginner',
        duration: 5,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      const tempMapping = await CourseSkill.create({
        course: tempCourse._id,
        skill: skillJava._id,
        coverageLevel: 'beginner',
        coverageWeight: 10
      });

      const res = await request(app)
        .delete(`/api/course-skills/${tempMapping._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const check = await CourseSkill.findById(tempMapping._id);
      expect(check.isActive).toBe(false);
    });

    it('20. Soft-deleted course skill mapping is excluded from non-admin course skills query', async () => {
      const tempCourse = await Course.create({
        title: 'Phase 17 Temp Course 2',
        description: 'Temporary course description',
        category: 'Backend',
        level: 'beginner',
        duration: 5,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      const tempMapping = await CourseSkill.create({
        course: tempCourse._id,
        skill: skillJava._id,
        coverageLevel: 'beginner',
        coverageWeight: 10,
        isActive: false
      });

      const res = await request(app)
        .get(`/api/courses/${tempCourse._id}/skills`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courseSkills.length).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 2: Recommendation Scoring Logic & Calculations (Tests 21–40)
  // =========================================================================
  describe('Suite 2: Recommendation Scoring Logic & Calculations', () => {
    beforeAll(async () => {
      // Setup course skill mappings for recommendation testing:
      // 1. courseJavaAdv covers skillJava with 'advanced', weight 80 (mandatory gap)
      // 2. coursePythonFull covers skillPython with 'intermediate', weight 60 (mandatory gap)
      // 3. courseMultiCloud covers:
      //    - skillPython with 'intermediate', weight 50 (mandatory gap)
      //    - skillDocker with 'intermediate', weight 50 (optional gap)
      // 4. courseDockerIntro covers skillDocker with 'beginner', weight 20 (optional gap)
      await CourseSkill.deleteMany({});

      await CourseSkill.create([
        {
          course: courseJavaAdv._id,
          skill: skillJava._id,
          coverageLevel: 'advanced',
          coverageWeight: 80
        },
        {
          course: coursePythonFull._id,
          skill: skillPython._id,
          coverageLevel: 'intermediate',
          coverageWeight: 60
        },
        {
          course: courseMultiCloud._id,
          skill: skillPython._id,
          coverageLevel: 'intermediate',
          coverageWeight: 50
        },
        {
          course: courseMultiCloud._id,
          skill: skillDocker._id,
          coverageLevel: 'intermediate',
          coverageWeight: 50
        },
        {
          course: courseDockerIntro._id,
          skill: skillDocker._id,
          coverageLevel: 'beginner',
          coverageWeight: 20
        }
      ]);
    });

    it('21. Score calculation for MISSING gap with beginner coverage: severity 40 + cov 10 + weight', async () => {
      const singleCourse = await Course.create({
        title: 'Phase 17 Single Beginner Python',
        description: 'Intro to Python',
        category: 'Backend',
        level: 'beginner',
        duration: 5,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: singleCourse._id,
        skill: skillPython._id, // Employee A has MISSING for Python
        coverageLevel: 'beginner',
        coverageWeight: 10
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === singleCourse._id.toString()
      );
      expect(rec).toBeDefined();
      // severity = 40, cov = 10, weight = (10/100)*20 = 2, mandatory bonus = +5 -> total = 57
      expect(rec.score).toBe(57);
    });

    it('22. Score calculation for MISSING gap with intermediate coverage: severity 40 + cov 20 + weight', async () => {
      // coursePythonFull: coverageLevel='intermediate' (cov=20), weight=60 ((60/100)*20 = 12)
      // mandatory bonus = +5 (Python is mandatory) -> total = 40 + 20 + 12 + 5 = 77
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === coursePythonFull._id.toString()
      );
      expect(rec).toBeDefined();
      expect(rec.score).toBe(77);
    });

    it('23. Score calculation for MISSING gap with advanced coverage: severity 40 + cov 30 + weight', async () => {
      const advCourse = await Course.create({
        title: 'Phase 17 Adv Python',
        description: 'Advanced Python',
        category: 'Backend',
        level: 'advanced',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: advCourse._id,
        skill: skillPython._id,
        coverageLevel: 'advanced',
        coverageWeight: 50
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === advCourse._id.toString()
      );
      // severity = 40, cov = 30, weight = 10, mandatory bonus = 5 -> total = 85
      expect(rec.score).toBe(85);
    });

    it('24. Score calculation for MISSING gap with expert coverage: severity 40 + cov 40 + weight', async () => {
      const expCourse = await Course.create({
        title: 'Phase 17 Expert Python',
        description: 'Expert Python',
        category: 'Backend',
        level: 'advanced',
        duration: 12,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: expCourse._id,
        skill: skillPython._id,
        coverageLevel: 'expert',
        coverageWeight: 100
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === expCourse._id.toString()
      );
      // severity = 40, cov = 40, weight = 20, mandatory bonus = 5 -> 105 capped at 100
      expect(rec.score).toBe(100);
    });

    it('25. Score calculation for BELOW_REQUIRED with diff=1: severity=25', async () => {
      // Employee A Docker: cur='beginner' (1), req='intermediate' (2), diff = 1 -> severity = 25
      // courseDockerIntro: coverageLevel='beginner' (1) -> covDiff = 1 - 2 = -1 -> covScore = 30
      // weight = 20 -> (20/100)*20 = 4. Optional gap -> mandatory bonus = 0. Single gap -> breadth = 0.
      // Total = 25 + 30 + 4 = 59
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseDockerIntro._id.toString()
      );
      expect(rec).toBeDefined();
      expect(rec.score).toBe(59);
    });

    it('26. Score calculation for BELOW_REQUIRED with diff=2: severity=32', async () => {
      // Employee A Java: cur='beginner' (1), req='advanced' (3), diff = 2 -> severity = 32
      // courseJavaAdv: coverageLevel='advanced' (3) -> covDiff = 3 - 3 = 0 -> covScore = 40
      // weight = 80 -> (80/100)*20 = 16. Java is mandatory -> mandatory bonus = +5.
      // Total = 32 + 40 + 16 + 5 = 93
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseJavaAdv._id.toString()
      );
      expect(rec).toBeDefined();
      expect(rec.score).toBe(93);
    });

    it('27. Score calculation for BELOW_REQUIRED with diff=3: severity=38', async () => {
      const expertRole = await JobRole.create({
        name: 'Phase 17 Expert Role',
        code: 'P17-JR-EXPERT',
        description: 'Expert role',
        isActive: true
      });
      await JobRoleSkillRequirement.create({
        jobRole: expertRole._id,
        skill: skillJava._id, // cur beginner (1), req expert (4) -> diff = 3 -> severity = 38
        requiredLevel: 'expert',
        mandatory: false,
        weight: 20
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${expertRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseJavaAdv._id.toString()
      );
      // diff = 3 -> severity = 38
      // course cov = 'advanced' (3), req = 'expert' (4) -> covDiff = -1 -> covScore = 30
      // weight = 80 -> 16. Optional -> mandatory bonus = 0.
      // Total = 38 + 30 + 16 = 84
      expect(rec.score).toBe(84);
    });

    it('28. Coverage score for BELOW_REQUIRED with covDiff >= 0 -> covScore = 40', async () => {
      // In test 26, courseJavaAdv cov='advanced' (3), req='advanced' (3) -> covDiff = 0 -> covScore = 40
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseJavaAdv._id.toString()
      );
      expect(rec).toBeDefined();
      expect(rec.score).toBe(93);
    });

    it('29. Coverage score for BELOW_REQUIRED with covDiff = -1 -> covScore = 30', async () => {
      // In test 25, courseDockerIntro cov='beginner' (1), req='intermediate' (2) -> covDiff = -1 -> covScore = 30
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseDockerIntro._id.toString()
      );
      expect(rec.score).toBe(59);
    });

    it('30. Coverage score for BELOW_REQUIRED with covDiff = -2 -> covScore = 20', async () => {
      const expRole2 = await JobRole.create({
        name: 'Phase 17 Expert Role 2',
        code: 'P17-JR-EXPERT2',
        description: 'Expert role 2',
        isActive: true
      });
      await JobRoleSkillRequirement.create({
        jobRole: expRole2._id,
        skill: skillDocker._id, // cur beginner (1), req expert (4) -> diff = 3 -> severity = 38
        requiredLevel: 'expert',
        mandatory: false,
        weight: 10
      });
      // courseDockerIntro: cov='beginner' (1) -> covDiff = 1 - 4 = -3.
      // Let's create an intermediate course for covDiff = -2:
      const interDockerCourse = await Course.create({
        title: 'Phase 17 Intermediate Docker',
        description: 'Intermediate Docker',
        category: 'DevOps',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: interDockerCourse._id,
        skill: skillDocker._id,
        coverageLevel: 'intermediate', // 2 -> covDiff = 2 - 4 = -2 -> covScore = 20
        coverageWeight: 0
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${expRole2._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === interDockerCourse._id.toString()
      );
      // severity = 38, covScore = 20, weight = 0, bonus = 0 -> total = 58
      expect(rec.score).toBe(58);
    });

    it('31. Coverage score for BELOW_REQUIRED with covDiff = -3 -> covScore = 10', async () => {
      const expRole3 = await JobRole.create({
        name: 'Phase 17 Expert Role 3',
        code: 'P17-JR-EXPERT3',
        description: 'Expert role 3',
        isActive: true
      });
      await JobRoleSkillRequirement.create({
        jobRole: expRole3._id,
        skill: skillDocker._id, // cur beginner (1), req expert (4) -> diff = 3 -> severity = 38
        requiredLevel: 'expert',
        mandatory: false,
        weight: 10
      });

      // courseDockerIntro has cov='beginner' (1) -> covDiff = 1 - 4 = -3 -> covScore = 10
      // weight = 20 -> (20/100)*20 = 4. Total = 38 + 10 + 4 = 52
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${expRole3._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseDockerIntro._id.toString()
      );
      expect(rec.score).toBe(52);
    });

    it('32. Normalized coverageWeight calculation: weight=50 -> 10 pts, weight=100 -> 20 pts, weight=0 -> 0 pts', async () => {
      // Tested in tests 21-27: (coverageWeight / 100) * 20
      const c1 = await Course.create({
        title: 'Phase 17 Zero Weight Course',
        description: 'Test zero weight',
        category: 'Backend',
        level: 'beginner',
        duration: 5,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: c1._id,
        skill: skillPython._id,
        coverageLevel: 'beginner',
        coverageWeight: 0
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === c1._id.toString()
      );
      // severity = 40, cov = 10, weight = 0, mandatory bonus = 5 -> total = 55
      expect(rec.score).toBe(55);
    });

    it('33. Single matched skill without bonuses: no breadth bonus and no mandatory bonus for optional gap', async () => {
      // courseDockerIntro covers only skillDocker (optional gap for Employee A)
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseDockerIntro._id.toString()
      );
      expect(rec.mandatoryGapCount).toBe(0);
      expect(rec.optionalGapCount).toBe(1);
      expect(rec.matchedSkills.length).toBe(1);
      // Raw skill score: 25 + 30 + 4 = 59. No bonuses -> 59
      expect(rec.score).toBe(59);
    });

    it('34. Mandatory bonus: +5 applied when course covers at least 1 mandatory gap', async () => {
      // courseJavaAdv covers skillJava (mandatory)
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseJavaAdv._id.toString()
      );
      expect(rec.mandatoryGapCount).toBe(1);
      // Raw: 32 + 40 + 16 = 88. +5 mandatory bonus = 93
      expect(rec.score).toBe(93);
    });

    it('35. Breadth bonus: +5 applied when course covers 2 or more gap skills', async () => {
      // Let's create a course covering 2 OPTIONAL gaps
      const multiOptRole = await JobRole.create({
        name: 'Phase 17 Multi Opt Role',
        code: 'P17-JR-MULTIOPT',
        description: 'Multi optional role',
        isActive: true
      });
      await JobRoleSkillRequirement.create([
        {
          jobRole: multiOptRole._id,
          skill: skillDocker._id,
          requiredLevel: 'intermediate',
          mandatory: false,
          weight: 20
        },
        {
          jobRole: multiOptRole._id,
          skill: skillPython._id,
          requiredLevel: 'intermediate',
          mandatory: false,
          weight: 20
        }
      ]);
      // courseMultiCloud covers both Python and Docker
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${multiOptRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseMultiCloud._id.toString()
      );
      expect(rec.matchedSkills.length).toBe(2);
      expect(rec.mandatoryGapCount).toBe(0);
      // Matched skill 1 (Python, missing): 40 + 20 + 10 = 70
      // Matched skill 2 (Docker, below req diff 1, covDiff 0): 25 + 40 + 10 = 75
      // Avg = 72.5. Breadth bonus = +5, mandatory bonus = 0 -> total = 77.5
      expect(rec.score).toBe(77.5);
    });

    it('36. Both bonuses applied: +10 total bonus when course covers >= 2 gap skills and at least 1 is mandatory', async () => {
      // courseMultiCloud for roleBackendDev:
      // Covers Python (mandatory gap) and Docker (optional gap)
      // Skill 1 (Python): 40 + 20 + 10 = 70
      // Skill 2 (Docker): 25 + 40 + 10 = 75
      // Avg = 72.5. Breadth bonus (+5) + mandatory bonus (+5) = +10 -> total = 82.5
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseMultiCloud._id.toString()
      );
      expect(rec.matchedSkills.length).toBe(2);
      expect(rec.mandatoryGapCount).toBe(1);
      expect(rec.optionalGapCount).toBe(1);
      expect(rec.score).toBe(82.5);
    });

    it('37. Maximum score cap: score cannot exceed 100 even with bonuses', async () => {
      const superCourse = await Course.create({
        title: 'Phase 17 Super Course',
        description: 'Super course description',
        category: 'Backend',
        level: 'advanced',
        duration: 30,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create([
        {
          course: superCourse._id,
          skill: skillPython._id,
          coverageLevel: 'expert', // 40 + 40 + 20 = 100
          coverageWeight: 100
        },
        {
          course: superCourse._id,
          skill: skillJava._id,
          coverageLevel: 'expert', // 32 + 40 + 20 = 92
          coverageWeight: 100
        }
      ]);

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === superCourse._id.toString()
      );
      // (100 + 92)/2 = 96 + 5 (breadth) + 5 (mandatory) = 106 -> capped at 100
      expect(rec.score).toBe(100);
    });

    it('38. Score rounded to 2 decimal places', async () => {
      const oddCourse = await Course.create({
        title: 'Phase 17 Odd Weight Course',
        description: 'Odd weight calculation',
        category: 'Backend',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: oddCourse._id,
        skill: skillPython._id,
        coverageLevel: 'intermediate',
        coverageWeight: 33 // (33/100)*20 = 6.6 -> 40 + 20 + 6.6 + 5 = 71.6
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === oddCourse._id.toString()
      );
      expect(rec.score).toBe(71.6);
      expect(typeof rec.score).toBe('number');
    });

    it('39. Multi-gap course aggregation correctly averages individual skill scores', async () => {
      // In test 36: courseMultiCloud averaged 70 and 75 to 72.5, before +10 bonus -> 82.5
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseMultiCloud._id.toString()
      );
      expect(rec.score).toBe(82.5);
    });

    it('40. Course covering only MET skills is not recommended', async () => {
      // Employee A already meets AWS (intermediate >= beginner)
      const awsOnlyCourse = await Course.create({
        title: 'Phase 17 AWS Only Course',
        description: 'AWS essentials',
        category: 'Cloud',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: awsOnlyCourse._id,
        skill: skillAWS._id,
        coverageLevel: 'intermediate',
        coverageWeight: 50
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === awsOnlyCourse._id.toString()
      );
      expect(rec).toBeUndefined();
    });
  });

  // =========================================================================
  // SUITE 3: Course Recommendation Eligibility & Invariants (Tests 41–55)
  // =========================================================================
  describe('Suite 3: Course Recommendation Eligibility & Invariants', () => {
    it('41. Completed course is completely excluded from recommendations', async () => {
      // Create a completed enrollment for Employee A in courseJavaAdv
      const enrollment = await Enrollment.create({
        employee: employeeProfileA._id,
        course: courseJavaAdv._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
        isActive: true
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseJavaAdv._id.toString()
      );
      expect(found).toBeUndefined();

      // Clean up enrollment for subsequent tests
      await Enrollment.deleteOne({ _id: enrollment._id });
    });

    it('42. Enrolled / in_progress course is included with proper enrollmentStatus field', async () => {
      const enrollment = await Enrollment.create({
        employee: employeeProfileA._id,
        course: courseJavaAdv._id,
        status: 'in_progress',
        progressPercentage: 40,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseJavaAdv._id.toString()
      );
      expect(rec).toBeDefined();
      expect(rec.enrollmentStatus).toBe('in_progress');

      // Clean up
      await Enrollment.deleteOne({ _id: enrollment._id });
    });

    it('43. Course without enrollment has enrollmentStatus = null', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const rec = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === coursePythonFull._id.toString()
      );
      expect(rec).toBeDefined();
      expect(rec.enrollmentStatus).toBeNull();
    });

    it('44. Draft course is excluded from recommendations', async () => {
      await CourseSkill.create({
        course: courseDraft._id,
        skill: skillPython._id,
        coverageLevel: 'intermediate',
        coverageWeight: 50
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const found = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseDraft._id.toString()
      );
      expect(found).toBeUndefined();
    });

    it('45. Archived course is excluded from recommendations', async () => {
      await CourseSkill.create({
        course: courseArchived._id,
        skill: skillPython._id,
        coverageLevel: 'intermediate',
        coverageWeight: 50
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const found = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseArchived._id.toString()
      );
      expect(found).toBeUndefined();
    });

    it('46. Inactive course (isActive=false) is excluded from recommendations', async () => {
      await CourseSkill.create({
        course: courseInactive._id,
        skill: skillPython._id,
        coverageLevel: 'intermediate',
        coverageWeight: 50
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const found = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === courseInactive._id.toString()
      );
      expect(found).toBeUndefined();
    });

    it('47. Inactive course-skill mapping (isActive=false) is excluded from recommendations', async () => {
      const inactiveMapCourse = await Course.create({
        title: 'Phase 17 Inactive Mapping Course',
        description: 'Course with inactive mapping',
        category: 'Backend',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: inactiveMapCourse._id,
        skill: skillPython._id,
        coverageLevel: 'intermediate',
        coverageWeight: 50,
        isActive: false
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const found = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === inactiveMapCourse._id.toString()
      );
      expect(found).toBeUndefined();
    });

    it('48. Inactive skill is excluded from recommendations', async () => {
      const inactiveSkillCourse = await Course.create({
        title: 'Phase 17 Inactive Skill Course',
        description: 'Course mapping inactive skill',
        category: 'Legacy',
        level: 'beginner',
        duration: 5,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      await CourseSkill.create({
        course: inactiveSkillCourse._id,
        skill: inactiveSkill._id,
        coverageLevel: 'beginner',
        coverageWeight: 50
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const found = res.body.data.recommendations.find(
        (r) => (r.course.id || r.course._id).toString() === inactiveSkillCourse._id.toString()
      );
      expect(found).toBeUndefined();
    });

    it('49. Employee with 0 skill gaps gets empty recommendations list and 0 candidateCourses', async () => {
      // Setup Employee B who meets all skills of roleBackendDev
      await EmployeeSkill.deleteMany({ employee: employeeProfileB._id });
      await EmployeeSkill.create([
        {
          employee: employeeProfileB._id,
          skill: skillJava._id,
          proficiencyLevel: 'advanced'
        },
        {
          employee: employeeProfileB._id,
          skill: skillPython._id,
          proficiencyLevel: 'expert'
        },
        {
          employee: employeeProfileB._id,
          skill: skillDocker._id,
          proficiencyLevel: 'advanced'
        },
        {
          employee: employeeProfileB._id,
          skill: skillAWS._id,
          proficiencyLevel: 'intermediate'
        }
      ]);

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations).toEqual([]);
      expect(res.body.data.summary.totalGapSkills).toBe(0);
      expect(res.body.data.summary.candidateCourses).toBe(0);
    });

    it('50. Recommendations are returned for employee self-access (GET /api/employees/me/recommendations/:jobRoleId)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    });

    it('51. Recommendations are returned for admin access (GET /api/employees/:employeeId/recommendations/:jobRoleId)', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileA._id}/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    });

    it('52. Summary metrics: totalGapSkills matches gap analysis', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      // Employee A has 3 gaps: Java (below), Python (missing), Docker (below). AWS is met.
      expect(res.body.data.summary.totalGapSkills).toBe(3);
    });

    it('53. Summary metrics: mandatoryGapSkills and optionalGapSkills accurately computed', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      // Mandatory gaps: Java, Python (2)
      // Optional gap: Docker (1)
      expect(res.body.data.summary.mandatoryGapSkills).toBe(2);
      expect(res.body.data.summary.optionalGapSkills).toBe(1);
    });

    it('54. Summary metrics: candidateCourses and returnedCourses accurately reflect counts', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.candidateCourses).toBe(
        res.body.data.recommendations.length
      );
      expect(res.body.data.summary.returnedCourses).toBe(
        res.body.data.recommendations.length
      );
    });

    it('55. Recommendation report includes employee and jobRole summary metadata', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee).toBeDefined();
      expect(res.body.data.employee.employeeId).toBe('P17-EMP-001');
      expect(res.body.data.jobRole).toBeDefined();
      expect(res.body.data.jobRole.code).toBe('P17-JR-BACKEND');
    });
  });

  // =========================================================================
  // SUITE 4: Sorting & Filtering (Tests 56–65)
  // =========================================================================
  describe('Suite 4: Sorting & Filtering', () => {
    it('56. Recommendations sorted primarily by score descending', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const recs = res.body.data.recommendations;
      for (let i = 0; i < recs.length - 1; i++) {
        expect(recs[i].score).toBeGreaterThanOrEqual(recs[i + 1].score);
      }
    });

    it('57. Tie-break 1: mandatoryGapCount descending for identical scores', async () => {
      // Create two courses with identical score: one has mandatoryGapCount=1, other 0
      const tieCourseMandatory = await Course.create({
        title: 'Phase 17 Tie Course Mandatory',
        description: 'Mandatory tie course',
        category: 'Backend',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      // Python is missing (mandatory): 40 + 20 + 0 + 5 (mandatory) = 65
      await CourseSkill.create({
        course: tieCourseMandatory._id,
        skill: skillPython._id,
        coverageLevel: 'intermediate',
        coverageWeight: 0
      });

      const tieCourseOptional = await Course.create({
        title: 'Phase 17 Tie Course Optional',
        description: 'Optional tie course',
        category: 'DevOps',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      // Docker is below req (diff 1) (optional): 25 + 40 + 0 = 65
      await CourseSkill.create({
        course: tieCourseOptional._id,
        skill: skillDocker._id,
        coverageLevel: 'intermediate',
        coverageWeight: 0
      });

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const recs = res.body.data.recommendations;
      const idxMandatory = recs.findIndex(
        (r) => (r.course.id || r.course._id).toString() === tieCourseMandatory._id.toString()
      );
      const idxOptional = recs.findIndex(
        (r) => (r.course.id || r.course._id).toString() === tieCourseOptional._id.toString()
      );

      expect(recs[idxMandatory].score).toBe(65);
      expect(recs[idxOptional].score).toBe(65);
      // Mandatory (count 1) must be ranked before Optional (count 0)
      expect(idxMandatory).toBeLessThan(idxOptional);
    });

    it('58. Tie-break 2: matchedSkills count descending for identical score and mandatory count', async () => {
      // Both have same score and mandatory count: course with more matchedSkills appears first
      // Let's create two courses:
      // Course A covers 1 gap with score S
      // Course B covers 2 gaps with avg score S
      // Both have mandatoryGapCount = 1
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const recs = res.body.data.recommendations;
      for (let i = 0; i < recs.length - 1; i++) {
        if (
          recs[i].score === recs[i + 1].score &&
          recs[i].mandatoryGapCount === recs[i + 1].mandatoryGapCount
        ) {
          expect(recs[i].matchedSkills.length).toBeGreaterThanOrEqual(
            recs[i + 1].matchedSkills.length
          );
        }
      }
    });

    it('59. Tie-break 3: course title ascending for identical score, mandatory count, and skill count', async () => {
      const cAlpha = await Course.create({
        title: 'Phase 17 Alpha Course',
        description: 'Alpha description',
        category: 'Backend',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });
      const cBeta = await Course.create({
        title: 'Phase 17 Beta Course',
        description: 'Beta description',
        category: 'Backend',
        level: 'intermediate',
        duration: 10,
        trainer: trainerUser._id,
        status: 'published',
        isActive: true
      });

      await CourseSkill.create([
        {
          course: cAlpha._id,
          skill: skillPython._id,
          coverageLevel: 'intermediate',
          coverageWeight: 25
        },
        {
          course: cBeta._id,
          skill: skillPython._id,
          coverageLevel: 'intermediate',
          coverageWeight: 25
        }
      ]);

      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const recs = res.body.data.recommendations;
      const idxAlpha = recs.findIndex((r) => (r.course.id || r.course._id).toString() === cAlpha._id.toString());
      const idxBeta = recs.findIndex((r) => (r.course.id || r.course._id).toString() === cBeta._id.toString());

      expect(recs[idxAlpha].score).toBe(recs[idxBeta].score);
      // 'Alpha' must come before 'Beta'
      expect(idxAlpha).toBeLessThan(idxBeta);
    });

    it('60. Query filter minScore excludes recommendations below specified threshold', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?minScore=80`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const recs = res.body.data.recommendations;
      expect(recs.length).toBeGreaterThan(0);
      for (const rec of recs) {
        expect(rec.score).toBeGreaterThanOrEqual(80);
      }
    });

    it('61. Query filter mandatoryOnly=true excludes courses with mandatoryGapCount = 0', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?mandatoryOnly=true`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      const recs = res.body.data.recommendations;
      expect(recs.length).toBeGreaterThan(0);
      for (const rec of recs) {
        expect(rec.mandatoryGapCount).toBeGreaterThan(0);
      }
    });

    it('62. Query filter limit restricts number of returned recommendations', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?limit=2`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations.length).toBe(2);
      expect(res.body.data.summary.returnedCourses).toBe(2);
      expect(res.body.data.summary.candidateCourses).toBeGreaterThan(2);
    });

    it('63. Query filter page allows paginating through recommendations', async () => {
      const resPage1 = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?limit=2&page=1`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const resPage2 = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?limit=2&page=2`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(resPage1.status).toBe(200);
      expect(resPage2.status).toBe(200);
      const id1 = (resPage1.body.data.recommendations[0].course.id || resPage1.body.data.recommendations[0].course._id).toString();
      const id2 = (resPage2.body.data.recommendations[0].course.id || resPage2.body.data.recommendations[0].course._id).toString();
      expect(id1).not.toBe(id2);
    });

    it('64. Combined query filters: minScore + mandatoryOnly + limit work harmoniously', async () => {
      const res = await request(app)
        .get(
          `/api/employees/me/recommendations/${roleBackendDev._id}?minScore=75&mandatoryOnly=true&limit=1`
        )
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations.length).toBe(1);
      expect(res.body.data.recommendations[0].score).toBeGreaterThanOrEqual(75);
      expect(res.body.data.recommendations[0].mandatoryGapCount).toBeGreaterThan(0);
    });

    it('65. returnedCourses count reflects paginated slice while candidateCourses reflects total eligible', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?limit=1`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.returnedCourses).toBe(1);
      expect(res.body.data.summary.candidateCourses).toBeGreaterThan(1);
    });
  });

  // =========================================================================
  // SUITE 5: Security, RBAC, IDOR & Error Handling (Tests 66–76)
  // =========================================================================
  describe('Suite 5: Security, RBAC, IDOR & Error Handling', () => {
    it('66. Employee cannot access other employee recommendations (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeProfileB._id}/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(403);
    });

    it('67. Employee self-recommendation strictly uses authenticated user session', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee.employeeId).toBe('P17-EMP-001');
    });

    it('68. Trainer cannot access recommendations endpoints (403 Forbidden)', async () => {
      const res1 = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${trainerToken}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .get(`/api/employees/${employeeProfileA._id}/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${trainerToken}`);
      expect(res2.status).toBe(403);
    });

    it('69. Unauthenticated requests are rejected with 401 Unauthorized', async () => {
      const res = await request(app).get(
        `/api/employees/me/recommendations/${roleBackendDev._id}`
      );
      expect(res.status).toBe(401);
    });

    it('70. Non-existent employeeId returns 404 Not Found (Admin endpoint)', async () => {
      const fakeEmpId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/employees/${fakeEmpId}/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Employee.*not found/i);
    });

    it('71. Non-existent jobRoleId returns 404 Not Found', async () => {
      const fakeRoleId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${fakeRoleId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Job role not found/i);
    });

    it('72. Inactive jobRoleId returns 404 Not Found', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${inactiveJobRole._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Job role not found/i);
    });

    it('73. Invalid ObjectId in URL parameters returns 400 Bad Request', async () => {
      const res1 = await request(app)
        .get(`/api/employees/me/recommendations/not-a-valid-id`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/employees/invalid-id/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);
    });

    it('74. NoSQL injection in query parameters is rejected (400 Bad Request)', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?minScore[$gt]=0`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
    });

    it('75. Invalid query parameters (negative minScore, invalid limit) return 400 Bad Request', async () => {
      const res1 = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?minScore=-10`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}?limit=0`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res2.status).toBe(400);
    });

    it('76. Response payload does not expose user passwords, password hashes, or internal secrets', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleBackendDev._id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employee.password).toBeUndefined();
      expect(res.body.data.employee.user).toBeUndefined();
      const firstRec = res.body.data.recommendations[0];
      if (firstRec && firstRec.course && firstRec.course.trainer && typeof firstRec.course.trainer === 'object') {
        expect(firstRec.course.trainer.password).toBeUndefined();
      }
    });
  });
});
