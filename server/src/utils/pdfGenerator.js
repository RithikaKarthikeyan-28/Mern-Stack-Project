/**
 * Professional Certificate PDF Generation Engine
 * Generates standards-compliant, vector-accurate PDF 1.4 documents
 * using pure Node.js Buffer manipulation without external binary dependencies.
 */

/**
 * Escapes characters that have special syntactic meaning inside PDF text string literals.
 *
 * @param {string|number} str - String to escape
 * @returns {string} PDF-escaped string
 */
function escapePdfText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Centers text horizontally within a given width.
 * Standard Helvetica average character width ~0.52 of font size.
 *
 * @param {string} text - The text string
 * @param {number} fontSize - Font size in points
 * @param {number} totalWidth - Total canvas width (default 842 pt for landscape A4)
 * @returns {number} Left X coordinate
 */
function getCenteredX(text, fontSize, totalWidth = 842) {
  const estWidth = String(text).length * fontSize * 0.52;
  return Math.max(40, Math.round((totalWidth - estWidth) / 2));
}

/**
 * Generates an official SkillTrack Certificate of Completion PDF as a Node.js Buffer.
 *
 * @param {object} params
 * @param {string} [params.employeeName='Learner'] - Recipient employee name
 * @param {string} [params.courseTitle='Technical Course'] - Course title
 * @param {number|string} [params.score] - Assessment score percentage
 * @param {string} [params.certificateNumber='SKILLTRACK-2026-00000000'] - Unique ID
 * @param {Date|string} [params.issueDate=new Date()] - Issue date
 * @param {string} [params.verificationUrl=''] - Optional custom verification URL
 * @returns {Buffer} Valid PDF-1.4 binary buffer
 */
