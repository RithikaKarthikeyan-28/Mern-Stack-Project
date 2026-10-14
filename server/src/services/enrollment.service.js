const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const {
  validateCreateEnrollment,
  validateUpdateEnrollmentStatus,
  validateProgressUpdate,
  validateObjectId
} = require('../validators/enrollment.validator');

const POPULATE_OPTIONS = [
  {
    path: 'course',
    select: 'title category level duration status isActive trainer',
    populate: {
      path: 'trainer',
      select: 'name email role isActive'
    }
  },
  {
    path: 'employee',
    select: 'employeeId designation department user isActive',
    populate: [
      { path: 'user', select: 'name email role' },
      { path: 'department', select: 'name description' }
    ]
  },
  {
    path: 'completedLessons',
    select: 'title contentType order isActive'
  }
];

/**
 * Enrolls an employee in a course.
 *
 * @param {object} payload - { courseId, employeeId }
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Populated enrollment document
 */
async function enrollEmployee({ courseId, employeeId }, currentUser) {
  const isEmployee = currentUser.role === 'employee';
  validateCreateEnrollment({ course: courseId, employee: employeeId }, isEmployee);

  let targetEmployee;

  if (isEmployee) {
    // Derive employee from authenticated user
    targetEmployee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
    if (!targetEmployee) {
      throw new AppError('Employee profile not found', 404);
    }
    if (!targetEmployee.isActive) {
      throw new AppError('Inactive employee cannot enroll in courses', 400);
    }
  } else if (currentUser.role === 'admin') {
    // Admin must provide employee ID
    targetEmployee = await Employee.findById(employeeId);
    if (!targetEmployee) {
      throw new AppError('Employee not found', 404);
    }
    if (!targetEmployee.isActive) {
      throw new AppError('Cannot enroll an inactive employee', 400);
    }
  } else {
    throw new AppError('Trainers cannot create enrollments', 403);
  }

  // Course must exist, be active, and be published
  const course = await Course.findById(courseId);
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course not found', 404);
  }

  // Check for existing enrollment
  const existingEnrollment = await Enrollment.findOne({
    employee: targetEmployee._id,
    course: courseId
  });

  if (existingEnrollment) {
    if (existingEnrollment.status === 'dropped' || !existingEnrollment.isActive) {
      // Reactivate dropped enrollment
      existingEnrollment.status = 'enrolled';
      existingEnrollment.isActive = true;
      existingEnrollment.progressPercentage = 0;
      existingEnrollment.completedLessons = [];
      existingEnrollment.startedAt = null;
      existingEnrollment.completedAt = null;
      await existingEnrollment.save();
      return await Enrollment.findById(existingEnrollment._id).populate(POPULATE_OPTIONS);
    }
    throw new AppError('Employee is already enrolled in this course', 409);
  }

  // Create new enrollment
  const enrollment = await Enrollment.create({
    employee: targetEmployee._id,
    course: courseId,
    status: 'enrolled',
    progressPercentage: 0,
    completedLessons: [],
    startedAt: null,
    completedAt: null,
    isActive: true
  });

  return await Enrollment.findById(enrollment._id).populate(POPULATE_OPTIONS);
}

/**
 * Retrieves all enrollments for the authenticated employee.
 *
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<Array>} List of populated enrollment documents
 */
async function getMyEnrollments(currentUser) {
  const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  return await Enrollment.find({ employee: employee._id })
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });
}

/**
 * Retrieves the authenticated employee's enrollment for a specific course.
 *
 * @param {string} courseId - Course ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Populated enrollment document
 */
async function getCourseEnrollment(courseId, currentUser) {
  validateObjectId(courseId, 'Course ID');

  const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  const enrollment = await Enrollment.findOne({
    employee: employee._id,
    course: courseId
  }).populate(POPULATE_OPTIONS);

  if (!enrollment) {
    throw new AppError('Enrollment not found for this course', 404);
  }

  return enrollment;
}

/**
 * Retrieves a single enrollment by ID with role-based access checks.
 *
 * @param {string} id - Enrollment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Populated enrollment document
 */
async function getEnrollmentById(id, currentUser) {
  validateObjectId(id, 'Enrollment ID');

  const enrollment = await Enrollment.findById(id).populate(POPULATE_OPTIONS);
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404);
  }

  if (currentUser.role === 'employee') {
    const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
    if (!employee || enrollment.employee._id.toString() !== employee._id.toString()) {
      throw new AppError('Enrollment not found', 404);
    }
  } else if (currentUser.role === 'trainer') {
    const trainerId = (currentUser.id || currentUser.userId).toString();
    const courseTrainerId = (
      enrollment.course.trainer?._id ||
      enrollment.course.trainer?.id ||
      enrollment.course.trainer
    ).toString();

    if (courseTrainerId !== trainerId) {
      throw new AppError('Access denied. You can only view enrollments for your own courses.', 403);
    }
  }

  return enrollment;
}

/**
 * Retrieves all enrollments with filtering and trainer scoping.
 *
 * @param {object} filters - Query filters (employee, course, status, isActive)
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<Array>} List of populated enrollment documents
 */
async function getAllEnrollments(filters = {}, currentUser) {
  const query = {};

  if (currentUser.role === 'trainer') {
    const trainerId = currentUser.id || currentUser.userId;
    const trainerCourses = await Course.find({ trainer: trainerId }).select('_id');
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
  }

  if (filters.employee) {
    validateObjectId(filters.employee, 'Employee ID');
    query.employee = filters.employee;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === 'true' || filters.isActive === true;
  }

  return await Enrollment.find(query)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });
}

