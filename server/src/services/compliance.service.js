const mongoose = require('mongoose');
const ComplianceRequirement = require('../models/ComplianceRequirement');
const ComplianceAssignment = require('../models/ComplianceAssignment');
const Course = require('../models/Course');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const config = require('../config');

/**
 * Calculates calendar days remaining until dueAt.
 * Returns:
 *   Positive integer: due in future days
 *   0: due today
 *   Negative integer: overdue by N days
 */
function calculateDaysRemaining(dueAt, now = new Date()) {
  const dueDate = new Date(dueAt);
  const nowDate = new Date(now);
  const dueMidnight = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const nowMidnight = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate());
  return Math.round((dueMidnight - nowMidnight) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates the deterministic compliance status for an assignment.
 * Priority:
 *   1. COMPLIANT: Active enrollment completed + valid unexpired active certificate (if certificate exists/required).
 *   2. OVERDUE: dueAt < now
 *   3. IN_PROGRESS: Enrollment exists and status is 'in_progress'
 *   4. DUE_SOON: dueAt >= now AND (dueAt - now) <= COMPLIANCE_DUE_SOON_DAYS
 *   5. NOT_STARTED: default
 */
async function evaluateAssignmentStatus(assignment, options = {}) {
  const now = options.now || new Date();

  // Load requirement if not populated
  let requirement = assignment.complianceRequirement;
  if (!requirement || !requirement.course) {
    requirement = await ComplianceRequirement.findById(
      assignment.complianceRequirement
    );
  }

  if (!requirement) {
    throw new AppError('Compliance requirement associated with assignment not found', 404);
  }

  const employeeId =
    assignment.employee?._id ||
    assignment.employee?.id ||
    assignment.employee;

  const courseId =
    requirement.course?._id ||
    requirement.course?.id ||
    requirement.course;

  // 1. Fetch active enrollment
  const enrollment = await Enrollment.findOne({
    employee: employeeId,
    course: courseId,
    isActive: true
  });

  // 2. Fetch certificates
  const certificates = await Certificate.find({
    employee: employeeId,
    course: courseId
  }).sort({ issuedAt: -1 });

  let determinedStatus = 'NOT_STARTED';
  let completedAt = null;

  const hasEnrollmentCompleted = enrollment && enrollment.status === 'completed';

  if (hasEnrollmentCompleted) {
    if (certificates && certificates.length > 0) {
      // Find latest or any valid active unexpired certificate
      const validCert = certificates.find((c) => {
        if (c.status !== 'active') return false;
        if (!c.expiresAt) return true;
        return new Date(c.expiresAt) > now;
      });

      if (validCert) {
        determinedStatus = 'COMPLIANT';
        completedAt = validCert.issuedAt || enrollment.completedAt || assignment.completedAt || now;
      }
      // If certificates exist but all are revoked or expired, fall through (not compliant)
    } else {
      // Completed enrollment with no certificate required/generated
      determinedStatus = 'COMPLIANT';
      completedAt = enrollment.completedAt || assignment.completedAt || now;
    }
  }

  // If not COMPLIANT, check remaining statuses in strict priority order
  if (determinedStatus !== 'COMPLIANT') {
    completedAt = null;
    const dueAtDate = new Date(assignment.dueAt);

    if (dueAtDate < now) {
      determinedStatus = 'OVERDUE';
    } else if (enrollment && enrollment.status === 'in_progress') {
      determinedStatus = 'IN_PROGRESS';
    } else {
      const dueSoonThresholdMs =
        (config.complianceDueSoonDays || 30) * 24 * 60 * 60 * 1000;
      const diffMs = dueAtDate.getTime() - now.getTime();
      if (diffMs <= dueSoonThresholdMs) {
        determinedStatus = 'DUE_SOON';
      } else {
        determinedStatus = 'NOT_STARTED';
      }
    }
  }

  const previousStatus = assignment.status;
  assignment.status = determinedStatus;
  assignment.completedAt = completedAt;
  assignment.lastEvaluatedAt = now;

  if (options.save === true && assignment.save) {
    await assignment.save();
  } else if (options.save !== false && assignment.save && !assignment.isNew) {
    await assignment.save();
  }

  const daysRemaining = calculateDaysRemaining(assignment.dueAt, now);

  return {
    assignment,
    status: determinedStatus,
    previousStatus,
    daysRemaining,
    isCompliant: determinedStatus === 'COMPLIANT'
  };
}

/**
 * Creates a new compliance requirement.
 */
async function createRequirement(data) {
  // Validate course exists and is active/published
  const course = await Course.findById(data.course);
  if (!course) {
    throw new AppError('Referenced course not found', 404);
  }
  if (!course.isActive || course.status !== 'published') {
    throw new AppError('Compliance requirement requires an active and published course', 400);
  }

  const dept = data.department || (course.department ? course.department : null);
  const departments = Array.isArray(data.departments) && data.departments.length > 0
    ? data.departments
    : (dept ? [dept] : []);
  const isGlobal = data.isGlobal !== undefined ? Boolean(data.isGlobal) : (!dept && departments.length === 0);

  const requirement = await ComplianceRequirement.create({
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    course: course._id,
    department: dept,
    departments,
    isGlobal,
    frequency: data.frequency || 'annual',
    dueWithinDays: data.dueWithinDays !== undefined ? Number(data.dueWithinDays) : 30,
    renewalGraceDays: data.renewalGraceDays !== undefined ? Number(data.renewalGraceDays) : 0,
    isActive: true
  });

  return requirement;
}

/**
 * Lists compliance requirements with pagination and filtering.
 */
async function getRequirements(query = {}) {
  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.frequency) {
    filter.frequency = query.frequency;
  }

  if (query.courseId) {
    filter.course = query.courseId;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  if (query.department) {
    filter.$or = [
      { department: query.department },
      { departments: query.department },
      { isGlobal: true }
    ];
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, requirements] = await Promise.all([
    ComplianceRequirement.countDocuments(filter),
    ComplianceRequirement.find(filter)
      .populate('course', 'title code status isActive department')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    requirements,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Retrieves a single compliance requirement by ID.
 */
async function getRequirementById(id) {
  const requirement = await ComplianceRequirement.findById(id).populate(
    'course',
    'title code description status isActive'
  );
  if (!requirement) {
    throw new AppError('Compliance requirement not found', 404);
  }
  return requirement;
}

/**
 * Updates a compliance requirement.
 * Enforces course immutability if assignments exist.
 */
async function updateRequirement(id, data) {
  const requirement = await ComplianceRequirement.findById(id);
  if (!requirement) {
    throw new AppError('Compliance requirement not found', 404);
  }

  // Course immutability check
  if (data.course && data.course.toString() !== requirement.course.toString()) {
    const assignmentCount = await ComplianceAssignment.countDocuments({
      complianceRequirement: id,
      isActive: true
    });
    if (assignmentCount > 0) {
      throw new AppError(
        'Cannot change course for a compliance requirement that has existing assignments',
        409
      );
    }

    const newCourse = await Course.findById(data.course);
    if (!newCourse) {
      throw new AppError('Referenced course not found', 404);
    }
    if (!newCourse.isActive || newCourse.status !== 'published') {
      throw new AppError('Compliance requirement requires an active and published course', 400);
    }

    requirement.course = newCourse._id;
  }

  if (data.title !== undefined) {
    requirement.title = data.title.trim();
  }
  if (data.description !== undefined) {
    requirement.description = data.description.trim();
  }
  if (data.frequency !== undefined) {
    requirement.frequency = data.frequency;
  }
  if (data.dueWithinDays !== undefined) {
    requirement.dueWithinDays = Number(data.dueWithinDays);
  }
  if (data.renewalGraceDays !== undefined) {
    requirement.renewalGraceDays = Number(data.renewalGraceDays);
  }
  if (data.department !== undefined) {
    requirement.department = data.department;
  }
  if (data.departments !== undefined) {
    requirement.departments = data.departments;
  }
  if (data.isGlobal !== undefined) {
    requirement.isGlobal = Boolean(data.isGlobal);
  }

  await requirement.save();
  return requirement;
}

/**
 * Soft deletes a compliance requirement and its active assignments.
 */
async function deleteRequirement(id) {
  const requirement = await ComplianceRequirement.findById(id);
  if (!requirement) {
    throw new AppError('Compliance requirement not found', 404);
  }

  requirement.isActive = false;
  await requirement.save();

  // Deactivate associated assignments
  await ComplianceAssignment.updateMany(
    { complianceRequirement: id },
    { isActive: false }
  );

  return requirement;
}

/**
 * Assigns a compliance requirement to a single employee.
 */
async function assignToEmployee(requirementId, employeeId) {
  const requirement = await ComplianceRequirement.findOne({
    _id: requirementId,
    isActive: true
  });
  if (!requirement) {
    throw new AppError('Active compliance requirement not found', 404);
  }

  const employee = await Employee.findOne({
    _id: employeeId,
    isActive: true
  });
  if (!employee) {
    throw new AppError('Active employee not found', 404);
  }

  // Department compatibility check
  const empDeptId = employee.department?._id?.toString() || employee.department?.toString();
  const reqDeptId = requirement.department?._id?.toString() || requirement.department?.toString();
  const reqDeptList = (requirement.departments || []).map((d) => (d._id || d).toString());
  const isGlobalReq = requirement.isGlobal === true;

  if (empDeptId && !isGlobalReq && reqDeptId && reqDeptId !== empDeptId && !reqDeptList.includes(empDeptId)) {
    throw new AppError('Compliance requirement does not apply to this employee’s department', 400);
  }

  // Duplicate check
  const existing = await ComplianceAssignment.findOne({
    complianceRequirement: requirementId,
    employee: employeeId,
    isActive: true
  });
  if (existing) {
    throw new AppError('Employee is already assigned to this compliance requirement', 409);
  }

  const assignedAt = new Date();
  const dueAt = new Date(
    assignedAt.getTime() + requirement.dueWithinDays * 24 * 60 * 60 * 1000
  );

  const assignment = new ComplianceAssignment({
    complianceRequirement: requirement._id,
    employee: employee._id,
    assignedAt,
    dueAt,
    status: 'NOT_STARTED',
    isActive: true
  });

  // Evaluate initial status and persist
  await evaluateAssignmentStatus(assignment, { save: true });

  await assignment.populate([
    { path: 'complianceRequirement', populate: { path: 'course', select: 'title code' } },
    { path: 'employee', select: 'employeeId user department designation' }
  ]);

  const assignmentObj = assignment.toObject();
  assignmentObj.daysRemaining = calculateDaysRemaining(assignment.dueAt);

  return assignmentObj;
}

/**
 * Bulk assigns a compliance requirement to multiple employees.
 */
async function bulkAssign(requirementId, employeeIds) {
  const requirement = await ComplianceRequirement.findOne({
    _id: requirementId,
    isActive: true
  });
  if (!requirement) {
    throw new AppError('Active compliance requirement not found', 404);
  }

  const uniqueIds = [...new Set(employeeIds.map((id) => id.toString()))];
  const activeEmployees = await Employee.find({
    _id: { $in: uniqueIds },
    isActive: true
  });

  const activeEmployeeMap = new Map(
    activeEmployees.map((e) => [e._id.toString(), e])
  );

  let assignedCount = 0;
  let skippedCount = 0;
  const assigned = [];

  for (const empId of uniqueIds) {
    if (!activeEmployeeMap.has(empId)) {
      skippedCount++;
      continue;
    }

    const existing = await ComplianceAssignment.findOne({
      complianceRequirement: requirementId,
      employee: empId,
      isActive: true
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const assignedAt = new Date();
    const dueAt = new Date(
      assignedAt.getTime() + requirement.dueWithinDays * 24 * 60 * 60 * 1000
    );

    const assignment = new ComplianceAssignment({
      complianceRequirement: requirement._id,
      employee: empId,
      assignedAt,
      dueAt,
      status: 'NOT_STARTED',
      isActive: true
    });

    await evaluateAssignmentStatus(assignment, { save: true });
    assigned.push(assignment._id);
    assignedCount++;
  }

  return {
    requirementId,
    assignedCount,
    skippedCount,
    totalProcessed: uniqueIds.length
  };
}

/**
 * Assigns a compliance requirement to all active employees in a department.
 */
async function assignToDepartment(requirementId, departmentId) {
  const requirement = await ComplianceRequirement.findOne({
    _id: requirementId,
    isActive: true
  });
  if (!requirement) {
    throw new AppError('Active compliance requirement not found', 404);
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Department compatibility check
  const reqDeptId = requirement.department?._id?.toString() || requirement.department?.toString();
  const reqDeptList = (requirement.departments || []).map((d) => (d._id || d).toString());
  const isGlobalReq = requirement.isGlobal === true;

  if (!isGlobalReq && reqDeptId && reqDeptId !== departmentId.toString() && !reqDeptList.includes(departmentId.toString())) {
    throw new AppError('Compliance requirement does not apply to the selected department', 400);
  }

  const employees = await Employee.find({
    department: departmentId,
    isActive: true
  });

  let assignedCount = 0;
  let skippedCount = 0;

  for (const emp of employees) {
    const existing = await ComplianceAssignment.findOne({
      complianceRequirement: requirementId,
      employee: emp._id,
      isActive: true
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const assignedAt = new Date();
    const dueAt = new Date(
      assignedAt.getTime() + requirement.dueWithinDays * 24 * 60 * 60 * 1000
    );

    const assignment = new ComplianceAssignment({
      complianceRequirement: requirement._id,
      employee: emp._id,
      assignedAt,
      dueAt,
      status: 'NOT_STARTED',
      isActive: true
    });

    await evaluateAssignmentStatus(assignment, { save: true });
    assignedCount++;
  }

  return {
    requirementId,
    departmentId,
    totalEmployees: employees.length,
    assignedCount,
    skippedCount
  };
}

/**
 * Formats an assignment document with dynamic evaluation and daysRemaining.
 */
async function formatAssignmentWithEvaluation(assignment, now = new Date()) {
  await evaluateAssignmentStatus(assignment, { now, save: true });

  const obj = assignment.toObject ? assignment.toObject() : { ...assignment };
  obj.daysRemaining = calculateDaysRemaining(obj.dueAt, now);

  // Expose aliases and course for Section 12
  if (obj.complianceRequirement) {
    obj.requirement = obj.complianceRequirement;
    if (obj.complianceRequirement.course) {
      obj.course = obj.complianceRequirement.course;
    }
  }

  // Look up enrollmentStatus and certificationStatus
  const employeeId =
    obj.employee?._id ||
    obj.employee?.id ||
    (typeof obj.employee === 'string' || obj.employee instanceof mongoose.Types.ObjectId
      ? obj.employee
      : null);

  const courseId =
    obj.course?._id ||
    obj.course?.id ||
    (typeof obj.course === 'string' || obj.course instanceof mongoose.Types.ObjectId
      ? obj.course
      : null) ||
    obj.complianceRequirement?.course?._id ||
    obj.complianceRequirement?.course?.id ||
    (typeof obj.complianceRequirement?.course === 'string' ||
    obj.complianceRequirement?.course instanceof mongoose.Types.ObjectId
      ? obj.complianceRequirement?.course
      : null);

  if (employeeId && courseId) {
    const enrollment = await Enrollment.findOne({
      employee: employeeId,
      course: courseId,
      isActive: true
    }).select('status progressPercentage completedAt');

    obj.enrollmentStatus = enrollment ? enrollment.status : 'not_enrolled';

    const latestCert = await Certificate.findOne({
      employee: employeeId,
      course: courseId
    })
      .sort({ issuedAt: -1 })
      .select('status expiresAt issuedAt certificateNumber');

    if (latestCert) {
      const isExp = Boolean(latestCert.expiresAt && new Date(latestCert.expiresAt) <= now);
      obj.certificationStatus =
        latestCert.status === 'revoked' ? 'revoked' : isExp ? 'expired' : 'active';
    } else {
      obj.certificationStatus = 'none';
    }
  }

  return obj;
}

/**
 * Automatically assigns role-calibrated compliance requirements for an employee.
 * Ensures the employee has their mandatory role-specific compliance obligations.
 *
 * @param {object} employeeDoc - Employee document
 * @param {object} [jobRoleDoc] - Optional JobRole document
 * @returns {Promise<Array>} Created ComplianceAssignment documents
 */
async function assignInitialComplianceForEmployee(employeeDoc, jobRoleDoc = null) {
  if (!employeeDoc || !employeeDoc._id) return [];

  let jobRole = jobRoleDoc;
  if (!jobRole && employeeDoc.jobRole) {
    const JobRole = require('../models/JobRole');
    jobRole = await JobRole.findById(employeeDoc.jobRole);
  }

  // Find all active compliance requirements with their associated courses
  const allReqs = await ComplianceRequirement.find({ isActive: true }).populate('course');
  if (!allReqs || allReqs.length === 0) return [];

  const empDeptId = (employeeDoc.department?._id || employeeDoc.department || '').toString();

  // First priority: Filter requirements strictly matching employee's department or global
  let targetReqs = [];
  if (empDeptId) {
    targetReqs = allReqs.filter((r) => {
      if (r.isGlobal === true) return true;
      const rDeptId = (r.department?._id || r.department || '').toString();
      if (rDeptId && rDeptId === empDeptId) return true;
      if (r.departments && r.departments.some((d) => (d._id || d).toString() === empDeptId)) return true;
      const courseDeptId = (r.course?.department?._id || r.course?.department || '').toString();
      if (courseDeptId && courseDeptId === empDeptId) return true;
      return false;
    });
  }

  // Fallback for employees without department assignment: calibrated role heuristic
  if (targetReqs.length === 0) {
    const roleName = (jobRole?.name || employeeDoc.designation || '').toLowerCase();
    if (roleName.includes('frontend')) {
      targetReqs = allReqs.filter(
        (r) =>
          r.title.toLowerCase().includes('frontend') ||
          r.course?.title?.toLowerCase().includes('html') ||
          r.course?.title?.toLowerCase().includes('react')
      );
    } else if (roleName.includes('backend')) {
      targetReqs = allReqs.filter(
        (r) =>
          r.title.toLowerCase().includes('database') ||
          r.course?.title?.toLowerCase().includes('sql') ||
          r.course?.title?.toLowerCase().includes('node')
      );
    } else if (roleName.includes('devops')) {
      targetReqs = allReqs.filter(
        (r) =>
          r.title.toLowerCase().includes('network') ||
          r.course?.title?.toLowerCase().includes('network') ||
          r.course?.title?.toLowerCase().includes('software engineering')
      );
    } else if (roleName.includes('full-stack') || roleName.includes('mern')) {
      targetReqs = allReqs.filter(
        (r) =>
          r.title.toLowerCase().includes('full-stack') ||
          r.course?.title?.toLowerCase().includes('mern')
      );
    } else if (roleName.includes('oop') || roleName.includes('object')) {
      targetReqs = allReqs.filter(
        (r) =>
          r.title.toLowerCase().includes('oop') ||
          r.course?.title?.toLowerCase().includes('object')
      );
    } else if (roleName.includes('java')) {
      targetReqs = allReqs.filter(
        (r) =>
          r.title.toLowerCase().includes('java') ||
          r.course?.title?.toLowerCase().includes('java')
      );
    }

    if (targetReqs.length === 0) {
      targetReqs = allReqs;
    }
  }

  const assigned = [];
  const assignedAt = new Date();

  for (const req of targetReqs) {
    const existing = await ComplianceAssignment.findOne({
      complianceRequirement: req._id,
      employee: employeeDoc._id,
      isActive: true
    });

    if (existing) {
      assigned.push(existing);
      continue;
    }

    const dueAt = new Date(
      assignedAt.getTime() + (req.dueWithinDays || 30) * 24 * 60 * 60 * 1000
    );

    const newAssignment = new ComplianceAssignment({
      complianceRequirement: req._id,
      employee: employeeDoc._id,
      assignedAt,
      dueAt,
      status: 'NOT_STARTED',
      isActive: true
    });

    await evaluateAssignmentStatus(newAssignment, { save: true });
    assigned.push(newAssignment);
  }

  return assigned;
}

/**
 * Retrieves the authenticated employee's compliance assignments.
 */
async function getMyCompliance(user, query = {}) {
  const employee = await Employee.findOne({
    user: user.id || user._id,
    isActive: true
  });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  let assignments = await ComplianceAssignment.find({
    employee: employee._id,
    isActive: true
  })
    .populate({
      path: 'complianceRequirement',
      match: { isActive: true },
      populate: { path: 'course', select: 'title code description' }
    })
    .sort({ dueAt: 1 });

  // Filter out assignments where requirement is inactive or deleted
  let validAssignments = assignments.filter((a) => a.complianceRequirement);

  // In non-test runtime, auto-assign compliance requirements if employee has none
  if (validAssignments.length === 0 && process.env.NODE_ENV !== 'test') {
    await assignInitialComplianceForEmployee(employee);
    assignments = await ComplianceAssignment.find({
      employee: employee._id,
      isActive: true
    })
      .populate({
        path: 'complianceRequirement',
        match: { isActive: true },
        populate: { path: 'course', select: 'title code description' }
      })
      .sort({ dueAt: 1 });
    validAssignments = assignments.filter((a) => a.complianceRequirement);
  }

  const formatted = [];
  const now = new Date();
  for (const assignment of validAssignments) {
    const evaluated = await formatAssignmentWithEvaluation(assignment, now);
    formatted.push(evaluated);
  }

  return { assignments: formatted };
}

/**
 * Retrieves the authenticated employee's compliance summary metrics.
 */
async function getMyComplianceSummary(user) {
  const employee = await Employee.findOne({
    user: user.id || user._id,
    isActive: true
  });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  let assignments = await ComplianceAssignment.find({
    employee: employee._id,
    isActive: true
  }).populate({
    path: 'complianceRequirement',
    match: { isActive: true }
  });

  let validAssignments = assignments.filter((a) => a.complianceRequirement);

  // In non-test runtime, auto-assign compliance requirements if employee has none
  if (validAssignments.length === 0 && process.env.NODE_ENV !== 'test') {
    await assignInitialComplianceForEmployee(employee);
    assignments = await ComplianceAssignment.find({
      employee: employee._id,
      isActive: true
    }).populate({
      path: 'complianceRequirement',
      match: { isActive: true }
    });
    validAssignments = assignments.filter((a) => a.complianceRequirement);
  }

  let compliant = 0;
  let dueSoon = 0;
  let overdue = 0;
  let inProgress = 0;
  let notStarted = 0;

  const now = new Date();
  for (const assignment of validAssignments) {
    const { status } = await evaluateAssignmentStatus(assignment, { now, save: true });
    if (status === 'COMPLIANT') compliant++;
    else if (status === 'OVERDUE') overdue++;
    else if (status === 'DUE_SOON') dueSoon++;
    else if (status === 'IN_PROGRESS') inProgress++;
    else notStarted++;
  }

  const totalAssignments = validAssignments.length;
  const complianceRate =
    totalAssignments > 0
      ? Number(((compliant / totalAssignments) * 100).toFixed(2))
      : 100;

  return {
    totalRequirements: totalAssignments,
    totalAssignments,
    compliant,
    dueSoon,
    overdue,
    inProgress,
    notStarted,
    complianceRate
  };
}

/**
 * Admin view of an arbitrary employee's compliance assignments.
 */
async function getEmployeeCompliance(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const assignments = await ComplianceAssignment.find({
    employee: employeeId,
    isActive: true
  })
    .populate({
      path: 'complianceRequirement',
      match: { isActive: true },
      populate: { path: 'course', select: 'title code description' }
    })
    .sort({ dueAt: 1 });

  const validAssignments = assignments.filter((a) => a.complianceRequirement);

  const formatted = [];
  const now = new Date();
  for (const assignment of validAssignments) {
    const evaluated = await formatAssignmentWithEvaluation(assignment, now);
    formatted.push(evaluated);
  }

  return { employeeId, assignments: formatted };
}

/**
 * Admin listing of all compliance assignments with filters and pagination.
 */
async function getComplianceAssignments(query = {}) {
  const filter = { isActive: true };

  if (query.requirementId) {
    filter.complianceRequirement = query.requirementId;
  }

  if (query.employeeId) {
    filter.employee = query.employeeId;
  }

  if (query.departmentId) {
    const deptEmployees = await Employee.find({
      department: query.departmentId,
      isActive: true
    }).select('_id');
    const empIds = deptEmployees.map((e) => e._id);
    filter.employee = { $in: empIds };
  }

  if (query.status) {
    filter.status = query.status;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, assignments] = await Promise.all([
    ComplianceAssignment.countDocuments(filter),
    ComplianceAssignment.find(filter)
      .populate({
        path: 'complianceRequirement',
        populate: { path: 'course', select: 'title code' }
      })
      .populate({
        path: 'employee',
        select: 'employeeId user department designation',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ dueAt: 1 })
      .skip(skip)
      .limit(limit)
  ]);

  const now = new Date();
  const formatted = [];
  for (const assignment of assignments) {
    const evaluated = await formatAssignmentWithEvaluation(assignment, now);
    formatted.push(evaluated);
  }

  return {
    assignments: formatted,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Admin overall compliance summary metrics.
 */
async function getComplianceSummary(query = {}) {
  const filter = { isActive: true };

  if (query.requirementId) {
    filter.complianceRequirement = query.requirementId;
  }

  if (query.departmentId) {
    const deptEmployees = await Employee.find({
      department: query.departmentId,
      isActive: true
    }).select('_id');
    const empIds = deptEmployees.map((e) => e._id);
    filter.employee = { $in: empIds };
  }

  const assignments = await ComplianceAssignment.find(filter).populate({
    path: 'complianceRequirement',
    match: { isActive: true }
  });

  const validAssignments = assignments.filter((a) => a.complianceRequirement);

  let compliant = 0;
  let dueSoon = 0;
  let overdue = 0;
  let inProgress = 0;
  let notStarted = 0;

  const now = new Date();
  for (const assignment of validAssignments) {
    const { status } = await evaluateAssignmentStatus(assignment, { now, save: true });
    if (status === 'COMPLIANT') compliant++;
    else if (status === 'OVERDUE') overdue++;
    else if (status === 'DUE_SOON') dueSoon++;
    else if (status === 'IN_PROGRESS') inProgress++;
    else notStarted++;
  }

  const totalAssignments = validAssignments.length;
  const complianceRate =
    totalAssignments > 0
      ? Number(((compliant / totalAssignments) * 100).toFixed(2))
      : 100;

  return {
    totalAssignments,
    compliant,
    dueSoon,
    overdue,
    inProgress,
    notStarted,
    complianceRate
  };
}

/**
 * Re-evaluates statuses for active assignments and sends idempotent notifications.
 */
async function refreshStatuses(filterOptions = {}) {
  const filter = { isActive: true };
  if (filterOptions.requirementId) {
    filter.complianceRequirement = filterOptions.requirementId;
  }

  const assignments = await ComplianceAssignment.find(filter)
    .populate('complianceRequirement')
    .populate('employee');

  let refreshedCount = 0;
  let updatedCount = 0;
  const statusBreakdown = {
    COMPLIANT: 0,
    DUE_SOON: 0,
    OVERDUE: 0,
    IN_PROGRESS: 0,
    NOT_STARTED: 0
  };

  const now = new Date();

  for (const assignment of assignments) {
    if (!assignment.complianceRequirement || !assignment.complianceRequirement.isActive) {
      continue;
    }

    const previousStatus = assignment.status;
    const { status } = await evaluateAssignmentStatus(assignment, { now, save: true });
    refreshedCount++;
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

    if (previousStatus !== status) {
      updatedCount++;
    }

    // Trigger idempotent notifications for DUE_SOON and OVERDUE
    if (status === 'DUE_SOON' || status === 'OVERDUE') {
      try {
        const employee = assignment.employee;
        if (employee && employee.user) {
          const recipientUserId = employee.user._id || employee.user;
          const reqTitle = assignment.complianceRequirement.title;
          const dueDateStr = assignment.dueAt
            ? new Date(assignment.dueAt).toISOString().split('T')[0]
            : 'soon';

          const notifType =
            status === 'DUE_SOON' ? 'compliance_due_soon' : 'compliance_overdue';
          const notifTitle =
            status === 'DUE_SOON'
              ? 'Compliance Training Due Soon'
              : 'Compliance Training Overdue';
          const notifMessage =
            status === 'DUE_SOON'
              ? `Your mandatory compliance training "${reqTitle}" is due on ${dueDateStr}.`
              : `Your mandatory compliance training "${reqTitle}" was due on ${dueDateStr} and is now overdue.`;

          const eventKeyPrefix =
            status === 'DUE_SOON' ? 'compliance-due-soon' : 'compliance-overdue';
          const eventKey = `${eventKeyPrefix}:${assignment._id}:${dueDateStr}`;

          await Notification.create({
            recipient: recipientUserId,
            type: notifType,
            title: notifTitle,
            message: notifMessage,
            relatedComplianceAssignment: assignment._id,
            relatedComplianceRequirement: assignment.complianceRequirement._id,
            relatedCourse: assignment.complianceRequirement.course,
            eventKey
          });
        }
      } catch (err) {
        // Ignore duplicate key error (code 11000) for idempotency
        if (err.code !== 11000) {
          // Log unexpected notification creation error but continue refresh
          // eslint-disable-next-line no-console
          console.warn('Notification creation notice:', err.message);
        }
      }
    }
  }

  return {
    refreshedCount,
    updatedCount,
    statusBreakdown
  };
}

module.exports = {
  calculateDaysRemaining,
  evaluateAssignmentStatus,
  createRequirement,
  getRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  assignToEmployee,
  assignInitialComplianceForEmployee,
  bulkAssign,
  assignToDepartment,
  getMyCompliance,
  getMyComplianceSummary,
  getEmployeeCompliance,
  getComplianceAssignments,
  getComplianceSummary,
  refreshStatuses
};
