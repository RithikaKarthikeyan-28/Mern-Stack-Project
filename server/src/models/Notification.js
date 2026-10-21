const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'certificate_issued',
  'certificate_expiring',
  'certificate_expired',
  'certificate_renewed',
  'compliance_due_soon',
  'compliance_overdue'
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: 'Notification type must be one of: certificate_issued, certificate_expiring, certificate_expired, certificate_renewed, compliance_due_soon, compliance_overdue'
      },
      required: [true, 'Notification type is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Notification title cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Notification message cannot exceed 1000 characters']
    },
    relatedCertificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate',
      default: null
    },
    relatedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    relatedComplianceAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplianceAssignment',
      default: null
    },
    relatedComplianceRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplianceRequirement',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    eventKey: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.eventKey;
        return ret;
      }
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.eventKey;
        return ret;
      }
    }
  }
);

// Indexes for query performance and inbox scoping
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Concurrency-safe idempotency index on eventKey
notificationSchema.index(
  { eventKey: 1 },
  { unique: true, partialFilterExpression: { eventKey: { $type: 'string' } } }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
