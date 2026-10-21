import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Award,
  Calendar,
  Clock,
  User,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import certificateService from '../services/certificateService';
import CertificateStatusBadge from '../components/certificates/CertificateStatusBadge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export const VerifyCertificatePage = () => {
  const { certificateNumber: paramCertNumber } = useParams();
  const navigate = useNavigate();

  const [inputCertNumber, setInputCertNumber] = useState(paramCertNumber || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchedNumber, setSearchedNumber] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const executeVerify = useCallback(async (certNum) => {
    if (!certNum || !certNum.trim()) return;
    const clean = certNum.trim().toUpperCase();
    setSearchedNumber(clean);
    setLoading(true);
    setNotFound(false);
    setErrorMessage('');
    setVerificationResult(null);

    try {
      const data = await certificateService.verifyCertificate(clean);
      setVerificationResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Unable to complete verification check.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paramCertNumber) {
      setInputCertNumber(paramCertNumber);
      executeVerify(paramCertNumber);
    }
  }, [paramCertNumber, executeVerify]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputCertNumber.trim()) return;
    const clean = inputCertNumber.trim().toUpperCase();
    if (paramCertNumber === clean) {
      executeVerify(clean);
    } else {
      navigate(`/verify-certificate/${clean}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-teal-700 shadow-lg shadow-teal-700/30 flex items-center justify-center text-white mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#102A2A] tracking-tight">
          Verify Certificate Credential
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter a SkillTrack certificate ID to verify authenticity, recipient details, and current lifecycle validity in real-time.
        </p>
      </div>

      {/* Lookup Search Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch"
        data-testid="verify-search-form"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="e.g. SKILLTRACK-2026-A1B2C3D4"
            value={inputCertNumber}
            onChange={(e) => setInputCertNumber(e.target.value)}
            className="pl-10 font-mono uppercase text-xs sm:text-sm"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="shrink-0"
          isLoading={loading}
          disabled={!inputCertNumber.trim()}
        >
          <span>Verify Credential</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex justify-center items-center">
          <LoadingSpinner text="Checking certificate verification registry..." />
        </div>
      )}

      {/* 404 Not Found State */}
      {!loading && notFound && (
        <div
          className="bg-rose-50/70 border border-rose-200 rounded-3xl p-8 text-center"
          data-testid="verify-not-found"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900">
            Certificate Not Found
          </h3>
          <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto mt-1 mb-3">
            No valid certificate record exists with the number{' '}
            <strong className="font-mono">{searchedNumber}</strong>. Please ensure the certificate number is spelled correctly.
          </p>
          <p className="text-[11px] text-rose-600/80">
            Valid IDs follow the pattern: <code>SKILLTRACK-YYYY-XXXXXXXX</code>
          </p>
        </div>
      )}

      {/* Error Message */}
      {!loading && errorMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-amber-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Verified Certificate Card */}
      {!loading && verificationResult && (
        <div
          className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden"
          data-testid="verify-success"
        >
          {/* Top Verification Status Banner */}
          <div
            className={`p-4 sm:p-5 flex items-center justify-between gap-4 border-b ${
              verificationResult.lifecycleStatus === 'active'
                ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
                : verificationResult.lifecycleStatus === 'expired'
                ? 'bg-amber-50/80 border-amber-100 text-amber-900'
                : 'bg-rose-50/80 border-rose-100 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {verificationResult.lifecycleStatus === 'active' && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              )}
              {verificationResult.lifecycleStatus === 'expired' && (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              {verificationResult.lifecycleStatus === 'revoked' && (
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
              )}

              <div>
                <h3 className="text-sm sm:text-base font-bold leading-tight">
                  {verificationResult.lifecycleStatus === 'active'
                    ? 'Verified Authentic Credential'
                    : verificationResult.lifecycleStatus === 'expired'
                    ? 'Authentic Credential (Expired)'
                    : 'Certificate Revoked'}
                </h3>
                <p className="text-xs opacity-80">
                  {verificationResult.lifecycleStatus === 'active'
                    ? 'This certificate is authentic, active, and registered in SkillTrack.'
                    : verificationResult.lifecycleStatus === 'expired'
                    ? 'This certificate was authentic but has passed its validity date.'
                    : 'This certificate was revoked by an administrator.'}
                </p>
              </div>
            </div>

            <CertificateStatusBadge
              status={verificationResult.status}
              lifecycleStatus={verificationResult.lifecycleStatus}
              expiresAt={verificationResult.expiresAt}
              isExpired={verificationResult.isExpired}
              size="md"
            />
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Recipient & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Recipient Learner
                  </span>
                  <h4 className="text-base font-bold text-[#102A2A] mt-0.5">
                    {verificationResult.employeeName}
                  </h4>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Certified Course
                  </span>
                  <h4 className="text-base font-bold text-[#102A2A] mt-0.5">
                    {verificationResult.courseTitle}
                  </h4>
                  <p className="text-xs text-slate-500 capitalize">
                    {verificationResult.courseCategory} • {verificationResult.courseLevel}
                    {verificationResult.courseDuration ? ` • ${verificationResult.courseDuration}h` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Certificate ID</span>
                <code className="font-mono font-bold text-slate-800 text-sm">
                  {verificationResult.certificateNumber}
                </code>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">Issue Date</span>
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {verificationResult.issuedAt
                      ? new Date(verificationResult.issuedAt).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-400 block mb-1">Expiration Date</span>
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {verificationResult.expiresAt
                      ? new Date(verificationResult.expiresAt).toLocaleDateString()
                      : 'No Expiration'}
                  </span>
                </div>
              </div>
            </div>

            {/* Renewal Note if applicable */}
            {verificationResult.isRenewal && (
              <div className="p-3 bg-teal-50/60 rounded-xl text-xs text-teal-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  This credential is a renewal of previous certificate{' '}
                  <strong className="font-mono">
                    {verificationResult.renewedFrom?.certificateNumber || 'Original'}
                  </strong>
                  .
                </span>
              </div>
            )}

            {/* Revocation Details if revoked */}
            {verificationResult.status === 'revoked' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Certificate Revocation Notice
                </p>
                <p>
                  Revoked On:{' '}
                  {verificationResult.revokedAt
                    ? new Date(verificationResult.revokedAt).toLocaleDateString()
                    : 'N/A'}
                </p>
                {verificationResult.revocationReason && (
                  <p>Reason: &ldquo;{verificationResult.revocationReason}&rdquo;</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyCertificatePage;
