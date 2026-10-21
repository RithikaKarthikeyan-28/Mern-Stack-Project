import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import adminService from '../services/adminService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import CertificateRevokeModal from '../components/admin/CertificateRevokeModal';

export const AdminCertificatesPage = () => {
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'expiring' | 'expired'
  const [certificates, setCertificates] = useState([]);
  const [expiringCerts, setExpiringCerts] = useState([]);
  const [expiredCerts, setExpiredCerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Revoke Modal
  const [revokingCert, setRevokingCert] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allData, expData, expdData] = await Promise.all([
        adminService.getCertificates(),
        adminService.getExpiringCertificates(),
        adminService.getExpiredCertificates(),
      ]);
      setCertificates(allData.certificates || (Array.isArray(allData) ? allData : []));
      setExpiringCerts(expData);
      setExpiredCerts(expdData);
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Failed to load certificate records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayedList = useMemo(() => {
    let base = certificates;
    if (activeTab === 'expiring') base = expiringCerts;
    if (activeTab === 'expired') base = expiredCerts;

    return base.filter((c) => {
      if (activeTab === 'all' && statusFilter !== 'all') {
        if ((c.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const num = (c.certificateNumber || '').toLowerCase();
        const empName = (c.employee?.user?.name || c.employee?.employeeId || '').toLowerCase();
        const courseTitle = (c.course?.title || '').toLowerCase();
        return num.includes(term) || empName.includes(term) || courseTitle.includes(term);
      }

      return true;
    });
  }, [certificates, expiringCerts, expiredCerts, activeTab, statusFilter, searchTerm]);

  const handleRevoke = async (id, reason) => {
    setIsRevoking(true);
    try {
      const updated = await adminService.revokeCertificate(id, reason);
      setCertificates((prev) =>
        prev.map((c) => ((c._id || c.id) === id ? updated : c))
      );
      success('Certificate revoked successfully.');
      setRevokingCert(null);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-ink-primary dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-600" />
            Certificates Oversight
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit issued credentials, monitor expiration windows, and manage revocations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh certificates"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'border-teal-700 text-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Certificates ({certificates.length})
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'expiring'
              ? 'border-teal-700 text-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Expiring Soon ({expiringCerts.length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'expired'
              ? 'border-teal-700 text-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Expired ({expiredCerts.length})
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by certificate number, recipient name, or course..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            aria-label="Search certificates"
          />
        </div>

        {activeTab === 'all' && (
          <div className="shrink-0 w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              aria-label="Filter certificates by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : error ? (
        <ErrorState
          title="Certificates Unavailable"
          message={error}
          onRetry={loadData}
        />
      ) : displayedList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No certificates found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || statusFilter !== 'all'
              ? 'Try modifying your search or filter.'
              : 'Credentials appear here automatically as learners complete certified courses.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Certificate Number</th>
                <th className="px-5 py-3.5">Recipient</th>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Issued / Expires</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayedList.map((c) => {
                const id = c._id || c.id;
                const isRevocable = c.status === 'active';
                const empName = c.employee?.user?.name || c.employee?.employeeId || 'Employee';

                return (
                  <tr key={id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {c.certificateNumber}
                      </div>
                      <Link
                        to={`/verify-certificate/${c.certificateNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-teal-700 hover:text-teal-800 dark:text-teal-400 flex items-center gap-1 mt-0.5"
                      >
                        Public Verify <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {empName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.employee?.user?.email || c.employee?.department?.name || ''}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">
                      {c.course?.title || 'Certified Course'}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div>Issued: {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : 'N/A'}</div>
                      <div>
                        {c.expiryDate ? `Expires: ${new Date(c.expiryDate).toLocaleDateString()}` : 'Lifetime'}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <AdminStatusBadge status={c.status} />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {isRevocable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokingCert(c)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Revoke Certificate"
                          aria-label={`Revoke certificate ${c.certificateNumber}`}
                        >
                          <ShieldAlert className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke Modal */}
      <CertificateRevokeModal
        isOpen={Boolean(revokingCert)}
        onClose={() => setRevokingCert(null)}
        certificate={revokingCert}
        onRevoke={handleRevoke}
        isLoading={isRevoking}
      />
    </div>
  );
};

export default AdminCertificatesPage;
