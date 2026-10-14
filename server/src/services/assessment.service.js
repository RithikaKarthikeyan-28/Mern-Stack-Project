const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Question = require('../models/Question');
const Employee = require('../models/Employee');
const Enrollment = require('../models/Enrollment');
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
    // Scoped exclusively to courses owned by this trainer
    const trainerCourses = await Course.find({ trainer: currentUserId }).select('_id');
    const trainerCourseIds = trainerCourses.map((c) => c._id.toString());

    if (filters.course) {
      validateObjectId(filters.course, 'Course ID');
      if (!trainerCourseIds.includes(filters.course.toString())) {
        return [];
      }
      query.course = filters.course;
    } else {
      query.course = { $in: trainerCourses.map((c) => c._id) };
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

  return await Assessment.find(query)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });
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

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  deleteAssessment,
  getAttemptData
};
