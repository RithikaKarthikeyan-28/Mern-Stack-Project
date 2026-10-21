const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Question = require('../models/Question');
const Employee = require('../models/Employee');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateObjectId
} = require('../validators/assessment.validator');

const POPULATE_OPTIONS = [
  {
    path: 'course',
    select: 'title category level duration status isActive trainer',
    populate: { path: 'trainer', select: 'name email role isActive' }
  },
  {
    path: 'module',
    select: 'title description order isActive'
  },
  {
    path: 'trainer',
    select: 'name email role isActive'
  }
];

/**
 * Creates a new Assessment.
 *
 * @param {object} data - Assessment creation payload
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Created populated assessment document
 */
async function createAssessment(data, currentUser) {
  const isTrainer = currentUser.role === 'trainer';
  validateCreateAssessment(data, isTrainer);

  // 1. Verify parent course exists and is active
  const course = await Course.findById(data.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (!course.isActive) {
    throw new AppError('Cannot create assessment for an inactive course', 400);
  }

  // 2. Enforce trainer ownership
  let assignedTrainerId;
  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (isTrainer) {
    const courseTrainerId = (course.trainer._id || course.trainer).toString();
    if (courseTrainerId !== currentUserId) {
      throw new AppError('Access denied. You can only create assessments for your own courses.', 403);
    }
    assignedTrainerId = currentUserId;
  } else if (currentUser.role === 'admin') {
    if (data.trainer) {
      const trainerUser = await User.findById(data.trainer);
      if (!trainerUser || trainerUser.role !== 'trainer') {
        throw new AppError('Invalid trainer specified for assessment', 400);
      }
      if (!trainerUser.isActive) {
        throw new AppError('Cannot assign assessment to an inactive trainer', 400);
      }
      assignedTrainerId = trainerUser._id;
    } else {
      assignedTrainerId = course.trainer;
    }
  }

  // 3. Verify module if provided
  if (data.module) {
    const moduleDoc = await Module.findById(data.module);
    if (!moduleDoc) {
      throw new AppError('Module not found', 404);
    }
    if (!moduleDoc.isActive) {
      throw new AppError('Cannot link assessment to an inactive module', 400);
    }
    if (moduleDoc.course.toString() !== course._id.toString()) {
      throw new AppError('Module does not belong to the specified course', 400);
    }
  }

  // 4. Create assessment document
  const assessment = await Assessment.create({
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    course: course._id,
    module: data.module || null,
    trainer: assignedTrainerId,
    status: data.status || 'draft',
    passingPercentage: data.passingPercentage !== undefined ? data.passingPercentage : 60,
    timeLimitMinutes: data.timeLimitMinutes || null,
    maxAttempts: data.maxAttempts || null,
    isActive: true
  });

  return await Assessment.findById(assessment._id).populate(POPULATE_OPTIONS);
}

/**
 * Retrieves assessments with role-based filtering and scoping.
 *
 * @param {object} filters - Query filters
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<Array>} List of populated assessment documents
 */
async function getAssessments(filters = {}, currentUser) {
  const query = {};
  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'trainer') {
    // Scoped to courses owned by this trainer or authored directly by this trainer
    const trainerCourses = await Course.find({ trainer: currentUserId }).select('_id');
    const trainerCourseIds = trainerCourses.map((c) => c._id.toString());

    if (filters.course) {
      validateObjectId(filters.course, 'Course ID');
      if (!trainerCourseIds.includes(filters.course.toString())) {
        return [];
      }
      query.course = filters.course;
    } else {
      query.$or = [
        { trainer: currentUserId },
        { course: { $in: trainerCourses.map((c) => c._id) } }
      ];
    }
  } else if (currentUser.role === 'admin') {
    if (filters.course) {
      validateObjectId(filters.course, 'Course ID');
      query.course = filters.course;
    }
    if (filters.trainer) {
      validateObjectId(filters.trainer, 'Trainer ID');
      query.trainer = filters.trainer;
    }
  } else if (currentUser.role === 'employee') {
    // Employees only see published assessments for published courses
    query.isActive = true;
    query.status = 'published';
    const publishedCourses = await Course.find({ isActive: true, status: 'published' }).select('_id');
    query.course = { $in: publishedCourses.map((c) => c._id) };
  }

  if (filters.module) {
    validateObjectId(filters.module, 'Module ID');
    query.module = filters.module;
  }

  if (filters.status && currentUser.role !== 'employee') {
    query.status = filters.status;
  }

  if (filters.isActive !== undefined && currentUser.role !== 'employee') {
    query.isActive = filters.isActive === 'true' || filters.isActive === true;
  }

  // Guard against obsolete demo assessments
  if (!query.title) {
    query.title = { $nin: ['Test', 'Test1'] };
  }

  const assessments = await Assessment.find(query)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });

  if (currentUser.role === 'employee') {
    const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
    const employee = await Employee.findOne({ user: currentUserId });
    if (!employee) {
      return assessments;
    }

    // Fetch employee's enrollments, attempts, and certificates in parallel
    const [enrollments, attempts, certificates] = await Promise.all([
      Enrollment.find({
        employee: employee._id,
        isActive: true,
        status: { $ne: 'dropped' }
      }),
      AssessmentAttempt.find({ employee: employee._id }).sort({ createdAt: -1 }),
      Certificate.find({ employee: employee._id, status: 'active' })
    ]);

    const enrollmentMap = new Map();
    enrollments.forEach((e) => {
      enrollmentMap.set(e.course.toString(), e);
    });

    const attemptsMap = new Map();
    attempts.forEach((a) => {
      const asmId = a.assessment.toString();
      if (!attemptsMap.has(asmId)) {
        attemptsMap.set(asmId, []);
      }
      attemptsMap.get(asmId).push(a);
    });

    const certificateMap = new Map();
    certificates.forEach((c) => {
      certificateMap.set(c.course.toString(), c);
    });

    // Check active lessons for each course
    const courseIds = assessments
      .map((a) => (a.course?._id ? a.course._id : a.course))
      .filter(Boolean);
    const activeModules = await Module.find({ course: { $in: courseIds }, isActive: true }).select('_id course');
    const activeLessons = await Lesson.find({
      module: { $in: activeModules.map((m) => m._id) },
      isActive: true
    }).select('_id module');

    const moduleToCourse = new Map();
    activeModules.forEach((m) => moduleToCourse.set(m._id.toString(), m.course.toString()));

    const courseActiveLessonsCount = new Map();
    activeLessons.forEach((l) => {
      const cId = moduleToCourse.get(l.module.toString());
      if (cId) {
        courseActiveLessonsCount.set(cId, (courseActiveLessonsCount.get(cId) || 0) + 1);
      }
    });

    return assessments.map((asm) => {
      const asmObj = asm.toObject ? asm.toObject() : { ...asm };
      const courseIdStr = (asm.course?._id || asm.course)?.toString();
      const enrollment = courseIdStr ? enrollmentMap.get(courseIdStr) : null;
      const isEnrolled = !!enrollment;
      const progress = enrollment?.progressPercentage || 0;
      const totalLessons = courseIdStr ? (courseActiveLessonsCount.get(courseIdStr) || 0) : 0;
      const isCourseCompleted = isEnrolled && (enrollment.status === 'completed' || progress === 100);

      let isUnlocked = false;
      let lockReason = null;
      if (!isEnrolled) {
        isUnlocked = false;
        lockReason = 'Enroll in the course to unlock the assessment.';
      } else if (asm.requiresCourseCompletion && totalLessons > 0 && !isCourseCompleted) {
        isUnlocked = false;
        lockReason = 'Complete all course lessons to unlock the assessment.';
      } else {
        isUnlocked = true;
      }

      const asmVAttempts = attemptsMap.get(asm._id.toString()) || [];
      const hasPassed = asmVAttempts.some((a) => a.result === 'passed');
      const latestAttempt = asmVAttempts.length > 0 ? asmVAttempts[0] : null;
      const activeAttempt = asmVAttempts.find((a) => a.status === 'in_progress') || null;
      const cert = courseIdStr ? certificateMap.get(courseIdStr) : null;

      let statusBadge = 'Not Started';
      if (hasPassed) {
        statusBadge = 'Passed';
      } else if (activeAttempt) {
        statusBadge = 'In Progress';
      } else if (latestAttempt && latestAttempt.result === 'failed') {
        statusBadge = isUnlocked ? 'Failed' : 'Not Started';
      } else if (isUnlocked) {
        statusBadge = 'Assessment Available';
      } else if (isEnrolled) {
        statusBadge = 'In Progress';
      } else {
        statusBadge = 'Not Started';
      }

      asmObj.learnerStatus = {
        isEnrolled,
        isCourseCompleted,
        courseProgress: progress,
        isUnlocked,
        lockReason,
        attemptsCount: asmVAttempts.length,
        hasPassed,
        statusBadge,
        latestAttempt: latestAttempt
          ? {
              id: latestAttempt._id.toString(),
              percentage: latestAttempt.percentage,
              result: latestAttempt.result,
              obtainedMarks: latestAttempt.obtainedMarks,
              totalMarks: latestAttempt.totalMarks,
              submittedAt: latestAttempt.submittedAt
            }
          : null,
        certificate: cert
          ? {
              id: cert._id.toString(),
              certificateNumber: cert.certificateNumber,
              issuedAt: cert.issuedAt
            }
          : null
      };

      return asmObj;
    });
  }

  return assessments;
}

