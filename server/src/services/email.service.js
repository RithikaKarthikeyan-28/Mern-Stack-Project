/**
 * Enterprise Email Notification Service
 * Handles transactional email dispatch for certificate achievements,
 * supporting production SMTP via nodemailer (when configured) and
 * high-fidelity transactional simulation for test & development environments.
 */

const config = require('../config');

/**
 * Builds the professional responsive HTML email template for certificate issuance.
 *
 * @param {object} params
 * @param {string} params.recipientName
 * @param {string} params.courseTitle
 * @param {number|string} params.score
 * @param {string} params.certificateNumber
 * @param {string} params.issueDateStr
 * @param {string} params.downloadUrl
 * @param {string} params.verificationUrl
 * @returns {string} Safe HTML string
 */
function buildCertificateEmailHtml({
  recipientName,
  courseTitle,
  score,
  certificateNumber,
  issueDateStr,
  expiryDateStr,
  downloadUrl,
  verificationUrl
}) {
  const scoreDisplay =
    score !== null && score !== undefined && score !== '' ? `${score}%` : 'Passed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! You Earned Your SkillTrack Certificate</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0F766E 0%, #115E59 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .cert-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .cert-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .cert-row:last-child { border-bottom: none; }
    .cert-label { color: #64748b; font-weight: 500; }
    .cert-value { color: #0f172a; font-weight: 700; }
    .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn-primary { display: inline-block; background-color: #0F766E; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(15,118,110,0.25); }
    .btn-secondary { display: inline-block; margin-top: 10px; color: #0F766E; text-decoration: underline; font-size: 13px; font-weight: 600; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>SkillTrack Enterprise Learning & Certification</p>
    </div>
    <div class="content">
      <div class="greeting">Dear ${recipientName},</div>
      <div class="message">
        We are thrilled to celebrate your achievement! You have successfully passed the final assessment for <strong>${courseTitle}</strong> and have been officially awarded your verified credential.
      </div>

      <div class="cert-card">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
          <tr>
            <td style="color: #64748b; font-weight: 500;">Course:</td>
            <td style="color: #0f172a; font-weight: 700; text-align: right;">${courseTitle}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Assessment Score:</td>
            <td style="color: #047857; font-weight: 700; text-align: right;"><span class="badge">${scoreDisplay}</span></td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Certificate ID:</td>
            <td style="font-family: monospace; font-weight: 700; color: #0f172a; text-align: right;">${certificateNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Issued Date:</td>
            <td style="color: #0f172a; font-weight: 600; text-align: right;">${issueDateStr}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Valid Until:</td>
            <td style="color: #0f172a; font-weight: 600; text-align: right;">${expiryDateStr || '6 Months Validity'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Authorized Issuer:</td>
            <td style="color: #0f172a; font-weight: 600; text-align: right;">SkillTrack Learning Board</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a href="${downloadUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">
          Download Your Certificate (PDF)
        </a>
        <br />
        <a href="${verificationUrl}" class="btn-secondary" target="_blank" rel="noopener noreferrer">
          Verify Online: ${certificateNumber}
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">
        Your official PDF certificate has also been attached to this email for your permanent records.
      </p>
    </div>
    <div class="footer">
      This is an automated notification from SkillTrack Learning Management Platform.<br />
      If you have questions regarding this credential, please contact your learning administrator.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds plain-text fallback for email clients without HTML rendering.
 */
function buildCertificateEmailText({
  recipientName,
  courseTitle,
  score,
  certificateNumber,
  issueDateStr,
  downloadUrl,
  verificationUrl
}) {
  const scoreDisplay =
    score !== null && score !== undefined && score !== '' ? `${score}%` : 'Passed';

  return `Congratulations ${recipientName}!

You have successfully passed the final assessment and earned your official SkillTrack Certificate of Completion for "${courseTitle}".

Certificate Details:
- Course: ${courseTitle}
- Assessment Score: ${scoreDisplay}
- Certificate ID: ${certificateNumber}
- Issue Date: ${issueDateStr}
- Issuer: SkillTrack Learning Board

Download your certificate:
${downloadUrl}

Verify credential online:
${verificationUrl}

Your official PDF certificate is also attached to this email.

SkillTrack Learning Platform`;
}

/**
 * Dispatches the certificate congratulations email to the recipient.
 * Uses real SMTP if configured and nodemailer is present, or transactional logging mock.
 * Guarantees safe resolution without throwing to preserve database transactions.
 *
 * @param {object} params
 * @param {string} params.recipientEmail - Recipient email address
 * @param {string} [params.recipientName='Learner'] - Recipient name
 * @param {string} params.certificateNumber - Certificate ID
 * @param {string} params.courseTitle - Course title
 * @param {number|string} [params.score] - Passing assessment percentage
 * @param {Date|string} [params.issueDate] - Issued date
 * @param {string} [params.certificateId] - MongoDB certificate ID for download route
 * @param {string} [params.verificationUrl] - Verification URL
 * @param {string} [params.certificateDownloadUrl] - Explicit download URL
 * @param {Buffer} [params.pdfBuffer] - PDF binary buffer to attach
 * @returns {Promise<{ success: boolean, status: string, messageId?: string, error?: string }>}
 */
async function sendCertificateIssuedEmail({
  recipientEmail,
  recipientName = 'Learner',
  certificateNumber,
  courseTitle = 'Course',
  score = null,
  issueDate = new Date(),
  certificateId = '',
  verificationUrl = '',
  certificateDownloadUrl = '',
  pdfBuffer = null
}) {
  const subject = 'Congratulations! You Earned Your SkillTrack Certificate 🎉';

  const clientBase = config.clientUrl || 'http://localhost:5173';
  const effectiveVerificationUrl =
    verificationUrl || `${clientBase}/verify-certificate/${certificateNumber}`;
  const effectiveDownloadUrl =
    certificateDownloadUrl ||
    (certificateId ? `${clientBase}/certificates/${certificateId}` : effectiveVerificationUrl);

  const formattedDate = new Date(issueDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate 6-month validity expiry date
  const validityDays = config.certificateValidityDays || 180;
  const expiryDate = new Date(new Date(issueDate || Date.now()).getTime() + validityDays * 86400000);
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = buildCertificateEmailHtml({
    recipientName,
    courseTitle,
    score,
    certificateNumber,
    issueDateStr: formattedDate,
    expiryDateStr: `${formattedExpiryDate} (6 Months Validity)`,
    downloadUrl: effectiveDownloadUrl,
    verificationUrl: effectiveVerificationUrl
  });

  const textContent = buildCertificateEmailText({
    recipientName,
    courseTitle,
    score,
    certificateNumber,
    issueDateStr: formattedDate,
    downloadUrl: effectiveDownloadUrl,
    verificationUrl: effectiveVerificationUrl
  });

  try {
    // Check if test environment explicitly mocks failure
    if (process.env.TEST_SIMULATE_EMAIL_FAIL === 'true') {
      throw new Error('Simulated SMTP connection failure for testing');
    }

    let nodemailer = null;
    try {
      nodemailer = require('nodemailer');
    } catch {
      nodemailer = null;
    }

    const attachments = [];
    if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
      attachments.push({
        filename: `SkillTrack-Certificate-${certificateNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // 1. Attempt real SMTP if nodemailer is installed and SMTP user/host is configured
    if (nodemailer && (config.smtpHost || config.smtpUser)) {
      try {
        const isGmail =
          (config.smtpHost && config.smtpHost.includes('gmail')) ||
          (config.smtpUser && config.smtpUser.includes('@gmail.com'));

        const cleanPass = isGmail && config.smtpPass
          ? config.smtpPass.replace(/\s+/g, '').replace(/['"]/g, '').trim()
          : config.smtpPass;

        const transporter = isGmail
          ? nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: config.smtpUser,
                pass: cleanPass
              }
            })
          : nodemailer.createTransport({
              host: config.smtpHost,
              port: config.smtpPort || (config.smtpPort === 465 ? 465 : 587),
              secure: config.smtpPort === 465,
              auth:
                config.smtpUser && config.smtpPass
                  ? { user: config.smtpUser, pass: config.smtpPass }
                  : undefined
            });

        const info = await transporter.sendMail({
          from: (isGmail && config.smtpUser)
            ? `"SkillTrack Learning" <${config.smtpUser}>`
            : (config.smtpFrom || (config.smtpUser ? `"SkillTrack Learning" <${config.smtpUser}>` : '"SkillTrack Learning" <noreply@skilltrack.local>')),
          to: recipientEmail,
          subject,
          text: textContent,
          html: htmlContent,
          attachments
        });

        console.log(
          `[Email Service] ✅ Real SMTP email delivered successfully to ${recipientEmail} for certificate ${certificateNumber} [MessageId: ${info.messageId}]`
        );

        return {
          success: true,
          status: 'sent',
          messageId: info.messageId,
          recipientEmail,
          subject,
          sentAt: new Date()
        };
      } catch (smtpErr) {
        console.error(
          `[Email Service] ⚠️ Configured SMTP failed to deliver to ${recipientEmail}:`,
          smtpErr.message
        );
        if (smtpErr.message && (smtpErr.message.includes('Username and Password not accepted') || smtpErr.message.includes('Invalid login') || smtpErr.message.includes('BadCredentials'))) {
          console.error(
            `[Email Service] 🔑 Gmail requires a 16-character Google App Password (not your regular account password). Create one at: https://myaccount.google.com/apppasswords`
          );
        }
      }
    }

    // In test environment without explicit SMTP, use instantaneous transactional simulation
    if (config.isTest) {
      const messageId = `mock_mail_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const hasAttachment = Boolean(pdfBuffer && Buffer.isBuffer(pdfBuffer));

      console.log(
        `[Email Service] [MOCK TEST] Dispatched "${subject}" to ${recipientEmail} (${recipientName}) | Cert: ${certificateNumber} | PDF Attached: ${hasAttachment} [${messageId}]`
      );

      return {
        success: true,
        status: 'sent',
        messageId,
        recipientEmail,
        recipientName,
        subject,
        sentAt: new Date(),
        certificateNumber,
        courseTitle,
        hasAttachment
      };
    }

    // 2. In development when real SMTP is not configured, dispatch via Ethereal test account for live browser preview
    if (nodemailer && config.isDevelopment) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const etherealTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        const info = await etherealTransporter.sendMail({
          from: '"SkillTrack Learning" <congratulations@skilltrack.local>',
          to: recipientEmail,
          subject,
          text: textContent,
          html: htmlContent,
          attachments
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`\n📬 ========================================================`);
        console.log(`📬 [EMAIL DISPATCHED VIA ETHEREAL]`);
        console.log(`📬 Recipient: ${recipientEmail} | Course: ${courseTitle}`);
        console.log(`📬 Certificate: ${certificateNumber} (Valid for 6 Months: until ${formattedExpiryDate})`);
        console.log(`📬 Live Email Preview URL: ${previewUrl}`);
        console.log(`📬 ========================================================\n`);

        return {
          success: true,
          status: 'sent',
          messageId: info.messageId,
          previewUrl,
          recipientEmail,
          recipientName,
          subject,
          sentAt: new Date(),
          certificateNumber,
          courseTitle,
          hasAttachment: attachments.length > 0
        };
      } catch (etherealErr) {
        console.warn('[Email Service] Ethereal delivery error:', etherealErr.message);
      }
    }

    // 3. Simulated delivery fallback
    if (config.isDevelopment || config.isTest) {
      const messageId = `mock_mail_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const hasAttachment = Boolean(pdfBuffer && Buffer.isBuffer(pdfBuffer));

      console.log(
        `[Email Service] [MOCK DEV/TEST] Dispatched "${subject}" to ${recipientEmail} (${recipientName}) | Cert: ${certificateNumber} | PDF Attached: ${hasAttachment} [${messageId}]`
      );

      return {
        success: true,
        status: 'sent',
        messageId,
        recipientEmail,
        recipientName,
        subject,
        sentAt: new Date(),
        certificateNumber,
        courseTitle,
        hasAttachment
      };
    }

    // In production mode with unconfigured SMTP, record graceful not_configured status
    console.warn(
      `[Email Service] SMTP not configured in production mode. Certificate ${certificateNumber} email queued as not_configured.`
    );
    return {
      success: false,
      status: 'not_configured',
      error: 'SMTP host is not configured in environment settings',
      recipientEmail
    };
  } catch (err) {
    console.error(
      `[Email Service] Failed to dispatch certificate email to ${recipientEmail}:`,
      err.message
    );
    return {
      success: false,
      status: 'failed',
      error: err.message,
      recipientEmail
    };
  }
}

module.exports = {
  sendCertificateIssuedEmail,
  buildCertificateEmailHtml,
  buildCertificateEmailText
};
