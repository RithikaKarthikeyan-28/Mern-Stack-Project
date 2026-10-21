const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Certificate = require('../models/Certificate');
const Employee = require('../models/Employee');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const config = require('../config');
const {
  validateNotificationQuery,
  validateMarkRead,
  validateObjectId
} = require('../validators/notification.validator');

const SANITIZED_CERTIFICATE_FIELDS = 'certificateNumber issuedAt expiresAt status';
const SANITIZED_COURSE_FIELDS = 'title category level';

/**
 * Extracts a normalized string user ID from currentUser.
 *
 * @param {object} currentUser - Authenticated user object
 * @returns {string} Stringified User ID
 */
function getUserId(currentUser) {
  if (!currentUser) {
    throw new AppError('Authentication required', 401);
  }
  const id = currentUser.id || currentUser.userId || currentUser._id;
  if (!id) {
    throw new AppError('Invalid user context', 401);
  }
  return id.toString();
}

/**
 * Helper to resolve employee and course data from a certificate.
 *
 * @param {object} certificate - Certificate document
 * @returns {Promise<{ employee: object, course: object, recipientUserId: string } | null>}
 */
async function resolveCertificateContext(certificate) {
  let employee = certificate.employee;
  if (!employee || !employee.user || !mongoose.Types.ObjectId.isValid(employee.user)) {
    employee = await Employee.findById(certificate.employee);
  }

  if (!employee || employee.isActive === false) {
    return null;
  }

  const recipientUserId = (employee.user._id || employee.user).toString();

  let course = certificate.course;
  if (!course || !course.title) {
    course = await Course.findById(certificate.course);
  }

  if (!course || course.isActive === false || course.status !== 'published') {
    return null;
  }

  return { employee, course, recipientUserId };
}

/**
 * Internal helper to safely create a notification with concurrency-safe duplicate prevention.
 *
 * @param {object} params - Notification attributes
 * @returns {Promise<{ notification: object, isExisting: boolean }>}
 */
async function createNotificationInternal({
  recipient,
  type,
  title,
  message,
  relatedCertificate = null,
  relatedCourse = null,
  eventKey = null
}) {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedCertificate,
      relatedCourse,
      eventKey
    });

    return { notification, isExisting: false };
  } catch (err) {
    // Concurrency race: Duplicate key on eventKey
    if (err.code === 11000 && eventKey) {
      const existing = await Notification.findOne({ eventKey });
      if (existing) {
        return { notification: existing, isExisting: true };
      }
    }
    throw err;
  }
}

/**
 * Retrieves paginated notifications for the authenticated user.
 * Scoped strictly to req.user._id.
 *
 * @param {object} currentUser - Authenticated user
 * @param {object} query - Query parameters (page, limit, isRead, type)
 * @returns {Promise<object>} Paginated notifications
 */
async function getNotifications(currentUser, query = {}) {
  const userId = getUserId(currentUser);
  validateNotificationQuery(query);

  const filter = {
    recipient: userId,
    isActive: true
  };

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === 'true' || query.isRead === true;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 20;
  if (limit > 100) limit = 100;
  const skip = (page - 1) * limit;

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .populate('relatedCertificate', SANITIZED_CERTIFICATE_FIELDS)
      .populate('relatedCourse', SANITIZED_COURSE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Retrieves unread notification count for the authenticated user.
 *
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<{ unreadCount: number }>}
 */
async function getUnreadCount(currentUser) {
  const userId = getUserId(currentUser);

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isActive: true,
    isRead: false
  });

  return { unreadCount };
}

/**
 * Retrieves a single notification by ID.
 * Scoped strictly to recipient === req.user._id. Returns 404 for foreign notifications.
 *
 * @param {object} currentUser - Authenticated user
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{ notification: object }>}
 */
async function getNotificationById(currentUser, notificationId) {
  const userId = getUserId(currentUser);
  validateObjectId(notificationId, 'Notification ID');

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
    isActive: true
  })
    .populate('relatedCertificate', SANITIZED_CERTIFICATE_FIELDS)
    .populate('relatedCourse', SANITIZED_COURSE_FIELDS);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return { notification };
}

