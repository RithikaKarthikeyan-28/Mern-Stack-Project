import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, ArrowDown, Award, Calendar, AlertCircle } from 'lucide-react';
import CertificateStatusBadge from './CertificateStatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

export const RenewalHistory = ({ certificate, parent, renewals = [], loading = false }) => {
  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <LoadingSpinner text="Loading renewal history..." />
      </div>
    );
  }

  const hasParent = Boolean(parent);
  const hasRenewals = renewals && renewals.length > 0;
  const isOriginalOnly = !hasParent && !hasRenewals;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#102A2A]">Certificate Renewal History</h3>
          <p className="text-xs text-slate-500">
            Immutable chain of credential issues, renewals, and expiration lifecycles.
          </p>
        </div>
      </div>

      {isOriginalOnly ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Initial Certificate Issuance</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            This is an original standalone certificate. It has not been renewed from an older certificate, and no newer renewals exist.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-xl mx-auto">
          {/* 1. Parent / Source Certificate (if any) */}
          {hasParent && (
            <div className="relative pl-8 pb-4">
              {/* Connector line */}
              <div className="absolute left-3.5 top-5 bottom-0 w-0.5 bg-teal-200" />
              <div className="absolute left-1.5 top-2 w-4 h-4 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Original Certificate
                  </span>
                  <CertificateStatusBadge
                    status={parent.status}
                    expiresAt={parent.expiresAt}
                    size="sm"
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono font-bold text-slate-800">
                    {parent.certificateNumber}
                  </code>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Issued: {parent.issuedAt ? new Date(parent.issuedAt).toLocaleDateString() : 'N/A'}
                  </span>
                  {parent.expiresAt && (
                    <span>Expires: {new Date(parent.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-center my-2 text-teal-500">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 2. Current Certificate */}
          <div className="relative pl-8 pb-4">
            {hasRenewals && (
              <div className="absolute left-3.5 top-5 bottom-0 w-0.5 bg-teal-200" />
            )}
            <div className="absolute left-1 top-2 w-5 h-5 rounded-full bg-teal-700 border-2 border-white shadow-xs flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                    {hasParent ? 'Renewed Credential (Current)' : 'Current Certificate'}
                  </span>
                  <span className="text-[10px] bg-teal-700 text-white font-bold px-2 py-0.5 rounded-full">
                    Active View
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

              <code className="text-sm font-mono font-bold text-teal-950 block mb-2">
                {certificate.certificateNumber}
              </code>

              <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-700" />
                  Issued: {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'N/A'}
                </span>
                {certificate.expiresAt && (
                  <span>Expires: {new Date(certificate.expiresAt).toLocaleDateString()}</span>
                )}
              </div>

              {certificate.renewalReason && (
                <div className="mt-3 pt-2 border-t border-teal-100 text-xs text-slate-600 italic">
                  &ldquo;{certificate.renewalReason}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* 3. Subsequent Renewals */}
          {hasRenewals && (
            <div className="space-y-4">
              <div className="flex justify-center my-2 text-teal-500">
                <ArrowDown className="w-4 h-4" />
              </div>

              {renewals.map((renewal) => {
                const rId = renewal.id || renewal._id;
                return (
                  <div key={rId} className="relative pl-8">
                    <div className="absolute left-1.5 top-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                          Subsequent Renewal
                        </span>
                        <CertificateStatusBadge
                          status={renewal.status}
                          expiresAt={renewal.expiresAt}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono font-bold text-slate-800">
                          {renewal.certificateNumber}
                        </code>
                        <Link
                          to={`/certificates/${rId}`}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          View Credential &rarr;
                        </Link>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Renewed: {renewal.renewedAt ? new Date(renewal.renewedAt).toLocaleDateString() : 'N/A'}
                        </span>
                        {renewal.expiresAt && (
                          <span>Expires: {new Date(renewal.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {renewal.renewalReason && (
                        <div className="mt-2 text-xs text-slate-600 italic">
                          Reason: {renewal.renewalReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {certificate.status === 'revoked' && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Certificate Revoked</p>
            <p className="mt-0.5">
              This certificate was revoked on{' '}
              {certificate.revokedAt ? new Date(certificate.revokedAt).toLocaleDateString() : 'N/A'}.
              {certificate.revocationReason ? ` Reason: "${certificate.revocationReason}"` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

RenewalHistory.propTypes = {
  certificate: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    certificateNumber: PropTypes.string,
    status: PropTypes.string,
    lifecycleStatus: PropTypes.string,
    isExpired: PropTypes.bool,
    issuedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    renewalReason: PropTypes.string,
    revokedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    revocationReason: PropTypes.string,
  }).isRequired,
  parent: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    certificateNumber: PropTypes.string,
    status: PropTypes.string,
    issuedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  renewals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      _id: PropTypes.string,
      certificateNumber: PropTypes.string,
      status: PropTypes.string,
      renewedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      renewalReason: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

export default RenewalHistory;
