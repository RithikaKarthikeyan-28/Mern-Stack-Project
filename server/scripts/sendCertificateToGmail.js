const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { generateCertificatePDFBuffer } = require('../src/utils/pdfGenerator');
const emailService = require('../src/services/email.service');
const Certificate = require('../src/models/Certificate');
const Employee = require('../src/models/Employee');
const User = require('../src/models/User');
const Course = require('../src/models/Course');

async function sendDirectToGmail(targetEmail = 'rithikakarthikeyan1128@gmail.com') {
  console.log(`\n======================================================`);
  console.log(`SkillTrack Direct Gmail Dispatch Utility`);
  console.log(`Target Recipient: ${targetEmail}`);
  console.log(`======================================================\n`);

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass || smtpUser.includes('your_email') || smtpPass.includes('your_gmail')) {
    console.error(`❌ SMTP credentials not yet set in server/.env!`);
    console.log(`\nTo send emails directly to your Google Account inbox:`);
    console.log(`1. Visit: https://myaccount.google.com/apppasswords`);
    console.log(`2. Generate a 16-character App Password (app name: "SkillTrack")`);
    console.log(`3. In server/.env, set:`);
    console.log(`   SMTP_USER=${targetEmail}`);
    console.log(`   SMTP_PASS=xxxx xxxx xxxx xxxx (your 16-character app password)`);
    console.log(`4. Re-run: node server/scripts/sendCertificateToGmail.js\n`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skilltrack');
  console.log('Connected to MongoDB skilltrack');

  const user = await User.findOne({ email: targetEmail });
  if (!user) {
    console.error(`User not found with email: ${targetEmail}`);
    process.exit(1);
  }

  const employee = await Employee.findOne({ user: user._id });
  if (!employee) {
    console.error(`Employee profile not found for user: ${targetEmail}`);
    process.exit(1);
  }

  const cert = await Certificate.findOne({ employee: employee._id }).populate('course');
  if (!cert) {
    console.error(`Certificate not found for employee: ${user.name}`);
    process.exit(1);
  }

  const issuedAt = cert.issuedAt || new Date();
  const validityDays = Number(process.env.CERTIFICATE_VALIDITY_DAYS) || 180;
  const expiryDate = cert.expiresAt || new Date(new Date(issuedAt).getTime() + validityDays * 86400000);

  console.log(`Generating Certificate PDF for ${user.name}...`);
  const pdfBuffer = generateCertificatePDFBuffer({
    employeeName: user.name,
    courseTitle: cert.course?.title || 'Certified Course',
    score: cert.score || 100,
    certificateNumber: cert.certificateNumber,
    issueDate: issuedAt,
    expiryDate,
    verificationUrl: `http://localhost:5173/verify-certificate/${cert.certificateNumber}`
  });

  console.log(`Connecting to Google Mail SMTP as ${smtpUser}...`);
  const result = await emailService.sendCertificateIssuedEmail({
    recipientEmail: user.email,
    recipientName: user.name,
    certificateNumber: cert.certificateNumber,
    courseTitle: cert.course?.title || 'Certified Course',
    score: cert.score || 100,
    issueDate: issuedAt,
    certificateId: cert._id.toString(),
    verificationUrl: `http://localhost:5173/verify-certificate/${cert.certificateNumber}`,
    pdfBuffer
  });

  if (result.success) {
    console.log(`\n🎉 SUCCESS! Real email delivered directly to ${user.email}`);
    console.log(`MessageId: ${result.messageId}`);
    cert.emailStatus = 'sent';
    cert.emailSentAt = new Date();
    await cert.save();
  } else {
    console.error(`\n❌ Delivery failed:`, result.error);
  }

  process.exit(0);
}

const target = process.argv[2] || 'rithikakarthikeyan1128@gmail.com';
sendDirectToGmail(target).catch(err => {
  console.error(err);
  process.exit(1);
});
