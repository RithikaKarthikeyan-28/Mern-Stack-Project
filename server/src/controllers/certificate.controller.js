const certificateService = require('../services/certificate.service');
const { validateRevokeCertificate } = require('../validators/certificate.validator');
const { sendSuccess } = require('../utils/response');

/**
 * Controller to handle employee certificate issuance.
 */
async function issueCertificate(req, res, next) {
  try {
    const { certificate, isExisting } = await certificateService.issueCertificate(
      req.user,
      req.body
    );

    return sendSuccess(res, {
      statusCode: isExisting ? 200 : 201,
      message: isExisting
        ? 'Certificate already issued for this course'
        : 'Certificate issued successfully',
      data: { certificate }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle public certificate verification (unauthenticated).
 */
async function verifyCertificate(req, res, next) {
  try {
    const verification = await certificateService.verifyCertificate(
      req.params.certificateNumber
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificate verified successfully',
      data: { certificate: verification }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve authenticated employee's certificates.
 */
async function getMyCertificates(req, res, next) {
  try {
    const result = await certificateService.getEmployeeCertificates(
      req.user,
      req.query
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Employee certificates retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve expiring certificates (Admin only).
 */
async function getExpiringCertificates(req, res, next) {
  try {
    const result = await certificateService.getExpiringCertificates(
      req.query,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Expiring certificates retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve expired certificates (Admin & Trainer).
 */
async function getExpiredCertificates(req, res, next) {
  try {
    const result = await certificateService.getExpiredCertificates(
      req.query,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Expired certificates retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle certificate renewal (Employee only).
 */
async function renewCertificate(req, res, next) {
  try {
    const { certificate, isExisting } = await certificateService.renewCertificate(
      req.params.id,
      req.body,
      req.user
    );

    return sendSuccess(res, {
      statusCode: isExisting ? 200 : 201,
      message: isExisting
        ? 'Certificate renewal already active'
        : 'Certificate renewed successfully',
      data: { certificate }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve certificate renewal history chain.
 */
async function getCertificateRenewals(req, res, next) {
  try {
    const result = await certificateService.getCertificateRenewals(
      req.params.id,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificate renewal history retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to retrieve a single certificate by ID.
 */
async function getCertificateById(req, res, next) {
  try {
    const certificate = await certificateService.getCertificateById(
      req.params.id,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificate retrieved successfully',
      data: { certificate }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for admin certificate listing with filtering & pagination.
 */
async function getAdminCertificates(req, res, next) {
  try {
    const result = await certificateService.getAdminCertificates(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificates retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for admin certificate revocation.
 */
async function revokeCertificate(req, res, next) {
  try {
    validateRevokeCertificate(req.params, req.body);
    const certificate = await certificateService.revokeCertificate(
      req.params.id,
      req.body?.reason,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificate revoked successfully',
      data: { certificate }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle certificate PDF download.
 */
async function downloadCertificate(req, res, next) {
  try {
    const { buffer, filename } = await certificateService.downloadCertificatePDF(
      req.params.id,
      req.user
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to handle manual resend of certificate email.
 */
async function resendCertificateEmail(req, res, next) {
  try {
    const certificate = await certificateService.resendCertificateEmail(
      req.params.id,
      req.user
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Certificate email dispatch triggered successfully',
      data: { certificate }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  issueCertificate,
  verifyCertificate,
  getMyCertificates,
  getExpiringCertificates,
  getExpiredCertificates,
  renewCertificate,
  getCertificateRenewals,
  getCertificateById,
  getAdminCertificates,
  revokeCertificate,
  downloadCertificate,
  resendCertificateEmail
};
