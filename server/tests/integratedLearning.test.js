const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const Assessment = require('../src/models/Assessment');
const Question = require('../src/models/Question');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');

const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Department = require('../src/models/Department');
const Enrollment = require('../src/models/Enrollment');
const AssessmentAttempt = require('../src/models/AssessmentAttempt');

const EXPECTED_MAPPINGS = [
  { courseTitle: 'Java Programming Fundamentals', assessmentTitle: 'Java Fundamentals' },
  { courseTitle: 'Object-Oriented Programming', assessmentTitle: 'Object-Oriented Programming' },
  { courseTitle: 'Data Structures and Algorithms', assessmentTitle: 'Data Structures and Algorithms' },
  { courseTitle: 'HTML and CSS Web Development', assessmentTitle: 'HTML and CSS' },
  { courseTitle: 'JavaScript Fundamentals', assessmentTitle: 'JavaScript' },
  { courseTitle: 'React.js Development', assessmentTitle: 'React.js' },
  { courseTitle: 'Node.js and Express.js', assessmentTitle: 'Node.js and Express.js' },
  { courseTitle: 'SQL and Database Management', assessmentTitle: 'SQL and Database Management' },
  { courseTitle: 'MongoDB and MERN Stack', assessmentTitle: 'MongoDB and MERN Stack' },
  { courseTitle: 'Software Engineering and Computer Networks', assessmentTitle: 'Software Engineering and Computer Networks' }
];

