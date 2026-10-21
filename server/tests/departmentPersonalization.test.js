const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Employee = require('../src/models/Employee');
const JobRole = require('../src/models/JobRole');
const Skill = require('../src/models/Skill');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const Course = require('../src/models/Course');
const CourseSkill = require('../src/models/CourseSkill');
const Enrollment = require('../src/models/Enrollment');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_test';

describe('Department-Based Personalization, Recommendations & Assignment Flow', () => {
  jest.setTimeout(30000);

  let adminToken, trainerToken, employeeTokenA, employeeTokenB;
  let adminUser, trainerUser, employeeUserA, employeeUserB;
  let deptA, deptB;
  let empA, empB;
  let roleA, roleB;
  let skillA, skillB;
  let courseA, courseB, courseGlobal;
  let compReqA, compReqGlobal;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    // Clean test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /@dept-test\.com$/ } }),
      Department.deleteMany({
        $or: [
          { code: { $in: ['DEPT-TEST-A', 'DEPT-TEST-B'] } },
          { name: { $in: ['Department A - Java', 'Department B - React'] } }
        ]
      }),
      Employee.deleteMany({ employeeId: { $in: ['EMP-TEST-A', 'EMP-TEST-B'] } }),
      JobRole.deleteMany({
        $or: [
          { code: { $in: ['ROLE-TEST-A', 'ROLE-TEST-B'] } },
          { name: { $in: ['Java Engineer', 'React Engineer'] } }
        ]
      }),
      Skill.deleteMany({ name: { $in: ['Skill Test A', 'Skill Test B'] } }),
      Course.deleteMany({ title: { $regex: /^Test Course Dept/ } }),
      ComplianceRequirement.deleteMany({ title: { $regex: /^Test Comp Req/ } })
    ]);

    // 1. Create Departments
    deptA = await Department.create({
      name: 'Department A - Java',
      code: 'DEPT-TEST-A',
      description: 'Java and OOP Department'
    });

    deptB = await Department.create({
      name: 'Department B - React',
      code: 'DEPT-TEST-B',
      description: 'Web and React Department'
    });

    // 2. Create Users
    adminUser = await User.create({
      name: 'Admin Personalization',
      email: 'admin@dept-test.com',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });

    trainerUser = await User.create({
      name: 'Trainer Personalization',
      email: 'trainer@dept-test.com',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });

    employeeUserA = await User.create({
      name: 'Employee A',
      email: 'employeeA@dept-test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    employeeUserB = await User.create({
      name: 'Employee B',
      email: 'employeeB@dept-test.com',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });

    // Generate JWT tokens
    adminToken = jwt.sign({ id: adminUser._id, userId: adminUser._id, role: 'admin' }, config.jwtSecret, { expiresIn: '1h' });
    trainerToken = jwt.sign({ id: trainerUser._id, userId: trainerUser._id, role: 'trainer' }, config.jwtSecret, { expiresIn: '1h' });
    employeeTokenA = jwt.sign({ id: employeeUserA._id, userId: employeeUserA._id, role: 'employee' }, config.jwtSecret, { expiresIn: '1h' });
    employeeTokenB = jwt.sign({ id: employeeUserB._id, userId: employeeUserB._id, role: 'employee' }, config.jwtSecret, { expiresIn: '1h' });

    // 3. Create Employees
    empA = await Employee.create({
      user: employeeUserA._id,
      employeeId: 'EMP-TEST-A',
      department: deptA._id,
      designation: 'Java Developer',
      isActive: true
    });

    empB = await Employee.create({
      user: employeeUserB._id,
      employeeId: 'EMP-TEST-B',
      department: deptB._id,
      designation: 'React Developer',
      isActive: true
    });

    // 4. Create Skills
    skillA = await Skill.create({
      name: 'Skill Test A',
      category: 'technical',
      department: deptA._id,
      departments: [deptA._id],
      isGlobal: false,
      isActive: true
    });

    skillB = await Skill.create({
      name: 'Skill Test B',
      category: 'technical',
      department: deptB._id,
      departments: [deptB._id],
      isGlobal: false,
      isActive: true
    });

    // 5. Create Job Roles
    roleA = await JobRole.create({
      name: 'Java Engineer',
      code: 'ROLE-TEST-A',
      department: deptA._id,
      departments: [deptA._id],
      isGlobal: false,
      isActive: true
    });

    roleB = await JobRole.create({
      name: 'React Engineer',
      code: 'ROLE-TEST-B',
      department: deptB._id,
      departments: [deptB._id],
      isGlobal: false,
      isActive: true
    });

    // Requirements
    await JobRoleSkillRequirement.create({
      jobRole: roleA._id,
      skill: skillA._id,
      requiredLevel: 'intermediate',
      isMandatory: true
    });

    await JobRoleSkillRequirement.create({
      jobRole: roleB._id,
      skill: skillB._id,
      requiredLevel: 'advanced',
      isMandatory: true
    });

    // 6. Create Courses
    courseA = await Course.create({
      title: 'Test Course Dept A - Java Deep Dive',
      description: 'Java programming',
      department: deptA._id,
      isGlobal: false,
      category: 'technical',
      duration: 60,
      level: 'intermediate',
      status: 'published',
      trainer: trainerUser._id,
      isActive: true
    });

    courseB = await Course.create({
      title: 'Test Course Dept B - React Mastery',
      description: 'React components and hooks',
      department: deptB._id,
      isGlobal: false,
      category: 'technical',
      duration: 60,
      level: 'advanced',
      status: 'published',
      trainer: trainerUser._id,
      isActive: true
    });

    courseGlobal = await Course.create({
      title: 'Test Course Dept Global - Workplace Ethics',
      description: 'Global standard ethics for all departments',
      isGlobal: true,
      category: 'compliance',
      duration: 30,
      level: 'beginner',
      status: 'published',
      trainer: trainerUser._id,
      isActive: true
    });

    // Create CourseSkill mappings
    await CourseSkill.create({
      course: courseA._id,
      skill: skillA._id,
      coverageLevel: 'intermediate',
      coverageWeight: 80,
      isActive: true
    });

    await CourseSkill.create({
      course: courseB._id,
      skill: skillB._id,
      coverageLevel: 'advanced',
      coverageWeight: 80,
      isActive: true
    });

    // 7. Create Compliance Requirements
    compReqA = await ComplianceRequirement.create({
      title: 'Test Comp Req Dept A - Secure Java Coding',
      description: 'Required compliance for Java department',
      department: deptA._id,
      departments: [deptA._id],
      isGlobal: false,
      course: courseA._id,
      dueWithinDays: 30,
      isActive: true
    });

    compReqGlobal = await ComplianceRequirement.create({
      title: 'Test Comp Req Global - Information Security Standard',
      description: 'Global organization-wide compliance',
      isGlobal: true,
      course: courseGlobal._id,
      dueWithinDays: 45,
      isActive: true
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@dept-test\.com$/ } }),
      Department.deleteMany({
        $or: [
          { code: { $in: ['DEPT-TEST-A', 'DEPT-TEST-B'] } },
          { name: { $in: ['Department A - Java', 'Department B - React'] } }
        ]
      }),
      Employee.deleteMany({ employeeId: { $in: ['EMP-TEST-A', 'EMP-TEST-B'] } }),
      JobRole.deleteMany({
        $or: [
          { code: { $in: ['ROLE-TEST-A', 'ROLE-TEST-B'] } },
          { name: { $in: ['Java Engineer', 'React Engineer'] } }
        ]
      }),
      Skill.deleteMany({ name: { $in: ['Skill Test A', 'Skill Test B'] } }),
      Course.deleteMany({ title: { $regex: /^Test Course Dept/ } }),
      ComplianceRequirement.deleteMany({ title: { $regex: /^Test Comp Req/ } }),
      Enrollment.deleteMany({ course: { $in: [courseA._id, courseB._id, courseGlobal._id] } }),
      ComplianceAssignment.deleteMany({ complianceRequirement: { $in: [compReqA._id, compReqGlobal._id] } }),
      CourseSkill.deleteMany({ course: { $in: [courseA._id, courseB._id, courseGlobal._id] } })
    ]);
    await mongoose.connection.close();
  });

  describe('1. Department-Relevant Skills Inventory', () => {
    it('Employee A receives competencies matching Department A, not Department B', async () => {
      const res = await request(app)
        .get('/api/employees/me/skills')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const skills = res.body.data.employeeSkills;
      const skillNames = skills.map(s => s.skill.name);
      expect(skillNames).toContain('Skill Test A');
      expect(skillNames).not.toContain('Skill Test B');
    });

    it('Employee B receives competencies matching Department B, not Department A', async () => {
      const res = await request(app)
        .get('/api/employees/me/skills')
        .set('Authorization', `Bearer ${employeeTokenB}`);

      expect(res.status).toBe(200);
      const skills = res.body.data.employeeSkills;
      const skillNames = skills.map(s => s.skill.name);
      expect(skillNames).toContain('Skill Test B');
      expect(skillNames).not.toContain('Skill Test A');
    });
  });

  describe('2. Department-Specific Skill Gap Analysis', () => {
    it('Employee A defaults to Department A Job Role benchmark without specifying role ID', async () => {
      const res = await request(app)
        .get('/api/employees/me/skill-gap/default')
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.jobRole.id.toString()).toBe(roleA._id.toString());
      const deptId = (res.body.data.employee.department.id || res.body.data.employee.department._id).toString();
      expect(deptId).toBe(deptA._id.toString());
    });
  });

  describe('3. Department-Specific Course Recommendations', () => {
    it('Employee A receives Department A courses, but NOT Department B courses', async () => {
      const res = await request(app)
        .get(`/api/employees/me/recommendations/${roleA._id}`)
        .set('Authorization', `Bearer ${employeeTokenA}`);

      expect(res.status).toBe(200);
      const recs = res.body.data.recommendations;
      const recTitles = recs.map(r => r.course.title);
      expect(recTitles).toContain('Test Course Dept A - Java Deep Dive');
      expect(recTitles).not.toContain('Test Course Dept B - React Mastery');
    });
  });

  describe('4. Course Enrollment & Department Compatibility Validation', () => {
    it('Admin cannot enroll Employee A into Department B-specific course (rejects with 400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee: empA._id.toString(),
          course: courseB._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Department incompatibility/i);
    });

    it('Admin successfully enrolls Employee A into Department A course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee: empA._id.toString(),
          course: courseA._id.toString()
        });

      expect(res.status).toBe(201);
      const enrolledEmpId = (res.body.data.enrollment.employee.id || res.body.data.enrollment.employee._id || res.body.data.enrollment.employee).toString();
      const enrolledCourseId = (res.body.data.enrollment.course.id || res.body.data.enrollment.course._id || res.body.data.enrollment.course).toString();
      expect(enrolledEmpId).toBe(empA._id.toString());
      expect(enrolledCourseId).toBe(courseA._id.toString());
    });

    it('Admin successfully enrolls Employee A into Global course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee: empA._id.toString(),
          course: courseGlobal._id.toString()
        });

      expect(res.status).toBe(201);
    });

    it('Bulk department assignment enrolls all active employees of the target department', async () => {
      const res = await request(app)
        .post('/api/enrollments/department')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: deptB._id.toString(),
          courseId: courseB._id.toString(),
          isMandatory: true
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.data.assignedCount).toBe(1);

      // Verify Employee B is now enrolled with isMandatory=true
      const enrollment = await Enrollment.findOne({ employee: empB._id, course: courseB._id });
      expect(enrollment).not.toBeNull();
      expect(enrollment.isMandatory).toBe(true);
    });
  });

  describe('5. Compliance Assignment & Department Compatibility', () => {
    it('Admin assigning Department A compliance requirement to Employee B is rejected (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${compReqA._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: empB._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not apply to this employee|department incompatibility/i);
    });

    it('Admin assigns Department A compliance requirement to Employee A successfully', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${compReqA._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: empA._id.toString()
        });

      expect(res.status).toBe(201);
      const asgEmployeeId = (res.body.data.assignment.employee.id || res.body.data.assignment.employee._id || res.body.data.assignment.employee).toString();
      expect(asgEmployeeId).toBe(empA._id.toString());
    });

    it('Global compliance requirement can be assigned to Employee B', async () => {
      const res = await request(app)
        .post(`/api/compliance-requirements/${compReqGlobal._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: empB._id.toString()
        });

      expect(res.status).toBe(201);
    });
  });
});
