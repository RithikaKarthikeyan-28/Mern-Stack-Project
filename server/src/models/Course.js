const mongoose = require('mongoose');

const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const COURSE_STATUSES = ['draft', 'published', 'archived'];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters long'],
      maxlength: [200, 'Course title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Course description must be at least 10 characters long'],
      maxlength: [5000, 'Course description cannot exceed 5000 characters']
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
      minlength: [2, 'Course category must be at least 2 characters long'],
      maxlength: [100, 'Course category cannot exceed 100 characters']
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: {
        values: COURSE_LEVELS,
        message: 'Course level must be one of: beginner, intermediate, advanced'
      }
    },
    duration: {
      type: Number,
      required: [true, 'Course duration is required'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Course duration must be an integer of at least 1 hour'
      }
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer is required']
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false
    },
    isGlobal: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: COURSE_STATUSES,
        message: 'Status must be one of: draft, published, archived'
      },
      default: 'draft'
    },
    isActive: {
      type: Boolean,
      default: true
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

// Targeted indexes for query performance
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ trainer: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ isGlobal: 1 });
courseSchema.index({ isActive: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
