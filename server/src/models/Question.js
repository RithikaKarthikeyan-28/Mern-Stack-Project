const mongoose = require('mongoose');

const QUESTION_TYPES = ['single_choice', 'multiple_choice'];

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Option key is required'],
      trim: true
    },
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true
    }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment reference is required'],
      index: true
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [5, 'Question text must be at least 5 characters long'],
      maxlength: [2000, 'Question text cannot exceed 2000 characters']
    },
    questionType: {
      type: String,
      enum: {
        values: QUESTION_TYPES,
        message: 'Question type must be one of: single_choice, multiple_choice'
      },
      default: 'single_choice',
      required: [true, 'Question type is required']
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: 'A question must have at least 2 options'
      }
    },
    correctAnswers: {
      type: [String],
      required: [true, 'Correct answers are required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'At least one correct answer is required'
      }
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      default: 1,
      min: [1, 'Marks must be at least 1'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Marks must be a positive integer'
      }
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [1, 'Order must be at least 1'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Order must be a positive integer'
      }
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

// Compound unique index ensuring no two questions share the same order in an assessment
questionSchema.index({ assessment: 1, order: 1 }, { unique: true });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
module.exports.QUESTION_TYPES = QUESTION_TYPES;
