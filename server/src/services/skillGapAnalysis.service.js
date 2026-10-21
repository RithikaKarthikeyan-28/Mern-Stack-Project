const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const JobRole = require('../models/JobRole');
const JobRoleSkillRequirement = require('../models/JobRoleSkillRequirement');
const EmployeeSkill = require('../models/EmployeeSkill');
const AppError = require('../utils/AppError');
const { compareProficiency } = require('../utils/proficiency');
const {
  validateSkillGapParams,
  validateSkillGapQuery
} = require('../validators/skillGapAnalysis.validator');

/**
 * Performs a deterministic Skill Gap Analysis for an employee against a Job Role.
 *
 * @param {string} employeeId - Target employee document ID
 * @param {string} jobRoleId - Target job role document ID
 * @param {object} [query={}] - Optional query filters (status, mandatory)
 * @returns {Promise<object>} Complete deterministic skill gap report
 */
async function analyzeEmployeeSkillGap(employeeId, jobRoleId, query = {}) {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError('Invalid Employee ID format', 400);
  }

  // 1. Verify active employee
  const employee = await Employee.findById(employeeId)
    .populate('user', 'name email role isActive')
    .populate('department', 'name');
  if (!employee || !employee.isActive) {
    throw new AppError('Employee not found', 404);
  }

  // 2. Resolve target job role (fallback to employee's department role if omitted)
  let effectiveJobRoleId = jobRoleId;
  if (!effectiveJobRoleId || effectiveJobRoleId === 'default' || effectiveJobRoleId === 'me') {
    if (employee.jobRole) {
      effectiveJobRoleId = employee.jobRole;
    } else if (employee.department) {
      const deptRole = await JobRole.findOne({
        $or: [{ department: employee.department._id || employee.department }, { departments: employee.department._id || employee.department }],
        isActive: true
      });
      if (deptRole) effectiveJobRoleId = deptRole._id;
    }
  }

  validateSkillGapParams(employeeId, effectiveJobRoleId);
  validateSkillGapQuery(query);

  const jobRole = await JobRole.findById(effectiveJobRoleId);
  if (!jobRole || !jobRole.isActive) {
    throw new AppError('Job Role not found', 404);
  }

  // 3. Retrieve active requirements for this job role
  const requirements = await JobRoleSkillRequirement.find({
    jobRole: jobRole._id,
    isActive: true
  }).populate('skill', 'name category description proficiencyLevels isActive');

  // Exclude requirements whose referenced skill is absent or inactive
  const validRequirements = requirements.filter((r) => r.skill && r.skill.isActive);

  // 4. Retrieve active employee skills
  const employeeSkills = await EmployeeSkill.find({
    employee: employee._id,
    isActive: true
  });

  const employeeSkillMap = new Map();
  for (const es of employeeSkills) {
    employeeSkillMap.set(es.skill.toString(), es);
  }

  // 5. Evaluate gap for each valid requirement
  const allGaps = validRequirements.map((reqDoc) => {
    const skillIdStr = reqDoc.skill._id.toString();
    const employeeSkill = employeeSkillMap.get(skillIdStr);

    const comparison = compareProficiency(
      employeeSkill ? employeeSkill.proficiencyLevel : null,
      reqDoc.requiredLevel
    );

    return {
      requirementId: reqDoc._id,
      skill: {
        _id: reqDoc.skill._id,
        name: reqDoc.skill.name,
        category: reqDoc.skill.category
      },
      requiredLevel: reqDoc.requiredLevel,
      currentLevel: employeeSkill ? employeeSkill.proficiencyLevel : null,
      requiredLevelRank: comparison.requiredRank,
      currentLevelRank: comparison.currentRank,
      gap: Math.max(0, comparison.requiredRank - (comparison.currentRank || 0)),
      mandatory: Boolean(reqDoc.mandatory),
      weight: typeof reqDoc.weight === 'number' ? reqDoc.weight : 1,
      status: comparison.status
    };
  });

  // 6. Calculate summary metrics over the full analysis set
  const totalRequirements = allGaps.length;
  const mandatoryRequirements = allGaps.filter((g) => g.mandatory).length;
  const optionalRequirements = allGaps.filter((g) => !g.mandatory).length;

  const missingSkills = allGaps.filter((g) => g.status === 'MISSING').length;
  const belowRequiredSkills = allGaps.filter((g) => g.status === 'BELOW_REQUIRED').length;
  const meetsRequiredSkills = allGaps.filter((g) => g.status === 'MEETS_REQUIRED').length;

  const mandatoryGaps = allGaps.filter(
    (g) => g.mandatory && (g.status === 'MISSING' || g.status === 'BELOW_REQUIRED')
  ).length;
  const optionalGaps = allGaps.filter(
    (g) => !g.mandatory && (g.status === 'MISSING' || g.status === 'BELOW_REQUIRED')
  ).length;

  const mandatoryRequirementsMet = allGaps.filter(
    (g) => g.mandatory && g.status === 'MEETS_REQUIRED'
  ).length;
  const mandatoryRequirementsGap = mandatoryGaps;

  // Percentage calculations with zero-division protection and 2 decimal place precision
  const overallMatchPercentage =
    totalRequirements === 0
      ? 100
      : Number(((meetsRequiredSkills / totalRequirements) * 100).toFixed(2));

  const mandatoryMatchPercentage =
    mandatoryRequirements === 0
      ? 100
      : Number(((mandatoryRequirementsMet / mandatoryRequirements) * 100).toFixed(2));

  const totalWeight = allGaps.reduce((sum, g) => sum + (g.weight || 0), 0);
  const metWeight = allGaps
    .filter((g) => g.status === 'MEETS_REQUIRED')
    .reduce((sum, g) => sum + (g.weight || 0), 0);

  const weightedMatchPercentage =
    totalWeight === 0 ? 100 : Number(((metWeight / totalWeight) * 100).toFixed(2));

  // 7. Deterministic sorting:
  // 1. Mandatory first
  // 2. requiredLevelRank descending
  // 3. skill name ascending
  // 4. requirementId ascending (tie breaker)
  allGaps.sort((a, b) => {
    if (a.mandatory !== b.mandatory) {
      return a.mandatory ? -1 : 1;
    }
    if (a.requiredLevelRank !== b.requiredLevelRank) {
      return b.requiredLevelRank - a.requiredLevelRank;
    }
    const nameA = (a.skill && a.skill.name ? a.skill.name : '').toLowerCase();
    const nameB = (b.skill && b.skill.name ? b.skill.name : '').toLowerCase();
    const nameCmp = nameA.localeCompare(nameB);
    if (nameCmp !== 0) {
      return nameCmp;
    }
    return a.requirementId.toString().localeCompare(b.requirementId.toString());
  });

  // 8. Apply query filters to the returned gaps list (preserving full summary metrics)
  let filteredGaps = [...allGaps];

  if (query.status) {
    filteredGaps = filteredGaps.filter((g) => g.status === query.status);
  }

  if (query.mandatory !== undefined) {
    const isMandatory = query.mandatory === 'true' || query.mandatory === true;
    filteredGaps = filteredGaps.filter((g) => g.mandatory === isMandatory);
  }

  return {
    employee: {
      id: employee._id,
      employeeId: employee.employeeId,
      name: employee.user ? employee.user.name : undefined,
      designation: employee.designation,
      department: employee.department
    },
    jobRole: {
      id: jobRole._id,
      name: jobRole.name,
      code: jobRole.code
    },
    summary: {
      totalRequirements,
      mandatoryRequirements,
      optionalRequirements,
      missingSkills,
      belowRequiredSkills,
      meetsRequiredSkills,
      mandatoryGaps,
      optionalGaps,
      mandatoryRequirementsMet,
      mandatoryRequirementsGap,
      overallMatchPercentage,
      mandatoryMatchPercentage,
      weightedMatchPercentage
    },
    gaps: filteredGaps
  };
}

module.exports = {
  analyzeEmployeeSkillGap
};
