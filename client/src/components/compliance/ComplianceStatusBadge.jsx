import React from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Circle,
} from 'lucide-react';

const STATUS_CONFIG = {
  COMPLIANT: {
    label: 'Compliant',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  DUE_SOON: {
    label: 'Due Soon',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertOctagon,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  NOT_STARTED: {
    label: 'Not Started',
    icon: Circle,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const ComplianceStatusBadge = ({
  status,
  daysRemaining,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normalized = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.NOT_STARTED;
  const IconComponent = config.icon;

  let displayLabel = config.label;
  if (normalized === 'DUE_SOON') {
    if (daysRemaining === 0) {
      displayLabel = 'Due Today';
    } else if (typeof daysRemaining === 'number' && daysRemaining > 0) {
      displayLabel = `Due in ${daysRemaining}d`;
    }
  } else if (normalized === 'OVERDUE') {
    if (typeof daysRemaining === 'number' && daysRemaining < 0) {
      displayLabel = `Overdue by ${Math.abs(daysRemaining)}d`;
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      data-testid="compliance-status-badge"
      data-status={normalized || 'NOT_STARTED'}
      aria-label={`Compliance status: ${displayLabel}`}
      className={`inline-flex items-center rounded-full border transition-colors ${config.badgeClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes[size] || iconSizes.md} shrink-0`} />}
      <span>{displayLabel}</span>
    </span>
  );
};

ComplianceStatusBadge.propTypes = {
  status: PropTypes.string,
  daysRemaining: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  className: PropTypes.string,
};

export default ComplianceStatusBadge;
