const EmployeeSkill = require('../models/EmployeeSkill');
const Employee = require('../models/Employee');
const Skill = require('../models/Skill');
const AppError = require('../utils/AppError');
const {
  validateObjectId,
  validateCreateEmployeeSkill,
  validateUpdateEmployeeSkill,
  validateEmployeeSkillId,
  validateEmployeeSkillQuery
} = require('../validators/employeeSkill.validator');

const POPULATE_OPTIONS = [
  { path: 'skill', select: 'name category description proficiencyLevels isActive' },
  { path: 'employee', select: 'employeeId user department designation isActive' }
];

/**
 * Assigns a skill and proficiency level to an employee.
 * Admin only.
 */
async function createEmployeeSkill(currentUser, employeeId, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can assign employee skills.', 403);
  }

  validateCreateEmployeeSkill(employeeId, data);

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }
  if (!employee.isActive) {
    throw new AppError('Cannot assign skill to an inactive employee', 400);
  }

  const skillId = data.skill || data.skillId;
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new AppError('Skill not found', 404);
  }
  if (!skill.isActive) {
    throw new AppError('Cannot assign inactive skill to an employee', 400);
  }

  // Check for duplicate employee + skill assignment
  const existing = await EmployeeSkill.findOne({
    employee: employee._id,
    skill: skill._id
  });

  if (existing) {
    throw new AppError('Skill already assigned to this employee', 409);
  }

  const employeeSkill = await EmployeeSkill.create({
    employee: employee._id,
    skill: skill._id,
    proficiencyLevel: data.proficiencyLevel
  });

  const populated = await EmployeeSkill.findById(employeeSkill._id).populate(POPULATE_OPTIONS);
  return populated;
}

/**
 * Retrieves skills for a specified employee.
 * Non-admins receive active records only.
 */
async function getEmployeeSkills(currentUser, employeeId, query = {}) {
  validateObjectId(employeeId, 'Employee ID');
  validateEmployeeSkillQuery(query);

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }
  if (!employee.isActive && currentUser.role !== 'admin') {
    throw new AppError('Employee not found', 404);
  }

  const filter = { employee: employeeId };

  if (currentUser.role !== 'admin') {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const employeeSkills = await EmployeeSkill.find(filter)
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });

  return {
    employeeSkills,
    total: employeeSkills.length
  };
}

/**
 * Retrieves the authenticated employee's own active skills.
 * Filters and enriches skills relevant to the employee's department and job role.
 * Guarantees recipient isolation / anti-IDOR.
 */
async function getMySkills(currentUser) {
  const userId = currentUser.id || currentUser.userId || currentUser._id;
  const employee = await Employee.findOne({ user: userId, isActive: true })
    .populate('department', 'name description');
  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  // 1. Fetch assessed employee skills
  const storedSkills = await EmployeeSkill.find({
    employee: employee._id,
    isActive: true
  })
    .populate(POPULATE_OPTIONS)
    .sort({ createdAt: -1 });

  const storedSkillMap = new Map();
  storedSkills.forEach((es) => {
    if (es.skill?._id) {
      storedSkillMap.set(es.skill._id.toString(), es);
    }
  });

  // 2. Fetch department competencies
  let deptSkills = [];
  if (employee.department) {
    const deptId = employee.department._id || employee.department;
    deptSkills = await Skill.find({
      $or: [
        { department: deptId },
        { departments: deptId }
      ],
      isActive: true
    }).select('name category description proficiencyLevels isActive');
  }

  // 3. Merge: ensure all department skills are represented
  const mergedList = [...storedSkills];
  const existingSkillIds = new Set(storedSkills.map((es) => es.skill?._id?.toString()).filter(Boolean));

  for (const skillDoc of deptSkills) {
    const sId = skillDoc._id.toString();
    if (!existingSkillIds.has(sId)) {
      mergedList.push({
        _id: `dept_skill_${sId}`,
        id: `dept_skill_${sId}`,
        employee: employee._id,
        skill: skillDoc,
        proficiencyLevel: 'beginner',
        isAssessed: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      existingSkillIds.add(sId);
    }
  }

  return {
    employeeSkills: mergedList,
    total: mergedList.length,
    department: employee.department
  };
}

/**
 * Updates an employee skill's proficiency level.
 * Admin only.
 */
async function updateEmployeeSkill(currentUser, id, data) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can update employee skills.', 403);
  }

  validateUpdateEmployeeSkill({ id }, data);

  const employeeSkill = await EmployeeSkill.findById(id);
  if (!employeeSkill) {
    throw new AppError('Employee skill not found', 404);
  }

  employeeSkill.proficiencyLevel = data.proficiencyLevel;
  await employeeSkill.save();

  const populated = await EmployeeSkill.findById(employeeSkill._id).populate(POPULATE_OPTIONS);
  return populated;
}

/**
 * Soft deletes an employee skill (isActive = false).
 * Admin only.
 */
async function softDeleteEmployeeSkill(currentUser, id) {
  if (currentUser.role !== 'admin') {
    throw new AppError('Access denied. Only administrators can delete employee skills.', 403);
  }

  validateEmployeeSkillId({ id });

  const employeeSkill = await EmployeeSkill.findById(id);
  if (!employeeSkill) {
    throw new AppError('Employee skill not found', 404);
  }

  employeeSkill.isActive = false;
  await employeeSkill.save();

  return { message: 'Employee skill deleted successfully' };
}

module.exports = {
  createEmployeeSkill,
  getEmployeeSkills,
  getMySkills,
  updateEmployeeSkill,
  softDeleteEmployeeSkill
};