/**
 * Marks a notification as read.
 * Idempotent: returns success if already read.
 *
 * @param {object} currentUser - Authenticated user
 * @param {string} notificationId - Notification ID
 * @param {object} body - Request body
 * @returns {Promise<{ notification: object }>}
 */
async function markNotificationRead(currentUser, notificationId, body = {}) {
  const userId = getUserId(currentUser);
  validateMarkRead({ id: notificationId }, body);

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
    isActive: true
  })
    .populate('relatedCertificate', SANITIZED_CERTIFICATE_FIELDS)
    .populate('relatedCourse', SANITIZED_COURSE_FIELDS);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.isRead) {
    return { notification };
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return { notification };
}

/**
 * Marks all unread active notifications for the current user as read.
 *
 * @param {object} currentUser - Authenticated user
 * @returns {Promise<{ message: string, updatedCount: number }>}
 */
async function markAllNotificationsRead(currentUser) {
  const userId = getUserId(currentUser);

  const now = new Date();
  const result = await Notification.updateMany(
    {
      recipient: userId,
      isActive: true,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: now
      }
    }
  );

  return {
    message: 'All notifications marked as read',
    updatedCount: result.modifiedCount || 0
  };
}

/**
 * Soft deletes a notification by setting isActive = false.
 * Returns 404 for foreign notifications.
 *
 * @param {object} currentUser - Authenticated user
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{ message: string }>}
 */
async function deleteNotification(currentUser, notificationId) {
  const userId = getUserId(currentUser);
  validateObjectId(notificationId, 'Notification ID');

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
    isActive: true
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  notification.isActive = false;
  await notification.save();

  return {
    message: 'Notification deleted successfully'
  };
}

/**
 * Creates a server-controlled notification for an expiring certificate.
 *
 * @param {object} certificate - Certificate document
 * @returns {Promise<object|null>} Created notification or null
 */
async function createCertificateExpiringNotification(certificate) {
  if (!certificate || certificate.status === 'revoked') {
    return null;
  }

  const now = new Date();
  const expiry = certificate.getDerivedExpiry ? certificate.getDerivedExpiry() : certificate.expiresAt;
  if (!expiry || new Date(expiry) <= now) {
    return null; // Already expired
  }

  const context = await resolveCertificateContext(certificate);
  if (!context) {
    return null;
  }

  const certNumber = certificate.certificateNumber || 'Unknown';
  const courseTitle = context.course.title || 'Course';
  const eventKey = `certificate-expiring:${certificate._id.toString()}`;

  const { notification } = await createNotificationInternal({
    recipient: context.recipientUserId,
    type: 'certificate_expiring',
    title: 'Certificate Expiring Soon',
    message: `Your certificate ${certNumber} for "${courseTitle}" is approaching its expiration date.`,
    relatedCertificate: certificate._id,
    relatedCourse: context.course._id,
    eventKey
  });

  return notification;
}

/**
 * Creates a server-controlled notification for an expired certificate.
 *
 * @param {object} certificate - Certificate document
 * @returns {Promise<object|null>} Created notification or null
 */
async function createCertificateExpiredNotification(certificate) {
  if (!certificate || certificate.status === 'revoked') {
    return null;
  }

  const now = new Date();
  const expiry = certificate.getDerivedExpiry ? certificate.getDerivedExpiry() : certificate.expiresAt;
  if (!expiry || new Date(expiry) > now) {
    return null; // Not expired yet
  }

  const context = await resolveCertificateContext(certificate);
  if (!context) {
    return null;
  }

  const certNumber = certificate.certificateNumber || 'Unknown';
  const courseTitle = context.course.title || 'Course';
  const eventKey = `certificate-expired:${certificate._id.toString()}`;

  const { notification } = await createNotificationInternal({
    recipient: context.recipientUserId,
    type: 'certificate_expired',
    title: 'Certificate Expired',
    message: `Your certificate ${certNumber} for "${courseTitle}" has expired.`,
    relatedCertificate: certificate._id,
    relatedCourse: context.course._id,
    eventKey
  });

  return notification;
}

