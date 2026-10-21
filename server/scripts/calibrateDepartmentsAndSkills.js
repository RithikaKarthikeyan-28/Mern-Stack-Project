const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Department = require('../src/models/Department');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Skill = require('../src/models/Skill');
const JobRole = require('../src/models/JobRole');
const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
const Employee = require('../src/models/Employee');
const EmployeeSkill = require('../src/models/EmployeeSkill');
const CourseSkill = require('../src/models/CourseSkill');
const ComplianceRequirement = require('../src/models/ComplianceRequirement');
const ComplianceAssignment = require('../src/models/ComplianceAssignment');
const complianceService = require('../src/services/compliance.service');

async function calibrate() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skilltrack');
  console.log('Connected to MongoDB skilltrack');

  // 1. Fetch all 10 departments
  const departments = await Department.find({ isActive: true });
  console.log(`Found ${departments.length} departments.`);

  const deptMap = new Map();
  departments.forEach(d => {
    deptMap.set(d.name, d);
  });

  // Department definitions & roles
  const departmentConfig = [
    {
      deptName: 'Java Programming',
      role: { name: 'Java Software Engineer', code: 'ROLE-JSE', desc: 'Designs, develops, and maintains robust enterprise Java applications.' },
      skills: [
        { name: 'Java Programming', category: 'Backend Development', required: 'advanced' },
        { name: 'Object-Oriented Programming', category: 'Software Engineering', required: 'advanced' },
        { name: 'Data Structures and Algorithms', category: 'Computer Science', required: 'intermediate' }
      ],
      complianceTitle: 'Enterprise Java Security & Compliance Standard',
      complianceDesc: 'Mandatory standard governing secure Java coding, memory safety, and thread concurrency compliance.',
      courseTitle: 'Java Programming Fundamentals'
    },
    {
      deptName: 'Object-Oriented Programming',
      role: { name: 'Object-Oriented Software Engineer', code: 'ROLE-OOP', desc: 'Architects scalable, maintainable systems using modern object-oriented design patterns.' },
      skills: [
        { name: 'Object-Oriented Programming', category: 'Software Engineering', required: 'expert' },
        { name: 'System Design & Architecture', category: 'Software Engineering', required: 'advanced' },
        { name: 'Java Programming', category: 'Backend Development', required: 'intermediate' }
      ],
      complianceTitle: 'OOP Secure Design & Software Integrity Standards',
      complianceDesc: 'Mandatory policies enforcing clean encapsulation, secure polymorphism, and architectural separation of concerns.',
      courseTitle: 'Object-Oriented Programming'
    },
    {
      deptName: 'Data Structures and Algorithms',
      role: { name: 'Algorithms & Systems Engineer', code: 'ROLE-DSA', desc: 'Specializes in high-performance computing, optimal algorithms, and computational complexity.' },
      skills: [
        { name: 'Data Structures and Algorithms', category: 'Computer Science', required: 'expert' },
        { name: 'System Design & Architecture', category: 'Software Engineering', required: 'advanced' }
      ],
      complianceTitle: 'Algorithmic Integrity & Computational Security Standard',
      complianceDesc: 'Regulations governing algorithmic fairness, efficiency boundaries, and resource exhaustion prevention.',
      courseTitle: 'Data Structures and Algorithms'
    },
    {
      deptName: 'Web Development — HTML and CSS',
      role: { name: 'Web Frontend Specialist', code: 'ROLE-WEB', desc: 'Builds accessible, responsive, semantic web interfaces complying with international standards.' },
      skills: [
        { name: 'HTML5 & CSS3 Responsive Design', category: 'Frontend Development', required: 'expert' },
        { name: 'JavaScript (ES6+)', category: 'Frontend Development', required: 'intermediate' }
      ],
      complianceTitle: 'Secure Frontend & Web Engineering Standards',
      complianceDesc: 'Strict enforcement of WCAG 2.1 accessibility, content security policies, and responsive web compliance.',
      courseTitle: 'HTML and CSS Web Development'
    },
    {
      deptName: 'JavaScript Development',
      role: { name: 'JavaScript Application Engineer', code: 'ROLE-JAE', desc: 'Develops performant modern JavaScript client and runtime solutions.' },
      skills: [
        { name: 'JavaScript (ES6+)', category: 'Frontend Development', required: 'expert' },
        { name: 'HTML5 & CSS3 Responsive Design', category: 'Frontend Development', required: 'advanced' },
        { name: 'React.js Framework', category: 'Frontend Development', required: 'intermediate' }
      ],
      complianceTitle: 'Secure JavaScript & Client-Side Code Safety Standard',
      complianceDesc: 'Policies mitigating cross-site scripting (XSS), prototype pollution, and third-party script vulnerabilities.',
      courseTitle: 'JavaScript Fundamentals'
    },
    {
      deptName: 'React.js Development',
      role: { name: 'React Frontend Engineer', code: 'ROLE-RFE', desc: 'Designs component-driven, reactive user interfaces with modern React paradigms.' },
      skills: [
        { name: 'React.js Framework', category: 'Frontend Development', required: 'expert' },
        { name: 'JavaScript (ES6+)', category: 'Frontend Development', required: 'advanced' },
        { name: 'HTML5 & CSS3 Responsive Design', category: 'Frontend Development', required: 'advanced' }
      ],
      complianceTitle: 'React Application Security & State Integrity Standard',
      complianceDesc: 'Framework security regulations including sanitization, state isolation, and component boundary validation.',
      courseTitle: 'React.js Development'
    },
    {
      deptName: 'Backend Development — Node.js and Express.js',
      role: { name: 'Backend Systems Engineer', code: 'ROLE-BSE', desc: 'Builds scalable asynchronous APIs, microservices, and server-side infrastructure.' },
      skills: [
        { name: 'Node.js & Express.js', category: 'Backend Development', required: 'expert' },
        { name: 'SQL & Relational Databases', category: 'Database Engineering', required: 'advanced' },
        { name: 'System Design & Architecture', category: 'Software Engineering', required: 'advanced' }
      ],
      complianceTitle: 'Node.js Backend API Security & Auth Compliance Standard',
      complianceDesc: 'Mandatory standard governing API authentication, JWT handling, rate limiting, and server hardening.',
      courseTitle: 'Node.js and Express.js'
    },
    {
      deptName: 'Database Management — SQL',
      role: { name: 'Database Engineer', code: 'ROLE-DBE', desc: 'Architects relational schemas, manages transactions, and optimizes query execution.' },
      skills: [
        { name: 'SQL & Relational Databases', category: 'Database Engineering', required: 'expert' },
        { name: 'System Design & Architecture', category: 'Software Engineering', required: 'advanced' }
      ],
      complianceTitle: 'Data Protection & Relational Database Governance',
      complianceDesc: 'Compliance framework for database encryption, SQL injection prevention, role-based access, and backups.',
      courseTitle: 'SQL and Database Management'
    },
    {
      deptName: 'Full-Stack Development — MongoDB and MERN',
      role: { name: 'Full-Stack MERN Developer', code: 'ROLE-FSD', desc: 'Architects and ships end-to-end cloud applications using MongoDB, Express, React, and Node.' },
      skills: [
        { name: 'MongoDB & NoSQL Architecture', category: 'Database Engineering', required: 'expert' },
        { name: 'Node.js & Express.js', category: 'Backend Development', required: 'advanced' },
        { name: 'React.js Framework', category: 'Frontend Development', required: 'advanced' },
        { name: 'JavaScript (ES6+)', category: 'Frontend Development', required: 'advanced' },
        { name: 'Git & CI/CD Workflows', category: 'DevOps & Systems', required: 'intermediate' }
      ],
      complianceTitle: 'Full-Stack Cloud Architecture & Security Standard',
      complianceDesc: 'Comprehensive cloud standard regulating full-stack dependency auditing, NoSQL injection, and secure deployments.',
      courseTitle: 'MongoDB and MERN Stack'
    },
    {
      deptName: 'Software Engineering and Computer Networks',
      role: { name: 'DevOps & Cloud Systems Engineer', code: 'ROLE-DSE', desc: 'Manages networking infrastructure, distributed systems protocols, and CI/CD automation.' },
      skills: [
        { name: 'Computer Networks & Protocols', category: 'DevOps & Systems', required: 'expert' },
        { name: 'Git & CI/CD Workflows', category: 'DevOps & Systems', required: 'expert' },
        { name: 'System Design & Architecture', category: 'Software Engineering', required: 'advanced' }
      ],
      complianceTitle: 'Information Security & Network Protocols Compliance',
      complianceDesc: 'Corporate governance covering zero-trust networks, TLS 1.3 protocol enforcement, and network packet integrity.',
      courseTitle: 'Software Engineering and Computer Networks'
    }
  ];

  // 2. Calibrate JobRoles and Skills
  for (const cfg of departmentConfig) {
    const dept = deptMap.get(cfg.deptName);
    if (!dept) {
      console.warn(`Department not found: "${cfg.deptName}"`);
      continue;
    }

    // Upsert JobRole
    let jobRole = await JobRole.findOne({ code: cfg.role.code });
    if (!jobRole) {
      jobRole = await JobRole.create({
        name: cfg.role.name,
        code: cfg.role.code,
        description: cfg.role.desc,
        department: dept._id,
        departments: [dept._id],
        isGlobal: false,
        isActive: true
      });
      console.log(`Created JobRole: ${jobRole.name} (${jobRole.code}) -> ${dept.name}`);
    } else {
      jobRole.name = cfg.role.name;
      jobRole.description = cfg.role.desc;
      jobRole.department = dept._id;
      if (!jobRole.departments || jobRole.departments.length === 0) {
        jobRole.departments = [dept._id];
      }
      jobRole.isGlobal = false;
      await jobRole.save();
      console.log(`Updated JobRole: ${jobRole.name} -> ${dept.name}`);
    }

    // Link Course to Department
    const course = await Course.findOne({ title: cfg.courseTitle });
    if (course) {
      course.department = dept._id;
      course.isGlobal = false;
      await course.save();
      console.log(`Linked Course "${course.title}" -> ${dept.name}`);
    }

    // Upsert Skills & JobRoleSkillRequirements
    for (const skCfg of cfg.skills) {
      let skill = await Skill.findOne({ name: skCfg.name });
      if (!skill) {
        skill = await Skill.create({
          name: skCfg.name,
          category: skCfg.category,
          department: dept._id,
          departments: [dept._id],
          isGlobal: false,
          proficiencyLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
          isActive: true
        });
        console.log(`Created Skill: "${skill.name}" -> ${dept.name}`);
      } else {
        if (!skill.department) skill.department = dept._id;
        if (!skill.departments || skill.departments.length === 0) {
          skill.departments = [dept._id];
        } else if (!skill.departments.some(d => d.equals(dept._id))) {
          skill.departments.push(dept._id);
        }
        await skill.save();
      }

      // Ensure JobRoleSkillRequirement exists
      let req = await JobRoleSkillRequirement.findOne({
        jobRole: jobRole._id,
        skill: skill._id
      });
      if (!req) {
        await JobRoleSkillRequirement.create({
          jobRole: jobRole._id,
          skill: skill._id,
          requiredLevel: skCfg.required,
          mandatory: true,
          weight: skCfg.required === 'expert' ? 3 : skCfg.required === 'advanced' ? 2 : 1,
          isActive: true
        });
        console.log(`Created JobRole Requirement: ${jobRole.name} -> ${skill.name} (${skCfg.required})`);
      } else {
        req.requiredLevel = skCfg.required;
        req.mandatory = true;
        req.isActive = true;
        await req.save();
      }
    }

    // Upsert ComplianceRequirement
    if (course) {
      let compReq = await ComplianceRequirement.findOne({
        $or: [{ course: course._id }, { title: cfg.complianceTitle }]
      });
      if (!compReq) {
        compReq = await ComplianceRequirement.create({
          title: cfg.complianceTitle,
          description: cfg.complianceDesc,
          course: course._id,
          department: dept._id,
          departments: [dept._id],
          isGlobal: false,
          frequency: 'annual',
          dueWithinDays: 30,
          renewalGraceDays: 0,
          isActive: true
        });
        console.log(`Created Compliance Requirement: "${compReq.title}" -> ${dept.name}`);
      } else {
        compReq.title = cfg.complianceTitle;
        compReq.description = cfg.complianceDesc;
        compReq.department = dept._id;
        compReq.departments = [dept._id];
        compReq.isGlobal = false;
        compReq.course = course._id;
        await compReq.save();
        console.log(`Updated Compliance Requirement: "${compReq.title}" -> ${dept.name}`);
      }
    }
  }

  // 3. Mark non-technical foundation courses as Global
  const foundationTitles = [
    'Leadership Essentials',
    'Data Privacy Foundations',
    'Secure Working Practices',
    'Project Management Fundamentals',
    'Inclusive Communication',
    'Financial Acumen for Non-Finance Teams',
    'Customer Experience Excellence',
    'Advanced Presentation Skills',
    'Workplace Health and Safety'
  ];

  await Course.updateMany(
    { title: { $in: foundationTitles } },
    { $set: { isGlobal: true, department: null } }
  );
  console.log(`Marked ${foundationTitles.length} foundation courses as Global.`);

  // 4. Calibrate Employees: karthi & rajasudhan
  const emps = await Employee.find({ isActive: true }).populate('user', 'name email').populate('department', 'name');
  for (const emp of emps) {
    if (!emp.department) continue;
    const deptRole = await JobRole.findOne({ department: emp.department._id });
    if (deptRole) {
      emp.jobRole = deptRole._id;
      emp.designation = deptRole.name;
      await emp.save();
      console.log(`Calibrated Employee ${emp.user?.name} (${emp.user?.email}): Dept "${emp.department.name}" -> Role "${deptRole.name}"`);
    }

    // Remove mismatched historical compliance assignments for this employee
    const activeAssignments = await ComplianceAssignment.find({ employee: emp._id, isActive: true }).populate({
      path: 'complianceRequirement',
      populate: { path: 'course' }
    });

    for (const a of activeAssignments) {
      const cr = a.complianceRequirement;
      if (!cr) continue;
      const isMatch =
        cr.isGlobal === true ||
        (cr.department && cr.department.equals(emp.department._id)) ||
        (cr.departments && cr.departments.some(d => d.equals(emp.department._id))) ||
        (cr.course?.department && cr.course.department.equals(emp.department._id));

      if (!isMatch) {
        console.log(`Removing mismatched assignment: "${cr.title}" from employee ${emp.user?.name} (${emp.department.name})`);
        await ComplianceAssignment.deleteOne({ _id: a._id });
      }
    }

    // Assign appropriate compliance requirement matching the employee's department
    const matchingReq = await ComplianceRequirement.findOne({
      isActive: true,
      $or: [
        { department: emp.department._id },
        { departments: emp.department._id }
      ]
    });

    if (matchingReq) {
      const existing = await ComplianceAssignment.findOne({
        employee: emp._id,
        complianceRequirement: matchingReq._id,
        isActive: true
      });

      if (!existing) {
        const assignedAt = new Date();
        const dueAt = new Date(assignedAt.getTime() + (matchingReq.dueWithinDays || 30) * 86400000);
        const newAssign = new ComplianceAssignment({
          complianceRequirement: matchingReq._id,
          employee: emp._id,
          assignedAt,
          dueAt,
          status: 'NOT_STARTED',
          isActive: true
        });
        await complianceService.evaluateAssignmentStatus(newAssign, { save: true });
        console.log(`Assigned department compliance requirement "${matchingReq.title}" to ${emp.user?.name} (${newAssign.status})`);
      } else {
        await complianceService.evaluateAssignmentStatus(existing, { save: true });
        console.log(`Evaluated existing compliance for ${emp.user?.name}: status is ${existing.status}`);
      }
    }

    // 5. Award/Ensure EmployeeSkills for completed courses
    // For karthi (completed Object-Oriented Programming):
    if (emp.department.name.includes('Object-Oriented')) {
      const oopSkill = await Skill.findOne({ name: 'Object-Oriented Programming' });
      if (oopSkill) {
        let es = await EmployeeSkill.findOne({ employee: emp._id, skill: oopSkill._id });
        if (!es) {
          es = await EmployeeSkill.create({
            employee: emp._id,
            skill: oopSkill._id,
            proficiencyLevel: 'advanced',
            isActive: true
          });
          console.log(`Awarded assessed skill "${oopSkill.name}" (advanced) to ${emp.user?.name}`);
        }
      }
    }

    // For rajasudhan (completed MongoDB and MERN):
    if (emp.department.name.includes('MERN')) {
      const mernSkill = await Skill.findOne({ name: 'MongoDB & NoSQL Architecture' });
      if (mernSkill) {
        let es = await EmployeeSkill.findOne({ employee: emp._id, skill: mernSkill._id });
        if (!es) {
          es = await EmployeeSkill.create({
            employee: emp._id,
            skill: mernSkill._id,
            proficiencyLevel: 'advanced',
            isActive: true
          });
          console.log(`Awarded assessed skill "${mernSkill.name}" (advanced) to ${emp.user?.name}`);
        }
      }
    }
  }

  console.log('\n✅ Calibration completed successfully!');
  process.exit(0);
}

calibrate().catch(err => {
  console.error(err);
  process.exit(1);
});
