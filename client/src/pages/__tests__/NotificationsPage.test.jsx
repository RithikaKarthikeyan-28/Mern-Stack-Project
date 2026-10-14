import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationsPage from '../NotificationsPage';
import notificationService from '../../services/notificationService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/notificationService', () => ({
  default: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

const mockNotifications = [
  {
    id: 'n1',
    type: 'certificate_expiring',
    title: 'Certificate Approaching Expiry',
    message: 'Your Cloud Architecture certificate expires in 10 days.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    type: 'compliance_overdue',
    title: 'Compliance Training Overdue',
    message: 'Information Security Training is past due.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationService.getNotifications.mockResolvedValue({
      notifications: mockNotifications,
      pagination: { page: 1, limit: 15, total: 2, totalPages: 1 },
    });
    notificationService.getUnreadCount.mockResolvedValue(2);
  });

  it('renders notifications list and displays unread count badge', async () => {
    renderComponent();

    expect(screen.getByText('Notifications')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2 new')).toBeInTheDocument();
      expect(screen.getByText('Certificate Approaching Expiry')).toBeInTheDocument();
      expect(screen.getByText('Compliance Training Overdue')).toBeInTheDocument();
    });
  });

  it('marks a single notification as read', async () => {
    notificationService.markAsRead.mockResolvedValueOnce({
      id: 'n1',
      isRead: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Certificate Approaching Expiry')).toBeInTheDocument();
    });

    const markBtns = screen.getAllByRole('button', { name: /mark as read/i });
    fireEvent.click(markBtns[0]);

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('n1');
    });
  });

  it('marks all notifications as read', async () => {
    notificationService.markAllAsRead.mockResolvedValueOnce({
      message: 'All notifications marked as read',
      updatedCount: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    const markAllBtn = screen.getByText('Mark all as read');
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('deletes a notification from list', async () => {
    notificationService.deleteNotification.mockResolvedValueOnce({
      message: 'Notification deleted',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Certificate Approaching Expiry')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole('button', { name: /delete notification/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(notificationService.deleteNotification).toHaveBeenCalledWith('n1');
    });
  });

  it('filters notifications when status tab or category type is selected', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Certificate Approaching Expiry')).toBeInTheDocument();
    });

    const unreadTab = screen.getByRole('button', { name: /unread/i });
    fireEvent.click(unreadTab);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: false })
      );
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'certificate_expiring' } });

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'certificate_expiring' })
      );
    });
  });
});