/**
 * Retrieves a single assessment by ID with role-based access checks.
 *
 * @param {string} id - Assessment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Populated assessment document
 */
async function getAssessmentById(id, currentUser) {
  validateObjectId(id, 'Assessment ID');

  const assessment = await Assessment.findById(id).populate(POPULATE_OPTIONS);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'trainer') {
    const courseTrainerId = (
      assessment.course?.trainer?._id ||
      assessment.course?.trainer?.id ||
      assessment.course?.trainer ||
      assessment.trainer?._id ||
      assessment.trainer
    ).toString();

    if (courseTrainerId !== currentUserId) {
      throw new AppError('Access denied. You can only view assessments for your own courses.', 403);
    }
  } else if (currentUser.role === 'employee') {
    // Enforce employee visibility chain
    if (!assessment.isActive || assessment.status !== 'published') {
      throw new AppError('Assessment not found', 404);
    }
    if (!assessment.course || !assessment.course.isActive || assessment.course.status !== 'published') {
      throw new AppError('Assessment not found', 404);
    }
    if (assessment.module && !assessment.module.isActive) {
      throw new AppError('Assessment not found', 404);
    }
  }

  return assessment;
}

/**
 * Updates an assessment.
 *
 * @param {string} id - Assessment ID
 * @param {object} data - Assessment update data
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Updated populated assessment document
 */