describe('Integrated Learning & 10 Matching Assessments Verification', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skilltrack');
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('All 10 mandated technical courses exist and are published', async () => {
    for (const mapping of EXPECTED_MAPPINGS) {
      const course = await Course.findOne({ title: mapping.courseTitle });
      expect(course).not.toBeNull();
      expect(course.status).toBe('published');
      expect(course.isActive).toBe(true);
      expect(course.description.length).toBeGreaterThanOrEqual(20);
      expect(typeof course.duration).toBe('number');
      expect(course.duration).toBeGreaterThanOrEqual(1);

      // Check modules and lessons
      const modules = await Module.find({ course: course._id }).sort({ order: 1 });
      expect(modules.length).toBeGreaterThanOrEqual(2);

      let totalLessons = 0;
      for (const mod of modules) {
        const lessons = await Lesson.find({ module: mod._id });
        expect(lessons.length).toBeGreaterThanOrEqual(1);
        totalLessons += lessons.length;

        for (const les of lessons) {
          expect(les.content).toBeDefined();
          expect(les.content.length).toBeGreaterThanOrEqual(50);
        }
      }
      expect(totalLessons).toBeGreaterThanOrEqual(4);
    }
  });

  test('All 10 matching assessments exist and are mapped 1-to-1 to their courses', async () => {
    for (const mapping of EXPECTED_MAPPINGS) {
      const course = await Course.findOne({ title: mapping.courseTitle });
      expect(course).not.toBeNull();

      const assessment = await Assessment.findOne({ course: course._id });
      expect(assessment).not.toBeNull();
      expect(assessment.title).toBe(mapping.assessmentTitle);
      expect(assessment.status).toBe('published');
      expect(assessment.isActive).toBe(true);
      expect(assessment.timeLimitMinutes).toBe(30);
      expect(assessment.passingPercentage).toBe(70);

      // Check questions
      const questions = await Question.find({ assessment: assessment._id }).sort({ order: 1 });
      expect(questions.length).toBe(10);

      let totalMarks = 0;
      questions.forEach((q, index) => {
        expect(q.order).toBe(index + 1);
        expect(q.questionType).toBe('single_choice');
        expect(q.options.length).toBe(4);
        expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D']);
        expect(q.correctAnswers.length).toBe(1);
        expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswers[0]);
        expect(q.marks).toBe(2);
        totalMarks += q.marks;
      });

      expect(totalMarks).toBe(20);
    }
  });

  describe('Prerequisite Engine & Assessment Gating', () => {
    let testUser;
    let testEmployee;
    let testToken;
    let javaCourse;
    let javaAssessment;
    let javaModules;
    let javaLessons;
    let testEnrollment;

    beforeAll(async () => {
      // Find Java course and assessment
      javaCourse = await Course.findOne({ title: 'Java Programming Fundamentals' });
      javaAssessment = await Assessment.findOne({ course: javaCourse._id });
      javaModules = await Module.find({ course: javaCourse._id });
      javaLessons = await Lesson.find({ module: { $in: javaModules.map((m) => m._id) } });

      let department = await Department.findOne({ isActive: true });
      if (!department) {
        department = await Department.create({ name: 'Engineering', code: 'ENG' });
      }

      // Create test employee
      testUser = await User.create({
        name: 'Prereq Tester',
        email: `prereq-${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'employee',
        isActive: true
      });

      testEmployee = await Employee.create({
        user: testUser._id,
        employeeId: `EMP-PREREQ-${Date.now()}`,
        department: department._id,
        designation: 'Software Engineer',
        isActive: true
      });

      testToken = jwt.sign(
        { id: testUser._id.toString(), userId: testUser._id.toString(), email: testUser.email, role: 'employee' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
    });

    afterAll(async () => {
      if (testUser) await User.findByIdAndDelete(testUser._id);
      if (testEmployee) await Employee.findByIdAndDelete(testEmployee._id);
      if (testEnrollment) await Enrollment.findByIdAndDelete(testEnrollment._id);
      await AssessmentAttempt.deleteMany({ employee: testEmployee?._id });
    });

    test('All 10 assessments have requiresCourseCompletion enabled', async () => {
      for (const mapping of EXPECTED_MAPPINGS) {
        const assessment = await Assessment.findOne({ title: mapping.assessmentTitle });
        expect(assessment).not.toBeNull();
        expect(assessment.requiresCourseCompletion).toBe(true);
      }
    });

    test('Unenrolled employee cannot access assessment attempts or attempt data', async () => {
      // Unenrolled -> 403 Forbidden
      const attemptRes = await request(app)
        .post(`/api/assessments/${javaAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(attemptRes.body.message).toMatch(/active enrollment/i);

      const statusRes = await request(app)
        .get(`/api/assessments/course/${javaCourse._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(statusRes.body.data.isEnrolled).toBe(false);
      expect(statusRes.body.data.isUnlocked).toBe(false);
      expect(statusRes.body.data.lockReason).toMatch(/enroll in the course/i);
    });

    test('Enrolled employee with < 100% lesson progress is locked from taking assessment', async () => {
      // Create active enrollment with 0% progress
      testEnrollment = await Enrollment.create({
        employee: testEmployee._id,
        course: javaCourse._id,
        status: 'enrolled',
        progressPercentage: 0,
        completedLessons: [],
        isActive: true
      });

      // Attempt start -> 403 Forbidden
      const attemptRes = await request(app)
        .post(`/api/assessments/${javaAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(attemptRes.body.message).toMatch(/must complete all course lessons/i);

      // Attempt data -> 403 Forbidden
      const dataRes = await request(app)
        .get(`/api/assessments/${javaAssessment._id}/attempt-data`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(dataRes.body.message).toMatch(/must complete all course lessons/i);

      // Course assessment status -> isUnlocked: false
      const statusRes = await request(app)
        .get(`/api/assessments/course/${javaCourse._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(statusRes.body.data.isEnrolled).toBe(true);
      expect(statusRes.body.data.isCourseCompleted).toBe(false);
      expect(statusRes.body.data.isUnlocked).toBe(false);
      expect(statusRes.body.data.lockReason).toMatch(/complete all course lessons/i);
    });

    test('Employee with 100% course completion successfully unlocks assessment', async () => {
      // Complete all lessons for the course
      testEnrollment.completedLessons = javaLessons.map((l) => l._id);
      testEnrollment.progressPercentage = 100;
      testEnrollment.status = 'completed';
      testEnrollment.completedAt = new Date();
      await testEnrollment.save();

      // Course assessment status -> isUnlocked: true
      const statusRes = await request(app)
        .get(`/api/assessments/course/${javaCourse._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(statusRes.body.data.isEnrolled).toBe(true);
      expect(statusRes.body.data.isCourseCompleted).toBe(true);
      expect(statusRes.body.data.isUnlocked).toBe(true);
      expect(statusRes.body.data.lockReason).toBeNull();

      // Attempt data -> 200 OK
      const dataRes = await request(app)
        .get(`/api/assessments/${javaAssessment._id}/attempt-data`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(dataRes.body.data.questions.length).toBe(10);

      // Start attempt -> 201 Created
      const startRes = await request(app)
        .post(`/api/assessments/${javaAssessment._id}/attempts`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(201);

      expect(startRes.body.data.attempt.attemptNumber).toBe(1);
      expect(startRes.body.data.attempt.status).toBe('in_progress');
    });

    test('GET /api/assessments returns published assessments enriched with learnerStatus', async () => {
      const res = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data.assessments)).toBe(true);
      expect(res.body.data.assessments.length).toBeGreaterThanOrEqual(10);

      // Check that learnerStatus is attached
      const javaAsm = res.body.data.assessments.find((a) => a.title === 'Java Fundamentals');
      expect(javaAsm).toBeDefined();
      expect(javaAsm.learnerStatus).toBeDefined();
      expect(javaAsm.learnerStatus.isEnrolled).toBe(true);
      expect(javaAsm.learnerStatus.isCourseCompleted).toBe(true);
      expect(javaAsm.learnerStatus.isUnlocked).toBe(true);
      expect(javaAsm.learnerStatus.statusBadge).toBe('In Progress'); // because we have an active attempt
    });

    test('startAttempt sets server-side expiresAt based on 30 minute duration', async () => {
      // Find the in-progress attempt created earlier
      const attempt = await AssessmentAttempt.findOne({
        employee: testEmployee._id,
        assessment: javaAssessment._id,
        status: 'in_progress'
      });

      expect(attempt).not.toBeNull();
      expect(attempt.expiresAt).toBeDefined();

      const diffMinutes = Math.round((new Date(attempt.expiresAt) - new Date(attempt.startedAt)) / 60000);
      expect(diffMinutes).toBe(30);
    });

    test('saveDraftAnswers persists in-progress draft answers to MongoDB', async () => {
      const attempt = await AssessmentAttempt.findOne({
        employee: testEmployee._id,
        assessment: javaAssessment._id,
        status: 'in_progress'
      });

      const questions = await Question.find({ assessment: javaAssessment._id }).sort({ order: 1 });
      const q1 = questions[0];
      const q2 = questions[1];

      // Save draft answer for Q1 and Q2
      const draftRes = await request(app)
        .patch(`/api/assessments/attempts/${attempt._id}/answers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            { question: q1._id.toString(), selectedAnswers: ['B'] },
            { question: q2._id.toString(), selectedAnswers: ['C'] }
          ]
        })
        .expect(200);

      expect(draftRes.body.data.attempt.answers.length).toBe(2);

      // Verify in DB directly
      const updatedInDb = await AssessmentAttempt.findById(attempt._id);
      expect(updatedInDb.answers.length).toBe(2);
      expect(updatedInDb.answers[0].selectedAnswers).toEqual(['B']);
      expect(updatedInDb.answers[1].selectedAnswers).toEqual(['C']);
      expect(updatedInDb.status).toBe('in_progress');
    });

    test('submitAttempt validates, evaluates score out of 20, and marks status as submitted', async () => {
      const attempt = await AssessmentAttempt.findOne({
        employee: testEmployee._id,
        assessment: javaAssessment._id,
        status: 'in_progress'
      });

      const questions = await Question.find({ assessment: javaAssessment._id }).sort({ order: 1 });

      // Provide correct answers for all 10 questions to achieve 100% (20/20 marks)
      const allAnswers = questions.map((q) => ({
        question: q._id.toString(),
        selectedAnswers: q.correctAnswers
      }));

      const submitRes = await request(app)
        .patch(`/api/assessments/attempts/${attempt._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ answers: allAnswers })
        .expect(200);

      const evaluated = submitRes.body.data.attempt;
      expect(evaluated.status).toBe('submitted');
      expect(evaluated.obtainedMarks).toBe(20);
      expect(evaluated.totalMarks).toBe(20);
      expect(evaluated.percentage).toBe(100);
      expect(evaluated.result).toBe('passed');
      expect(evaluated.submittedAt).toBeDefined();
      expect(evaluated.evaluatedAt).toBeDefined();
    });
    test('Passing evaluation automatically issues certificate, sends notification, and enables public verification', async () => {
      const Certificate = require('../src/models/Certificate');
      const Notification = require('../src/models/Notification');

      // 1. Verify Certificate record created in MongoDB
      const cert = await Certificate.findOne({
        employee: testEmployee._id,
        course: javaCourse._id,
        status: 'active'
      });
      expect(cert).not.toBeNull();
      expect(cert.certificateNumber).toMatch(/^SKILLTRACK-\d{4}-[A-F0-9]+$/);
      expect(cert.status).toBe('active');
      expect(cert.issuedAt).toBeInstanceOf(Date);
      expect(cert.expiresAt).toBeInstanceOf(Date);

      // 2. Verify in-app Notification generated for the employee
      const notif = await Notification.findOne({
        recipient: testUser._id,
        type: 'certificate_issued',
        relatedCertificate: cert._id
      });
      expect(notif).not.toBeNull();
      expect(notif.title).toContain('Certificate Earned');
      expect(notif.message).toContain(cert.certificateNumber);

      // 3. Verify public certificate verification endpoint (NO authentication required)
      const verifyRes = await request(app)
        .get(`/api/certificates/verify/${cert.certificateNumber}`)
        .expect(200);

      const verified = verifyRes.body.data.certificate;
      expect(verified.certificateNumber).toBe(cert.certificateNumber);
      expect(verified.status).toBe('active');
      expect(verified.lifecycleStatus).toBe('active');
      expect(verified.courseTitle).toBe('Java Programming Fundamentals');
      expect(verified.employeeName).toBe(testUser.name);
      expect(verified.isExpired).toBe(false);
    });
    test('Obsolete demo assessments (Test, Test1) and courses are completely removed from all endpoints', async () => {
      const obsoleteAsm = await Assessment.find({ title: { $in: ['Test', 'Test1'] } });
      expect(obsoleteAsm.length).toBe(0);

      const obsoleteCourses = await Course.find({ title: { $in: ['Excel for Better Decisions', 'Coaching for Performance'] } });
      expect(obsoleteCourses.length).toBe(0);

      const empRes = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const empAsms = empRes.body.data.assessments || empRes.body.data;
      const empTitles = empAsms.map((a) => a.title);
      expect(empTitles).not.toContain('Test');
      expect(empTitles).not.toContain('Test1');
      expect(empAsms.length).toBe(10);
    });
  });
});
