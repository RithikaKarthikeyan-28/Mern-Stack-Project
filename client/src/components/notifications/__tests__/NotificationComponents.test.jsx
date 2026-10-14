import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationItem from '../NotificationItem';
import NotificationList from '../NotificationList';

describe('Notification Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotificationItem', () => {
    const mockNotif = {
      id: 'notif01',
      type: 'certificate_expiring',
      title: 'Certificate Approaching Expiration',
      message: 'Your certificate for Security Best Practices expires in 15 days.',
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedCertificate: {
        id: 'cert99',
        certificateNumber: 'SKILLTRACK-2026-EXP01',
      },
      relatedCourse: {
        id: 'c55',
        title: 'Security Best Practices',
      },
    };

    it('renders notification title, message, and type badge', () => {
      render(
        <MemoryRouter>
          <NotificationItem notification={mockNotif} />
        </MemoryRouter>
      );

      expect(screen.getByText('Certificate Approaching Expiration')).toBeInTheDocument();
      expect(
        screen.getByText('Your certificate for Security Best Practices expires in 15 days.')
      ).toBeInTheDocument();
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('renders unread indicator when unread', () => {
      render(
        <MemoryRouter>
          <NotificationItem notification={mockNotif} />
        </MemoryRouter>
      );

      expect(screen.getByTitle('Unread')).toBeInTheDocument();
    });

    it('renders links to related certificate and related course', () => {
      render(
        <MemoryRouter>
          <NotificationItem notification={mockNotif} />
        </MemoryRouter>
      );

      expect(screen.getByText(/View Certificate/i)).toBeInTheDocument();
      expect(screen.getByText('Course: Security Best Practices')).toBeInTheDocument();
    });

    it('calls onMarkRead callback when mark as read button is clicked', () => {
      const markMock = vi.fn();
      render(
        <MemoryRouter>
          <NotificationItem notification={mockNotif} onMarkRead={markMock} />
        </MemoryRouter>
      );

      const markBtn = screen.getByRole('button', { name: /mark as read/i });
      fireEvent.click(markBtn);

      expect(markMock).toHaveBeenCalledWith('notif01');
    });

    it('calls onDelete callback when delete button is clicked', () => {
      const deleteMock = vi.fn();
      render(
        <MemoryRouter>
          <NotificationItem notification={mockNotif} onDelete={deleteMock} />
        </MemoryRouter>
      );

      const deleteBtn = screen.getByRole('button', { name: /delete notification/i });
      fireEvent.click(deleteBtn);

      expect(deleteMock).toHaveBeenCalledWith('notif01');
    });

    it('supports compliance overdue type styling', () => {
      const overdueNotif = {
        id: 'notif02',
        type: 'compliance_overdue',
        title: 'Mandatory Training Overdue',
        message: 'Annual ethics module is overdue.',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      };

      render(
        <MemoryRouter>
          <NotificationItem notification={overdueNotif} />
        </MemoryRouter>
      );

      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Compliance Hub/i })).toHaveAttribute(
        'href',
        '/compliance'
      );
    });
  });

  describe('NotificationList', () => {
    it('renders loading skeleton when loading is true', () => {
      render(<NotificationList loading={true} />);
      expect(screen.getByTestId('notifications-loading')).toBeInTheDocument();
    });

    it('renders empty state message when list is empty', () => {
      render(<NotificationList notifications={[]} emptyMessage="Zero alerts found." />);
      expect(screen.getByTestId('notifications-empty')).toBeInTheDocument();
      expect(screen.getByText("You're All Caught Up")).toBeInTheDocument();
      expect(screen.getByText('Zero alerts found.')).toBeInTheDocument();
    });

    it('renders list of notification items when populated', () => {
      const list = [
        {
          id: 'n1',
          type: 'certificate_renewed',
          title: 'Certificate Renewed',
          message: 'Credential successfully renewed.',
          isRead: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'n2',
          type: 'compliance_due_soon',
          title: 'Upcoming Compliance Deadline',
          message: 'Complete by Friday.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      render(
        <MemoryRouter>
          <NotificationList notifications={list} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
      expect(screen.getByText('Certificate Renewed')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Compliance Deadline')).toBeInTheDocument();
    });
  });
});
