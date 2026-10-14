import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

/**
 * Renders an accessible, colored lifecycle badge for a certificate.
 */
export const CertificateStatusBadge = ({
  status = 'active',
  lifecycleStatus,
  expiresAt,
  isExpired = false,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  // Authoritative lifecycle determination
  const effectiveStatus = (lifecycleStatus || (isExpired ? 'expired' : status)).toLowerCase();

  // Determine if active certificate is expiring soon (within 30 days)
  let isExpiringSoon = false;
  if (effectiveStatus === 'active' && expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    const nowTime = Date.now();
    const daysUntilExpiry = (expiryTime - nowTime) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
      isExpiringSoon = true;
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3.5 h-3.5';

  if (effectiveStatus === 'revoked') {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${sizeClasses} ${className}`}
        data-testid="certificate-status-revoked"
      >
        {showIcon && <XCircle className={`${iconSizes} text-rose-600 shrink-0`} />}
        <span>Revoked</span>
      </span>
    );
  }

  if (effectiveStatus === 'expired') {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${sizeClasses} ${className}`}
        data-testid="certificate-status-expired"
      >
        {showIcon && <AlertTriangle className={`${iconSizes} text-amber-600 shrink-0`} />}
        <span>Expired</span>
      </span>
    );
  }

  if (isExpiringSoon) {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-xs ${sizeClasses} ${className}`}
        data-testid="certificate-status-expiring-soon"
      >
        {showIcon && <Clock className={`${iconSizes} text-amber-600 shrink-0`} />}
        <span>Expiring Soon</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses} ${className}`}
      data-testid="certificate-status-active"
    >
      {showIcon && <CheckCircle2 className={`${iconSizes} text-emerald-600 shrink-0`} />}
      <span>Active</span>
    </span>
  );
};

CertificateStatusBadge.propTypes = {
  status: PropTypes.string,
  lifecycleStatus: PropTypes.string,
  expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  isExpired: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
};

export default CertificateStatusBadge;
