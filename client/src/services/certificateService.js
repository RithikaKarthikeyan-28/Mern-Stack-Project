import api from './api';

export const certificateService = {
  /**
   * Retrieves the authenticated employee's certificates with lifecycle filtering and pagination.
   * @param {object} params - { page, limit, status } where status can be 'active', 'expired', or 'revoked'
   * @returns {Promise<{ certificates: Array, pagination: object }>}
   */
  getMyCertificates: async (params = {}) => {
    const res = await api.get('/certificates/me', { params });
    const data = res.data?.data || res.data || {};
    return {
      certificates: data.certificates || [],
      pagination: data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  },

  /**
   * Retrieves a single certificate by ID.
   * Access is scoped by backend (employee owns cert, trainer teaches course, or admin).
   * @param {string} certificateId
   * @returns {Promise<object>}
   */
  getCertificateById: async (certificateId) => {
    const res = await api.get(`/certificates/${certificateId}`);
    return res.data?.data?.certificate || res.data?.certificate;
  },

  /**
   * Renews an eligible certificate, creating a new certificate document.
   * @param {string} certificateId
   * @param {object} data - { reason?: string }
   * @returns {Promise<{ certificate: object, isExisting: boolean }>}
   */
  renewCertificate: async (certificateId, data = {}) => {
    const res = await api.post(`/certificates/${certificateId}/renew`, data);
    return {
      certificate: res.data?.data?.certificate || res.data?.certificate,
      isExisting: Boolean(res.data?.data?.isExisting ?? res.data?.isExisting),
    };
  },

  /**
   * Retrieves the renewal history chain (parent and subsequent renewals).
   * @param {string} certificateId
   * @returns {Promise<{ certificate: object, parent: object|null, renewals: Array }>}
   */
  getCertificateRenewals: async (certificateId) => {
    const res = await api.get(`/certificates/${certificateId}/renewals`);
    const data = res.data?.data || res.data || {};
    return {
      certificate: data.certificate || null,
      parent: data.parent || null,
      renewals: data.renewals || [],
    };
  },

  /**
   * Public certificate verification endpoint (NO authentication required).
   * @param {string} certificateNumber
   * @returns {Promise<object>} Safe public certificate verification object
   */
  verifyCertificate: async (certificateNumber) => {
    const cleanNumber = String(certificateNumber).trim().toUpperCase();
    const res = await api.get(`/certificates/verify/${encodeURIComponent(cleanNumber)}`);
    return res.data?.data?.certificate || res.data?.certificate;
  },

  /**
   * Issues a certificate for an authenticated employee upon course completion.
   * @param {object} data - { enrollmentId: string }
   * @returns {Promise<{ certificate: object, isExisting: boolean }>}
   */
  issueCertificate: async (data) => {
    const res = await api.post('/certificates', data);
    return {
      certificate: res.data?.data?.certificate || res.data?.certificate,
      isExisting: Boolean(res.data?.data?.isExisting ?? res.data?.isExisting),
    };
  },

  /**
   * Downloads the official vector PDF certificate file.
   * @param {string} certificateId
   * @param {string} [certificateNumber='certificate']
   */
  downloadCertificatePDF: async (certificateId, certificateNumber = 'certificate') => {
    const res = await api.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SkillTrack-Certificate-${certificateNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Triggers a resend of the certificate congratulations email.
   * @param {string} certificateId
   * @returns {Promise<object>}
   */
  resendCertificateEmail: async (certificateId) => {
    const res = await api.post(`/certificates/${certificateId}/resend-email`);
    return res.data?.data?.certificate || res.data?.certificate;
  },
};

export default certificateService;
