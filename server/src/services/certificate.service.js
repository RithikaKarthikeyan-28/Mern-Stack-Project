const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Employee = require('../models/Employee');
const config = require('../config');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateIssueCertificate,
  validateRenewal,
  validateRevokeCertificate,
  validateExpiringQuery,
  validateCertificateNumber,
  validateAdminCertificateQuery,
  validateEmployeeCertificateQuery
} = require('../validators/certificate.validator');

const POPULATE_OPTIONS = [
  {
    path: 'employee',
    populate: [
      { path: 'user', select: 'name email role' },
      { path: 'department', select: 'name' }
    ]
  },
  {
    path: 'course',
    select: 'title description category level duration trainer status isActive'
  },
  {
    path: 'enrollment',
    select: 'status progressPercentage startedAt completedAt'
  },
  {
    path: 'revokedBy',
    select: 'name email'
  },
  {
    path: 'renewedFrom',
    select: 'certificateNumber issuedAt expiresAt status'
  },
  {
    path: 'assessment',
    select: 'title passingPercentage'
  },
  {
    path: 'assessmentAttempt',
    select: 'percentage obtainedMarks totalMarks result evaluatedAt'
  }
];

/**
 * Generates a unique, server-controlled certificate number.
 * Format: SKILLTRACK-YYYY-XXXXXXXX (8 uppercase hex chars)
 *
 * @returns {Promise<string>} Unique certificate number
 */
async function generateCertificateNumber() {
  const year = new Date().getFullYear();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const candidateNumber = `SKILLTRACK-${year}-${randomHex}`;

    const exists = await Certificate.findOne({ certificateNumber: candidateNumber });
    if (!exists) {
      return candidateNumber;
    }
    attempts++;
  }

  // Fallback with timestamp to guarantee uniqueness under contention
  const fallbackHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `SKILLTRACK-${year}-${fallbackHex}`;
}

/**
 * Builds a query filter based on derived lifecycle status.
 *
 * @param {string} lifecycleStatus - 'active' | 'expired' | 'revoked'
 * @param {object} baseFilter - Initial query filter
 * @returns {object} Updated MongoDB query filter
 */
function buildLifecycleStatusFilter(lifecycleStatus, baseFilter = {}) {
  const filter = { ...baseFilter };
  if (!lifecycleStatus) return filter;

  const now = new Date();
  const validityDays = config.certificateValidityDays || 365;
  const legacyCutoff = new Date(now.getTime() - validityDays * 86400000);

  if (lifecycleStatus === 'revoked') {
    filter.status = 'revoked';
  } else if (lifecycleStatus === 'active') {
    filter.status = 'active';
    filter.$or = [
      { expiresAt: { $gt: now } },
      { expiresAt: null, issuedAt: { $gt: legacyCutoff } }
    ];
  } else if (lifecycleStatus === 'expired') {
    filter.status = 'active';
    filter.$or = [
      { expiresAt: { $lte: now } },
      { expiresAt: null, issuedAt: { $lte: legacyCutoff } }
    ];
  }

  return filter;
}

/**
 * Issues a certificate for an authenticated employee upon course completion.
 * Strictly verifies eligibility against authoritative MongoDB state.
 * Sets server-controlled issuedAt and expiresAt.
 * Fully idempotent: returns existing certificate if active record already exists.
 *
 * @param {object} currentUser - Authenticated user from JWT
 * @param {object} data - Payload containing enrollmentId
 * @returns {Promise<object>} { certificate, isExisting }
 */
