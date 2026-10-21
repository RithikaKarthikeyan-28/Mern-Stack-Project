const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Skill = require('../models/Skill');
const JobRole = require('../models/JobRole');
const JobRoleSkillRequirement = require('../models/JobRoleSkillRequirement');
const CourseSkill = require('../models/CourseSkill');
const EmployeeSkill = require('../models/EmployeeSkill');
const ComplianceRequirement = require('../models/ComplianceRequirement');
const ComplianceAssignment = require('../models/ComplianceAssignment');

const courseData = require('./courseData');
const assessmentData = require('./assessmentData');

const DEPARTMENT_DATA = [
  {
    name: 'Java Programming',
    description: 'Core Java development, syntax, JVM architecture, OOP concepts, collections framework, and multi-threaded enterprise programming.',
    courseTitle: 'Java Programming Fundamentals'
  },
  {
    name: 'Object-Oriented Programming',
    description: 'Design patterns, SOLID principles, encapsulation, inheritance, polymorphism, abstraction, and clean architectural design.',
    courseTitle: 'Object-Oriented Programming'
  },
  {
    name: 'Data Structures and Algorithms',
    description: 'Computational complexity, Big-O analysis, algorithmic problem solving, trees, graphs, sorting, and dynamic programming.',
    courseTitle: 'Data Structures and Algorithms'
  },
  {
    name: 'Web Development — HTML and CSS',
    description: 'Semantic HTML5, responsive CSS layout, Flexbox, Grid systems, accessibility standards, and modern frontend styling.',
    courseTitle: 'HTML and CSS Web Development'
  },
  {
    name: 'JavaScript Development',
    description: 'Core ECMAScript, closures, asynchronous execution loop, promises, DOM manipulation, and modern web application logic.',
    courseTitle: 'JavaScript Fundamentals'
  },
  {
    name: 'React.js Development',
    description: 'Declarative UI engineering, component architecture, hooks, state lifecycle, virtual DOM, and single-page applications.',
    courseTitle: 'React.js Development'
  },
  {
    name: 'Backend Development — Node.js and Express.js',
    description: 'Server-side JavaScript, event-driven runtime, RESTful API engineering, middleware architecture, and microservices.',
    courseTitle: 'Node.js and Express.js'
  },
  {
    name: 'Database Management — SQL',
    description: 'Relational database schema modeling, ACID transactions, complex joins, indexing strategies, and data optimization.',
    courseTitle: 'SQL and Database Management'
  },
  {
    name: 'Full-Stack Development — MongoDB and MERN',
    description: 'Document-based database engineering, Mongoose ODM, end-to-end MERN stack integration, and scalable full-stack applications.',
    courseTitle: 'MongoDB and MERN Stack'
  },
  {
    name: 'Software Engineering and Computer Networks',
    description: 'Software development lifecycle, version control with Git, CI/CD pipelines, OSI/TCP-IP models, and network protocols.',
    courseTitle: 'Software Engineering and Computer Networks'
  }
];

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/skilltrack';

/**
 * Safely removes obsolete demo records and migrates employees away from legacy departments.
 */
async function cleanupObsoleteDemoRecords() {
  const obsoleteCourseTitles = ['Excel for Better Decisions', 'Coaching for Performance'];
  const obsoleteAssessmentTitles = ['Test', 'Test1'];

  const courses = await Course.find({ title: { $in: obsoleteCourseTitles } });
  const courseIds = courses.map((c) => c._id);

  const assessments = await Assessment.find({
    $or: [{ title: { $in: obsoleteAssessmentTitles } }, { course: { $in: courseIds } }]
  });
  const asmIds = assessments.map((a) => a._id);

  if (asmIds.length > 0) {
    const delQ = await Question.deleteMany({ assessment: { $in: asmIds } });
    const delAtt = await AssessmentAttempt.deleteMany({ assessment: { $in: asmIds } });
    const delAsm = await Assessment.deleteMany({ _id: { $in: asmIds } });
    console.log(`[Seed Cleanup] Removed ${delAsm.deletedCount} obsolete assessments, ${delQ.deletedCount} questions, ${delAtt.deletedCount} attempts.`);
  }

  if (courseIds.length > 0) {
    const modules = await Module.find({ course: { $in: courseIds } });
    const moduleIds = modules.map((m) => m._id);
    const delL = await Lesson.deleteMany({ module: { $in: moduleIds } });
    const delM = await Module.deleteMany({ _id: { $in: moduleIds } });
    const delEnr = await Enrollment.deleteMany({ course: { $in: courseIds } });
    const delC = await Course.deleteMany({ _id: { $in: courseIds } });
    console.log(`[Seed Cleanup] Removed ${delC.deletedCount} obsolete courses, ${delM.deletedCount} modules, ${delL.deletedCount} lessons, ${delEnr.deletedCount} enrollments.`);
  }

  // Archive non-technical courses to remove them from active catalogs
  const nonTechCoursesToArchive = [
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
    { title: { $in: nonTechCoursesToArchive } },
    { $set: { status: 'archived', isActive: false } }
  );

  // Safely migrate employees belonging to legacy departments (DevOps, Engineering)
  const legacyDepts = await Department.find({ name: { $in: ['Engineering', 'DevOps'] } });
  if (legacyDepts.length > 0) {
    const legacyDeptIds = legacyDepts.map((d) => d._id);
    const devopsDept = legacyDepts.find((d) => d.name === 'DevOps');
    const engineeringDept = legacyDepts.find((d) => d.name === 'Engineering');

    // Find target technical departments for reassignment
    const softwareNetDept = await Department.findOne({ name: 'Software Engineering and Computer Networks' });
    const fullstackDept = await Department.findOne({ name: 'Full-Stack Development — MongoDB and MERN' });
    const fallbackDept = softwareNetDept || fullstackDept;

    if (devopsDept && softwareNetDept) {
      await Employee.updateMany(
        { department: devopsDept._id },
        { $set: { department: softwareNetDept._id } }
      );
    }

    if (engineeringDept && fallbackDept) {
      await Employee.updateMany(
        { department: engineeringDept._id },
        { $set: { department: fallbackDept._id } }
      );
    }

    // Now permanently remove the legacy departments
    const delDeptRes = await Department.deleteMany({ _id: { $in: legacyDeptIds } });
    console.log(`[Seed Cleanup] Safely removed ${delDeptRes.deletedCount} legacy departments ('Engineering', 'DevOps').`);
  }

  // Safely clean up obsolete test placeholder users and employees (e.g. diagnostic, check-user, alex.preview)
  const obsoleteEmails = [
    'diagnostic-1788686794975@example.com',
    'check-user@example.com',
    'rithikakarthikeyan1128@gmail.com',
    'employee1788690734038@example.com',
    'trainer1788690734038@example.com',
    'admin1788690734038@example.com',
    'auth-test-1788686255008@example.com',
    'casterror_1791303275445@example.com',
    'alex.preview@skilltrack.local',
    'sudhan@gmail.com',
    'rithikas@gmail.com',
    'rithiks@gmail.com'
  ];
  const obsoleteUsers = await User.find({ email: { $in: obsoleteEmails } });
  if (obsoleteUsers.length > 0) {
    const userIds = obsoleteUsers.map((u) => u._id);
    const delEmps = await Employee.deleteMany({ user: { $in: userIds } });
    const delUsrs = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`[Seed Cleanup] Removed ${delEmps.deletedCount} obsolete demo employee profiles and ${delUsrs.deletedCount} placeholder users.`);
  }
}

