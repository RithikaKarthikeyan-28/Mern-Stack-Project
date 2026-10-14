import { describe, it, expect } from 'vitest';
import {
  getGreeting,
  formatPercentage,
  formatRelativeTime,
  deriveRecentActivity,
} from '../dashboardUtils';

describe('dashboardUtils', () => {
  describe('getGreeting', () => {
    it('returns "Good morning" for hours before 12', () => {
      const morningDate = new Date(2026, 0, 1, 9, 30);
      expect(getGreeting(morningDate)).toBe('Good morning');
    });

    it('returns "Good afternoon" for hours between 12 and 16', () => {
      const afternoonDate = new Date(2026, 0, 1, 14, 0);
      expect(getGreeting(afternoonDate)).toBe('Good afternoon');
    });

    it('returns "Good evening" for hours 17 and later', () => {
      const eveningDate = new Date(2026, 0, 1, 19, 0);
      expect(getGreeting(eveningDate)).toBe('Good evening');
    });

    it('defaults to current date if not provided', () => {
      const greeting = getGreeting();
      expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
    });
  });

  describe('formatPercentage', () => {
    it('formats numbers into rounded percentages', () => {
      expect(formatPercentage(74.6)).toBe('75%');
      expect(formatPercentage(100)).toBe('100%');
      expect(formatPercentage(0)).toBe('0%');
    });

    it('handles null, undefined, or NaN safely', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
      expect(formatPercentage(NaN)).toBe('0%');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns empty string for falsy or invalid dates', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime('invalid-date')).toBe('');
    });

    it('returns "Just now" for dates within 60 seconds', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('Just now');
    });

    it('returns minute or hour diffs', () => {
      const date10mAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(formatRelativeTime(date10mAgo)).toBe('10m ago');

      const date2hAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(date2hAgo)).toBe('2h ago');
    });
  });

  describe('deriveRecentActivity', () => {
    it('correctly merges completed courses, certificates, and notifications sorted by date', () => {
      const enrollments = [
        {
          _id: 'enr1',
          status: 'completed',
          completedAt: '2026-10-01T10:00:00Z',
          course: { title: 'Node.js Core' },
        },
        {
          _id: 'enr2',
          status: 'in_progress',
          progressPercentage: 50,
        },
      ];

      const certificates = [
        {
          _id: 'cert1',
          certificateNumber: 'CERT-001',
          issuedAt: '2026-10-03T10:00:00Z',
          course: { title: 'Node.js Core' },
        },
      ];

      const notifications = [
        {
          _id: 'notif1',
          title: 'Alert',
          message: 'Important message',
          createdAt: '2026-10-02T10:00:00Z',
        },
      ];

      const result = deriveRecentActivity(enrollments, certificates, notifications, 5);

      expect(result).toHaveLength(3);
      // Newest should be cert1 (Oct 3), then notif1 (Oct 2), then enr1 (Oct 1)
      expect(result[0].id).toBe('cert-cert1');
      expect(result[0].type).toBe('certificate_earned');
      expect(result[1].id).toBe('notif-notif1');
      expect(result[1].type).toBe('notification');
      expect(result[2].id).toBe('course-enr1');
      expect(result[2].type).toBe('course_completed');
    });

    it('handles empty arrays gracefully', () => {
      expect(deriveRecentActivity()).toEqual([]);
    });
  });
});
