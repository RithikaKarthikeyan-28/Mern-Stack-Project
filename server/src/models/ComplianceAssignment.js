const mongoose = require('mongoose');

const COMPLIANCE_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLIANT',
  'DUE_SOON',
  'OVERDUE'
];

const complianceAssignmentSchema = new mongoose.Schema(
  {
    complianceRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplianceRequirement',
      required: [true, 'Compliance requirement reference is required'],
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Assigned date is required']
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: COMPLIANCE_STATUSES,
        message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLIANT, DUE_SOON, OVERDUE'
      },
      default: 'NOT_STARTED',
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    lastEvaluatedAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index ensuring one assignment per (requirement, employee)
complianceAssignmentSchema.index(
  { complianceRequirement: 1, employee: 1 },
  { unique: true }
);

// Performance indexes for querying and reporting
complianceAssignmentSchema.index({ employee: 1, status: 1 });
complianceAssignmentSchema.index({ complianceRequirement: 1, status: 1 });
complianceAssignmentSchema.index({ status: 1, dueAt: 1 });

const ComplianceAssignment = mongoose.model(
  'ComplianceAssignment',
  complianceAssignmentSchema
);

module.exports = ComplianceAssignment;
module.exports.COMPLIANCE_STATUSES = COMPLIANCE_STATUSES;