/**
 * Ensures authorized admin and trainer users exist.
 */
async function ensureAdminAndTrainer() {
  let trainer = await User.findOne({ email: 'trainer@skilltrack.demo' });
  if (trainer) {
    trainer.name = 'Meera Iyer';
    trainer.role = 'trainer';
    trainer.password = 'Password123!';
    trainer.isActive = true;
    await trainer.save();
  } else {
    trainer = await User.create({
      name: 'Meera Iyer',
      email: 'trainer@skilltrack.demo',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });
  }

  let admin = await User.findOne({ email: 'admin@skilltrack.demo' });
  if (admin) {
    admin.name = 'Aarav Sharma';
    admin.role = 'admin';
    admin.password = 'Password123!';
    admin.isActive = true;
    await admin.save();
  } else {
    admin = await User.create({
      name: 'Aarav Sharma',
      email: 'admin@skilltrack.demo',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });
  }

  return { trainer, admin };
}

/**
 * Seeds and maintains the 10 Mandated Technical Departments.
 */
async function seedTechnicalDepartments() {
  const deptMapByCourseTitle = new Map();
  const deptMapByName = new Map();

  for (const dInfo of DEPARTMENT_DATA) {
    let deptDoc = await Department.findOne({
      name: { $regex: new RegExp(`^${dInfo.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    if (deptDoc) {
      deptDoc.name = dInfo.name;
      deptDoc.description = dInfo.description;
      deptDoc.isActive = true;
      await deptDoc.save();
    } else {
      deptDoc = await Department.create({
        name: dInfo.name,
        description: dInfo.description,
        isActive: true
      });
    }

    deptMapByCourseTitle.set(dInfo.courseTitle, deptDoc);
    deptMapByName.set(dInfo.name, deptDoc);
  }

  console.log(`[Seed] Processed ${DEPARTMENT_DATA.length} Technical Departments.`);
  return { deptMapByCourseTitle, deptMapByName };
}

/**
 * Seeds and maintains the 10 Mandated Technical Courses and Matching Assessments.
 */
async function seedCoursesAndAssessments(trainer, deptMapByCourseTitle) {
  const courseMapByTitle = new Map();

  for (const cInfo of courseData) {
    let courseDoc = await Course.findOne({ title: cInfo.title });
    const matchingDept = deptMapByCourseTitle.get(cInfo.title);

    if (courseDoc) {
      courseDoc.description = cInfo.description;
      courseDoc.category = cInfo.category;
      courseDoc.level = cInfo.level;
      courseDoc.duration = cInfo.duration;
      courseDoc.status = 'published';
      courseDoc.isActive = true;
      if (matchingDept) courseDoc.department = matchingDept._id;
      courseDoc.trainer = trainer._id;
      await courseDoc.save();
    } else {
      courseDoc = await Course.create({
        title: cInfo.title,
        description: cInfo.description,
        category: cInfo.category,
        level: cInfo.level,
        duration: cInfo.duration,
        trainer: trainer._id,
        department: matchingDept ? matchingDept._id : undefined,
        status: 'published',
        isActive: true
      });
    }

    courseMapByTitle.set(cInfo.title, courseDoc);

    // Seed Modules & Lessons
    for (const mInfo of cInfo.modules) {
      let moduleDoc = await Module.findOne({ course: courseDoc._id, order: mInfo.order });

      if (moduleDoc) {
        moduleDoc.title = mInfo.title;
        moduleDoc.description = mInfo.description;
        moduleDoc.isActive = true;
        await moduleDoc.save();
      } else {
        moduleDoc = await Module.create({
          course: courseDoc._id,
          title: mInfo.title,
          description: mInfo.description,
          order: mInfo.order,
          isActive: true
        });
      }

      for (const lInfo of mInfo.lessons) {
        let lessonDoc = await Lesson.findOne({ module: moduleDoc._id, order: lInfo.order });

        if (lessonDoc) {
          lessonDoc.title = lInfo.title;
          lessonDoc.content = lInfo.content;
          lessonDoc.contentType = lInfo.contentType;
          lessonDoc.isActive = true;
          await lessonDoc.save();
        } else {
          lessonDoc = await Lesson.create({
            module: moduleDoc._id,
            title: lInfo.title,
            content: lInfo.content,
            contentType: lInfo.contentType,
            order: lInfo.order,
            isActive: true
          });
        }
      }
    }
  }

  // Seed Assessments & Questions
  for (const aInfo of assessmentData) {
    const matchingCourse = courseMapByTitle.get(aInfo.courseTitle);
    if (!matchingCourse) continue;

    let assessmentDoc = await Assessment.findOne({ course: matchingCourse._id });
    if (!assessmentDoc) {
      assessmentDoc = await Assessment.findOne({ title: aInfo.title });
    }

    if (assessmentDoc) {
      assessmentDoc.title = aInfo.title;
      assessmentDoc.description = aInfo.description;
      assessmentDoc.course = matchingCourse._id;
      assessmentDoc.trainer = trainer._id;
      assessmentDoc.status = 'published';
      assessmentDoc.passingPercentage = aInfo.passingPercentage;
      assessmentDoc.timeLimitMinutes = aInfo.timeLimitMinutes;
      assessmentDoc.requiresCourseCompletion = true;
      assessmentDoc.isActive = true;
      await assessmentDoc.save();
    } else {
      assessmentDoc = await Assessment.create({
        title: aInfo.title,
        description: aInfo.description,
        course: matchingCourse._id,
        trainer: trainer._id,
        status: 'published',
        passingPercentage: aInfo.passingPercentage,
        timeLimitMinutes: aInfo.timeLimitMinutes,
        requiresCourseCompletion: true,
        isActive: true
      });
    }

    for (const qInfo of aInfo.questions) {
      let questionDoc = await Question.findOne({ assessment: assessmentDoc._id, order: qInfo.order });

      if (questionDoc) {
        questionDoc.questionText = qInfo.questionText;
        questionDoc.questionType = 'single_choice';
        questionDoc.options = qInfo.options;
        questionDoc.correctAnswers = qInfo.correctAnswers;
        questionDoc.marks = qInfo.marks;
        questionDoc.isActive = true;
        await questionDoc.save();
      } else {
        questionDoc = await Question.create({
          assessment: assessmentDoc._id,
          questionText: qInfo.questionText,
          questionType: 'single_choice',
          options: qInfo.options,
          correctAnswers: qInfo.correctAnswers,
          marks: qInfo.marks,
          order: qInfo.order,
          isActive: true
        });
      }
    }
  }

  console.log(`[Seed] Processed 10 Mandated Technical Courses and 10 Assessments.`);
  return courseMapByTitle;
}

/**
 * Seeds a consistent roster of 13 realistic fictional employees across the 10 departments.
 */
async function seedFictionalEmployees(deptMapByName) {
  const FICTIONAL_ROSTER = [
    {
      employeeId: 'EMP-1001',
      name: 'Priya Patel',
      email: 'employee@skilltrack.demo',
      departmentName: 'Full-Stack Development — MongoDB and MERN',
      designation: 'Full-Stack MERN Developer',
      phone: '+1 (555) 234-5671',
      dateOfJoining: new Date('2023-03-15')
    },
    {
      employeeId: 'EMP-1002',
      name: 'Kavita Rao',
      email: 'kavita.rao@example.com',
      departmentName: 'Java Programming',
      designation: 'Senior Java Developer',
      phone: '+1 (555) 234-5672',
      dateOfJoining: new Date('2022-08-10')
    },
    {
      employeeId: 'EMP-1003',
      name: 'David Chen',
      email: 'david.chen@example.com',
      departmentName: 'Object-Oriented Programming',
      designation: 'Software Architecture Engineer',
      phone: '+1 (555) 234-5673',
      dateOfJoining: new Date('2023-01-20')
    },
    {
      employeeId: 'EMP-1004',
      name: 'Sofia Rodriguez',
      email: 'sofia.rodriguez@example.com',
      departmentName: 'Data Structures and Algorithms',
      designation: 'Algorithms & Optimization Engineer',
      phone: '+1 (555) 234-5674',
      dateOfJoining: new Date('2023-06-01')
    },
    {
      employeeId: 'EMP-1005',
      name: 'Marcus Vance',
      email: 'marcus.vance@example.com',
      departmentName: 'Web Development — HTML and CSS',
      designation: 'UI/Web Developer',
      phone: '+1 (555) 234-5675',
      dateOfJoining: new Date('2024-02-15')
    },
    {
      employeeId: 'EMP-1006',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      departmentName: 'JavaScript Development',
      designation: 'Core JavaScript Developer',
      phone: '+1 (555) 234-5676',
      dateOfJoining: new Date('2023-11-10')
    },
    {
      employeeId: 'EMP-1007',
      name: 'Liam O\'Connor',
      email: 'liam.oconnor@example.com',
      departmentName: 'React.js Development',
      designation: 'Frontend React Engineer',
      phone: '+1 (555) 234-5677',
      dateOfJoining: new Date('2022-09-05')
    },
    {
      employeeId: 'EMP-1008',
      name: 'Zara Al-Mansoor',
      email: 'zara.almansoor@example.com',
      departmentName: 'Backend Development — Node.js and Express.js',
      designation: 'Backend API Engineer',
      phone: '+1 (555) 234-5678',
      dateOfJoining: new Date('2023-04-12')
    },
    {
      employeeId: 'EMP-1009',
      name: 'Ethan Walker',
      email: 'ethan.walker@example.com',
      departmentName: 'Database Management — SQL',
      designation: 'Database Administrator',
      phone: '+1 (555) 234-5679',
      dateOfJoining: new Date('2022-11-28')
    },
    {
      employeeId: 'EMP-1010',
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@example.com',
      departmentName: 'Software Engineering and Computer Networks',
      designation: 'DevOps & Systems Engineer',
      phone: '+1 (555) 234-5680',
      dateOfJoining: new Date('2023-07-19')
    },
    {
      employeeId: 'EMP-1011',
      name: 'Chloe Bennett',
      email: 'chloe.bennett@example.com',
      departmentName: 'Full-Stack Development — MongoDB and MERN',
      designation: 'Associate Full-Stack Developer',
      phone: '+1 (555) 234-5681',
      dateOfJoining: new Date('2024-01-08')
    },
    {
      employeeId: 'EMP-1012',
      name: 'Tariq Hassan',
      email: 'tariq.hassan@example.com',
      departmentName: 'React.js Development',
      designation: 'Junior UI Engineer',
      phone: '+1 (555) 234-5682',
      dateOfJoining: new Date('2024-03-22')
    },
    {
      employeeId: 'EMP-1013',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      departmentName: 'Java Programming',
      designation: 'Enterprise Systems Engineer',
      phone: '+1 (555) 234-5683',
      dateOfJoining: new Date('2022-05-14')
    }
  ];

  const employeeMapByEmail = new Map();

  for (const item of FICTIONAL_ROSTER) {
    const deptDoc = deptMapByName.get(item.departmentName);
    if (!deptDoc) {
      console.warn(`[Seed] Warning: Department ${item.departmentName} not found for ${item.name}`);
      continue;
    }

    // 1. Upsert User
    let userDoc = await User.findOne({ email: item.email });
    if (userDoc) {
      userDoc.name = item.name;
      userDoc.role = 'employee';
      userDoc.password = 'Password123!';
      userDoc.isActive = true;
      await userDoc.save();
    } else {
      userDoc = await User.create({
        name: item.name,
        email: item.email,
        password: 'Password123!',
        role: 'employee',
        isActive: true
      });
    }

    // 2. Upsert Employee profile
    let empDoc = await Employee.findOne({ user: userDoc._id });
    if (!empDoc) {
      empDoc = await Employee.findOne({ employeeId: item.employeeId });
    }

    if (empDoc) {
      empDoc.user = userDoc._id;
      empDoc.employeeId = item.employeeId;
      empDoc.department = deptDoc._id;
      empDoc.designation = item.designation;
      empDoc.phone = item.phone;
      empDoc.dateOfJoining = item.dateOfJoining;
      empDoc.isActive = true;
      await empDoc.save();
    } else {
      empDoc = await Employee.create({
        user: userDoc._id,
        employeeId: item.employeeId,
        department: deptDoc._id,
        designation: item.designation,
        phone: item.phone,
        dateOfJoining: item.dateOfJoining,
        isActive: true
      });
    }

    employeeMapByEmail.set(item.email, empDoc);
  }

  console.log(`[Seed] Processed ${FICTIONAL_ROSTER.length} Fictional Employee Profiles.`);
  return employeeMapByEmail;
}

/**
 * Seeds Skills, Benchmark Job Roles, JobRoleSkillRequirements, and CourseSkills.
 */
async function seedSkillsAndJobRoles(courseMapByTitle) {
  const SKILLS_DATA = [
    { name: 'Java Programming', category: 'Backend Development', description: 'Core Java, collections, exception handling, and JVM concurrency' },
    { name: 'Object-Oriented Programming', category: 'Software Engineering', description: 'SOLID design principles, design patterns, encapsulation and abstraction' },
    { name: 'Data Structures and Algorithms', category: 'Computer Science', description: 'Asymptotic analysis, trees, dynamic programming, and search/sort algorithms' },
    { name: 'HTML5 & CSS3 Responsive Design', category: 'Frontend Development', description: 'Semantic markup, Flexbox, Grid systems, and accessibility' },
    { name: 'JavaScript (ES6+)', category: 'Frontend Development', description: 'Modern ECMAScript, closures, event loop, and asynchronous programming' },
    { name: 'React.js Framework', category: 'Frontend Development', description: 'Component architecture, custom hooks, virtual DOM, and client state management' },
    { name: 'Node.js & Express.js', category: 'Backend Development', description: 'Non-blocking I/O runtime, REST API design, middleware, and backend security' },
    { name: 'SQL & Relational Databases', category: 'Database Engineering', description: 'Relational data modeling, ACID transactions, complex joins, and indexing' },
    { name: 'MongoDB & NoSQL Architecture', category: 'Database Engineering', description: 'Document stores, aggregation pipelines, schema modeling with Mongoose' },
    { name: 'Computer Networks & Protocols', category: 'DevOps & Systems', description: 'OSI/TCP-IP layers, HTTP/HTTPS, DNS, and socket communication' },
    { name: 'System Design & Architecture', category: 'Software Engineering', description: 'Scalable distributed systems, load balancing, caching, and microservices' },
    { name: 'Git & CI/CD Workflows', category: 'DevOps & Systems', description: 'Branching strategies, automated test pipelines, and continuous integration' }
  ];

  const skillMapByName = new Map();
  for (const s of SKILLS_DATA) {
    let skillDoc = await Skill.findOne({ name: s.name }).collation({ locale: 'en', strength: 2 });
    if (!skillDoc) {
      skillDoc = await Skill.findOne({
        name: { $regex: new RegExp(`^${s.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
    }
    if (skillDoc) {
      skillDoc.category = s.category;
      skillDoc.description = s.description;
      skillDoc.isActive = true;
      await skillDoc.save();
    } else {
      skillDoc = await Skill.create({
        name: s.name,
        category: s.category,
        description: s.description,
        isActive: true
      });
    }
    skillMapByName.set(s.name, skillDoc);
  }

  // Seed 4 Benchmark Job Roles
  const ROLES_DATA = [
    {
      name: 'Full-Stack MERN Developer',
      code: 'ROLE-FSD',
      description: 'Engineers responsive full-stack applications with MongoDB, Express.js, React, and Node.js.',
      requirements: [
        { skillName: 'React.js Framework', requiredLevel: 'advanced', mandatory: true, weight: 30 },
        { skillName: 'Node.js & Express.js', requiredLevel: 'advanced', mandatory: true, weight: 25 },
        { skillName: 'MongoDB & NoSQL Architecture', requiredLevel: 'advanced', mandatory: true, weight: 20 },
        { skillName: 'JavaScript (ES6+)', requiredLevel: 'advanced', mandatory: true, weight: 15 },
        { skillName: 'HTML5 & CSS3 Responsive Design', requiredLevel: 'intermediate', mandatory: false, weight: 5 },
        { skillName: 'Git & CI/CD Workflows', requiredLevel: 'intermediate', mandatory: false, weight: 5 }
      ]
    },
    {
      name: 'Backend Systems Engineer',
      code: 'ROLE-BSE',
      description: 'Designs reliable, high-throughput server backends, database schemas, and microservices.',
      requirements: [
        { skillName: 'Java Programming', requiredLevel: 'expert', mandatory: true, weight: 35 },
        { skillName: 'Object-Oriented Programming', requiredLevel: 'advanced', mandatory: true, weight: 25 },
        { skillName: 'SQL & Relational Databases', requiredLevel: 'advanced', mandatory: true, weight: 20 },
        { skillName: 'Data Structures and Algorithms', requiredLevel: 'advanced', mandatory: true, weight: 15 },
        { skillName: 'Node.js & Express.js', requiredLevel: 'intermediate', mandatory: false, weight: 5 }
      ]
    },
    {
      name: 'Frontend UI/UX Engineer',
      code: 'ROLE-FEE',
      description: 'Constructs performant, accessible web user interfaces and rich interactive client applications.',
      requirements: [
        { skillName: 'React.js Framework', requiredLevel: 'expert', mandatory: true, weight: 35 },
        { skillName: 'JavaScript (ES6+)', requiredLevel: 'advanced', mandatory: true, weight: 30 },
        { skillName: 'HTML5 & CSS3 Responsive Design', requiredLevel: 'advanced', mandatory: true, weight: 20 },
        { skillName: 'Data Structures and Algorithms', requiredLevel: 'intermediate', mandatory: false, weight: 15 }
      ]
    },
    {
      name: 'DevOps & Cloud Systems Engineer',
      code: 'ROLE-DSE',
      description: 'Operates distributed cloud networks, CI/CD deployment pipelines, and system reliability.',
      requirements: [
        { skillName: 'Computer Networks & Protocols', requiredLevel: 'advanced', mandatory: true, weight: 35 },
        { skillName: 'System Design & Architecture', requiredLevel: 'advanced', mandatory: true, weight: 30 },
        { skillName: 'Git & CI/CD Workflows', requiredLevel: 'expert', mandatory: true, weight: 25 },
        { skillName: 'SQL & Relational Databases', requiredLevel: 'intermediate', mandatory: false, weight: 10 }
      ]
    }
  ];

  for (const r of ROLES_DATA) {
    let roleDoc = await JobRole.findOne({ code: r.code });
    if (roleDoc) {
      roleDoc.name = r.name;
      roleDoc.description = r.description;
      roleDoc.isActive = true;
      await roleDoc.save();
    } else {
      roleDoc = await JobRole.create({
        name: r.name,
        code: r.code,
        description: r.description,
        isActive: true
      });
    }

    // Seed Role Requirements
    for (const req of r.requirements) {
      const skillDoc = skillMapByName.get(req.skillName);
      if (!skillDoc) continue;

      let reqDoc = await JobRoleSkillRequirement.findOne({ jobRole: roleDoc._id, skill: skillDoc._id });
      if (reqDoc) {
        reqDoc.requiredLevel = req.requiredLevel;
        reqDoc.mandatory = req.mandatory;
        reqDoc.weight = req.weight;
        reqDoc.isActive = true;
        await reqDoc.save();
      } else {
        await JobRoleSkillRequirement.create({
          jobRole: roleDoc._id,
          skill: skillDoc._id,
          requiredLevel: req.requiredLevel,
          mandatory: req.mandatory,
          weight: req.weight,
          isActive: true
        });
      }
    }
  }

  // Seed CourseSkill mappings for course recommendations
  const COURSE_SKILL_MAPPINGS = [
    { courseTitle: 'Java Programming Fundamentals', skillName: 'Java Programming', coverageLevel: 'advanced' },
    { courseTitle: 'Java Programming Fundamentals', skillName: 'Object-Oriented Programming', coverageLevel: 'intermediate' },
    { courseTitle: 'Object-Oriented Programming', skillName: 'Object-Oriented Programming', coverageLevel: 'expert' },
    { courseTitle: 'Object-Oriented Programming', skillName: 'System Design & Architecture', coverageLevel: 'advanced' },
    { courseTitle: 'Data Structures and Algorithms', skillName: 'Data Structures and Algorithms', coverageLevel: 'advanced' },
    { courseTitle: 'HTML and CSS Web Development', skillName: 'HTML5 & CSS3 Responsive Design', coverageLevel: 'advanced' },
    { courseTitle: 'JavaScript Fundamentals', skillName: 'JavaScript (ES6+)', coverageLevel: 'advanced' },
    { courseTitle: 'React.js Development', skillName: 'React.js Framework', coverageLevel: 'advanced' },
    { courseTitle: 'Node.js and Express.js', skillName: 'Node.js & Express.js', coverageLevel: 'advanced' },
    { courseTitle: 'SQL and Database Management', skillName: 'SQL & Relational Databases', coverageLevel: 'advanced' },
    { courseTitle: 'MongoDB and MERN Stack', skillName: 'MongoDB & NoSQL Architecture', coverageLevel: 'advanced' },
    { courseTitle: 'MongoDB and MERN Stack', skillName: 'Node.js & Express.js', coverageLevel: 'intermediate' },
    { courseTitle: 'Software Engineering and Computer Networks', skillName: 'Computer Networks & Protocols', coverageLevel: 'advanced' },
    { courseTitle: 'Software Engineering and Computer Networks', skillName: 'Git & CI/CD Workflows', coverageLevel: 'advanced' }
  ];

  for (const m of COURSE_SKILL_MAPPINGS) {
    const courseDoc = courseMapByTitle.get(m.courseTitle);
    const skillDoc = skillMapByName.get(m.skillName);
    if (!courseDoc || !skillDoc) continue;

    let cs = await CourseSkill.findOne({ course: courseDoc._id, skill: skillDoc._id });
    if (cs) {
      cs.coverageLevel = m.coverageLevel;
      cs.isActive = true;
      await cs.save();
    } else {
      await CourseSkill.create({
        course: courseDoc._id,
        skill: skillDoc._id,
        coverageLevel: m.coverageLevel,
        coverageWeight: 10,
        isActive: true
      });
    }
  }

  console.log(`[Seed] Processed Skills, Job Roles, Requirements, and CourseSkill mappings.`);
  return skillMapByName;
}

/**
 * Seeds realistic EmployeeSkill inventories so Skills & Skill Gap pages display populated data.
 */
async function seedEmployeeSkills(employeeMapByEmail, skillMapByName) {
  // Define realistic skill profiles
  // Priya Patel (employee@skilltrack.demo) has benchmark role Full-Stack MERN Developer:
  // - React: intermediate (requires advanced -> BELOW_REQUIRED)
  // - MongoDB: beginner (requires advanced -> BELOW_REQUIRED)
  // - Node.js: unassigned -> MISSING
  // - JavaScript: advanced (requires advanced -> MEETS_REQUIRED)
  // - HTML/CSS: advanced (requires intermediate -> MEETS_REQUIRED)
  // - Git: intermediate (requires intermediate -> MEETS_REQUIRED)
  const EMPLOYEE_SKILL_INVENTORY = [
    {
      email: 'employee@skilltrack.demo',
      skills: [
        { name: 'JavaScript (ES6+)', level: 'advanced' },
        { name: 'HTML5 & CSS3 Responsive Design', level: 'advanced' },
        { name: 'React.js Framework', level: 'intermediate' },
        { name: 'MongoDB & NoSQL Architecture', level: 'beginner' },
        { name: 'Git & CI/CD Workflows', level: 'intermediate' }
      ]
    },
    {
      email: 'kavita.rao@example.com',
      skills: [
        { name: 'Java Programming', level: 'expert' },
        { name: 'Object-Oriented Programming', level: 'advanced' },
        { name: 'SQL & Relational Databases', level: 'advanced' },
        { name: 'Data Structures and Algorithms', level: 'intermediate' }
      ]
    },
    {
      email: 'david.chen@example.com',
      skills: [
        { name: 'Object-Oriented Programming', level: 'expert' },
        { name: 'System Design & Architecture', level: 'advanced' },
        { name: 'Java Programming', level: 'advanced' },
        { name: 'SQL & Relational Databases', level: 'intermediate' }
      ]
    },
    {
      email: 'sofia.rodriguez@example.com',
      skills: [
        { name: 'Data Structures and Algorithms', level: 'expert' },
        { name: 'Java Programming', level: 'advanced' },
        { name: 'JavaScript (ES6+)', level: 'intermediate' }
      ]
    },
    {
      email: 'marcus.vance@example.com',
      skills: [
        { name: 'HTML5 & CSS3 Responsive Design', level: 'expert' },
        { name: 'JavaScript (ES6+)', level: 'intermediate' },
        { name: 'React.js Framework', level: 'beginner' }
      ]
    },
    {
      email: 'ananya.sharma@example.com',
      skills: [
        { name: 'JavaScript (ES6+)', level: 'expert' },
        { name: 'Node.js & Express.js', level: 'intermediate' },
        { name: 'HTML5 & CSS3 Responsive Design', level: 'advanced' }
      ]
    },
    {
      email: 'liam.oconnor@example.com',
      skills: [
        { name: 'React.js Framework', level: 'advanced' },
        { name: 'JavaScript (ES6+)', level: 'advanced' },
        { name: 'HTML5 & CSS3 Responsive Design', level: 'advanced' }
      ]
    },
    {
      email: 'zara.almansoor@example.com',
      skills: [
        { name: 'Node.js & Express.js', level: 'expert' },
        { name: 'MongoDB & NoSQL Architecture', level: 'advanced' },
        { name: 'System Design & Architecture', level: 'intermediate' }
      ]
    },
    {
      email: 'ethan.walker@example.com',
      skills: [
        { name: 'SQL & Relational Databases', level: 'expert' },
        { name: 'System Design & Architecture', level: 'advanced' }
      ]
    },
    {
      email: 'vikram.malhotra@example.com',
      skills: [
        { name: 'Computer Networks & Protocols', level: 'expert' },
        { name: 'Git & CI/CD Workflows', level: 'expert' },
        { name: 'System Design & Architecture', level: 'advanced' }
      ]
    }
  ];

  let skillsAssigned = 0;
  for (const empItem of EMPLOYEE_SKILL_INVENTORY) {
    const empDoc = employeeMapByEmail.get(empItem.email);
    if (!empDoc) continue;

    for (const s of empItem.skills) {
      const skillDoc = skillMapByName.get(s.name);
      if (!skillDoc) continue;

      let esDoc = await EmployeeSkill.findOne({ employee: empDoc._id, skill: skillDoc._id });
      if (esDoc) {
        esDoc.proficiencyLevel = s.level;
        esDoc.isActive = true;
        await esDoc.save();
      } else {
        await EmployeeSkill.create({
          employee: empDoc._id,
          skill: skillDoc._id,
          proficiencyLevel: s.level,
          isActive: true
        });
      }
      skillsAssigned++;
    }
  }

  console.log(`[Seed] Seeded ${skillsAssigned} EmployeeSkill assignments across roster.`);
}

/**
 * Seeds realistic Compliance Requirements, Assignments, Enrollments, and Certificates.
 */
async function seedComplianceData(employeeMapByEmail, courseMapByTitle) {
  const req1Course = courseMapByTitle.get('Software Engineering and Computer Networks');
  const req2Course = courseMapByTitle.get('SQL and Database Management');
  const req3Course = courseMapByTitle.get('MongoDB and MERN Stack');
  const req4Course = courseMapByTitle.get('HTML and CSS Web Development');

  if (!req1Course || !req2Course || !req3Course || !req4Course) {
    console.warn('[Seed] Required courses not found for compliance seeding.');
    return;
  }

  const COMPLIANCE_REQS = [
    {
      title: 'Information Security & Network Protocols Compliance',
      description: 'Mandatory annual regulatory compliance regarding secure socket communication, DNS security, and infrastructure access controls.',
      course: req1Course._id,
      frequency: 'annual',
      dueWithinDays: 30,
      renewalGraceDays: 14
    },
    {
      title: 'Data Protection & Relational Database Governance',
      description: 'Annual certification governing ACID transaction integrity, PII protection, database query auditing, and data backup compliance.',
      course: req2Course._id,
      frequency: 'annual',
      dueWithinDays: 60,
      renewalGraceDays: 14
    },
    {
      title: 'Full-Stack Cloud Architecture & Security Standard',
      description: 'Annual compliance requirement on document-level database encryption, CORS policy management, and session handling security.',
      course: req3Course._id,
      frequency: 'annual',
      dueWithinDays: 45,
      renewalGraceDays: 10
    },
    {
      title: 'Secure Frontend & Web Engineering Standards',
      description: 'Biennial compliance standard on web accessibility (WCAG 2.1), input sanitization against XSS, and semantic web structures.',
      course: req4Course._id,
      frequency: 'biennial',
      dueWithinDays: 90,
      renewalGraceDays: 30
    }
  ];

  const reqDocMap = new Map();
  for (const r of COMPLIANCE_REQS) {
    let reqDoc = await ComplianceRequirement.findOne({ title: r.title });
    if (reqDoc) {
      reqDoc.description = r.description;
      reqDoc.course = r.course;
      reqDoc.frequency = r.frequency;
      reqDoc.dueWithinDays = r.dueWithinDays;
      reqDoc.renewalGraceDays = r.renewalGraceDays;
      reqDoc.isActive = true;
      await reqDoc.save();
    } else {
      reqDoc = await ComplianceRequirement.create({
        title: r.title,
        description: r.description,
        course: r.course,
        frequency: r.frequency,
        dueWithinDays: r.dueWithinDays,
        renewalGraceDays: r.renewalGraceDays,
        isActive: true
      });
    }
    reqDocMap.set(r.title, reqDoc);
  }

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Helper to upsert assignment, enrollment, and certificate for COMPLIANT status
  async function seedCompliantAssignment(employee, requirement, course, certNum, completedDaysAgo) {
    const completedDate = new Date(now.getTime() - completedDaysAgo * dayMs);
    const assignedDate = new Date(completedDate.getTime() - 15 * dayMs);
    const dueDate = new Date(assignedDate.getTime() + requirement.dueWithinDays * dayMs);

    let enrollment = await Enrollment.findOne({ employee: employee._id, course: course._id });
    if (enrollment) {
      enrollment.status = 'completed';
      enrollment.progressPercentage = 100;
      enrollment.completedAt = completedDate;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        employee: employee._id,
        course: course._id,
        status: 'completed',
        progressPercentage: 100,
        completedAt: completedDate,
        startedAt: assignedDate,
        isActive: true
      });
    }

    let cert = await Certificate.findOne({ certificateNumber: certNum });
    if (cert) {
      cert.employee = employee._id;
      cert.course = course._id;
      cert.enrollment = enrollment._id;
      cert.issuedAt = completedDate;
      cert.expiresAt = new Date(completedDate.getTime() + 365 * dayMs);
      cert.status = 'active';
      await cert.save();
    } else {
      await Certificate.create({
        employee: employee._id,
        course: course._id,
        enrollment: enrollment._id,
        certificateNumber: certNum,
        issuedAt: completedDate,
        expiresAt: new Date(completedDate.getTime() + 365 * dayMs),
        status: 'active'
      });
    }

    let assignment = await ComplianceAssignment.findOne({
      complianceRequirement: requirement._id,
      employee: employee._id
    });
    if (assignment) {
      assignment.assignedAt = assignedDate;
      assignment.dueAt = dueDate;
      assignment.status = 'COMPLIANT';
      assignment.completedAt = completedDate;
      assignment.lastEvaluatedAt = now;
      assignment.isActive = true;
      await assignment.save();
    } else {
      await ComplianceAssignment.create({
        complianceRequirement: requirement._id,
        employee: employee._id,
        assignedAt: assignedDate,
        dueAt: dueDate,
        status: 'COMPLIANT',
        completedAt: completedDate,
        lastEvaluatedAt: now,
        isActive: true
      });
    }
  }

  // Helper to upsert arbitrary assignment status
  async function seedAssignmentStatus(employee, requirement, status, daysFromNow, enrollmentStatus = null) {
    const dueAt = new Date(now.getTime() + daysFromNow * dayMs);
    const assignedAt = new Date(dueAt.getTime() - requirement.dueWithinDays * dayMs);

    if (enrollmentStatus) {
      let enrollment = await Enrollment.findOne({ employee: employee._id, course: requirement.course });
      if (enrollment) {
        enrollment.status = enrollmentStatus;
        enrollment.progressPercentage = enrollmentStatus === 'in_progress' ? 45 : 0;
        await enrollment.save();
      } else {
        await Enrollment.create({
          employee: employee._id,
          course: requirement.course,
          status: enrollmentStatus,
          progressPercentage: enrollmentStatus === 'in_progress' ? 45 : 0,
          startedAt: assignedAt,
          isActive: true
        });
      }
    }

    let assignment = await ComplianceAssignment.findOne({
      complianceRequirement: requirement._id,
      employee: employee._id
    });
    if (assignment) {
      assignment.assignedAt = assignedAt;
      assignment.dueAt = dueAt;
      assignment.status = status;
      assignment.lastEvaluatedAt = now;
      assignment.isActive = true;
      await assignment.save();
    } else {
      await ComplianceAssignment.create({
        complianceRequirement: requirement._id,
        employee: employee._id,
        assignedAt: assignedAt,
        dueAt: dueAt,
        status: status,
        lastEvaluatedAt: now,
        isActive: true
      });
    }
  }

  const priya = employeeMapByEmail.get('employee@skilltrack.demo');
  const kavita = employeeMapByEmail.get('kavita.rao@example.com');
  const david = employeeMapByEmail.get('david.chen@example.com');
  const sofia = employeeMapByEmail.get('sofia.rodriguez@example.com');
  const marcus = employeeMapByEmail.get('marcus.vance@example.com');
  const ananya = employeeMapByEmail.get('ananya.sharma@example.com');
  const liam = employeeMapByEmail.get('liam.oconnor@example.com');
  const ethan = employeeMapByEmail.get('ethan.walker@example.com');
  const elena = employeeMapByEmail.get('elena.rostova@example.com');
  const vikram = employeeMapByEmail.get('vikram.malhotra@example.com');

  const req1 = reqDocMap.get('Information Security & Network Protocols Compliance');
  const req2 = reqDocMap.get('Data Protection & Relational Database Governance');
  const req3 = reqDocMap.get('Full-Stack Cloud Architecture & Security Standard');
  const req4 = reqDocMap.get('Secure Frontend & Web Engineering Standards');

  // 1. COMPLIANT cases (with valid certificate)
  if (priya && req1) {
    await seedCompliantAssignment(priya, req1, req1Course, 'SKILLTRACK-2026-COMP-001', 45);
  }
  if (kavita && req2) {
    await seedCompliantAssignment(kavita, req2, req2Course, 'SKILLTRACK-2026-COMP-002', 30);
  }
  if (david && req3) {
    await seedCompliantAssignment(david, req3, req3Course, 'SKILLTRACK-2026-COMP-003', 20);
  }

  // 2. DUE_SOON cases (due in 10-20 days)
  if (priya && req3) {
    await seedAssignmentStatus(priya, req3, 'DUE_SOON', 18);
  }
  if (liam && req4) {
    await seedAssignmentStatus(liam, req4, 'DUE_SOON', 12);
  }

  // 3. OVERDUE cases (due in the past, incomplete)
  if (marcus && req1) {
    await seedAssignmentStatus(marcus, req1, 'OVERDUE', -14);
  }
  if (ethan && req4) {
    await seedAssignmentStatus(ethan, req4, 'OVERDUE', -8);
  }

  // 4. IN_PROGRESS cases (training in progress)
  if (sofia && req1) {
    await seedAssignmentStatus(sofia, req1, 'IN_PROGRESS', 35, 'in_progress');
  }
  if (ananya && req3) {
    await seedAssignmentStatus(ananya, req3, 'IN_PROGRESS', 40, 'in_progress');
  }

  // 5. NOT_STARTED cases (future due dates, not started)
  if (elena && req2) {
    await seedAssignmentStatus(elena, req2, 'NOT_STARTED', 80);
  }
  if (vikram && req2) {
    await seedAssignmentStatus(vikram, req2, 'NOT_STARTED', 75);
  }

  console.log(`[Seed] Seeded realistic Compliance Requirements and Assignments across roles.`);
}

/**
 * Main idempotent seeder entry point.
 */
async function seedIntegratedLearning() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log(`[Seed] Connected to database: ${mongoose.connection.name}`);

  // 0. Remove obsolete demo records & legacy departments
  await cleanupObsoleteDemoRecords();

  // 1. Admin and Trainer users
  const { trainer } = await ensureAdminAndTrainer();

  // 2. Mandated 10 Technical Departments
  const { deptMapByCourseTitle, deptMapByName } = await seedTechnicalDepartments();

  // 3. Mandated 10 Technical Courses & 10 Matching Assessments
  const courseMapByTitle = await seedCoursesAndAssessments(trainer, deptMapByCourseTitle);

  // 4. Fictional Employee Roster across remaining active departments
  const employeeMapByEmail = await seedFictionalEmployees(deptMapByName);

  // 5. Skills, Job Roles, Requirements, CourseSkill mappings
  const skillMapByName = await seedSkillsAndJobRoles(courseMapByTitle);

  // 6. Employee Skills inventory
  await seedEmployeeSkills(employeeMapByEmail, skillMapByName);

  // 7. Compliance requirements & pre-populated assignments
  await seedComplianceData(employeeMapByEmail, courseMapByTitle);

  console.log('[Seed] All seeding tasks completed successfully and idempotently!');
}

// Execute standalone if invoked directly
if (require.main === module) {
  seedIntegratedLearning()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Error during seeding:', err);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = seedIntegratedLearning;
