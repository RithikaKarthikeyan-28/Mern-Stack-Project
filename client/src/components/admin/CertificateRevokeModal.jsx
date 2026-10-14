import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ShieldAlert } from 'lucide-react';

export const CertificateRevokeModal = ({
  isOpen,
  onClose,
  certificate,
  onRevoke,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !certificate) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A formal revocation reason is required.');
      return;
    }
    setError('');
    try {
      await onRevoke(certificate._id || certificate.id, reason.trim());
      onClose();
    } catch (err) {
      setError(err.normalizedMessage || err.message || 'Revocation failed');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke Issued Certificate"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-semibold block">Permanent Revocation</span>
            Revoking certificate <span className="font-mono font-bold">{certificate.certificateNumber}</span> cannot be undone. Public verification will immediately indicate this credential is void.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason for Revocation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Credential issued in error, academic misconduct, or regulatory policy breach..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" size="sm" isLoading={isLoading}>
            Revoke Certificate
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CertificateRevokeModal;
