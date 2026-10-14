const notificationService = require('../services/notification.service');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to retrieve paginated notifications for authenticated user.
 */
async function getNotifications(req, res, next) {
  try {
    const result = await notificationService.getNotifications(req.user, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve unread notification count for authenticated user.
 */
async function getUnreadCount(req, res, next) {
  try {
    const result = await notificationService.getUnreadCount(req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Unread count retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve a single notification by ID.
 */
async function getNotificationById(req, res, next) {
  try {
    const result = await notificationService.getNotificationById(req.user, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Notification retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to mark a single notification as read.
 */
async function markNotificationRead(req, res, next) {
  try {
    const result = await notificationService.markNotificationRead(
      req.user,
      req.params.id,
      req.body
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Notification marked as read',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to mark all unread active notifications as read.
 */
async function markAllNotificationsRead(req, res, next) {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: { updatedCount: result.updatedCount }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to soft delete a notification.
 */
async function deleteNotification(req, res, next) {
  try {
    const result = await notificationService.deleteNotification(req.user, req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to trigger certificate expiry and expired notification scan (Admin maintenance).
 */
async function processCertificateExpiries(req, res, next) {
  try {
    const result = await notificationService.processCertificateExpiryNotifications();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificate expiry notifications processed successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  processCertificateExpiries
};
