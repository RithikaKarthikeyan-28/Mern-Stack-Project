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
    select: 'title description category level duration status isActive trainer',
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
  if (currentUser.role === 'trainer' && !employeeId) {
    throw new AppError('Trainers cannot self-enroll in courses', 403);
  }

  const isEmployee = currentUser.role === 'employee';
  validateCreateEnrollment({ course: courseId, employee: employeeId }, isEmployee);

  let targetEmployee;

  if (isEmployee) {
    // Derive employee from authenticated user
    targetEmployee = await Employee.findOne({ user: currentUser.id || currentUser.userId })
      .populate('department', 'name');
    if (!targetEmployee) {
      throw new AppError('Employee profile not found', 404);
    }
    if (!targetEmployee.isActive) {
      throw new AppError('Inactive employee cannot enroll in courses', 400);
    }
  } else if (currentUser.role === 'admin' || currentUser.role === 'trainer') {
    // Admin or Trainer providing employee ID
    targetEmployee = await Employee.findById(employeeId).populate('department', 'name');
    if (!targetEmployee) {
      throw new AppError('Employee not found', 404);
    }
    if (!targetEmployee.isActive) {
      throw new AppError('Cannot enroll an inactive employee', 400);
    }
  } else {
    throw new AppError('Unauthorized to create enrollments', 403);
  }

  // Course must exist, be active, and be published
  const course = await Course.findById(courseId).populate('department', 'name');
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course not found', 404);
  }

  // If Trainer, ensure they have instruction authority over this course
  if (currentUser.role === 'trainer') {
    const trainerUserId = (currentUser.id || currentUser._id || currentUser.userId).toString();
    const courseTrainerId = (course.trainer?._id || course.trainer || '').toString();
    if (courseTrainerId && courseTrainerId !== trainerUserId) {
      throw new AppError('Trainers can only assign courses they are authorized to instruct', 403);
    }
  }

  // Validate department compatibility
  const employeeDeptId = targetEmployee.department?._id?.toString() || targetEmployee.department?.toString();
  const courseDeptId = course.department?._id?.toString() || course.department?.toString();
  const isGlobalCourse = course.isGlobal === true || !courseDeptId;

  if (employeeDeptId && courseDeptId && !isGlobalCourse && employeeDeptId !== courseDeptId) {
    throw new AppError(
      `Department incompatibility: Course "${course.title}" belongs to ${course.department?.name || 'another department'} and cannot be assigned to an employee in a different department.`,
      400
    );
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
      const populated = await Enrollment.findById(existingEnrollment._id).populate(POPULATE_OPTIONS);
      const activeModules = await Module.find({ course: courseId, isActive: true }).select('_id');
      const totalActiveLessons = await Lesson.countDocuments({
        module: { $in: activeModules.map((m) => m._id) },
        isActive: true
      });
      const obj = populated.toObject ? populated.toObject() : populated;
      obj.totalLessons = totalActiveLessons;
      obj.completedLessonsCount = 0;
      return obj;
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
    isMandatory: !isEmployee,
    assignedBy: !isEmployee ? (currentUser.id || currentUser._id || currentUser.userId) : null,
    assignedAt: !isEmployee ? new Date() : null,
    isActive: true
  });

  const populated = await Enrollment.findById(enrollment._id).populate(POPULATE_OPTIONS);
  const activeModules = await Module.find({ course: courseId, isActive: true }).select('_id');
  const totalActiveLessons = await Lesson.countDocuments({
    module: { $in: activeModules.map((m) => m._id) },
    isActive: true
  });
  const obj = populated.toObject ? populated.toObject() : populated;
  obj.totalLessons = totalActiveLessons;
  obj.completedLessonsCount = 0;
  return obj;
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

  const enrollments = await Enrollment.find({ employee: employee._id })
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });

  const OBSOLETE_COURSES = [
    'Excel for Better Decisions',
    'Coaching for Performance',
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

  const validEnrollments = enrollments.filter((e) => {
    if (!e.course) return false;
    if (e.course.title && OBSOLETE_COURSES.includes(e.course.title)) return false;
    return true;
  });

  const courseIds = validEnrollments
    .map((e) => (e.course?._id || e.course))
    .filter(Boolean);

  const activeModules = await Module.find({ course: { $in: courseIds }, isActive: true }).select('_id course');
  const moduleIds = activeModules.map((m) => m._id);
  const activeLessons = await Lesson.find({ module: { $in: moduleIds }, isActive: true }).select('_id module');

  const moduleToCourse = new Map();
  activeModules.forEach((m) => moduleToCourse.set(m._id.toString(), m.course.toString()));

  const courseLessonsCount = new Map();
  activeLessons.forEach((l) => {
    const cId = moduleToCourse.get(l.module.toString());
    if (cId) {
      courseLessonsCount.set(cId, (courseLessonsCount.get(cId) || 0) + 1);
    }
  });

  return validEnrollments.map((e) => {
    const obj = e.toObject ? e.toObject() : { ...e };
    const cId = (obj.course?._id || obj.course)?.toString();
    obj.totalLessons = cId ? (courseLessonsCount.get(cId) || 0) : 0;
    obj.completedLessonsCount = Array.isArray(obj.completedLessons) ? obj.completedLessons.length : 0;
    return obj;
  });
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

  const activeModules = await Module.find({ course: courseId, isActive: true }).select('_id');
  const totalActiveLessons = await Lesson.countDocuments({
    module: { $in: activeModules.map((m) => m._id) },
    isActive: true
  });

  const obj = enrollment.toObject ? enrollment.toObject() : enrollment;
  obj.totalLessons = totalActiveLessons;
  obj.completedLessonsCount = Array.isArray(obj.completedLessons) ? obj.completedLessons.length : 0;
  return obj;
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

  const courseId = enrollment.course?._id || enrollment.course;
  const activeModules = await Module.find({ course: courseId, isActive: true }).select('_id');
  const totalActiveLessons = await Lesson.countDocuments({
    module: { $in: activeModules.map((m) => m._id) },
    isActive: true
  });

  const obj = enrollment.toObject ? enrollment.toObject() : enrollment;
  obj.totalLessons = totalActiveLessons;
  obj.completedLessonsCount = Array.isArray(obj.completedLessons) ? obj.completedLessons.length : 0;
  return obj;
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

  const enrollments = await Enrollment.find(query)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });

  // Filter out any enrollments with dangling/deleted employee references
  return enrollments.filter((e) => e.employee != null);
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

  const lessonId = progressData.lessonId;
  const completed =
    progressData.completed !== undefined
      ? progressData.completed
      : progressData.isCompleted;
  const { moduleId, courseId } = progressData;

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

  if (moduleId) {
    validateObjectId(moduleId, 'Module ID');
    if (lesson.module.toString() !== moduleId.toString()) {
      throw new AppError('Lesson does not belong to the specified module', 400);
    }
  }

  const enrollmentCourseId = (enrollment.course?._id || enrollment.course).toString();
  if (moduleDoc.course.toString() !== enrollmentCourseId) {
    throw new AppError('Lesson does not belong to the enrolled course', 400);
  }

  if (courseId) {
    validateObjectId(courseId, 'Course ID');
    if (enrollmentCourseId !== courseId.toString()) {
      throw new AppError('Enrollment does not match the specified course', 400);
    }
  }

  const course = await Course.findById(enrollmentCourseId);
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course is not accessible or not published', 400);
  }

  // Update completedLessons list
  const lessonIdStr = lesson._id.toString();
  const existingSet = new Set(enrollment.completedLessons.map((id) => (id._id || id).toString()));

  if (completed) {
    if (!existingSet.has(lessonIdStr)) {
      enrollment.completedLessons.push(lesson._id);
    }
    if (!enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }
  } else {
    enrollment.completedLessons = enrollment.completedLessons.filter(
      (id) => (id._id || id).toString() !== lessonIdStr
    );
  }

  // Dynamic Progress Calculation:
  // Find all active modules in the course
  const activeModules = await Module.find({ course: enrollmentCourseId, isActive: true }).select('_id');
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
    activeLessonIds.has((id._id || id).toString())
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

      // Automatically award course skills and re-evaluate compliance obligations
      try {
        const CourseSkill = require('../models/CourseSkill');
        const EmployeeSkill = require('../models/EmployeeSkill');
        const courseSkills = await CourseSkill.find({ course: enrollment.course, isActive: true });
        for (const cs of courseSkills) {
          await EmployeeSkill.findOneAndUpdate(
            { employee: enrollment.employee, skill: cs.skill },
            {
              $set: {
                proficiencyLevel: cs.coverageLevel || 'intermediate',
                isActive: true
              }
            },
            { upsert: true, new: true }
          );
        }

        const ComplianceRequirement = require('../models/ComplianceRequirement');
        const ComplianceAssignment = require('../models/ComplianceAssignment');
        const complianceService = require('./compliance.service');
        const reqs = await ComplianceRequirement.find({ course: enrollment.course, isActive: true });
        if (reqs.length > 0) {
          const assignments = await ComplianceAssignment.find({
            employee: enrollment.employee,
            complianceRequirement: { $in: reqs.map((r) => r._id) },
            isActive: true
          });
          for (const assignment of assignments) {
            await complianceService.evaluateAssignmentStatus(assignment, { save: true });
          }
        }
      } catch (postCompletionErr) {
        console.error('Post course-completion task notice:', postCompletionErr.message);
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
  const populated = await Enrollment.findById(enrollmentId).populate(POPULATE_OPTIONS);
  const result = populated.toObject ? populated.toObject() : populated;
  result.totalLessons = totalActiveLessons;
  result.completedLessonsCount = completedActiveLessons.length;
  return result;
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

/**
 * Assigns a course to an entire department of eligible employees.
 * Accessible to Admins and authorized Trainers.
 *
 * @param {object} params
 * @param {string} params.courseId
 * @param {string} params.departmentId
 * @param {boolean} [params.isMandatory=true]
 * @param {object} currentUser
 * @returns {Promise<object>} Summary of assignment operation
 */
async function assignCourseToDepartment({ courseId, departmentId, isMandatory = true }, currentUser) {
  if (currentUser.role !== 'admin' && currentUser.role !== 'trainer') {
    throw new AppError('Unauthorized to assign courses to departments', 403);
  }

  validateObjectId(courseId, 'Course ID');
  validateObjectId(departmentId, 'Department ID');

  const course = await Course.findById(courseId).populate('department');
  if (!course || !course.isActive || course.status !== 'published') {
    throw new AppError('Course not found or inactive', 404);
  }

  // Trainer authorization
  if (currentUser.role === 'trainer') {
    const trainerUserId = (currentUser.id || currentUser._id || currentUser.userId).toString();
    const courseTrainerId = (course.trainer?._id || course.trainer || '').toString();
    if (courseTrainerId && courseTrainerId !== trainerUserId) {
      throw new AppError('Trainers can only assign courses they are authorized to instruct', 403);
    }
  }

  // Department compatibility: course must be global or belong to this department
  const courseDeptId = course.department?._id?.toString() || course.department?.toString();
  const isGlobalCourse = course.isGlobal === true || !courseDeptId;

  if (courseDeptId && !isGlobalCourse && courseDeptId !== departmentId.toString()) {
    throw new AppError(
      `Course "${course.title}" belongs to ${course.department?.name || 'another department'} and cannot be assigned to this department.`,
      400
    );
  }

  // Fetch active employees in target department
  const employees = await Employee.find({ department: departmentId, isActive: true });
  let assignedCount = 0;
  let skippedCount = 0;

  for (const emp of employees) {
    const existing = await Enrollment.findOne({ employee: emp._id, course: course._id });
    if (existing && existing.isActive && existing.status !== 'dropped') {
      skippedCount++;
      continue;
    }

    if (existing && (existing.status === 'dropped' || !existing.isActive)) {
      existing.status = 'enrolled';
      existing.isActive = true;
      existing.progressPercentage = 0;
      existing.completedLessons = [];
      existing.isMandatory = isMandatory;
      existing.assignedBy = currentUser.id || currentUser._id || currentUser.userId;
      existing.assignedAt = new Date();
      await existing.save();
      assignedCount++;
    } else {
      await Enrollment.create({
        employee: emp._id,
        course: course._id,
        status: 'enrolled',
        progressPercentage: 0,
        completedLessons: [],
        isMandatory,
        assignedBy: currentUser.id || currentUser._id || currentUser.userId,
        assignedAt: new Date(),
        isActive: true
      });
      assignedCount++;
    }
  }

  return {
    courseId: course._id,
    courseTitle: course.title,
    departmentId,
    totalEmployees: employees.length,
    assignedCount,
    skippedCount
  };
}

module.exports = {
  enrollEmployee,
  assignCourseToDepartment,
  getMyEnrollments,
  getCourseEnrollment,
  getEnrollmentById,
  getAllEnrollments,
  updateEnrollmentStatus,
  updateLessonProgress,
  dropEnrollment
};
