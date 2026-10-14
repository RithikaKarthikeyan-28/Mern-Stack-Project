const mongoose = require('mongoose');
const { PROFICIENCY_LEVELS } = require('../utils/proficiency');

const employeeSkillSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
      index: true
    },
    proficiencyLevel: {
      type: String,
      required: [true, 'Proficiency level is required'],
      enum: {
        values: PROFICIENCY_LEVELS,
        message: 'Proficiency level must be one of: beginner, intermediate, advanced, expert'
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

// Compound unique index ensuring one active/current record per employee + skill combination
employeeSkillSchema.index({ employee: 1, skill: 1 }, { unique: true });
employeeSkillSchema.index({ employee: 1, isActive: 1 });

const EmployeeSkill = mongoose.model('EmployeeSkill', employeeSkillSchema);

module.exports = EmployeeSkill;
