const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Department = require('../src/models/Department');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Course = require('../src/models/Course');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const EmployeeSkill = require('../src/models/EmployeeSkill');
const CourseSkill = require('../src/models/CourseSkill');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skilltrack');
  console.log('Connected to MongoDB');

  const depts = await Department.find();
  console.log(`\n=== DEPARTMENTS (${depts.length}) ===`);
  depts.forEach(d => console.log(`ID: ${d._id} | Name: "${d.name}" | Active: ${d.isActive}`));

  const courses = await Course.find().populate('department', 'name');
  console.log(`\n=== COURSES (${courses.length}) ===`);
  courses.forEach(c => console.log(`ID: ${c._id} | Title: "${c.title}" | Dept: "${c.department?.name || 'NONE'}" (${c.department?._id || ''})`));

  const roles = await JobRole.find();
  console.log(`\n=== JOB ROLES (${roles.length}) ===`);
  roles.forEach(r => console.log(`ID: ${r._id} | Name: "${r.name}" | Code: ${r.code}`));

  const skills = await Skill.find();
  console.log(`\n=== SKILLS (${skills.length}) ===`);
  skills.forEach(s => console.log(`ID: ${s._id} | Name: "${s.name}" | Category: "${s.category}"`));

  const emps = await Employee.find().populate('user', 'name email role').populate('department', 'name');
  console.log(`\n=== EMPLOYEES (${emps.length}) ===`);
  emps.forEach(e => console.log(`ID: ${e._id} | User: ${e.user?.name} (${e.user?.email}) | Dept: "${e.department?.name}" (${e.department?._id}) | Desig: "${e.designation}"`));

  const empSkills = await EmployeeSkill.find().populate('employee').populate('skill', 'name');
  console.log(`\n=== EMPLOYEE SKILLS (${empSkills.length}) ===`);
  empSkills.forEach(es => console.log(`Emp: ${es.employee?._id} | Skill: ${es.skill?.name} | Level: ${es.proficiencyLevel}`));

  const courseSkills = await CourseSkill.find().populate('course', 'title').populate('skill', 'name');
  console.log(`\n=== COURSE SKILLS (${courseSkills.length}) ===`);
  courseSkills.forEach(cs => console.log(`Course: "${cs.course?.title}" | Skill: ${cs.skill?.name} | Level: ${cs.coverageLevel}`));

  const roleReqs = await JobRoleSkillRequirement.find().populate('jobRole', 'name').populate('skill', 'name');
  console.log(`\n=== JOB ROLE SKILL REQUIREMENTS (${roleReqs.length}) ===`);
  roleReqs.forEach(rr => console.log(`Role: "${rr.jobRole?.name}" | Skill: ${rr.skill?.name} | RequiredLevel: ${rr.requiredLevel}`));

  const compReqs = await ComplianceRequirement.find().populate('course', 'title');
  console.log(`\n=== COMPLIANCE REQUIREMENTS (${compReqs.length}) ===`);
  compReqs.forEach(cr => console.log(`ID: ${cr._id} | Title: "${cr.title}" | Course: "${cr.course?.title}" | Freq: ${cr.frequency}`));

  const compAssigns = await ComplianceAssignment.find().populate('employee').populate('complianceRequirement', 'title');
  console.log(`\n=== COMPLIANCE ASSIGNMENTS (${compAssigns.length}) ===`);
  compAssigns.forEach(ca => console.log(`ID: ${ca._id} | Emp: ${ca.employee?._id} | Req: "${ca.complianceRequirement?.title}" | Status: ${ca.status}`));

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
