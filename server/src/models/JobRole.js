const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Job Role name is required'],
      trim: true,
      minlength: [2, 'Job Role name must be at least 2 characters'],
      maxlength: [150, 'Job Role name cannot exceed 150 characters']
    },
    code: {
      type: String,
      required: [true, 'Job Role code is required'],
      trim: true,
      uppercase: true,
      minlength: [1, 'Job Role code cannot be empty'],
      maxlength: [50, 'Job Role code cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
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

// Indexes for unique constraints and active state queries
jobRoleSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
jobRoleSchema.index({ code: 1 }, { unique: true });
jobRoleSchema.index({ department: 1 });
jobRoleSchema.index({ isGlobal: 1 });
jobRoleSchema.index({ isActive: 1 });

const JobRole = mongoose.model('JobRole', jobRoleSchema);

module.exports = JobRole;
