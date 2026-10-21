const mongoose = require('mongoose');
const config = require('../config');

const CERTIFICATE_STATUSES = ['active', 'revoked'];
const LIFECYCLE_STATUSES = ['active', 'expired', 'revoked'];

const certificateSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment reference is required'],
      index: true
    },
    certificateNumber: {
      type: String,
      required: [true, 'Certificate number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    issuedAt: {
      type: Date,
      required: [true, 'Issued date is required'],
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: CERTIFICATE_STATUSES,
        message: 'Status must be one of: active, revoked'
      },
      default: 'active',
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    revocationReason: {
      type: String,
      maxlength: [500, 'Revocation reason cannot exceed 500 characters'],
      default: null
    },
    renewedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate',
      default: null
    },
    renewedAt: {
      type: Date,
      default: null
    },
    renewalReason: {
      type: String,
      maxlength: [500, 'Renewal reason cannot exceed 500 characters'],
      default: null
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null
    },
    assessmentAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      default: null
    },
    score: {
      type: Number,
      default: null
    },
    emailStatus: {
      type: String,
      enum: {
        values: ['pending', 'sent', 'failed', 'not_configured'],
        message: 'emailStatus must be pending, sent, failed, or not_configured'
      },
      default: 'pending',
      index: true
    },
    emailSentAt: {
      type: Date,
      default: null
    },
    emailError: {
      type: String,
      maxlength: [500, 'Email error cannot exceed 500 characters'],
      default: null
    },
    emailPreviewUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        // Derive expiresAt for legacy certificates if not persisted (6 months / 180 days default)
        if (!ret.expiresAt && ret.issuedAt) {
          const validityDays = config.certificateValidityDays || 180;
          ret.expiresAt = new Date(
            new Date(ret.issuedAt).getTime() + validityDays * 24 * 60 * 60 * 1000
          );
        }

        const now = new Date();
        const isExp = Boolean(ret.expiresAt && new Date(ret.expiresAt) <= now);
        ret.isExpired = isExp;

        // Revocation ALWAYS takes precedence
        if (ret.status === 'revoked') {
          ret.lifecycleStatus = 'revoked';
        } else if (isExp) {
          ret.lifecycleStatus = 'expired';
        } else {
          ret.lifecycleStatus = 'active';
        }

        return ret;
      }
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        if (!ret.expiresAt && ret.issuedAt) {
          const validityDays = config.certificateValidityDays || 180;
          ret.expiresAt = new Date(
            new Date(ret.issuedAt).getTime() + validityDays * 24 * 60 * 60 * 1000
          );
        }

        const now = new Date();
        const isExp = Boolean(ret.expiresAt && new Date(ret.expiresAt) <= now);
        ret.isExpired = isExp;

        if (ret.status === 'revoked') {
          ret.lifecycleStatus = 'revoked';
        } else if (isExp) {
          ret.lifecycleStatus = 'expired';
        } else {
          ret.lifecycleStatus = 'active';
        }

        return ret;
      }
    }
  }
);

// Method to safely retrieve effective expiry date
certificateSchema.methods.getDerivedExpiry = function () {
  if (this.expiresAt) return this.expiresAt;
  const validityDays = config.certificateValidityDays || 365;
  return new Date(new Date(this.issuedAt).getTime() + validityDays * 24 * 60 * 60 * 1000);
};

// Method to determine derived lifecycle status
certificateSchema.methods.getLifecycleStatus = function (now = new Date()) {
  if (this.status === 'revoked') return 'revoked';
  const expiry = this.getDerivedExpiry();
  if (expiry && new Date(expiry) <= now) return 'expired';
  return 'active';
};

// Method to determine if certificate is expired
certificateSchema.methods.getIsExpired = function (now = new Date()) {
  const expiry = this.getDerivedExpiry();
  return Boolean(expiry && new Date(expiry) <= now);
};

// Compound unique index ensuring at most one initial certificate record per employee/course pair
certificateSchema.index(
  { employee: 1, course: 1 },
  { unique: true, partialFilterExpression: { renewedFrom: null } }
);

// Database constraint: Each source certificate can be renewed at most once
certificateSchema.index(
  { renewedFrom: 1 },
  { unique: true, partialFilterExpression: { renewedFrom: { $type: 'objectId' } } }
);

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
module.exports.CERTIFICATE_STATUSES = CERTIFICATE_STATUSES;
module.exports.LIFECYCLE_STATUSES = LIFECYCLE_STATUSES;
