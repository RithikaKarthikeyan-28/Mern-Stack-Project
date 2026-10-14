const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

/**
 * All notification routes require authentication.
 */
router.use(authMiddleware);

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for current authenticated user
 * @access  Private (All authenticated roles - recipient scoped)
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for current user
 * @access  Private (All authenticated roles - recipient scoped)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all unread active notifications for current user as read
 * @access  Private (All authenticated roles - recipient scoped)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.patch('/read-all', notificationController.markAllNotificationsRead);

/**
 * @route   POST /api/notifications/process-expiries
 * @desc    Admin-only maintenance endpoint to trigger certificate expiry notification scanning
 * @access  Private (Admin only)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.post(
  '/process-expiries',
  authorizeRoles('admin'),
  notificationController.processCertificateExpiries
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private (Recipient scoped only - 404 for foreign)
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private (Recipient scoped only - 404 for foreign)
 */
router.patch('/:id/read', notificationController.markNotificationRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Soft delete a notification (isActive = false)
 * @access  Private (Recipient scoped only - 404 for foreign)
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
