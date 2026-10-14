const mongoose = require('mongoose');
const { PROFICIENCY_LEVELS } = require('../utils/proficiency');

const courseSkillSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
      index: true
    },
    coverageLevel: {
      type: String,
      required: [true, 'Coverage level is required'],
      enum: {
        values: PROFICIENCY_LEVELS,
        message: 'Coverage level must be one of: beginner, intermediate, advanced, expert'
      }
    },
    coverageWeight: {
      type: Number,
      default: 1,
      min: [0, 'Coverage weight cannot be negative'],
      max: [100, 'Coverage weight cannot exceed 100']
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

// Compound unique index ensuring no duplicate skill mapping for the same course
courseSkillSchema.index({ course: 1, skill: 1 }, { unique: true });
courseSkillSchema.index({ course: 1, isActive: 1 });

const CourseSkill = mongoose.model('CourseSkill', courseSkillSchema);

module.exports = CourseSkill;
