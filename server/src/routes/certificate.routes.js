const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const certificateController = require('../controllers/certificate.controller');

const router = express.Router();

/**
 * @route   POST /api/certificates
 * @desc    Issue a certificate for an authenticated employee upon course completion
 * @access  Private (Employee only)
 */
router.post(
  '/',
  authMiddleware,
  authorizeRoles('employee'),
  certificateController.issueCertificate
);

/**
 * @route   GET /api/certificates/verify/:certificateNumber
 * @desc    Public certificate verification endpoint
 * @access  Public (NO authentication required)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.get(
  '/verify/:certificateNumber',
  certificateController.verifyCertificate
);

/**
 * @route   GET /api/certificates/me
 * @desc    Retrieve the authenticated employee's certificates with lifecycle filtering
 * @access  Private (Employee only)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.get(
  '/me',
  authMiddleware,
  authorizeRoles('employee'),
  certificateController.getMyCertificates
);

/**
 * @route   GET /api/certificates/expiring
 * @desc    Discover certificates approaching expiration within a window
 * @access  Private (Admin only)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.get(
  '/expiring',
  authMiddleware,
  authorizeRoles('admin'),
  certificateController.getExpiringCertificates
);

/**
 * @route   GET /api/certificates/expired
 * @desc    Discover expired certificates (scoping applied for trainers)
 * @access  Private (Admin, Trainer)
 * @note    Declared before /:id to prevent route parameter collision
 */
router.get(
  '/expired',
  authMiddleware,
  authorizeRoles('admin', 'trainer'),
  certificateController.getExpiredCertificates
);

/**
 * @route   GET /api/certificates
 * @desc    Admin certificate listing with lifecycle filtering and pagination
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  certificateController.getAdminCertificates
);

/**
 * @route   POST /api/certificates/:id/renew
 * @desc    Renew an eligible certificate, creating a new certificate document
 * @access  Private (Employee only)
 */
router.post(
  '/:id/renew',
  authMiddleware,
  authorizeRoles('employee'),
  certificateController.renewCertificate
);

/**
 * @route   GET /api/certificates/:id/renewals
 * @desc    Retrieve renewal history chain (parent and subsequent renewals)
 * @access  Private (Admin, Trainer, Employee)
 */
router.get(
  '/:id/renewals',
  authMiddleware,
  authorizeRoles('admin', 'trainer', 'employee'),
  certificateController.getCertificateRenewals
);

/**
 * @route   PATCH /api/certificates/:id/revoke
 * @desc    Revoke an active certificate
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/revoke',
  authMiddleware,
  authorizeRoles('admin'),
  certificateController.revokeCertificate
);

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download the official vector PDF certificate
 * @access  Private (Admin, Trainer, Employee)
 */
router.get(
  '/:id/download',
  authMiddleware,
  authorizeRoles('admin', 'trainer', 'employee'),
  certificateController.downloadCertificate
);

/**
 * @route   POST /api/certificates/:id/resend-email
 * @desc    Resend certificate congratulations email
 * @access  Private (Admin, Employee)
 */
router.post(
  '/:id/resend-email',
  authMiddleware,
  authorizeRoles('admin', 'employee'),
  certificateController.resendCertificateEmail
);

/**
 * @route   GET /api/certificates/:id
 * @desc    Retrieve single certificate details with ownership scoping
 * @access  Private (Admin, Trainer, Employee)
 */
router.get(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'trainer', 'employee'),
  certificateController.getCertificateById
);

module.exports = router;
