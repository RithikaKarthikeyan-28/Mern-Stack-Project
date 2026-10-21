const mongoose = require('mongoose');

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      minlength: [2, 'Skill name must be at least 2 characters'],
      maxlength: [100, 'Skill name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    },
    proficiencyLevels: {
      type: [String],
      enum: {
        values: PROFICIENCY_LEVELS,
        message: 'Proficiency level must be one of: beginner, intermediate, advanced, expert'
      },
      default: ['beginner', 'intermediate', 'advanced', 'expert']
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

// Case-insensitive unique index on skill name
skillSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
skillSchema.index({ category: 1 });
skillSchema.index({ department: 1 });
skillSchema.index({ isGlobal: 1 });
skillSchema.index({ isActive: 1 });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
module.exports.PROFICIENCY_LEVELS = PROFICIENCY_LEVELS;
