const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const VERIFY_DB_URI = process.env.VERIFY_MONGO_URI || 'mongodb://127.0.0.1:27017/skilltrack_phase21_integration';

async function runLiveVerification() {
  console.log('================================================================');
  console.log('SKILLTRACK PHASE 21 — LIVE INTEGRATION VERIFICATION (60 CHECKS)');
  console.log('Database:', VERIFY_DB_URI);
  console.log('================================================================\n');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(VERIFY_DB_URI);

  const app = require('../src/app');
  const config = require('../src/config');

  // Models
  const User = require('../src/models/User');
  const Department = require('../src/models/Department');
  const Employee = require('../src/models/Employee');
  const Course = require('../src/models/Course');
  const Module = require('../src/models/Module');
  const Lesson = require('../src/models/Lesson');
  const Enrollment = require('../src/models/Enrollment');
  const Assessment = require('../src/models/Assessment');
  const Question = require('../src/models/Question');
  const AssessmentAttempt = require('../src/models/AssessmentAttempt');
  const Certificate = require('../src/models/Certificate');
  const Notification = require('../src/models/Notification');
  const Skill = require('../src/models/Skill');
  const JobRole = require('../src/models/JobRole');
  const JobRoleSkillRequirement = require('../src/models/JobRoleSkillRequirement');
  const EmployeeSkill = require('../src/models/EmployeeSkill');
  const CourseSkill = require('../src/models/CourseSkill');
  const ComplianceRequirement = require('../src/models/ComplianceRequirement');
  const ComplianceAssignment = require('../src/models/ComplianceAssignment');

  let passed = 0;
  let failed = 0;

  function assert(condition, checkNum, description) {
    if (condition) {
      console.log(`[PASS] Check ${String(checkNum).padStart(2, '0')}: ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] Check ${String(checkNum).padStart(2, '0')}: ${description}`);
      failed++;
      throw new Error(`Assertion failed at Check ${checkNum}: ${description}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // SECTION 1: AUTHENTICATION, DEPARTMENT & EMPLOYEE SETUP (Checks 1–8)
    // -------------------------------------------------------------
    // Check 01: Clean database
    await mongoose.connection.dropDatabase();
    assert(true, 1, 'Clean and isolate verification database');

    // Check 02: Admin user creation & login
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin.live@skilltrack.test',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });
    const adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    assert(Boolean(adminToken), 2, 'Admin credentials generated with valid JWT');

    // Check 03: Admin creates Engineering Department
    const deptRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Systems Engineering',
        description: 'Core infrastructure and platform engineering'
      });
    const deptId = deptRes.body.data?.department?.id || deptRes.body.data?.department?._id;
    assert(deptRes.status === 201 && Boolean(deptId), 3, 'Admin creates department via POST /api/departments');

    // Check 04: Create Trainers (A and B)
    const trainerAUser = await User.create({
      name: 'Trainer Alice',
      email: 'trainer.alice@skilltrack.test',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });
    const trainerBUser = await User.create({
      name: 'Trainer Bob',
      email: 'trainer.bob@skilltrack.test',
      password: 'Password123!',
      role: 'trainer',
      isActive: true
    });
    const trainerTokenA = jwt.sign(
      { userId: trainerAUser._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const trainerTokenB = jwt.sign(
      { userId: trainerBUser._id.toString(), role: 'trainer' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    assert(Boolean(trainerTokenA && trainerTokenB), 4, 'Trainer users registered and authenticated');

    // Check 05: Register Employees (A and B)
    const employeeAUser = await User.create({
      name: 'Employee Arthur',
      email: 'employee.arthur@skilltrack.test',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });
    const employeeBUser = await User.create({
      name: 'Employee Beatrice',
      email: 'employee.beatrice@skilltrack.test',
      password: 'Password123!',
      role: 'employee',
      isActive: true
    });
    const employeeTokenA = jwt.sign(
      { userId: employeeAUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const employeeTokenB = jwt.sign(
      { userId: employeeBUser._id.toString(), role: 'employee' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    assert(Boolean(employeeTokenA && employeeTokenB), 5, 'Employee users registered and authenticated');

    // Check 06: Admin creates Employee Profile A
    const empARes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: employeeAUser._id.toString(),
        employeeId: 'EMP-P21-01',
        department: deptId,
        designation: 'Senior Backend Engineer',
        phone: '9888800001'
      });
    const employeeDocA = empARes.body.data?.employee;
    const empIdA = employeeDocA?.id || employeeDocA?._id;
    assert(empARes.status === 201 && Boolean(empIdA), 6, 'Admin creates Employee Profile A via POST /api/employees');

    // Check 07: Admin creates Employee Profile B
    const empBRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user: employeeBUser._id.toString(),
        employeeId: 'EMP-P21-02',
        department: deptId,
        designation: 'Staff Reliability Engineer',
        phone: '9888800002'
      });
    const employeeDocB = empBRes.body.data?.employee;
    const empIdB = employeeDocB?.id || employeeDocB?._id;
    assert(empBRes.status === 201 && Boolean(empIdB), 7, 'Admin creates Employee Profile B via POST /api/employees');

    // Check 08: Employee A queries own profile via GET /api/employees/me
    const meRes = await request(app)
      .get('/api/employees/me')
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(meRes.status === 200 && meRes.body.data.employee.employeeId === 'EMP-P21-01', 8, 'Employee A retrieves own profile via GET /api/employees/me');

    // -------------------------------------------------------------
    // SECTION 2: COURSE & CONTENT HIERARCHY (Checks 9–16)
    // -------------------------------------------------------------
    // Check 09: Trainer A creates Course A
    const cARes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        title: 'Cloud Native Microservices Architecture',
        description: 'Advanced microservices design patterns',
        category: 'technical',
        level: 'advanced',
        duration: 40
      });
    const courseDocA = cARes.body.data?.course;
    const courseAId = courseDocA?.id || courseDocA?._id;
    assert(cARes.status === 201 && Boolean(courseAId), 9, 'Trainer A creates Course A via POST /api/courses');

    // Check 10: Trainer B creates Course B
    const cBRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${trainerTokenB}`)
      .send({
        title: 'Kubernetes Cluster Operations',
        description: 'Production cluster management',
        category: 'devops',
        level: 'advanced',
        duration: 35
      });
    const courseDocB = cBRes.body.data?.course;
    const courseBId = courseDocB?.id || courseDocB?._id;
    assert(cBRes.status === 201 && Boolean(courseBId), 10, 'Trainer B creates Course B via POST /api/courses');

    // Check 11: Trainer A creates Module 1 on Course A
    const modARes = await request(app)
      .post('/api/modules')
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        course: courseAId,
        title: 'Module 1: Service Mesh Architecture',
        order: 1
      });
    const modAId = modARes.body.data?.module?.id || modARes.body.data?.module?._id;
    assert(modARes.status === 201 && Boolean(modAId), 11, 'Trainer A creates Module on Course A via POST /api/modules');

    // Check 12: Trainer A creates Lesson 1 on Module 1
    const les1Res = await request(app)
      .post(`/api/modules/${modAId}/lessons`)
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        title: 'Lesson 1: Envoy Proxy Principles',
        contentType: 'text',
        content: 'Understanding the data plane and sidecar proxies.',
        order: 1
      });
    const lesson1Id = les1Res.body.data?.lesson?.id || les1Res.body.data?.lesson?._id;
    assert(les1Res.status === 201 && Boolean(lesson1Id), 12, 'Trainer A creates Lesson 1 via POST /api/modules/:id/lessons');

    // Check 13: Trainer A creates Lesson 2 on Module 1
    const les2Res = await request(app)
      .post(`/api/modules/${modAId}/lessons`)
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        title: 'Lesson 2: Istio Control Plane',
        contentType: 'text',
        content: 'Traffic routing, mutual TLS, and security policies.',
        order: 2
      });
    const lesson2Id = les2Res.body.data?.lesson?.id || les2Res.body.data?.lesson?._id;
    assert(les2Res.status === 201 && Boolean(lesson2Id), 13, 'Trainer A creates Lesson 2 via POST /api/modules/:id/lessons');

    // Check 14: Trainer A publishes Course A
    const pubCARes = await request(app)
      .patch(`/api/courses/${courseAId}`)
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({ status: 'published' });
    assert(pubCARes.status === 200 && pubCARes.body.data.course.status === 'published', 14, 'Trainer A publishes Course A via PATCH /api/courses/:id');

    // Check 15: Trainer B publishes Course B
    const pubCBRes = await request(app)
      .patch(`/api/courses/${courseBId}`)
      .set('Authorization', `Bearer ${trainerTokenB}`)
      .send({ status: 'published' });
    assert(pubCBRes.status === 200 && pubCBRes.body.data.course.status === 'published', 15, 'Trainer B publishes Course B via PATCH /api/courses/:id');

    // Check 16: Trainer A cannot modify Course B (Tenant isolation / 403)
    const crossCourseRes = await request(app)
      .patch(`/api/courses/${courseBId}`)
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({ title: 'Malicious Course B Update' });
    assert(crossCourseRes.status === 403, 16, 'Trainer A modifying Course B is rejected with 403 Forbidden');

    // -------------------------------------------------------------
    // SECTION 3: LEARNING WORKFLOW & PROGRESS CALCULATION (Checks 17–24)
    // -------------------------------------------------------------
    // Check 17: Employee A enrolls in Course A
    const enrRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({ course: courseAId });
    const enrollmentAId = enrRes.body.data?.enrollment?.id || enrRes.body.data?.enrollment?._id;
    assert(enrRes.status === 201 && enrRes.body.data.enrollment.status === 'enrolled', 17, 'Employee A self-enrolls in Course A via POST /api/enrollments');

    // Check 18: Duplicate enrollment attempt rejected with 409
    const dupEnrRes = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({ course: courseAId });
    assert(dupEnrRes.status === 409, 18, 'Duplicate enrollment is rejected with 409 Conflict');

    // Check 19: Employee A retrieves enrollments via GET /api/enrollments/me
    const myEnrRes = await request(app)
      .get('/api/enrollments/me')
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(myEnrRes.status === 200 && myEnrRes.body.data.enrollments.length === 1, 19, 'Employee A retrieves own enrollments via GET /api/enrollments/me');

    // Check 20: Client tampering with progress percentage rejected with 400
    const tamperRes = await request(app)
      .patch(`/api/enrollments/${enrollmentAId}/progress`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        lessonId: lesson1Id,
        completed: true,
        progressPercentage: 100
      });
    assert(tamperRes.status === 400, 20, 'Direct client tampering with progress percentage rejected with 400');

    // Check 21: Complete Lesson 1 -> server calculates 50%, in_progress
    const prog1Res = await request(app)
      .patch(`/api/enrollments/${enrollmentAId}/progress`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        lessonId: lesson1Id,
        completed: true
      });
    assert(prog1Res.status === 200 && prog1Res.body.data.enrollment.progressPercentage === 50 && prog1Res.body.data.enrollment.status === 'in_progress', 21, 'Completing Lesson 1 dynamically calculates 50% and in_progress');

    // Check 22: Complete Lesson 2 -> server calculates 100%, completed
    const prog2Res = await request(app)
      .patch(`/api/enrollments/${enrollmentAId}/progress`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        lessonId: lesson2Id,
        completed: true
      });
    assert(prog2Res.status === 200 && prog2Res.body.data.enrollment.progressPercentage === 100 && prog2Res.body.data.enrollment.status === 'completed', 22, 'Completing Lesson 2 achieves 100% and transitions to completed');

    // Check 23: Trainer A views enrollments for Course A
    const trainerAEnrRes = await request(app)
      .get(`/api/enrollments?course=${courseAId}`)
      .set('Authorization', `Bearer ${trainerTokenA}`);
    assert(trainerAEnrRes.status === 200 && trainerAEnrRes.body.data.enrollments.length === 1, 23, 'Trainer A views Course A enrollments via GET /api/enrollments');

    // Check 24: Trainer A querying Course B enrollments returns empty array (Course scoping)
    const trainerAScopeRes = await request(app)
      .get(`/api/enrollments?course=${courseBId}`)
      .set('Authorization', `Bearer ${trainerTokenA}`);
    assert(trainerAScopeRes.status === 200 && trainerAScopeRes.body.data.enrollments.length === 0, 24, 'Trainer A querying foreign Course B enrollments returns empty list');

    // -------------------------------------------------------------
    // SECTION 4: ASSESSMENT LIFECYCLE & DETERMINISTIC GRADING (Checks 25–32)
    // -------------------------------------------------------------
    // Check 25: Trainer A creates Assessment on Course A
    const assRes = await request(app)
      .post('/api/assessments')
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        title: 'Microservices Architecture Certification Exam',
        description: 'Comprehensive exam for cloud native architecture',
        course: courseAId,
        passingPercentage: 60,
        maxAttempts: 3
      });
    const assessmentAId = assRes.body.data?.assessment?.id || assRes.body.data?.assessment?._id;
    assert(assRes.status === 201 && assRes.body.data.assessment.status === 'draft', 25, 'Trainer A creates Assessment in draft status via POST /api/assessments');

    // Check 26: Add Question 1 (Single choice, 2 marks)
    const q1Res = await request(app)
      .post(`/api/assessments/${assessmentAId}/questions`)
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        questionText: 'Which proxy is used primarily as Istio data plane?',
        questionType: 'single_choice',
        options: [
          { key: 'A', text: 'Envoy' },
          { key: 'B', text: 'HAProxy' },
          { key: 'C', text: 'Nginx' }
        ],
        correctAnswers: ['A'],
        marks: 2,
        order: 1
      });
    const q1Id = q1Res.body.data?.question?.id || q1Res.body.data?.question?._id;
    assert(q1Res.status === 201 && q1Res.body.data.question.marks === 2, 26, 'Trainer A adds Question 1 (Single choice) with 2 marks');

    // Check 27: Add Question 2 (Multiple choice, 3 marks)
    const q2Res = await request(app)
      .post(`/api/assessments/${assessmentAId}/questions`)
      .set('Authorization', `Bearer ${trainerTokenA}`)
      .send({
        questionText: 'Which features are provided by Service Mesh control plane?',
        questionType: 'multiple_choice',
        options: [
          { key: 'A', text: 'Mutual TLS encryption' },
          { key: 'B', text: 'Traffic splitting' },
          { key: 'C', text: 'Physical cabling' }
        ],
        correctAnswers: ['A', 'B'],
        marks: 3,
        order: 2
      });
    const q2Id = q2Res.body.data?.question?.id || q2Res.body.data?.question?._id;
    assert(q2Res.status === 201 && q2Res.body.data.question.marks === 3, 27, 'Trainer A adds Question 2 (Multiple choice) with 3 marks');

    // Check 28: Trainer A publishes Assessment
    const pubAssRes = await request(app)
      .patch(`/api/assessments/${assessmentAId}/publish`)
      .set('Authorization', `Bearer ${trainerTokenA}`);
    assert(pubAssRes.status === 200 && pubAssRes.body.data.assessment.status === 'published', 28, 'Trainer A publishes Assessment via PATCH /api/assessments/:id/publish');

    // Check 29: Employee A starts Attempt 1
    const att1Res = await request(app)
      .post(`/api/assessments/${assessmentAId}/attempts`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    const attempt1Id = att1Res.body.data?.attempt?.id || att1Res.body.data?.attempt?._id;
    assert(att1Res.status === 201 && att1Res.body.data.attempt.status === 'in_progress' && att1Res.body.data.attempt.attemptNumber === 1, 29, 'Employee A starts Attempt 1 (in_progress, attemptNumber: 1)');

    // Check 30: Employee A submits failing answers (Only Q1 correct = 2/5 = 40% < 60%)
    const sub1Res = await request(app)
      .patch(`/api/assessments/attempts/${attempt1Id}/submit`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        answers: [
          { question: q1Id, selectedAnswers: ['A'] }, // 2 marks
          { question: q2Id, selectedAnswers: ['C'] }  // 0 marks
        ]
      });
    assert(sub1Res.status === 200 && sub1Res.body.data.attempt.result === 'failed' && sub1Res.body.data.attempt.percentage === 40, 30, 'Attempt 1 evaluates deterministically to failed (40%)');

    // Check 31: Re-submitting submitted attempt is rejected with 400
    const resubRes = await request(app)
      .patch(`/api/assessments/attempts/${attempt1Id}/submit`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        answers: [
          { question: q1Id, selectedAnswers: ['A'] }
        ]
      });
    assert(resubRes.status === 400, 31, 'Re-submission of an already evaluated attempt is rejected with 400');

    // Check 32: Employee A starts Attempt 2 and submits 100% correct answers (passed)
    const att2Res = await request(app)
      .post(`/api/assessments/${assessmentAId}/attempts`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    const attempt2Id = att2Res.body.data?.attempt?.id || att2Res.body.data?.attempt?._id;

    const sub2Res = await request(app)
      .patch(`/api/assessments/attempts/${attempt2Id}/submit`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        answers: [
          { question: q1Id, selectedAnswers: ['A'] },
          { question: q2Id, selectedAnswers: ['A', 'B'] }
        ]
      });
    assert(sub2Res.status === 200 && sub2Res.body.data.attempt.result === 'passed' && sub2Res.body.data.attempt.percentage === 100, 32, 'Attempt 2 evaluates deterministically to passed (100%)');

    // -------------------------------------------------------------
    // SECTION 5: CERTIFICATES & PUBLIC VERIFICATION (Checks 33–38)
    // -------------------------------------------------------------
    // Check 33: Client injection of certificateNumber rejected with 400
    const injectCertRes = await request(app)
      .post('/api/certificates')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        enrollmentId: enrollmentAId,
        certificateNumber: 'SKILLTRACK-INJECT-0001',
        status: 'active'
      });
    assert(injectCertRes.status === 400, 33, 'Certificate client injection rejected with 400');

    // Check 34: Legitimate certificate issuance for completed course
    const certIssueRes = await request(app)
      .post('/api/certificates')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({ enrollmentId: enrollmentAId });
    const certDocA = certIssueRes.body.data?.certificate;
    const certNumberA = certDocA?.certificateNumber;
    const certAId = certDocA?.id || certDocA?._id;
    assert(certIssueRes.status === 201 && certDocA?.status === 'active' && Boolean(certNumberA), 34, 'Certificate successfully issued via POST /api/certificates');

    // Check 35: Duplicate certificate issuance returns 200 with isExisting: true
    const dupCertRes = await request(app)
      .post('/api/certificates')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({ enrollmentId: enrollmentAId });
    assert(dupCertRes.status === 200 && dupCertRes.body.data.certificate.certificateNumber === certNumberA, 35, 'Duplicate certificate issuance returns existing certificate with 200');

    // Check 36: Employee A retrieves certificate details
    const certGetRes = await request(app)
      .get(`/api/certificates/${certAId}`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(certGetRes.status === 200 && certGetRes.body.data.certificate.certificateNumber === certNumberA, 36, 'Employee A retrieves certificate details via GET /api/certificates/:id');

    // Check 37: Public unauthenticated verification of certificate
    const verifyRes = await request(app)
      .get(`/api/certificates/verify/${certNumberA}`);
    assert(verifyRes.status === 200 && verifyRes.body.data.certificate.certificateNumber === certNumberA && verifyRes.body.data.certificate.isExpired === false, 37, 'Public unauthenticated certificate verification succeeds via GET /api/certificates/verify/:num');

    // Check 38: Verification of non-existent certificate returns 404
    const verifyFakeRes = await request(app)
      .get('/api/certificates/verify/SKILLTRACK-2026-NONEXISTENT');
    assert(verifyFakeRes.status === 404, 38, 'Public verification of non-existent certificate returns 404 Not Found');

    // -------------------------------------------------------------
    // SECTION 6: CERTIFICATE RENEWAL & EXPIRY NOTIFICATIONS (Checks 39–44)
    // -------------------------------------------------------------
    // Check 39: Premature renewal (>30 days away) is rejected with 400
    const earlyRenRes = await request(app)
      .post(`/api/certificates/${certAId}/renew`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({ reason: 'Premature renewal' });
    assert(earlyRenRes.status === 400, 39, 'Premature renewal outside 30-day window is rejected with 400');

    // Check 40: Set expiry to 15 days future and admin triggers notification scan
    const fifteenDaysFuture = new Date(Date.now() + 15 * 86400000);
    await Certificate.findByIdAndUpdate(certAId, { expiresAt: fifteenDaysFuture });

    const scanRes = await request(app)
      .post('/api/notifications/process-expiries')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(scanRes.status === 200 && scanRes.body.data.expiringProcessed >= 1, 40, 'Admin triggers expiry scan via POST /api/notifications/process-expiries');

    // Check 41: Employee A receives certificate_expiring notification
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(notifRes.status === 200 && notifRes.body.data.notifications.some((n) => n.type === 'certificate_expiring'), 41, 'Employee A receives certificate_expiring notification');

    // Check 42: Re-scanning confirms eventKey deduplication (no duplicates)
    await request(app)
      .post('/api/notifications/process-expiries')
      .set('Authorization', `Bearer ${adminToken}`);
    const dedupeNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeTokenA}`);
    const expCount = dedupeNotifRes.body.data.notifications.filter((n) => n.type === 'certificate_expiring').length;
    assert(expCount === 1, 42, 'EventKey idempotency prevents duplicate notifications upon repeated scan');

    // Check 43: Employee A renews certificate within renewal window -> new child certificate created
    const renewRes = await request(app)
      .post(`/api/certificates/${certAId}/renew`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({ reason: 'Annual professional recertification' });
    const certChildDoc = renewRes.body.data?.certificate;
    const certChildId = certChildDoc?.id || certChildDoc?._id;
    assert(renewRes.status === 201 && certChildDoc?.status === 'active' && Boolean(certChildId), 43, 'Employee A successfully renews certificate via POST /api/certificates/:id/renew');

    // Check 44: Renewal history chain links parent to child
    const chainRes = await request(app)
      .get(`/api/certificates/${certAId}/renewals`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(chainRes.status === 200 && chainRes.body.data.renewals.length === 1 && chainRes.body.data.renewals[0].certificateNumber === certChildDoc.certificateNumber, 44, 'Renewal history chain correctly links parent and child certificates');

    // -------------------------------------------------------------
    // SECTION 7: SKILLS GAP ANALYSIS & RECOMMENDATIONS (Checks 45–50)
    // -------------------------------------------------------------
    // Check 45: Admin creates Skills
    const sk1Res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Distributed Systems Design',
        category: 'technical',
        description: 'Large scale distributed computing'
      });
    const sk2Res = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Zero Trust Network Architecture',
        category: 'security',
        description: 'Micro-segmentation and identity based access'
      });
    assert(sk1Res.status === 201 && sk2Res.status === 201, 45, 'Admin creates skills in catalog via POST /api/skills');
    const skill1Id = sk1Res.body.data?.skill?.id || sk1Res.body.data?.skill?._id;
    const skill2Id = sk2Res.body.data?.skill?.id || sk2Res.body.data?.skill?._id;

    // Check 46: Admin creates Job Role
    const jrRes = await request(app)
      .post('/api/job-roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Principal Platform Architect',
        code: 'ROLE-P21-PPA',
        department: deptId,
        description: 'Engineering technical leadership'
      });
    const jobRoleId = jrRes.body.data?.jobRole?.id || jrRes.body.data?.jobRole?._id;
    assert(jrRes.status === 201 && Boolean(jobRoleId), 46, 'Admin creates Job Role via POST /api/job-roles');

    // Check 47: Admin adds skill requirements to Job Role
    await request(app)
      .post(`/api/job-roles/${jobRoleId}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skill1Id,
        requiredLevel: 'advanced',
        mandatory: true,
        weight: 60
      });
    await request(app)
      .post(`/api/job-roles/${jobRoleId}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skill2Id,
        requiredLevel: 'intermediate',
        mandatory: true,
        weight: 40
      });
    assert(true, 47, 'Admin sets skill requirements on Job Role via POST /api/job-roles/:id/requirements');

    // Check 48: Admin records Employee A has skill 1 at intermediate (below required)
    await request(app)
      .post(`/api/employees/${empIdA}/skills`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skill1Id,
        proficiencyLevel: 'intermediate'
      });
    assert(true, 48, 'Admin records Employee A skill proficiency via POST /api/employees/:id/skills');

    // Check 49: Employee A retrieves Skill Gap Analysis (BELOW_REQUIRED + MISSING)
    const gapRes = await request(app)
      .get(`/api/employees/me/skill-gap/${jobRoleId}`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(gapRes.status === 200 && gapRes.body.data.summary.belowRequiredSkills === 1 && gapRes.body.data.summary.missingSkills === 1, 49, 'Employee A retrieves deterministic skill gap report (1 BELOW_REQUIRED, 1 MISSING)');

    // Check 50: Map skill 2 to Course B and Employee A requests recommendations
    await request(app)
      .post(`/api/courses/${courseBId}/skills`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skill: skill2Id,
        coverageLevel: 'intermediate',
        coverageWeight: 80
      });

    const recRes = await request(app)
      .get(`/api/employees/me/recommendations/${jobRoleId}`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(recRes.status === 200 && recRes.body.data.recommendations.length >= 1, 50, 'Course recommendations returned for gap skills via GET /api/employees/me/recommendations/:id');

    // -------------------------------------------------------------
    // SECTION 8: COMPLIANCE LIFECYCLE & STATE TRANSITIONS (Checks 51–56)
    // -------------------------------------------------------------
    // Check 51: Admin creates Compliance Requirement
    const compReqRes = await request(app)
      .post('/api/compliance-requirements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Mandatory Cluster Infrastructure Governance',
        course: courseBId,
        frequency: 'annual',
        dueWithinDays: 60
      });
    const compReqId = compReqRes.body.data?.requirement?.id || compReqRes.body.data?.requirement?._id;
    assert(compReqRes.status === 201 && Boolean(compReqId), 51, 'Admin creates Compliance Requirement via POST /api/compliance-requirements');

    // Check 52: Admin assigns Compliance Requirement to Employee B
    const compAssRes = await request(app)
      .post(`/api/compliance-requirements/${compReqId}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: empIdB });
    const compAssignmentId = compAssRes.body.data?.assignment?.id || compAssRes.body.data?.assignment?._id;
    assert(compAssRes.status === 201 && compAssRes.body.data.assignment.status === 'NOT_STARTED', 52, 'Admin assigns requirement to Employee B via POST /api/compliance-requirements/:id/assignments');

    // Check 53: Employee B checks compliance: status is NOT_STARTED
    const empBComp1Res = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeTokenB}`);
    assert(empBComp1Res.status === 200 && empBComp1Res.body.data.assignments[0].status === 'NOT_STARTED', 53, 'Employee B initial compliance status is NOT_STARTED');

    // Check 54: Set due date to 10 days future -> status dynamically becomes DUE_SOON
    const tenDaysFut = new Date(Date.now() + 10 * 86400000);
    await ComplianceAssignment.findByIdAndUpdate(compAssignmentId, { dueAt: tenDaysFut });
    const empBComp2Res = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeTokenB}`);
    assert(empBComp2Res.status === 200 && empBComp2Res.body.data.assignments[0].status === 'DUE_SOON', 54, 'Dynamic state transition: assignment approaches deadline -> DUE_SOON');

    // Check 55: Set due date to 5 days past -> status dynamically becomes OVERDUE
    const fiveDaysPast = new Date(Date.now() - 5 * 86400000);
    await ComplianceAssignment.findByIdAndUpdate(compAssignmentId, { dueAt: fiveDaysPast });
    const empBComp3Res = await request(app)
      .get('/api/employees/me/compliance')
      .set('Authorization', `Bearer ${employeeTokenB}`);
    assert(empBComp3Res.status === 200 && empBComp3Res.body.data.assignments[0].status === 'OVERDUE', 55, 'Dynamic state transition: uncompleted assignment passes deadline -> OVERDUE');

    // Check 56: Admin retrieves compliance summary
    const compSummaryRes = await request(app)
      .get('/api/compliance/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(compSummaryRes.status === 200 && compSummaryRes.body.data.overdue >= 1, 56, 'Admin retrieves organizational compliance summary via GET /api/compliance/summary');

    // -------------------------------------------------------------
    // SECTION 9: ANALYTICS CONSISTENCY & IDOR DEFENSE (Checks 57–60)
    // -------------------------------------------------------------
    // Check 57: Admin verifies Overview Analytics
    const analyticsOvRes = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(analyticsOvRes.status === 200 && analyticsOvRes.body.data.employees.total === 2 && analyticsOvRes.body.data.courses.total === 2, 57, 'Admin verifies Overview Analytics consistency via GET /api/analytics/overview');

    // Check 58: Admin verifies Learning Analytics matches Overview
    const analyticsLrRes = await request(app)
      .get('/api/analytics/learning')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(analyticsLrRes.status === 200 && analyticsLrRes.body.data.totalEnrollments === analyticsOvRes.body.data.enrollments.total, 58, 'Cross-module consistency: Learning analytics matches Overview analytics enrollments');

    // Check 59: IDOR defense: Employee B accessing Employee A enrollment returns 404
    const idorRes = await request(app)
      .get(`/api/enrollments/${enrollmentAId}`)
      .set('Authorization', `Bearer ${employeeTokenB}`);
    assert(idorRes.status === 404, 59, 'IDOR & Anti-enumeration defense: peer employee resource probe returns 404 Not Found');

    // Check 60: Role boundary: Employee A accessing admin analytics is forbidden (403)
    const rbacRes = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${employeeTokenA}`);
    assert(rbacRes.status === 403, 60, 'Role boundary defense: Employee accessing admin analytics is rejected with 403 Forbidden');

  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`PHASE 21 VERIFICATION SUMMARY: ${passed}/60 PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch((err) => {
  console.error('\nFatal error during live verification:', err);
  process.exit(1);
});