/**
 * Creates a server-controlled notification for a renewed certificate.
 *
 * @param {object} newCertificate - The freshly created renewal Certificate document
 * @returns {Promise<object|null>} Created notification or null
 */
async function createCertificateRenewedNotification(newCertificate) {
  if (!newCertificate) {
    return null;
  }

  const context = await resolveCertificateContext(newCertificate);
  if (!context) {
    return null;
  }

  const courseTitle = context.course.title || 'Course';
  const eventKey = `certificate-renewed:${newCertificate._id.toString()}`;

  const { notification } = await createNotificationInternal({
    recipient: context.recipientUserId,
    type: 'certificate_renewed',
    title: 'Certificate Renewed',
    message: `Your certificate for "${courseTitle}" has been renewed successfully.`,
    relatedCertificate: newCertificate._id,
    relatedCourse: context.course._id,
    eventKey
  });

  return notification;
}

/**
 * Scans certificates and generates expiring / expired notifications.
 * Callable programmatically and idempotent.
 *
 * @returns {Promise<object>} Processing summary
 */
async function processCertificateExpiryNotifications() {
  const now = new Date();
  const renewalWindowDays = config.certificateRenewalWindowDays || 30;
  const validityDays = config.certificateValidityDays || 365;
  const targetExpiringDate = new Date(now.getTime() + renewalWindowDays * 86400000);
  const legacyCutoff = new Date(now.getTime() - validityDays * 86400000);

  // 1. Scan certificates approaching expiration within renewalWindowDays
  const expiringFilter = {
    status: 'active',
    $or: [
      { expiresAt: { $gt: now, $lte: targetExpiringDate } },
      { expiresAt: null, issuedAt: { $gt: legacyCutoff, $lte: targetExpiringDate } }
    ]
  };

  const expiringCerts = await Certificate.find(expiringFilter)
    .populate('employee')
    .populate('course');

  let expiringProcessed = 0;
  for (const cert of expiringCerts) {
    const notif = await createCertificateExpiringNotification(cert);
    if (notif) expiringProcessed++;
  }

  // 2. Scan newly expired certificates
  const expiredFilter = {
    status: 'active',
    $or: [
      { expiresAt: { $lte: now } },
      { expiresAt: null, issuedAt: { $lte: legacyCutoff } }
    ]
  };

  const expiredCerts = await Certificate.find(expiredFilter)
    .populate('employee')
    .populate('course');

  let expiredProcessed = 0;
  for (const cert of expiredCerts) {
    const notif = await createCertificateExpiredNotification(cert);
    if (notif) expiredProcessed++;
  }

  return {
    expiringProcessed,
    expiredProcessed,
    totalScanned: expiringCerts.length + expiredCerts.length
  };
}

/**
 * Creates a server-controlled notification for an issued certificate.
 *
 * @param {object} certificate - Certificate document
 * @returns {Promise<object|null>} Created notification or null
 */
async function createCertificateIssuedNotification(certificate) {
  if (!certificate || certificate.status === 'revoked') {
    return null;
  }

  const context = await resolveCertificateContext(certificate);
  if (!context) {
    return null;
  }

  const courseTitle = context.course.title || 'Course';
  const certNumber = certificate.certificateNumber || 'Credential';
  const eventKey = `certificate-issued:${certificate._id.toString()}`;

  const { notification } = await createNotificationInternal({
    recipient: context.recipientUserId,
    type: 'certificate_issued',
    title: 'Certificate Earned!',
    message: `Congratulations! You earned certificate ${certNumber} for successfully completing "${courseTitle}".`,
    relatedCertificate: certificate._id,
    relatedCourse: context.course._id,
    eventKey
  });

  return notification;
}

module.exports = {
  createCertificateIssuedNotification,
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createCertificateExpiringNotification,
  createCertificateExpiredNotification,
  createCertificateRenewedNotification,
  processCertificateExpiryNotifications
};