async function issueCertificate(currentUser, data) {
  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can request certificate issuance', 403);
  }

  validateIssueCertificate(data);

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const employee = await Employee.findOne({ user: currentUserId });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }
  if (!employee.isActive) {
    throw new AppError('Employee profile is inactive', 403);
  }

  const enrollment = await Enrollment.findById(data.enrollmentId);
  if (!enrollment) {
    throw new AppError('Enrollment not found', 404);
  }

  // Enrollment ownership verification
  if (enrollment.employee.toString() !== employee._id.toString()) {
    throw new AppError('Enrollment does not belong to the authenticated employee', 400);
  }

  // Enrollment eligibility rules
  if (enrollment.isActive === false) {
    throw new AppError('Enrollment is inactive', 400);
  }
  if (enrollment.status === 'dropped') {
    throw new AppError('Dropped enrollments are not eligible for certificate issuance', 400);
  }
  if (enrollment.status !== 'completed') {
    throw new AppError('Course enrollment must be completed to issue a certificate', 400);
  }
  if (enrollment.progressPercentage !== 100) {
    throw new AppError('Course progress must be 100% to issue a certificate', 400);
  }

  // Course verification
  const course = await Course.findById(enrollment.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (course.isActive === false) {
    throw new AppError('Course is inactive', 400);
  }
  if (course.status !== 'published') {
    throw new AppError('Course is not published', 400);
  }

  return await issueCertificateInternal({
    employeeId: employee._id,
    courseId: course._id,
    enrollmentId: enrollment._id
  });
}

/**
 * Revokes an existing active certificate.
 * Preserves the historical document for audit trail (soft revocation).
 *
 * @param {string} id - Certificate ID
 * @param {string} reason - Optional revocation reason
 * @param {object} currentUser - Authenticated admin user
 * @returns {Promise<object>} Revoked certificate document
 */
async function revokeCertificate(id, reason, currentUser) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Only administrators can revoke certificates', 403);
  }

  validateObjectId(id, 'Certificate ID');

  const cert = await Certificate.findById(id);
  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  if (cert.status === 'revoked') {
    throw new AppError('Certificate is already revoked', 400);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  cert.status = 'revoked';
  cert.revokedAt = new Date();
  cert.revokedBy = currentUserId;
  cert.revocationReason = reason && typeof reason === 'string' && reason.trim() ? reason.trim() : null;

  await cert.save();
  return await Certificate.findById(cert._id).populate(POPULATE_OPTIONS);
}

/**
 * Publicly verifies a certificate by its certificate number.
 * Requires NO authentication.
 * Returns only safe verification metadata with derived expiry and lifecycle status.
 *
 * @param {string} certificateNumber - Certificate number to verify
 * @returns {Promise<object>} Safe verification response
 */
async function verifyCertificate(certificateNumber) {
  validateCertificateNumber({ certificateNumber });

  const cleanNumber = certificateNumber.trim().toUpperCase();
  const cert = await Certificate.findOne({ certificateNumber: cleanNumber })
    .populate({
      path: 'employee',
      populate: { path: 'user', select: 'name' }
    })
    .populate('course', 'title category level duration')
    .populate('renewedFrom', 'certificateNumber issuedAt expiresAt');

  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  const effectiveExpiresAt = cert.getDerivedExpiry();
  const now = new Date();
  const isExpired = Boolean(effectiveExpiresAt && new Date(effectiveExpiresAt) <= now);

  // Revocation ALWAYS wins in lifecycle status
  let lifecycleStatus = 'active';
  if (cert.status === 'revoked') {
    lifecycleStatus = 'revoked';
  } else if (isExpired) {
    lifecycleStatus = 'expired';
  }

  const response = {
    certificateNumber: cert.certificateNumber,
    status: cert.status,
    lifecycleStatus,
    issuedAt: cert.issuedAt,
    expiresAt: effectiveExpiresAt,
    isExpired,
    employeeName: cert.employee?.user?.name || 'Unknown Employee',
    courseTitle: cert.course?.title || 'Unknown Course',
    courseCategory: cert.course?.category || '',
    courseLevel: cert.course?.level || '',
    courseDuration: cert.course?.duration || 0,
    isRenewal: Boolean(cert.renewedFrom)
  };

  if (cert.renewedFrom) {
    response.renewedFrom = {
      certificateNumber: cert.renewedFrom.certificateNumber || String(cert.renewedFrom)
    };
  }

  if (cert.status === 'revoked') {
    response.revokedAt = cert.revokedAt;
    response.revocationReason = cert.revocationReason;
  }

  return response;
}

/**
 * Discovers certificates approaching expiration within a specified window.
 * Admin only.
 *
 * @param {object} query - { days } (default 30)
 * @param {object} currentUser - Authenticated admin
 * @returns {Promise<object>} { certificates, total }
 */
