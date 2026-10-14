import api from './api';

export const notificationService = {
  /**
   * Retrieves paginated notifications for the authenticated user.
   * Scoped strictly to the authenticated user.
   * @param {object} params - { page, limit, isRead, type }
   * @returns {Promise<{ notifications: Array, pagination: object }>}
   */
  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    const data = res.data?.data || res.data || {};
    return {
      notifications: data.notifications || [],
      pagination: data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  /**
   * Retrieves unread notification count for the authenticated user.
   * @returns {Promise<number>} Unread count
   */
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return (
      res.data?.data?.unreadCount ??
      res.data?.unreadCount ??
      res.data?.data?.count ??
      res.data?.count ??
      0
    );
  },

  /**
   * Marks a single notification as read.
   * Idempotent: returns the notification object.
   * @param {string} id - Notification ID
   * @param {object} body - Optional body
   * @returns {Promise<object>} Updated notification
   */
  markAsRead: async (id, body = {}) => {
    const res = await api.patch(`/notifications/${id}/read`, body);
    return res.data?.data?.notification || res.data?.notification;
  },

  /**
   * Marks all unread active notifications for the current user as read.
   * @returns {Promise<{ message: string, updatedCount: number }>}
   */
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    const data = res.data?.data || res.data || {};
    return {
      message: res.data?.message || 'All notifications marked as read',
      updatedCount: data.updatedCount ?? 0,
    };
  },

  /**
   * Retrieves a single notification by ID.
   * @param {string} id - Notification ID
   * @returns {Promise<object>} Notification object
   */
  getNotificationById: async (id) => {
    const res = await api.get(`/notifications/${id}`);
    return res.data?.data?.notification || res.data?.notification;
  },

  /**
   * Soft deletes a notification.
   * @param {string} id - Notification ID
   * @returns {Promise<{ message: string }>}
   */
  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return {
      message: res.data?.message || 'Notification deleted successfully',
    };
  },
};

export default notificationService;
