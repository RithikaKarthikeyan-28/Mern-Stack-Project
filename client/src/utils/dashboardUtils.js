/**
 * Generates dynamic time-of-day greeting.
 * @param {Date} [date=new Date()]
 * @returns {string} "Good morning" | "Good afternoon" | "Good evening"
 */
export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Formats a decimal or percentage value cleanly.
 * @param {number|null|undefined} value
 * @returns {string} e.g. "85%"
 */
export function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

/**
 * Converts a date into a human-friendly relative time string.
 * @param {string|Date} dateInput
 * @returns {string} e.g. "2h ago", "Yesterday", "just now"
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Merges distinct entity streams into a cohesive, reverse-chronological activity feed.
 * @param {Array} enrollments
 * @param {Array} certificates
 * @param {Array} notifications
 * @param {number} [limit=5]
 * @returns {Array}
 */
export function deriveRecentActivity(enrollments = [], certificates = [], notifications = [], limit = 5) {
  const activities = [];

  // 1. Completed courses from enrollments
  for (const enr of enrollments) {
    if (enr.status === 'completed' && (enr.completedAt || enr.updatedAt)) {
      activities.push({
        id: `course-${enr._id}`,
        type: 'course_completed',
        title: 'Course Completed',
        description: enr.course?.title || 'Course completed',
        timestamp: new Date(enr.completedAt || enr.updatedAt).getTime(),
        date: enr.completedAt || enr.updatedAt,
      });
    }
  }

  // 2. Issued certificates
  for (const cert of certificates) {
    if (cert.issuedAt) {
      activities.push({
        id: `cert-${cert._id || cert.certificateNumber}`,
        type: 'certificate_earned',
        title: 'Certificate Earned',
        description: cert.course?.title ? `${cert.course.title} (${cert.certificateNumber})` : cert.certificateNumber,
        timestamp: new Date(cert.issuedAt).getTime(),
        date: cert.issuedAt,
      });
    }
  }

  // 3. Recent notifications
  for (const notif of notifications) {
    if (notif.createdAt) {
      activities.push({
        id: `notif-${notif._id}`,
        type: 'notification',
        title: notif.title || 'Notification Received',
        description: notif.message,
        timestamp: new Date(notif.createdAt).getTime(),
        date: notif.createdAt,
      });
    }
  }

  // Sort newest first and slice limit
  activities.sort((a, b) => b.timestamp - a.timestamp);
  return activities.slice(0, limit);
}
