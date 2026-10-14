const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required']
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [3, 'Module title must be at least 3 characters long'],
      maxlength: [200, 'Module title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Module description cannot exceed 2000 characters']
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Module order must be an integer of at least 1'
      }
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

// Compound index for efficient course-scoped ordering queries
moduleSchema.index({ course: 1, order: 1 });

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
