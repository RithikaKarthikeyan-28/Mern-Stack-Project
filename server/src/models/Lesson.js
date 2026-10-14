const mongoose = require('mongoose');

const LESSON_CONTENT_TYPES = ['text', 'video', 'link'];

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module reference is required']
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [3, 'Lesson title must be at least 3 characters long'],
      maxlength: [200, 'Lesson title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
      trim: true,
      minlength: [1, 'Lesson content is required'],
      maxlength: [20000, 'Lesson content cannot exceed 20000 characters']
    },
    contentType: {
      type: String,
      required: [true, 'Content type is required'],
      enum: {
        values: LESSON_CONTENT_TYPES,
        message: 'Content type must be one of: text, video, link'
      }
    },
    resourceUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: [2000, 'Resource URL cannot exceed 2000 characters']
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && Number.isInteger(v) && v >= 1;
        },
        message: 'Lesson order must be an integer of at least 1'
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

// Compound index for efficient module-scoped ordering queries
lessonSchema.index({ module: 1, order: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
