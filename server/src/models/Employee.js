const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    designation: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Designation cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [25, 'Phone number cannot exceed 25 characters']
    },
    dateOfJoining: {
      type: Date
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

// Performance indexes for department querying and active employee lookups
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
