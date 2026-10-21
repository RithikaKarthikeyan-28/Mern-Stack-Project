import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  BookOpen,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import certificateService from '../services/certificateService';
import CertificateCard from '../components/certificates/CertificateCard';
import StatCard from '../components/ui/StatCard';
import Tabs from '../components/ui/Tabs';
import Pagination from '../components/ui/Pagination';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export const CertificatesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });

  // Renewal Modal State
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedCertForRenewal, setSelectedCertForRenewal] = useState(null);
  const [renewalReason, setRenewalReason] = useState('');
  const [renewing, setRenewing] = useState(false);

  // Stats computed from all retrieved certificates or fetched count
  const [statsSummary, setStatsSummary] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });

  const fetchCertificates = useCallback(async (tab, page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
      };
      if (tab !== 'all') {
        params.status = tab;
      }

      const res = await certificateService.getMyCertificates(params);
      setCertificates(res.certificates || []);
      setPagination(
        res.pagination || { page: 1, limit: 9, total: res.certificates?.length || 0, totalPages: 1 }
      );
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to load your certificates.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Initial stats discovery
  useEffect(() => {
    const fetchAllForStats = async () => {
      try {
        const res = await certificateService.getMyCertificates({ limit: 100 });
        const all = res.certificates || [];

        let activeCount = 0;
        let expiringCount = 0;
        let expiredCount = 0;

        const now = Date.now();
        all.forEach((c) => {
          const isRev = c.status === 'revoked' || c.lifecycleStatus === 'revoked';
          const isExp = c.isExpired || c.lifecycleStatus === 'expired';

          if (!isRev && !isExp) {
            activeCount++;
            if (c.expiresAt) {
              const daysLeft = (new Date(c.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24);
              if (daysLeft <= 30 && daysLeft > 0) {
                expiringCount++;
              }
            }
          } else if (isExp) {
            expiredCount++;
          }
        });

        setStatsSummary({
          total: all.length,
          active: activeCount,
          expiringSoon: expiringCount,
          expired: expiredCount,
        });
      } catch {
        // Stats error is non-fatal
      }
    };

    fetchAllForStats();
  }, []);

  useEffect(() => {
    fetchCertificates(activeTab, pagination.page);
  }, [fetchCertificates, activeTab, pagination.page]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenRenewModal = (cert) => {
    setSelectedCertForRenewal(cert);
    setRenewalReason('');
    setRenewalModalOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!selectedCertForRenewal) return;
    setRenewing(true);
    try {
      const certId = selectedCertForRenewal.id || selectedCertForRenewal._id;
      const res = await certificateService.renewCertificate(certId, {
        reason: renewalReason.trim() || undefined,
      });

      addToast({
        type: 'success',
        message: res.isExisting
          ? 'Certificate renewal is already active.'
          : 'Certificate renewed successfully! New credential issued.',
      });

      setRenewalModalOpen(false);
      // Navigate to the newly renewed or updated certificate
      const newCertId = res.certificate?.id || res.certificate?._id || certId;
      navigate(`/certificates/${newCertId}`);
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to renew certificate.',
      });
    } finally {
      setRenewing(false);
    }
  };

  // Filter list by search query client-side
  const filteredCertificates = useMemo(() => {
    if (!searchQuery.trim()) return certificates;
    const q = searchQuery.toLowerCase().trim();
    return certificates.filter((c) => {
      const courseTitle = (c.course?.title || '').toLowerCase();
      const certNum = (c.certificateNumber || '').toLowerCase();
      return courseTitle.includes(q) || certNum.includes(q);
    });
  }, [certificates, searchQuery]);

  const tabsConfig = [
    { id: 'all', label: 'All Certificates' },
    { id: 'active', label: 'Active Credentials' },
    { id: 'expired', label: 'Expired' },
    { id: 'revoked', label: 'Revoked' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#0D544F] rounded-3xl p-6 sm:p-8 text-white shadow-md border border-[#0F766E]/20 relative overflow-hidden"
        data-testid="certificates-hero-banner"
      >
        {/* Soft background glow accents */}
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-[#14B8A6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-12 w-64 h-64 bg-[#2DD4BF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#ECFDF5] text-[#0F766E] text-xs font-semibold px-3 py-1 rounded-full mb-3 shadow-xs border border-[#A7DCCB]">
              <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Verified Learning Achievements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              My Certificates
            </h1>
            <p className="text-sm text-teal-50/90 leading-relaxed font-normal">
              Access your verified course completion credentials, view renewal eligibility, and share publicly verifiable proof of your skill proficiencies.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => fetchCertificates(activeTab, pagination.page)}
              disabled={loading}
              className="flex items-center gap-1.5"
              aria-label="Refresh certificates"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earned"
          value={statsSummary.total}
          icon={<Award className="w-5 h-5" />}
          color="teal"
          description="Issued credentials"
        />
        <StatCard
          title="Active & Valid"
          value={statsSummary.active}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
          description="In good standing"
        />
        <StatCard
          title="Expiring Soon"
          value={statsSummary.expiringSoon}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          description="Within 30-day window"
        />
        <StatCard
          title="Expired / Past"
          value={statsSummary.expired}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="rose"
          description="Eligible for renewal"
        />
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="overflow-x-auto">
          <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={handleTabChange} />
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by course or cert #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="certificates-loading">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div
          className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200"
          data-testid="certificates-empty"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#A7DCCB] flex items-center justify-center text-[#0F766E] mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#102A2A]">
            {searchQuery ? 'No matching certificates found' : 'No certificates earned yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 mb-6">
            {searchQuery
              ? 'Try modifying your search query or reset the filter tabs.'
              : 'Complete all lessons and pass the final course assessments with 100% progress to earn official verifiable certificates.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/courses')}>
            <BookOpen className="w-4 h-4 mr-2" />
            <span>Explore Courses</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="certificates-grid">
          {filteredCertificates.map((cert) => (
            <CertificateCard
              key={cert.id || cert._id}
              certificate={cert}
              onRenewClick={handleOpenRenewModal}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Renewal Confirmation Modal */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        title="Renew Certificate Credential"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            You are requesting a renewal for course:{' '}
            <strong className="text-slate-900">
              {selectedCertForRenewal?.course?.title || 'Certification Course'}
            </strong>
            .
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Renewal will verify current course completion and issue a new certificate document with updated validity dates, preserving the original credential in the renewal audit chain.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Renewal Reason (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., Annual compliance renewal, job requirement"
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

export default CertificatesPage;