async function updateAssessment(id, data, currentUser) {
  validateObjectId(id, 'Assessment ID');
  validateUpdateAssessment(data);

  const assessment = await Assessment.findById(id);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (currentUser.role === 'trainer') {
    const courseTrainerId = course.trainer.toString();
    if (courseTrainerId !== currentUserId) {
      throw new AppError('Access denied. You can only update assessments for your own courses.', 403);
    }
    if (data.trainer !== undefined && data.trainer.toString() !== currentUserId) {
      throw new AppError('Trainers cannot transfer assessment ownership', 403);
    }
  }

  // Module check if updating module
  if (data.module !== undefined) {
    if (data.module !== null) {
      validateObjectId(data.module, 'Module ID');
      const moduleDoc = await Module.findById(data.module);
      if (!moduleDoc) {
        throw new AppError('Module not found', 404);
      }
      if (!moduleDoc.isActive) {
        throw new AppError('Cannot link assessment to an inactive module', 400);
      }
      if (moduleDoc.course.toString() !== assessment.course.toString()) {
        throw new AppError('Module does not belong to the assessment course', 400);
      }
      assessment.module = data.module;
    } else {
      assessment.module = null;
    }
  }

  // Assign updatable fields
  if (data.title !== undefined) assessment.title = data.title.trim();
  if (data.description !== undefined) assessment.description = data.description.trim();
  if (data.passingPercentage !== undefined) assessment.passingPercentage = data.passingPercentage;
  if (data.timeLimitMinutes !== undefined) assessment.timeLimitMinutes = data.timeLimitMinutes;
  if (data.maxAttempts !== undefined) assessment.maxAttempts = data.maxAttempts;
  if (data.status !== undefined) assessment.status = data.status;
  if (data.isActive !== undefined) assessment.isActive = data.isActive;

  if (currentUser.role === 'admin' && data.trainer !== undefined) {
    validateObjectId(data.trainer, 'Trainer ID');
    const trainerUser = await User.findById(data.trainer);
    if (!trainerUser || trainerUser.role !== 'trainer' || !trainerUser.isActive) {
      throw new AppError('Invalid or inactive trainer specified', 400);
    }
    assessment.trainer = data.trainer;
  }

  await assessment.save();
  return await Assessment.findById(id).populate(POPULATE_OPTIONS);
}