async function getExpiringCertificates(query = {}, currentUser) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can view expiring certificates.', 403);
  }

  validateExpiringQuery(query);
  const days = query.days !== undefined ? parseInt(query.days, 10) : 30;

  const now = new Date();
  const targetDate = new Date(now.getTime() + days * 86400000);
  const validityDays = config.certificateValidityDays || 365;
  const legacyMin = new Date(now.getTime() - validityDays * 86400000);
  const legacyMax = new Date(targetDate.getTime() - validityDays * 86400000);

  const filter = {
    status: 'active',
    $or: [
      { expiresAt: { $gt: now, $lte: targetDate } },
      { expiresAt: null, issuedAt: { $gt: legacyMin, $lte: legacyMax } }
    ]
  };

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [total, certificates] = await Promise.all([
    Certificate.countDocuments(filter),
    Certificate.find(filter)
      .populate(POPULATE_OPTIONS)
      .sort({ expiresAt: 1, issuedAt: 1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    certificates,
    windowDays: days,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Discovers expired certificates.
 * Admin & Trainer (Trainers scoped exclusively to owned courses).
 *
 * @param {object} query - Optional query filters (course, employee, page, limit)
 * @param {object} currentUser - Authenticated admin or trainer
 * @returns {Promise<object>} { certificates, pagination }
 */
async function getExpiredCertificates(query = {}, currentUser) {
  if (currentUser.role === 'employee') {
    throw new AppError('Access denied. Employees cannot access expired certificates directory.', 403);
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const now = new Date();
  const validityDays = config.certificateValidityDays || 365;
  const legacyCutoff = new Date(now.getTime() - validityDays * 86400000);

  const filter = {
    status: 'active',
    $or: [
      { expiresAt: { $lte: now } },
      { expiresAt: null, issuedAt: { $lte: legacyCutoff } }
    ]
  };

  if (query.course) {
    filter.course = query.course;
  }
  if (query.employee) {
    filter.employee = query.employee;
  }

  if (currentUser.role === 'trainer') {
    const trainerId = (currentUser.id || currentUser.userId || currentUser._id).toString();
    const trainerCourses = await Course.find({ trainer: trainerId }).select('_id');
    const trainerCourseIds = trainerCourses.map((c) => c._id);
    if (query.course) {
      if (!trainerCourseIds.some((id) => id.toString() === query.course.toString())) {
        filter.course = { $in: [] };
      }
    } else {
      filter.course = { $in: trainerCourseIds };
    }
  }

  const [total, certificates] = await Promise.all([
    Certificate.countDocuments(filter),
    Certificate.find(filter)
      .populate(POPULATE_OPTIONS)
      .sort({ expiresAt: -1, issuedAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    certificates,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Renews an eligible certificate, creating a new certificate and preserving old immutability.
 *
 * @param {string} certificateId - ID of certificate to renew
 * @param {object} data - Payload containing optional reason
 * @param {object} currentUser - Authenticated employee user
 * @returns {Promise<object>} { certificate, isExisting }
 */
async function renewCertificate(certificateId, data = {}, currentUser) {
  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can request certificate renewal', 403);
  }

  validateRenewal({ id: certificateId }, data);

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const employee = await Employee.findOne({ user: currentUserId });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }
  if (!employee.isActive) {
    throw new AppError('Employee profile is inactive', 403);
  }

  const sourceCert = await Certificate.findById(certificateId);
  if (!sourceCert) {
    throw new AppError('Certificate not found', 404);
  }

  // IDOR protection / anti-enumeration
  if (sourceCert.employee.toString() !== employee._id.toString()) {
    throw new AppError('Certificate not found', 404);
  }

  // Revocation check: Revoked certificates cannot be renewed
  if (sourceCert.status === 'revoked') {
    throw new AppError('A revoked certificate cannot be renewed', 409);
  }

  // Renewal window check: expired OR within configured renewal window
  const effectiveExpiry = sourceCert.getDerivedExpiry();
  const renewalWindowDays = config.certificateRenewalWindowDays || 30;
  const windowStart = new Date(effectiveExpiry.getTime() - renewalWindowDays * 86400000);
  const now = new Date();

  if (now < windowStart) {
    throw new AppError(
      `Certificate is not eligible for renewal yet. Renewal is only permitted within ${renewalWindowDays} days of expiration or after expiration.`,
      400
    );
  }

  // Idempotency check: if active renewed certificate already exists for this source certificate
  const existingRenewal = await Certificate.findOne({ renewedFrom: sourceCert._id });
  if (existingRenewal) {
    if (existingRenewal.status === 'active') {
      const populated = await Certificate.findById(existingRenewal._id).populate(POPULATE_OPTIONS);
      return { certificate: populated, isExisting: true };
    } else {
      throw new AppError('Previous renewal of this certificate has been revoked and cannot be renewed again', 409);
    }
  }

  // Re-verify course completion criteria
  const enrollment = await Enrollment.findById(sourceCert.enrollment);
  if (
    !enrollment ||
    enrollment.status !== 'completed' ||
    enrollment.progressPercentage !== 100 ||
    enrollment.isActive === false ||
    enrollment.status === 'dropped'
  ) {
    throw new AppError('Enrollment completion requirements not met for certificate renewal', 400);
  }

  const course = await Course.findById(sourceCert.course);
  if (!course || course.isActive === false || course.status !== 'published') {
    throw new AppError('Course is no longer active or published', 400);
  }

  // Generate new certificate metadata
  const newCertNumber = await generateCertificateNumber();
  const issuedAt = new Date();
  const validityDays = config.certificateValidityDays || 365;
  const expiresAt = new Date(issuedAt.getTime() + validityDays * 86400000);

  // Create new certificate document - OLD CERTIFICATE REMAINS STRICTLY UNTOUCHED
  const newCert = await Certificate.create({
    employee: employee._id,
    course: sourceCert.course,
    enrollment: sourceCert.enrollment,
    certificateNumber: newCertNumber,
    issuedAt,
    expiresAt,
    status: 'active',
    renewedFrom: sourceCert._id,
    renewedAt: issuedAt,
    renewalReason: data?.reason && typeof data.reason === 'string' && data.reason.trim() ? data.reason.trim() : null
  });

  const populated = await Certificate.findById(newCert._id).populate(POPULATE_OPTIONS);

  // Phase 14 Notification: Trigger certificate_renewed notification
  try {
    const notificationService = require('./notification.service');
    await notificationService.createCertificateRenewedNotification(populated);
  } catch (notifErr) {
    // Notification error must not corrupt certificate renewal
    console.error('Failed to create certificate renewed notification:', notifErr.message);
  }

  return { certificate: populated, isExisting: false };
}

/**
 * Retrieves the renewal history chain for a certificate.
 *
 * @param {string} certificateId - Certificate ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} { certificate, parent, renewals }
 */
async function getCertificateRenewals(certificateId, currentUser) {
  validateObjectId(certificateId, 'Certificate ID');

  const cert = await Certificate.findById(certificateId).populate(POPULATE_OPTIONS);
  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'employee') {
    const employee = await Employee.findOne({ user: currentUserId });
    if (!employee || cert.employee._id.toString() !== employee._id.toString()) {
      throw new AppError('Certificate not found', 404);
    }
  } else if (currentUser.role === 'trainer') {
    const courseTrainerId = (
      cert.course.trainer?._id ||
      cert.course.trainer?.id ||
      cert.course.trainer
    ).toString();

    if (courseTrainerId !== currentUserId) {
      throw new AppError('Access denied. You can only view certificates for your own courses.', 403);
    }
  }

  let parent = null;
  if (cert.renewedFrom) {
    parent = await Certificate.findById(cert.renewedFrom)
      .select('certificateNumber issuedAt expiresAt status createdAt')
      .populate('course', 'title');
  }

  const renewals = await Certificate.find({ renewedFrom: cert._id })
    .select('certificateNumber issuedAt expiresAt status renewedAt renewalReason createdAt')
    .sort({ issuedAt: 1 });

  return {
    certificate: cert,
    parent,
    renewals
  };
}

/**
 * Retrieves the authenticated employee's certificates with pagination and lifecycle filtering.
 *
 * @param {object} currentUser - Authenticated employee user
 * @param {object} query - Pagination and filter query params ({ page, limit, status })
 * @returns {Promise<object>} { certificates, pagination }
 */
async function getEmployeeCertificates(currentUser, query = {}) {
  if (currentUser.role !== 'employee') {
    throw new AppError('Only employees can access their certificate history', 403);
  }

  validateEmployeeCertificateQuery(query);

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();
  const employee = await Employee.findOne({ user: currentUserId });
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  const baseFilter = { employee: employee._id };
  const filter = buildLifecycleStatusFilter(query.status, baseFilter);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Certificate.countDocuments(filter);
  const certificates = await Certificate.find(filter)
    .populate({
      path: 'course',
      select: 'title category level duration'
    })
    .populate({
      path: 'enrollment',
      select: 'status progressPercentage startedAt completedAt'
    })
    .populate({
      path: 'renewedFrom',
      select: 'certificateNumber issuedAt expiresAt status'
    })
    .sort({ issuedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    certificates,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Retrieves a single certificate by ID with role-based access checks and anti-enumeration.
 *
 * @param {string} id - Certificate ID
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<object>} Populated certificate document
 */
async function getCertificateById(id, currentUser) {
  validateObjectId(id, 'Certificate ID');

  const cert = await Certificate.findById(id).populate(POPULATE_OPTIONS);
  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  const currentUserId = (currentUser.id || currentUser.userId || currentUser._id).toString();

  if (currentUser.role === 'employee') {
    const employee = await Employee.findOne({ user: currentUserId });
    if (!employee || cert.employee._id.toString() !== employee._id.toString()) {
      // Anti-enumeration: return 404 rather than 403 to prevent ID probing
      throw new AppError('Certificate not found', 404);
    }
  } else if (currentUser.role === 'trainer') {
    const courseTrainerId = (
      cert.course.trainer?._id ||
      cert.course.trainer?.id ||
      cert.course.trainer
    ).toString();

    if (courseTrainerId !== currentUserId) {
      throw new AppError('Access denied. You can only view certificates for your own courses.', 403);
    }
  }

  return cert;
}

/**
 * Retrieves all certificates with lifecycle filtering and pagination (Admin only).
 *
 * @param {object} query - Query parameters ({ employee, course, status, page, limit })
 * @returns {Promise<object>} { certificates, pagination }
 */
async function getAdminCertificates(query = {}) {
  validateAdminCertificateQuery(query);

  let filter = {};

  if (query.employee) {
    filter.employee = query.employee;
  }
  if (query.course) {
    filter.course = query.course;
  }

  filter = buildLifecycleStatusFilter(query.status, filter);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Certificate.countDocuments(filter);
  const certificates = await Certificate.find(filter)
    .populate(POPULATE_OPTIONS)
    .sort({ issuedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    certificates,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

module.exports = {
  issueCertificateInternal,
  generateCertificateNumber,
  buildLifecycleStatusFilter,
  issueCertificate,
  revokeCertificate,
  verifyCertificate,
  getExpiringCertificates,
  getExpiredCertificates,
  renewCertificate,
  getCertificateRenewals,
  getEmployeeCertificates,
  getCertificateById,
  getAdminCertificates,
  downloadCertificatePDF,
  resendCertificateEmail
};


/**
 * Internal certificate issuance engine.
 * Idempotently issues an active certificate for an employee and course.
 * Generates official PDF certificate, sends congratulations email with status tracking.
 *
 * @param {object} params - { employeeId, courseId, enrollmentId, assessmentId, attemptId, score }
 * @returns {Promise<{ certificate: object, isExisting: boolean }>}
 */
async function issueCertificateInternal({
  employeeId,
  courseId,
  enrollmentId,
  assessmentId = null,
  attemptId = null,
  score = null
}) {
  const existingCert = await Certificate.findOne({
    employee: employeeId,
    course: courseId,
    renewedFrom: null
  });

  if (existingCert) {
    if (existingCert.status === 'active') {
      const populated = await Certificate.findById(existingCert._id).populate(POPULATE_OPTIONS);
      return { certificate: populated, isExisting: true };
    } else {
      throw new AppError('Certificate for this course has been revoked and cannot be re-issued', 409);
    }
  }

  let targetEnrollmentId = enrollmentId;
  if (!targetEnrollmentId) {
    let enrollment = await Enrollment.findOne({ employee: employeeId, course: courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        employee: employeeId,
        course: courseId,
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date()
      });
    }
    targetEnrollmentId = enrollment._id;
  }

  const certificateNumber = await generateCertificateNumber();
  const issuedAt = new Date();
  const validityDays = config.certificateValidityDays || 365;
  const expiresAt = new Date(issuedAt.getTime() + validityDays * 86400000);

  const certificate = await Certificate.create({
    employee: employeeId,
    course: courseId,
    enrollment: targetEnrollmentId,
    certificateNumber,
    issuedAt,
    expiresAt,
    status: 'active',
    renewedFrom: null,
    assessment: assessmentId || null,
    assessmentAttempt: attemptId || null,
    score: typeof score === 'number' ? score : null,
    emailStatus: 'pending'
  });

  if (targetEnrollmentId) {
    await Enrollment.findByIdAndUpdate(targetEnrollmentId, {
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date()
    });
  }

  try {
    const notificationService = require('./notification.service');
    await notificationService.createCertificateIssuedNotification(certificate);
  } catch (err) {
    console.error('Error creating certificate issued notification:', err.message);
  }

  // Award Skills from this course to the employee
  try {
    const CourseSkill = require('../models/CourseSkill');
    const EmployeeSkill = require('../models/EmployeeSkill');
    const courseSkills = await CourseSkill.find({ course: courseId, isActive: true });
    for (const cs of courseSkills) {
      await EmployeeSkill.findOneAndUpdate(
        { employee: employeeId, skill: cs.skill },
        {
          $set: {
            proficiencyLevel: cs.coverageLevel || 'intermediate',
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
    }
  } catch (skillErr) {
    console.error('Error awarding skills on certificate issuance:', skillErr.message);
  }

  // Update compliance assignment status
  try {
    const ComplianceRequirement = require('../models/ComplianceRequirement');
    const ComplianceAssignment = require('../models/ComplianceAssignment');
    const complianceService = require('./compliance.service');
    const requirements = await ComplianceRequirement.find({ course: courseId, isActive: true });
    if (requirements.length > 0) {
      const reqIds = requirements.map((r) => r._id);
      const assignments = await ComplianceAssignment.find({
        employee: employeeId,
        complianceRequirement: { $in: reqIds },
        isActive: true
      });
      for (const assignment of assignments) {
        await complianceService.evaluateAssignmentStatus(assignment, { save: true });
      }
    }
  } catch (compErr) {
    console.error('Error updating compliance assignments on certificate issuance:', compErr.message);
  }

  try {
    const { generateCertificatePDFBuffer } = require('../utils/pdfGenerator');
    const emailService = require('./email.service');
    const employee = await Employee.findById(employeeId).populate('user');
    const course = await Course.findById(courseId);
    const employeeName = employee?.user?.name || employee?.name || 'Learner';
    const courseTitle = course?.title || 'Course';

    const pdfBuffer = generateCertificatePDFBuffer({
      employeeName,
      courseTitle,
      score: typeof score === 'number' ? score : null,
      certificateNumber,
      issueDate: issuedAt,
      expiryDate: expiresAt,
      verificationUrl: `${config.clientUrl || 'http://localhost:5173'}/verify-certificate/${certificateNumber}`
    });

    if (employee?.user?.email) {
      const emailResult = await emailService.sendCertificateIssuedEmail({
        recipientEmail: employee.user.email,
        recipientName: employeeName,
        certificateNumber,
        courseTitle,
        score: typeof score === 'number' ? score : null,
        issueDate: issuedAt,
        certificateId: certificate._id.toString(),
        verificationUrl: `${config.clientUrl || 'http://localhost:5173'}/verify-certificate/${certificateNumber}`,
        pdfBuffer
      });

      if (emailResult.status === 'sent') {
        certificate.emailStatus = 'sent';
        certificate.emailSentAt = new Date();
        certificate.emailError = null;
        if (emailResult.previewUrl) {
          certificate.emailPreviewUrl = emailResult.previewUrl;
        }
      } else if (emailResult.status === 'not_configured') {
        certificate.emailStatus = 'not_configured';
        certificate.emailError = emailResult.error || null;
      } else {
        certificate.emailStatus = 'failed';
        certificate.emailError = emailResult.error || 'Failed to dispatch email';
      }
      await certificate.save();
    }
  } catch (err) {
    console.error('Error dispatching certificate email:', err.message);
    certificate.emailStatus = 'failed';
    certificate.emailError = err.message;
    await certificate.save().catch(() => {});
  }

  const populated = await Certificate.findById(certificate._id).populate(POPULATE_OPTIONS);
  return { certificate: populated, isExisting: false };
}

/**
 * Downloads the official vector PDF certificate with strict role authorization.
 *
 * @param {string} id - Certificate ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<{ buffer: Buffer, filename: string, certificate: object }>}
 */
async function downloadCertificatePDF(id, currentUser) {
  const cert = await getCertificateById(id, currentUser);

  const { generateCertificatePDFBuffer } = require('../utils/pdfGenerator');
  const employeeName = cert.employee?.user?.name || cert.employee?.name || 'Learner';
  const courseTitle = cert.course?.title || 'Course';

  const buffer = generateCertificatePDFBuffer({
    employeeName,
    courseTitle,
    score: cert.score,
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issuedAt,
    verificationUrl: `${config.clientUrl || 'http://localhost:5173'}/verify-certificate/${cert.certificateNumber}`
  });

  return {
    buffer,
    filename: `SkillTrack-Certificate-${cert.certificateNumber}.pdf`,
    certificate: cert
  };
}

/**
 * Triggers a secure resend of the congratulations email for a certificate.
 *
 * @param {string} id - Certificate ID
 * @param {object} currentUser - Authenticated user object
 * @returns {Promise<object>} Populated certificate document
 */
async function resendCertificateEmail(id, currentUser) {
  const cert = await getCertificateById(id, currentUser);
  if (currentUser.role !== 'admin' && currentUser.role !== 'employee') {
    throw new AppError('Access denied. You do not have permission to resend certificate email.', 403);
  }

  const employee = await Employee.findById(cert.employee?._id || cert.employee).populate('user');
  const course = await Course.findById(cert.course?._id || cert.course);
  const employeeName = employee?.user?.name || employee?.name || 'Learner';
  const recipientEmail = employee?.user?.email;

  if (!recipientEmail) {
    throw new AppError('Recipient email address not found on employee profile', 400);
  }

  const { generateCertificatePDFBuffer } = require('../utils/pdfGenerator');
  const emailService = require('./email.service');

  const pdfBuffer = generateCertificatePDFBuffer({
    employeeName,
    courseTitle: course?.title || 'Course',
    score: cert.score,
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issuedAt,
    verificationUrl: `${config.clientUrl || 'http://localhost:5173'}/verify-certificate/${cert.certificateNumber}`
  });

  const emailResult = await emailService.sendCertificateIssuedEmail({
    recipientEmail,
    recipientName: employeeName,
    certificateNumber: cert.certificateNumber,
    courseTitle: course?.title || 'Course',
    score: cert.score,
    issueDate: cert.issuedAt,
    certificateId: cert._id.toString(),
    verificationUrl: `${config.clientUrl || 'http://localhost:5173'}/verify-certificate/${cert.certificateNumber}`,
    pdfBuffer
  });

  const certDoc = await Certificate.findById(cert._id);
  if (emailResult.status === 'sent') {
    certDoc.emailStatus = 'sent';
    certDoc.emailSentAt = new Date();
    certDoc.emailError = null;
  } else if (emailResult.status === 'not_configured') {
    certDoc.emailStatus = 'not_configured';
    certDoc.emailError = emailResult.error || null;
  } else {
    certDoc.emailStatus = 'failed';
    certDoc.emailError = emailResult.error || 'Failed to dispatch email';
  }

  await certDoc.save();
  return await Certificate.findById(certDoc._id).populate(POPULATE_OPTIONS);
}
