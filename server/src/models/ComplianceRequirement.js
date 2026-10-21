const mongoose = require('mongoose');

const COMPLIANCE_FREQUENCIES = ['one_time', 'annual', 'biennial'];

const complianceRequirementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Compliance requirement title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
      }
    ],
    isGlobal: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: {
        values: COMPLIANCE_FREQUENCIES,
        message: 'Frequency must be one of: one_time, annual, biennial'
      },
      required: [true, 'Frequency is required'],
      default: 'annual'
    },
    dueWithinDays: {
      type: Number,
      required: [true, 'dueWithinDays is required'],
      min: [1, 'dueWithinDays must be at least 1'],
      max: [365, 'dueWithinDays cannot exceed 365'],
      default: 30
    },
    renewalGraceDays: {
      type: Number,
      min: [0, 'renewalGraceDays cannot be negative'],
      max: [90, 'renewalGraceDays cannot exceed 90'],
      default: 0
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

// Indexes
complianceRequirementSchema.index({ isActive: 1, course: 1 });
complianceRequirementSchema.index({ department: 1 });
complianceRequirementSchema.index({ isGlobal: 1 });
complianceRequirementSchema.index({ title: 1 });

const ComplianceRequirement = mongoose.model(
  'ComplianceRequirement',
  complianceRequirementSchema
);

module.exports = ComplianceRequirement;
module.exports.COMPLIANCE_FREQUENCIES = COMPLIANCE_FREQUENCIES;
