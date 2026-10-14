const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateDepartment,
  validateUpdateDepartment
} = require('../validators/department.validator');

/**
 * Creates a new department.
 *
 * @param {object} data - Department data (name, description)
 * @returns {Promise<object>} Created department document
 */
async function createDepartment(data) {
  validateCreateDepartment(data);

  const trimmedName = data.name.trim();

  // Check for duplicate name (case-insensitive)
  const existing = await Department.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  });

  if (existing) {
    throw new AppError('Department with this name already exists', 400);
  }

  const department = await Department.create({
    name: trimmedName,
    description: data.description !== undefined ? data.description.trim() : ''
  });

  return department;
}

/**
 * Retrieves departments, optionally filtered by active status.
 *
 * @param {object} [query={}] - Query parameters (e.g. isActive)
 * @returns {Promise<Array>} List of departments
 */
async function getDepartments(query = {}) {
  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  return Department.find(filter).sort({ name: 1 });
}

/**
 * Retrieves a single department by its ID.
 *
 * @param {string} id - Department ID
 * @returns {Promise<object>} Found department document
 */
async function getDepartmentById(id) {
  validateObjectId(id, 'Department ID');

  const department = await Department.findById(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  return department;
}

/**
 * Updates an existing department.
 *
 * @param {string} id - Department ID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated department document
 */
async function updateDepartment(id, data) {
  validateObjectId(id, 'Department ID');
  validateUpdateDepartment(data);

  const department = await Department.findById(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (trimmedName.toLowerCase() !== department.name.toLowerCase()) {
      const existing = await Department.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });

      if (existing) {
        throw new AppError('Department with this name already exists', 400);
      }
      department.name = trimmedName;
    }
  }

  if (data.description !== undefined) {
    department.description = typeof data.description === 'string' ? data.description.trim() : '';
  }

  if (data.isActive !== undefined) {
    department.isActive = data.isActive;
  }

  await department.save();
  return department;
}

/**
 * Soft-deletes a department by setting isActive to false.
 *
 * @param {string} id - Department ID
 * @returns {Promise<object>} Soft-deleted department document
 */
async function deleteDepartment(id) {
  validateObjectId(id, 'Department ID');

  const department = await Department.findById(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  department.isActive = false;
  await department.save();

  return department;
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