/**
 * Updates enrollment status (admin-only).
 *
 * @param {string} id - Enrollment ID
 * @param {string} status - New status
 * @returns {Promise<object>} Updated populated enrollment document
 */
async function updateEnrollmentStatus(id, status) {
  validateObjectId(id, 'Enrollment ID');
  validateUpdateEnrollmentStatus({ status });

  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404);
  }

  enrollment.status = status;
  if (status === 'completed') {
    if (!enrollment.completedAt) enrollment.completedAt = new Date();
    enrollment.progressPercentage = 100;
  } else if (status === 'dropped') {
    enrollment.isActive = false;
  } else {
    enrollment.isActive = true;
    if (status === 'enrolled') {
      enrollment.completedAt = null;
    }
  }

  await enrollment.save();
  return await Enrollment.findById(id).populate(POPULATE_OPTIONS);
}

/**
 * Updates lesson progress, recalculating completion percentage.
 *
 * @param {string} enrollmentId - Enrollment ID
 * @param {object} progressData - { lessonId, completed }
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Updated populated enrollment document
 */
async function updateLessonProgress(enrollmentId, progressData, currentUser) {
  validateObjectId(enrollmentId, 'Enrollment ID');
  validateProgressUpdate(progressData);

  const { lessonId, completed } = progressData;

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404);
  }

  // Disallow updates on dropped or inactive enrollment
  if (enrollment.status === 'dropped' || !enrollment.isActive) {
    throw new AppError('Cannot update progress on a dropped or inactive enrollment', 400);
  }

  // User authorization: Employee must own the enrollment, Admin has universal authority
  if (currentUser.role === 'employee') {
    const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
    if (!employee || enrollment.employee.toString() !== employee._id.toString()) {
      throw new AppError('Enrollment not found', 404);
    }
  } else if (currentUser.role === 'trainer') {
    throw new AppError('Trainers cannot update lesson progress', 403);
  }

  // Hierarchy Validation:
  // Lesson -> Module -> Course == Enrollment.course
  const lesson = await Lesson.findById(lessonId);
  if (!lesson || !lesson.isActive) {
    throw new AppError('Lesson not found or inactive', 400);
  }

  const moduleDoc = await Module.findById(lesson.module);
  if (!moduleDoc || !moduleDoc.isActive) {
    throw new AppError('Module not found or inactive', 400);
  }

  if (moduleDoc.course.toString() !== enrollment.course.toString()) {
    throw new AppError('Lesson does not belong to the enrolled course', 400);
  }

  const course = await Course.findById(enrollment.course);
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course is not accessible or not published', 400);
  }

  // Update completedLessons list
  const lessonIdStr = lesson._id.toString();
  const existingSet = new Set(enrollment.completedLessons.map((id) => id.toString()));

  if (completed) {
    if (!existingSet.has(lessonIdStr)) {
      enrollment.completedLessons.push(lesson._id);
    }
    if (!enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }
  } else {
    enrollment.completedLessons = enrollment.completedLessons.filter(
      (id) => id.toString() !== lessonIdStr
    );
  }

  // Dynamic Progress Calculation:
  // Find all active modules in the course
  const activeModules = await Module.find({ course: enrollment.course, isActive: true }).select('_id');
  const activeModuleIds = activeModules.map((m) => m._id);

  // Find all active lessons in those active modules
  const activeLessons = await Lesson.find({
    module: { $in: activeModuleIds },
    isActive: true
  }).select('_id');

  const activeLessonIds = new Set(activeLessons.map((l) => l._id.toString()));
  const totalActiveLessons = activeLessons.length;

  // Normalize completed lessons to only active lessons
  const completedActiveLessons = enrollment.completedLessons.filter((id) =>
    activeLessonIds.has(id.toString())
  );

  if (totalActiveLessons === 0) {
    enrollment.progressPercentage = 0;
    enrollment.completedAt = null;
    if (enrollment.status !== 'dropped') {
      enrollment.status = 'enrolled';
    }
  } else {
    const progress = Math.round((completedActiveLessons.length / totalActiveLessons) * 100);
    enrollment.progressPercentage = progress;

    if (progress === 100) {
      enrollment.status = 'completed';
      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }
    } else if (completedActiveLessons.length > 0) {
      enrollment.status = 'in_progress';
      enrollment.completedAt = null;
    } else {
      enrollment.status = 'enrolled';
      enrollment.completedAt = null;
    }
  }

  await enrollment.save();
  return await Enrollment.findById(enrollmentId).populate(POPULATE_OPTIONS);
}

/**
 * Drops an enrollment (sets status to 'dropped' and isActive to false).
 *
 * @param {string} id - Enrollment ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Updated populated enrollment document
 */
async function dropEnrollment(id, currentUser) {
  validateObjectId(id, 'Enrollment ID');

  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404);
  }

  if (currentUser.role === 'employee') {
    const employee = await Employee.findOne({ user: currentUser.id || currentUser.userId });
    if (!employee || enrollment.employee.toString() !== employee._id.toString()) {
      throw new AppError('Enrollment not found', 404);
    }
  } else if (currentUser.role === 'trainer') {
    throw new AppError('Trainers cannot drop enrollments', 403);
  }

  enrollment.status = 'dropped';
  enrollment.isActive = false;

  await enrollment.save();
  return await Enrollment.findById(id).populate(POPULATE_OPTIONS);
}

module.exports = {
  enrollEmployee,
  getMyEnrollments,
  getCourseEnrollment,
  getEnrollmentById,
  getAllEnrollments,
  updateEnrollmentStatus,
  updateLessonProgress,
  dropEnrollment
};
