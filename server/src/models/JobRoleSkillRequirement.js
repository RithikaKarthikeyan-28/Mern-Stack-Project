const mongoose = require('mongoose');
const { PROFICIENCY_LEVELS } = require('./Skill');

const jobRoleSkillRequirementSchema = new mongoose.Schema(
  {
    jobRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRole',
      required: [true, 'Job Role reference is required'],
      index: true
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
      index: true
    },
    requiredLevel: {
      type: String,
      enum: {
        values: PROFICIENCY_LEVELS,
        message: 'Required level must be one of: beginner, intermediate, advanced, expert'
      },
      required: [true, 'Required proficiency level is required']
    },
    mandatory: {
      type: Boolean,
      default: true
    },
    weight: {
      type: Number,
      default: 1,
      min: [0, 'Weight cannot be less than 0'],
      max: [100, 'Weight cannot exceed 100']
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

// Compound unique index ensuring no duplicate skill requirement for the same job role
jobRoleSkillRequirementSchema.index({ jobRole: 1, skill: 1 }, { unique: true });
jobRoleSkillRequirementSchema.index({ jobRole: 1, isActive: 1 });

const JobRoleSkillRequirement = mongoose.model(
  'JobRoleSkillRequirement',
  jobRoleSkillRequirementSchema
);

module.exports = JobRoleSkillRequirement;
