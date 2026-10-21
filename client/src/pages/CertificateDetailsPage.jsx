import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Building2,
  Share2,
  BookOpen,
  Download,
  Mail,
} from 'lucide-react';
import certificateService from '../services/certificateService';
import CertificateStatusBadge from '../components/certificates/CertificateStatusBadge';
import RenewalHistory from '../components/certificates/RenewalHistory';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import { useToast } from '../context/ToastContext';

export const CertificateDetailsPage = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [certificate, setCertificate] = useState(null);
  const [renewalHistory, setRenewalHistory] = useState({ parent: null, renewals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Renewal Action Modal
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalReason, setRenewalReason] = useState('');
  const [renewing, setRenewing] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [certData, renewalsData] = await Promise.all([
        certificateService.getCertificateById(certificateId),
        certificateService.getCertificateRenewals(certificateId).catch(() => ({
          parent: null,
          renewals: [],
        })),
      ]);

      setCertificate(certData);
      setRenewalHistory({
        parent: renewalsData.parent || null,
        renewals: renewalsData.renewals || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner text="Loading certificate credential..." />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Certificate Not Available"
          message={error || 'Unable to load certificate credential details.'}
          onRetry={fetchDetails}
        />
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate('/certificates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back to Certificates</span>
          </Button>
        </div>
      </div>
    );
  }

  const employeeName =
    certificate.employee?.user?.name ||
    certificate.employee?.name ||
    'Learner';
  const departmentName = certificate.employee?.department?.name || 'Department';
  const courseId =
    certificate.course?._id ||
    certificate.course?.id ||
    (typeof certificate.course === 'string' ? certificate.course : null);
  const courseTitle = certificate.course?.title || 'Professional Certification';
  const courseCategory = certificate.course?.category || 'Professional';
  const courseLevel = certificate.course?.level || 'Intermediate';
  const courseDuration = certificate.course?.duration
    ? `${certificate.course.duration} hours`
    : 'Comprehensive';
  const certNumber = certificate.certificateNumber;

  const issuedDateStr = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const expiryDateStr = certificate.expiresAt
    ? new Date(certificate.expiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never Expires';

  // Renewal eligibility rules
  const isRevoked = certificate.status === 'revoked' || certificate.lifecycleStatus === 'revoked';
  const isExpired = certificate.isExpired || certificate.lifecycleStatus === 'expired';
  let isExpiringSoon = false;
  let daysUntilExpiry = null;
  if (!isRevoked && !isExpired && certificate.expiresAt) {
    daysUntilExpiry = Math.ceil(
      (new Date(certificate.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      isExpiringSoon = true;
    }
  }

  // Check if a subsequent renewal already exists
  const hasSubsequentRenewal = renewalHistory.renewals && renewalHistory.renewals.length > 0;
  const isRenewalEligible = !isRevoked && !hasSubsequentRenewal && (isExpired || isExpiringSoon);

  const verificationUrl = `${window.location.origin}/verify-certificate/${certNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast({ type: 'success', message: 'Verification link copied to clipboard!' });
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(certNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
    addToast({ type: 'success', message: 'Certificate number copied!' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await certificateService.downloadCertificatePDF(certificateId, certNumber);
      addToast({ type: 'success', message: 'Certificate PDF downloaded successfully!' });
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to download certificate PDF.'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleConfirmRenew = async () => {
    setRenewing(true);
    try {
      const res = await certificateService.renewCertificate(certificateId, {
        reason: renewalReason.trim() || undefined,
      });

      addToast({
        type: 'success',
        message: res.isExisting
          ? 'Certificate renewal already active.'
          : 'Certificate renewed successfully! New credential issued.',
      });

      setRenewalModalOpen(false);
      const newCertId = res.certificate?.id || res.certificate?._id || certificateId;
      if (newCertId !== certificateId) {
        navigate(`/certificates/${newCertId}`);
      } else {
        fetchDetails();
      }
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to renew certificate.',
      });
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/certificates')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to All Certificates</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleDownloadPDF} disabled={downloading}>
            <Download className="w-4 h-4 mr-1.5" />
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600 mr-1.5" />
            ) : (
              <Share2 className="w-4 h-4 mr-1.5" />
            )}
            <span>Share Link</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print / Save PDF</span>
          </Button>

          <Link to={`/verify-certificate/${certNumber}`}>
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              <span>Public Verification</span>
            </Button>
          </Link>

          {courseId && (
            <Link to={`/courses/${courseId}`}>
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-1.5" />
                <span>View Course</span>
              </Button>
            </Link>
          )}

          {certificate.emailPreviewUrl && (
            <a
              href={certificate.emailPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <Button variant="outline" size="sm" className="text-teal-700 border-teal-300 hover:bg-teal-50">
                <Mail className="w-4 h-4 mr-1.5 text-teal-600" />
                <span>View Email Notification</span>
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Official Certificate Credential Document Card (Printable) */}
      <div
        className="bg-white rounded-3xl border-4 border-slate-900 shadow-xl overflow-hidden relative"
        data-testid="certificate-showcase"
      >
        {/* Certificate Decorative Border Margin */}
        <div className="p-2 sm:p-4 border-4 border-dashed border-teal-200/80 m-2 sm:m-4 rounded-2xl bg-radial from-white via-teal-50/20 to-slate-50/40">
          <div className="p-6 sm:p-12 text-center flex flex-col items-center">
            {/* Seal / Emblem */}
            <div className="w-20 h-20 rounded-2xl bg-teal-700 shadow-xl shadow-teal-700/30 flex items-center justify-center text-white mb-6">
              <Award className="w-10 h-10" />
            </div>

            {/* Platform Issuer Brand */}
            <span className="text-xs font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200 mb-2">
              SkillTrack Enterprise Credential
            </span>

            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#102A2A] mb-4">
              Certificate of Completion
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-semibold mb-6">
              This is to certify that
            </p>

            {/* Recipient Name */}
            <h2 className="text-xl sm:text-3xl font-bold text-[#102A2A] underline decoration-teal-500 decoration-2 underline-offset-8 mb-2">
              {employeeName}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
              <Building2 className="w-3.5 h-3.5" />
              <span>{departmentName}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-4">
              has successfully fulfilled all curriculum requirements, passed all associated assessments, and achieved mastery in
            </p>

            {/* Course Title */}
            <div className="bg-teal-50/80 border border-teal-100 rounded-2xl px-6 py-4 max-w-xl mx-auto mb-6">
              <h3 className="text-lg sm:text-2xl font-bold text-teal-950 mb-1">
                {courseTitle}
              </h3>
              <div className="flex items-center justify-center gap-3 text-xs text-teal-800 font-medium">
                <span className="capitalize">{courseCategory}</span>
                <span>•</span>
                <span className="capitalize">{courseLevel}</span>
                <span>•</span>
                <span>{courseDuration}</span>
              </div>
            </div>

            {certificate.score !== null && certificate.score !== undefined && (
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Assessment Score: {certificate.score}% • Passed</span>
              </div>
            )}

            {/* Status & Identifiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl pt-6 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Issued Date
                </span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{issuedDateStr}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Expiration Date
                </span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{expiryDateStr}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Credential Status
                </span>
                <CertificateStatusBadge
                  status={certificate.status}
                  lifecycleStatus={certificate.lifecycleStatus}
                  expiresAt={certificate.expiresAt}
                  isExpired={certificate.isExpired}
                  size="md"
                />
              </div>
            </div>

            {/* Certificate ID footer */}
            <div className="mt-8 pt-4 border-t border-dashed border-slate-200 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Certificate ID:</span>
                <code className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {certNumber}
                </code>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                  title="Copy ID"
                >
                  {copiedNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="text-slate-400 text-[11px]">
                Verify online at {verificationUrl}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Status & Action Card (Employee interactive) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Renewal Policy & Status</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Certificates are valid for 1 year and can be renewed within 30 days of expiration or after expiry.
              </p>

              {/* Status explanation */}
              <div className="mt-2 text-xs">
                {isRevoked ? (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    This certificate has been revoked and cannot be renewed.
                  </span>
                ) : hasSubsequentRenewal ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    This credential has already been renewed. Check the renewal chain below.
                  </span>
                ) : isExpired ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    This credential is expired and is eligible for renewal.
                  </span>
                ) : isExpiringSoon ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Expiring in {daysUntilExpiry} days. Eligible for renewal now!
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">
                    In good standing. Renewal opens 30 days prior to expiration.
                  </span>
                )}
              </div>
            </div>
          </div>

          {isRenewalEligible && (
            <Button
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              onClick={() => {
                setRenewalReason('');
                setRenewalModalOpen(true);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Renew Certificate</span>
            </Button>
          )}
        </div>
      </div>

      {/* Renewal History Chain */}
      <div className="print:hidden">
        <RenewalHistory
          certificate={certificate}
          parent={renewalHistory.parent}
          renewals={renewalHistory.renewals}
        />
      </div>

      {/* Renewal Confirmation Modal */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        title="Renew Certificate Credential"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            You are requesting a renewal for course:{' '}
            <strong className="text-slate-900">{courseTitle}</strong>.
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Renewal verifies active course completion eligibility and creates a brand-new certificate credential with updated expiration dates, linked to this parent record.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Renewal Reason (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., Annual recertification"
              value={renewalReason}
              onChange={(e) => setRenewalReason(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setRenewalModalOpen(false)}
              disabled={renewing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmRenew}
              isLoading={renewing}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Confirm & Renew</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificateDetailsPage;