function generateCertificatePDFBuffer({
  employeeName = 'Learner',
  courseTitle = 'Technical Course',
  score = null,
  certificateNumber = 'SKILLTRACK-2026-00000000',
  issueDate = new Date(),
  expiryDate = null,
  verificationUrl = ''
} = {}) {
  const safeName = escapePdfText(employeeName);
  const safeCourse = escapePdfText(courseTitle);
  const safeCertNum = escapePdfText(certificateNumber);

  const effectiveIssueDate = new Date(issueDate || Date.now());
  const effectiveExpiryDate =
    expiryDate ? new Date(expiryDate) : new Date(effectiveIssueDate.getTime() + 180 * 86400000);

  const formattedDate = escapePdfText(
    effectiveIssueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );

  const formattedExpiryDate = escapePdfText(
    effectiveExpiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );

  const scoreText =
    score !== null && score !== undefined && score !== ''
      ? `Assessment Score: ${score}%   |   Status: Passed`
      : 'Curriculum & Assessment Requirements Fulfilled';

  const verifyNotice = verificationUrl
    ? `Verify online at: ${verificationUrl}`
    : `Verify online at: /verify-certificate/${safeCertNum}`;

  // Landscape A4 dimensions in PDF points (72 pt/inch): 841.89 x 595.28 pt
  const width = 842;
  const height = 595;

  // Compute centered X coordinates for main headings
  const brandX = getCenteredX('SKILLTRACK ENTERPRISE CREDENTIAL', 11, width);
  const titleX = getCenteredX('Certificate of Completion', 28, width);
  const presX = getCenteredX('THIS IS PROUDLY PRESENTED TO', 11, width);
  const nameX = getCenteredX(employeeName, 24, width);
  const descX = getCenteredX('has demonstrated technical proficiency and successfully passed the final assessment in', 11, width);
  const courseX = getCenteredX(courseTitle, 18, width);
  const scoreX = getCenteredX(scoreText, 11, width);
  const verifyX = getCenteredX(verifyNotice, 9, width);

  // PDF Graphics Stream
  const streamCommands = [
    // 1. Background Fill (clean off-white slate)
    'q',
    '0.985 0.992 0.992 rg',
    `0 0 ${width} ${height} re f`,
    'Q',

    // 2. Outer Border (Deep Teal #0F766E)
    'q',
    '0.059 0.463 0.431 RG',
    '8 w',
    `28 28 ${width - 56} ${height - 56} re S`,
    'Q',

    // 3. Inner Accent Border (Warm Gold #D97706)
    'q',
    '0.85 0.65 0.15 RG',
    '1.5 w',
    `38 38 ${width - 76} ${height - 76} re S`,
    'Q',

    // 4. Decorative Corner Motifs
    'q',
    '0.059 0.463 0.431 RG',
    '2.5 w',
    // Top-left
    '44 547 m 68 547 l 44 547 m 44 523 l S',
    // Top-right
    `${width - 44} 547 m ${width - 68} 547 l ${width - 44} 547 m ${width - 44} 523 l S`,
    // Bottom-left
    '44 48 m 68 48 l 44 48 m 44 72 l S',
    // Bottom-right
    `${width - 44} 48 m ${width - 68} 48 l ${width - 44} 48 m ${width - 44} 72 l S`,
    'Q',

    // 5. Course Highlight Box Background (Mint / Light Teal #ECFDF5)
    'q',
    '0.925 0.992 0.961 rg',
    '0.65 0.85 0.75 RG',
    '1 w',
    `100 205 ${width - 200} 58 re B`,
    'Q',

    // 6. Name Underline Decorative Rule
    'q',
    '0.059 0.463 0.431 RG',
    '1.5 w',
    `180 345 m ${width - 180} 345 l S`,
    'Q',

    // 7. Text Section
    'BT',

    // Brand Label
    '/F2 11 Tf',
    '0.059 0.463 0.431 rg',
    `1 0 0 1 ${brandX} 512 Tm`,
    '(SKILLTRACK ENTERPRISE CREDENTIAL) Tj',

    // Main Certificate Title
    '/F2 28 Tf',
    '0.063 0.165 0.165 rg',
    `1 0 0 1 ${titleX} 455 Tm`,
    '(Certificate of Completion) Tj',

    // Subtitle
    '/F1 11 Tf',
    '0.38 0.45 0.50 rg',
    `1 0 0 1 ${presX} 415 Tm`,
    '(THIS IS PROUDLY PRESENTED TO) Tj',

    // Employee Name
    '/F2 24 Tf',
    '0.059 0.463 0.431 rg',
    `1 0 0 1 ${nameX} 360 Tm`,
    `(${safeName}) Tj`,

    // Description
    '/F1 11 Tf',
    '0.30 0.35 0.40 rg',
    `1 0 0 1 ${descX} 305 Tm`,
    '(has demonstrated technical proficiency and successfully passed the final assessment in) Tj',

    // Course Title (inside mint box)
    '/F2 18 Tf',
    '0.04 0.22 0.20 rg',
    `1 0 0 1 ${courseX} 228 Tm`,
    `(${safeCourse}) Tj`,

    // Score / Passed Tag
    '/F2 11 Tf',
    '0.059 0.463 0.431 rg',
    `1 0 0 1 ${scoreX} 175 Tm`,
    `(${escapePdfText(scoreText)}) Tj`,

    // Footer Metadata Columns
    // Col 1: Date of Issue & Validity
    '/F1 10 Tf',
    '0.35 0.40 0.45 rg',
    '1 0 0 1 80 115 Tm',
    `(${escapePdfText('Date of Issue: ' + formattedDate)}) Tj`,
    '/F2 9 Tf',
    '0.059 0.463 0.431 rg',
    '1 0 0 1 80 100 Tm',
    `(${escapePdfText('Valid Until: ' + formattedExpiryDate + ' (6 Months)')}) Tj`,

    // Col 2: Certificate ID
    '/F2 10 Tf',
    '0.10 0.15 0.20 rg',
    '1 0 0 1 310 115 Tm',
    `(${escapePdfText('Certificate ID: ' + safeCertNum)}) Tj`,

    // Col 3: Authorized Issuer
    '/F1 10 Tf',
    '0.35 0.40 0.45 rg',
    '1 0 0 1 590 115 Tm',
    '(Authorized by: SkillTrack Learning Board) Tj',

    // Col 3 sub-signature line
    '/F2 9 Tf',
    '0.059 0.463 0.431 rg',
    '1 0 0 1 590 100 Tm',
    '(Official Academic Registry) Tj',

    // Verification URL Notice
    '/F1 9 Tf',
    '0.50 0.55 0.60 rg',
    `1 0 0 1 ${verifyX} 62 Tm`,
    `(${escapePdfText(verifyNotice)}) Tj`,

    'ET'
  ];

  const streamContent = streamCommands.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  // Construct PDF Objects
  const objects = [
    // 1: Catalog
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    // 2: Pages
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    // 3: Page (Landscape A4: 842 x 595)
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    // 4: Font F1 (Helvetica)
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`,
    // 5: Font F2 (Helvetica-Bold)
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`,
    // 6: Stream Contents
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  ];

  let body = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  let offset = Buffer.byteLength(body, 'latin1');
  const xref = [`xref\n0 7\n0000000000 65535 f \n`];

  for (let i = 0; i < objects.length; i++) {
    const padOffset = String(offset).padStart(10, '0');
    xref.push(`${padOffset} 00000 n \n`);
    body += objects[i];
    offset = Buffer.byteLength(body, 'latin1');
  }

  const startxref = offset;
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  body += xref.join('') + trailer;

  return Buffer.from(body, 'latin1');
}

module.exports = {
  generateCertificatePDFBuffer,
  escapePdfText
};
