const mongoose = require('mongoose');

const ASSESSMENT_STATUSES = ['draft', 'published', 'archived'];

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
      minlength: [3, 'Assessment title must be at least 3 characters long'],
      maxlength: [200, 'Assessment title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Assessment description cannot exceed 2000 characters']
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer reference is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ASSESSMENT_STATUSES,
        message: 'Status must be one of: draft, published, archived'
      },
      default: 'draft',
      index: true
    },
    passingPercentage: {
      type: Number,
      default: 60,
      min: [0, 'Passing percentage cannot be less than 0'],
      max: [100, 'Passing percentage cannot exceed 100']
    },
    timeLimitMinutes: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          if (v === null || v === undefined) return true;
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Time limit must be an integer of at least 1 minute'
      }
    },
    maxAttempts: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          if (v === null || v === undefined) return true;
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Max attempts must be an integer of at least 1'
      }
    },
    requiresCourseCompletion: {
      type: Boolean,
      default: false
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

// Indexes for common query patterns
assessmentSchema.index({ course: 1, status: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
module.exports.ASSESSMENT_STATUSES = ASSESSMENT_STATUSES;
