import { describe, it, expect, vi, beforeEach } from 'vitest';
import notificationService from '../notificationService';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('fetches recipient-scoped paginated notifications', async () => {
      const mockPayload = {
        data: {
          data: {
            notifications: [
              { id: 'notif1', title: 'Certificate Expiring', type: 'certificate_expiring' },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        },
      };
      api.get.mockResolvedValueOnce(mockPayload);

      const result = await notificationService.getNotifications({ page: 1, isRead: false });

      expect(api.get).toHaveBeenCalledWith('/notifications', {
        params: { page: 1, isRead: false },
      });
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].title).toBe('Certificate Expiring');
      expect(result.pagination.total).toBe(1);
    });

    it('returns empty array and default pagination when payload is empty', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      const result = await notificationService.getNotifications();

      expect(result.notifications).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('extracts unreadCount from backend response', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          data: { unreadCount: 5 },
        },
      });

      const count = await notificationService.getUnreadCount();

      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(count).toBe(5);
    });

    it('falls back to 0 if count is missing', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      const count = await notificationService.getUnreadCount();

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('calls PATCH /notifications/:id/read and returns updated notification', async () => {
      const updatedNotif = { id: 'notif1', isRead: true };
      api.patch.mockResolvedValueOnce({
        data: {
          data: { notification: updatedNotif },
        },
      });

      const result = await notificationService.markAsRead('notif1');

      expect(api.patch).toHaveBeenCalledWith('/notifications/notif1/read', {});
      expect(result).toEqual(updatedNotif);
    });
  });

  describe('markAllAsRead', () => {
    it('calls PATCH /notifications/read-all and returns updatedCount', async () => {
      api.patch.mockResolvedValueOnce({
        data: {
          message: 'All notifications marked as read',
          data: { updatedCount: 4 },
        },
      });

      const result = await notificationService.markAllAsRead();

      expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
      expect(result.updatedCount).toBe(4);
      expect(result.message).toBe('All notifications marked as read');
    });
  });

  describe('getNotificationById', () => {
    it('fetches a single notification by ID', async () => {
      const mockNotif = { id: 'notif99', title: 'Compliance Due Soon' };
      api.get.mockResolvedValueOnce({
        data: {
          data: { notification: mockNotif },
        },
      });

      const result = await notificationService.getNotificationById('notif99');

      expect(api.get).toHaveBeenCalledWith('/notifications/notif99');
      expect(result).toEqual(mockNotif);
    });
  });

  describe('deleteNotification', () => {
    it('calls DELETE /notifications/:id and returns confirmation', async () => {
      api.delete.mockResolvedValueOnce({
        data: {
          message: 'Notification soft deleted',
        },
      });

      const result = await notificationService.deleteNotification('notif99');

      expect(api.delete).toHaveBeenCalledWith('/notifications/notif99');
      expect(result.message).toBe('Notification soft deleted');
    });
  });
});