/**
 * Publishes an assessment.
 */
async function publishAssessment(id, currentUser) {
  return await updateAssessment(id, { status: 'published' }, currentUser);
}

/**
 * Archives an assessment.
 */
async function archiveAssessment(id, currentUser) {
  return await updateAssessment(id, { status: 'archived' }, currentUser);
}

/**
 * Soft-deletes an assessment.
 */
async function deleteAssessment(id, currentUser) {
  validateObjectId(id, 'Assessment ID');

  const assessment = await Assessment.findById(id);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const course = await Course.findById(assessment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (currentUser.role === 'trainer') {
    if (course.trainer.toString() !== currentUserId) {
      throw new AppError('Access denied. You can only delete assessments for your own courses.', 403);
    }
  }

  assessment.isActive = false;
  await assessment.save();
  return await Assessment.findById(id).populate(POPULATE_OPTIONS);
}

/**
 * Retrieves employee-safe assessment attempt data with correct answers completely stripped.
 *
 * @param {string} assessmentId - Assessment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Sanitized attempt data
 */
async function getAttemptData(assessmentId, currentUser) {
  validateObjectId(assessmentId, 'Assessment ID');

  const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
  if (!employee || !employee.isActive) {
    throw new AppError('Active employee profile required', 403);
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.isActive || assessment.status !== 'published') {
    throw new AppError('Assessment not found or inaccessible', 404);
  }

  const course = await Course.findById(assessment.course);
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course not found or inaccessible', 404);
  }

  let moduleDoc = null;
  if (assessment.module) {
    moduleDoc = await Module.findById(assessment.module);
    if (!moduleDoc || !moduleDoc.isActive || moduleDoc.course.toString() !== course._id.toString()) {
      throw new AppError('Assessment module is inactive or inaccessible', 404);
    }
  }

  // Verify active enrollment
  const enrollment = await Enrollment.findOne({
    employee: employee._id,
    course: course._id,
    isActive: true,
    status: { $ne: 'dropped' }
  });

  if (!enrollment) {
    throw new AppError('You must have an active enrollment in this course to access the assessment', 403);
  }

  // Enforce course completion prerequisite if required by assessment
  if (assessment.requiresCourseCompletion) {
    const activeModules = await Module.find({ course: course._id, isActive: true }).select('_id');
    const totalActiveLessons = await Lesson.countDocuments({
      module: { $in: activeModules.map((m) => m._id) },
      isActive: true
    });

    if (totalActiveLessons === 0) {
      throw new AppError('Assessment is not available because the course has no active lessons', 400);
    }

    const completedCount = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0;
    if (
      enrollment.progressPercentage < 100 ||
      enrollment.status !== 'completed' ||
      completedCount < totalActiveLessons
    ) {
      throw new AppError('You must complete all course lessons before starting the assessment', 403);
    }
  }

  // Retrieve active questions
  const questions = await Question.find({ assessment: assessment._id, isActive: true }).sort({ order: 1 });

  // Safe projection: STRICTLY EXCLUDE correctAnswers
  const safeQuestions = questions.map((q) => ({
    id: q._id.toString(),
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options.map((opt) => ({
      key: opt.key,
      text: opt.text
    })),
    marks: q.marks,
    order: q.order
  }));

  return {
    assessment: {
      id: assessment._id.toString(),
      title: assessment.title,
      description: assessment.description,
      course: {
        id: course._id.toString(),
        title: course.title
      },
      module: moduleDoc
        ? {
            id: moduleDoc._id.toString(),
            title: moduleDoc.title
          }
        : null,
      passingPercentage: assessment.passingPercentage,
      timeLimitMinutes: assessment.timeLimitMinutes,
      maxAttempts: assessment.maxAttempts,
      totalQuestions: safeQuestions.length,
      totalMarks: safeQuestions.reduce((sum, q) => sum + q.marks, 0)
    },
    questions: safeQuestions
  };
}

/**
 * Retrieves the matching assessment and learner status for a course.
 *
 * @param {string} courseId - Course ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Assessment course status
 */
