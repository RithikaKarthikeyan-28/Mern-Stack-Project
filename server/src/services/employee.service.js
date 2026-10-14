const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const { validateObjectId } = require('../validators/department.validator');
const {
  validateCreateEmployee,
  validateUpdateEmployee
} = require('../validators/employee.validator');

const POPULATE_OPTIONS = [
  { path: 'user', select: 'name email role isActive' },
  { path: 'department', select: 'name description isActive' }
];

/**
 * Creates an employee profile linking a User to a Department.
 *
 * @param {object} data - Employee creation payload
 * @returns {Promise<object>} Populated created employee document
 */
async function createEmployee(data) {
  validateCreateEmployee(data);

  // 1. Verify user exists and is active
  const user = await User.findById(data.user);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!user.isActive) {
    throw new AppError('Cannot create employee profile for an inactive user', 400);
  }

  // 2. Verify department exists and is active
  const department = await Department.findById(data.department);
  if (!department) {
    throw new AppError('Department not found', 404);
  }
  if (!department.isActive) {
    throw new AppError('Cannot assign employee to an inactive department', 400);
  }

  // 3. Prevent duplicate profile for the same user
  const existingUserProfile = await Employee.findOne({ user: data.user });
  if (existingUserProfile) {
    throw new AppError('An employee profile already exists for this user', 400);
  }

  // 4. Prevent duplicate employeeId
  const trimmedEmployeeId = data.employeeId.trim();
  const existingEmployeeId = await Employee.findOne({
    employeeId: { $regex: new RegExp(`^${trimmedEmployeeId}$`, 'i') }
  });
  if (existingEmployeeId) {
    throw new AppError('Employee ID already in use', 400);
  }

  // 5. Create employee document
  const employee = await Employee.create({
    user: data.user,
    employeeId: trimmedEmployeeId,
    department: data.department,
    designation: data.designation !== undefined ? data.designation.trim() : '',
    phone: data.phone !== undefined ? data.phone.trim() : '',
    dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined
  });

  await employee.populate(POPULATE_OPTIONS);
  return employee;
}

/**
 * Retrieves all employees, with optional department and active status filtering.
 *
 * @param {object} [query={}] - Filter criteria
 * @returns {Promise<Array>} List of populated employee documents
 */
async function getEmployees(query = {}) {
  const filter = {};

  if (query.department) {
    validateObjectId(query.department, 'Department ID');
    filter.department = query.department;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  return Employee.find(filter).populate(POPULATE_OPTIONS).sort({ createdAt: -1 });
}

/**
 * Retrieves an employee by employee document ID.
 *
 * @param {string} id - Employee ID
 * @returns {Promise<object>} Populated employee document
 */
async function getEmployeeById(id) {
  validateObjectId(id, 'Employee ID');

  const employee = await Employee.findById(id).populate(POPULATE_OPTIONS);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return employee;
}

/**
 * Retrieves an employee profile by associated user ObjectId.
 * Used for employee self-profile (/me).
 *
 * @param {string} userId - User ObjectId
 * @returns {Promise<object>} Populated employee document
 */
async function getEmployeeByUserId(userId) {
  validateObjectId(userId, 'User ID');

  const employee = await Employee.findOne({ user: userId }).populate(POPULATE_OPTIONS);
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  return employee;
}

/**
 * Updates an existing employee profile.
 *
 * @param {string} id - Employee ID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated populated employee document
 */
async function updateEmployee(id, data) {
  validateObjectId(id, 'Employee ID');
  validateUpdateEmployee(data);

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Reject altering user reference
  if (data.user !== undefined && data.user.toString() !== employee.user.toString()) {
    throw new AppError('Cannot change user reference of an employee profile', 400);
  }

  // If department is being updated, verify it exists and is active
  if (data.department !== undefined) {
    validateObjectId(data.department, 'Department ID');
    const dept = await Department.findById(data.department);
    if (!dept) {
      throw new AppError('Department not found', 404);
    }
    if (!dept.isActive) {
      throw new AppError('Cannot assign employee to an inactive department', 400);
    }
    employee.department = data.department;
  }

  // If employeeId is being updated, verify uniqueness
  if (data.employeeId !== undefined) {
    const trimmedId = data.employeeId.trim();
    if (trimmedId.toLowerCase() !== employee.employeeId.toLowerCase()) {
      const existing = await Employee.findOne({
        _id: { $ne: id },
        employeeId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
      });
      if (existing) {
        throw new AppError('Employee ID already in use', 400);
      }
      employee.employeeId = trimmedId;
    }
  }

  if (data.designation !== undefined) {
    employee.designation = typeof data.designation === 'string' ? data.designation.trim() : '';
  }

  if (data.phone !== undefined) {
    employee.phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  }

  if (data.dateOfJoining !== undefined) {
    employee.dateOfJoining = data.dateOfJoining ? new Date(data.dateOfJoining) : null;
  }

  if (data.isActive !== undefined) {
    employee.isActive = data.isActive;
  }

  await employee.save();
  await employee.populate(POPULATE_OPTIONS);
  return employee;
}

/**
 * Soft-deletes an employee profile by setting isActive to false.
 *
 * @param {string} id - Employee ID
 * @returns {Promise<object>} Soft-deleted employee document
 */
async function deleteEmployee(id) {
  validateObjectId(id, 'Employee ID');

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  employee.isActive = false;
  await employee.save();

  return employee;
}

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeeByUserId,
  updateEmployee,
  deleteEmployee
};
