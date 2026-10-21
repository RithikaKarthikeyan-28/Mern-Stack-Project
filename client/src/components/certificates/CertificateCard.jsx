import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Award, Calendar, Copy, Check, ExternalLink, RefreshCw, ArrowUpRight, Download } from 'lucide-react';
import CertificateStatusBadge from './CertificateStatusBadge';
import Button from '../ui/Button';
import certificateService from '../../services/certificateService';

export const CertificateCard = ({ certificate, onRenewClick }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const certId = certificate.id || certificate._id;
  const courseTitle = certificate.course?.title || 'Certification Course';
  const courseCategory = certificate.course?.category || 'Professional';
  const courseLevel = certificate.course?.level || 'Intermediate';

  const certNumber = certificate.certificateNumber || 'SKILLTRACK-UNKNOWN';
  const issuedDate = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const expiryDate = certificate.expiresAt
    ? new Date(certificate.expiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No Expiration';

  // Determine renewal eligibility
  const isRevoked = certificate.status === 'revoked' || certificate.lifecycleStatus === 'revoked';
  const isExpired = certificate.isExpired || certificate.lifecycleStatus === 'expired';
  let isExpiringSoon = false;
  if (!isRevoked && !isExpired && certificate.expiresAt) {
    const daysLeft = (new Date(certificate.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 30 && daysLeft > 0) {
      isExpiringSoon = true;
    }
  }

  const isRenewalEligible = !isRevoked && (isExpired || isExpiringSoon);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(certNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
      data-testid={`certificate-card-${certId}`}
    >
      {/* Top Banner Accent */}
      <div className="h-2 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-800 w-full" />

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header: Category & Lifecycle Status Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
              {courseCategory}
            </span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
              {courseLevel}
            </span>
          </div>

          <CertificateStatusBadge
            status={certificate.status}
            lifecycleStatus={certificate.lifecycleStatus}
            expiresAt={certificate.expiresAt}
            isExpired={certificate.isExpired}
            size="sm"
          />
        </div>

        {/* Course Title */}
        <h3 className="text-base sm:text-lg font-bold text-[#102A2A] group-hover:text-teal-700 transition-colors line-clamp-2 mb-2">
          {courseTitle}
        </h3>

        {/* Certificate Number with copy */}
        <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
          <Award className="w-4 h-4 text-slate-400 shrink-0" />
          <code className="text-xs font-mono font-semibold text-slate-700 truncate select-all flex-1">
            {certNumber}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            title="Copy certificate number"
            aria-label="Copy certificate number"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100 mt-auto">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Issued On</span>
            </div>
            <p className="font-semibold text-slate-800">{issuedDate}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Expires</span>
            </div>
            <p className={`font-semibold ${isExpired ? 'text-amber-700' : 'text-slate-800'}`}>
              {expiryDate}
            </p>
          </div>
        </div>

        {/* Renewal parent badge if this is a renewed certificate */}
        {certificate.renewedFrom && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-teal-800 bg-teal-50/60 px-2.5 py-1 rounded-lg">
            <RefreshCw className="w-3 h-3 text-teal-600" />
            <span>Renewed Credential</span>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => navigate(`/verify-certificate/${certNumber}`)}
          >
            <span>Verify</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50"
            title="Download PDF Certificate"
            onClick={async (e) => {
              e.stopPropagation();
              await certificateService.downloadCertificatePDF(certId, certNumber);
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>PDF</span>
          </Button>

          {isRenewalEligible && (
            <Button
              size="sm"
              variant="secondary"
              className="text-xs bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              onClick={() => {
                if (onRenewClick) {
                  onRenewClick(certificate);
                } else {
                  navigate(`/certificates/${certId}`);
                }
              }}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Renew</span>
            </Button>
          )}
        </div>

        <Button
          size="sm"
          variant="primary"
          className="text-xs"
          onClick={() => navigate(`/certificates/${certId}`)}
        >
          <span>View</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

CertificateCard.propTypes = {
  certificate: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    certificateNumber: PropTypes.string,
    status: PropTypes.string,
    lifecycleStatus: PropTypes.string,
    isExpired: PropTypes.bool,
    issuedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    renewedFrom: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    course: PropTypes.shape({
      title: PropTypes.string,
      category: PropTypes.string,
      level: PropTypes.string,
    }),
  }).isRequired,
  onRenewClick: PropTypes.func,
};

export default CertificateCard;