async function getCourseAssessmentStatus(courseId, currentUser) {
  validateObjectId(courseId, 'Course ID');

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const assessment = await Assessment.findOne({
    course: course._id,
    status: 'published',
    isActive: true
  });

  if (!assessment) {
    return {
      hasAssessment: false,
      assessment: null
    };
  }

  const activeQuestions = await Question.find({
    assessment: assessment._id,
    isActive: true
  }).sort({ order: 1 });

  const totalQuestions = activeQuestions.length;
  const totalMarks = activeQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const statusData = {
    hasAssessment: true,
    assessment: {
      id: assessment._id.toString(),
      title: assessment.title,
      description: assessment.description,
      passingPercentage: assessment.passingPercentage,
      timeLimitMinutes: assessment.timeLimitMinutes,
      maxAttempts: assessment.maxAttempts,
      totalQuestions,
      totalMarks
    },
    isEnrolled: false,
    isCourseCompleted: false,
    courseProgress: 0,
    isUnlocked: true,
    lockReason: null,
    attemptsCount: 0,
    hasPassed: false,
    latestAttempt: null,
    activeAttempt: null,
    certificate: null
  };

  if (currentUser.role === 'employee') {
    const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
    const employee = await Employee.findOne({ user: currentUserId });

    if (employee) {
      const enrollment = await Enrollment.findOne({
        employee: employee._id,
        course: course._id,
        isActive: true,
        status: { $ne: 'dropped' }
      });

      const Certificate = require('../models/Certificate');
      const AssessmentAttempt = require('../models/AssessmentAttempt');

      // Check course lessons
      const activeModules = await Module.find({ course: course._id, isActive: true }).select('_id');
      const totalActiveLessons = await Lesson.countDocuments({
        module: { $in: activeModules.map((m) => m._id) },
        isActive: true
      });

      const isEnrolled = !!enrollment;
      const progress = enrollment?.progressPercentage || 0;
      const isCourseCompleted =
        isEnrolled && (enrollment.status === 'completed' || progress === 100);

      let isUnlocked = false;
      let lockReason = null;

      if (!isEnrolled) {
        isUnlocked = false;
        lockReason = 'Enroll in the course to unlock the assessment.';
      } else if (assessment.requiresCourseCompletion && totalActiveLessons === 0) {
        isUnlocked = false;
        lockReason = 'Course curriculum has no active lessons. Complete lessons once available.';
      } else if (assessment.requiresCourseCompletion && (!isCourseCompleted || (Array.isArray(enrollment.completedLessons) && enrollment.completedLessons.length < totalActiveLessons))) {
        isUnlocked = false;
        lockReason = 'Complete all course lessons to unlock the assessment.';
      } else {
        isUnlocked = true;
      }

      // Check assessment attempts
      const attempts = await AssessmentAttempt.find({
        employee: employee._id,
        assessment: assessment._id
      }).sort({ createdAt: -1 });

      const hasPassed = attempts.some((a) => a.result === 'passed');
      const latestAttempt = attempts.length > 0 ? attempts[0] : null;
      const activeAttempt = attempts.find((a) => a.status === 'in_progress') || null;

      // Check certificate
      const certificate = await Certificate.findOne({
        employee: employee._id,
        course: course._id,
        status: 'active'
      });

      statusData.isEnrolled = isEnrolled;
      statusData.isCourseCompleted = isCourseCompleted;
      statusData.courseProgress = progress;
      statusData.isUnlocked = isUnlocked;
      statusData.isEligible = isUnlocked;
      statusData.lockReason = lockReason;
      statusData.reason = lockReason;
      statusData.attemptsCount = attempts.length;
      statusData.hasPassed = hasPassed;
      statusData.latestAttempt = latestAttempt
        ? {
            id: latestAttempt._id.toString(),
            attemptNumber: latestAttempt.attemptNumber,
            status: latestAttempt.status,
            percentage: latestAttempt.percentage,
            obtainedMarks: latestAttempt.obtainedMarks,
            totalMarks: latestAttempt.totalMarks,
            result: latestAttempt.result,
            submittedAt: latestAttempt.submittedAt
          }
        : null;
      statusData.activeAttempt = activeAttempt
        ? {
            id: activeAttempt._id.toString(),
            attemptNumber: activeAttempt.attemptNumber,
            startedAt: activeAttempt.startedAt
          }
        : null;
      statusData.certificate = certificate
        ? {
            id: certificate._id.toString(),
            certificateNumber: certificate.certificateNumber,
            issuedAt: certificate.issuedAt
          }
        : null;
    }
  }

  return statusData;
}

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  deleteAssessment,
  getAttemptData,
  getCourseAssessmentStatus
};

