const mongoose = require('mongoose');

const ATTEMPT_STATUSES = ['in_progress', 'submitted', 'abandoned'];

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required']
    },
    selectedAnswers: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment reference is required'],
      index: true
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment reference is required'],
      index: true
    },
    attemptNumber: {
      type: Number,
      required: [true, 'Attempt number is required'],
      min: [1, 'Attempt number must be at least 1'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Attempt number must be an integer'
      }
    },
    status: {
      type: String,
      enum: {
        values: ATTEMPT_STATUSES,
        message: 'Attempt status must be one of: in_progress, submitted, abandoned'
      },
      default: 'in_progress',
      index: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    totalMarks: {
      type: Number,
      min: [0, 'Total marks cannot be negative'],
      default: 0
    },
    obtainedMarks: {
      type: Number,
      min: [0, 'Obtained marks cannot be negative'],
      default: 0
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be less than 0'],
      max: [100, 'Percentage cannot exceed 100'],
      default: 0
    },
    result: {
      type: String,
      enum: {
        values: ['passed', 'failed', null],
        message: 'Result must be passed or failed'
      },
      default: null,
      index: true
    },
    evaluatedAt: {
      type: Date,
      default: null
    },
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate',
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

// Compound unique index ensuring at most one record per employee, assessment, and attemptNumber
assessmentAttemptSchema.index({ employee: 1, assessment: 1, attemptNumber: 1 }, { unique: true });
assessmentAttemptSchema.index({ assessment: 1, status: 1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

module.exports = AssessmentAttempt;
module.exports.ATTEMPT_STATUSES = ATTEMPT_STATUSES;
module.exports.ATTEMPT_RESULTS = ['passed', 'failed'];
