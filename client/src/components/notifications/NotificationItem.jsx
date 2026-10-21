import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Bell,
  Award,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Calendar,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';

/**
 * Returns human-readable relative time string.
 */
function getRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const notifId = notification.id || notification._id;
  const isUnread = !notification.isRead;
  const timeAgo = getRelativeTime(notification.createdAt);

  // Icon configuration based on type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'certificate_issued':
        return {
          icon: Award,
          bgColor: 'bg-teal-100',
          textColor: 'text-teal-800',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          label: 'Certificate Earned',
        };
      case 'certificate_expiring':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Expiring Soon',
        };
      case 'certificate_expired':
        return {
          icon: Clock,
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-700',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Expired',
        };
      case 'certificate_renewed':
        return {
          icon: Award,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-700',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Renewed',
        };
      case 'compliance_due_soon':
        return {
          icon: Calendar,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Compliance Due',
        };
      case 'compliance_overdue':
        return {
          icon: ShieldAlert,
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-700',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Overdue',
        };
      default:
        return {
          icon: Bell,
          bgColor: 'bg-teal-100',
          textColor: 'text-teal-800',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          label: 'Notification',
        };
    }
  };

  const config = getTypeConfig(notification.type);
  const IconComponent = config.icon;

  const certificateRef = notification.relatedCertificate;
  const certId =
    typeof certificateRef === 'object' && certificateRef !== null
      ? certificateRef.id || certificateRef._id
      : certificateRef;
  const certNumber =
    typeof certificateRef === 'object' && certificateRef !== null
      ? certificateRef.certificateNumber
      : null;

  const courseRef = notification.relatedCourse;
  const courseId =
    typeof courseRef === 'object' && courseRef !== null
      ? courseRef.id || courseRef._id
      : courseRef;
  const courseTitle =
    typeof courseRef === 'object' && courseRef !== null ? courseRef.title : null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex gap-3 sm:gap-4 items-start ${
        isUnread
          ? 'bg-white border-teal-200 shadow-xs ring-1 ring-teal-500/10'
          : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
      }`}
      data-testid={`notification-item-${notifId}`}
    >
      {/* Type Icon */}
      <div
        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${config.bgColor} ${config.textColor}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeColor}`}
          >
            {config.label}
          </span>

          <span className="text-xs text-slate-400 font-medium">{timeAgo}</span>

          {isUnread && (
            <span
              className="inline-block w-2 h-2 rounded-full bg-teal-700 ml-1"
              title="Unread"
              aria-label="Unread notification"
            />
          )}
        </div>

        <h4 className="text-sm font-semibold text-[#102A2A] mb-1 leading-snug">
          {notification.title}
        </h4>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
          {notification.message}
        </p>

        {/* Contextual Links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {certId && (
            <Link
              to={`/certificates/${certId}`}
              className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800 bg-teal-50/80 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Certificate {certNumber ? `(${certNumber})` : ''}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          )}

          {courseId && (
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <span>{courseTitle ? `Course: ${courseTitle}` : 'View Course'}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          )}

          {(notification.type === 'compliance_due_soon' || notification.type === 'compliance_overdue') && (
            <Link
              to="/compliance"
              className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Compliance Hub</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 self-start">
        {isUnread && onMarkRead && (
          <button
            type="button"
            onClick={() => onMarkRead(notifId)}
            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(notifId)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete notification"
            aria-label="Delete notification"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    isRead: PropTypes.bool,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    relatedCertificate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        _id: PropTypes.string,
        certificateNumber: PropTypes.string,
      }),
    ]),
    relatedCourse: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        _id: PropTypes.string,
        title: PropTypes.string,
      }),
    ]),
  }).isRequired,
  onMarkRead: PropTypes.func,
  onDelete: PropTypes.func,
};

export default NotificationItem;
