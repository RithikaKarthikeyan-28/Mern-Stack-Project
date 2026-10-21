const CourseSkill = require('../models/CourseSkill');
const Enrollment = require('../models/Enrollment');
const skillGapAnalysisService = require('./skillGapAnalysis.service');
const { getProficiencyRank } = require('../utils/proficiency');
const {
  validateRecommendationParams,
  validateRecommendationQuery
} = require('../validators/courseRecommendation.validator');

/**
 * Calculates the recommendation score for a course's coverage of a single gap skill.
 *
 * @param {object} gapItem - Gap analysis item from skill gap report
 * @param {object} courseSkillDoc - CourseSkill document
 * @returns {object} { score, matchedSkillData }
 */
function calculateMatchedSkillScore(gapItem, courseSkillDoc) {
  let gapSeverityScore = 0;
  let coverageScore = 0;

  const requiredRank = gapItem.requiredLevelRank;
  const currentRank = gapItem.currentLevelRank;
  const courseCoverageRank = getProficiencyRank(courseSkillDoc.coverageLevel);

  if (gapItem.status === 'MISSING') {
    gapSeverityScore = 40;
    switch (courseSkillDoc.coverageLevel) {
      case 'beginner':
        coverageScore = 10;
        break;
      case 'intermediate':
        coverageScore = 20;
        break;
      case 'advanced':
        coverageScore = 30;
        break;
      case 'expert':
        coverageScore = 40;
        break;
      default:
        coverageScore = 10;
    }
  } else if (gapItem.status === 'BELOW_REQUIRED') {
    const diff = requiredRank - currentRank;
    if (diff === 1) {
      gapSeverityScore = 25;
    } else if (diff === 2) {
      gapSeverityScore = 32;
    } else if (diff >= 3) {
      gapSeverityScore = 38;
    }

    const covDiff = courseCoverageRank - requiredRank;
    if (covDiff >= 0) {
      coverageScore = 40;
    } else if (covDiff === -1) {
      coverageScore = 30;
    } else if (covDiff === -2) {
      coverageScore = 20;
    } else if (covDiff === -3) {
      coverageScore = 10;
    } else {
      coverageScore = 0;
    }
  }

  const normalizedWeight = ((courseSkillDoc.coverageWeight !== undefined ? courseSkillDoc.coverageWeight : 1) / 100) * 20;
  const totalSkillScore = Math.min(100, gapSeverityScore + coverageScore + normalizedWeight);

  return {
    score: totalSkillScore,
    matchedSkillData: {
      skill: {
        _id: courseSkillDoc.skill._id,
        name: courseSkillDoc.skill.name,
        category: courseSkillDoc.skill.category
      },
      status: gapItem.status,
      currentLevel: gapItem.currentLevel,
      requiredLevel: gapItem.requiredLevel,
      coverageLevel: courseSkillDoc.coverageLevel,
      mandatory: gapItem.mandatory
    }
  };
}

/**
 * Generates deterministic course recommendations based on an employee's skill gaps.
 *
 * @param {string} employeeId - Employee ID
 * @param {string} jobRoleId - Job Role ID
 * @param {object} [query={}] - Optional query filters (minScore, mandatoryOnly, limit, page)
 * @returns {Promise<object>} Recommendation report
 */
async function getCourseRecommendations(employeeId, jobRoleId, query = {}) {
  validateRecommendationParams(employeeId, jobRoleId);
  validateRecommendationQuery(query);

  // 1. Authoritative Skill Gap Analysis (reused, no duplication)
  const gapReport = await skillGapAnalysisService.analyzeEmployeeSkillGap(employeeId, jobRoleId);

  // 2. Filter gap skills (only MISSING and BELOW_REQUIRED)
  const gapItems = gapReport.gaps.filter(
    (g) => g.status === 'MISSING' || g.status === 'BELOW_REQUIRED'
  );

  const totalGapSkills = gapItems.length;
  const mandatoryGapSkills = gapItems.filter((g) => g.mandatory).length;
  const optionalGapSkills = gapItems.filter((g) => !g.mandatory).length;

  if (gapItems.length === 0) {
    return {
      employee: gapReport.employee,
      jobRole: gapReport.jobRole,
      summary: {
        totalGapSkills: 0,
        mandatoryGapSkills: 0,
        optionalGapSkills: 0,
        candidateCourses: 0,
        returnedCourses: 0
      },
      recommendations: []
    };
  }

  // 3. Find completed courses to exclude
  const completedEnrollments = await Enrollment.find({
    employee: employeeId,
    status: 'completed',
    isActive: true
  }).select('course');
  const completedCourseIds = new Set(completedEnrollments.map((e) => e.course.toString()));

  // Find other active enrollments for status representation (enrolled / in_progress)
  const activeEnrollments = await Enrollment.find({
    employee: employeeId,
    status: { $in: ['enrolled', 'in_progress'] },
    isActive: true
  }).select('course status');
  const enrollmentStatusMap = new Map();
  for (const e of activeEnrollments) {
    enrollmentStatusMap.set(e.course.toString(), e.status);
  }

  // 4. Retrieve candidate course-skill mappings for gap skills
  const gapSkillIds = gapItems.map((g) => g.skill._id.toString());

  const mappings = await CourseSkill.find({
    skill: { $in: gapSkillIds },
    isActive: true
  })
    .populate({
      path: 'course',
      match: { isActive: true, status: 'published' },
      select: 'title description category level duration status isActive department isGlobal'
    })
    .populate('skill', 'name category description isActive');

  // 5. Group by course, evaluating each matched skill
  const courseMap = new Map();
  const empDeptId =
    gapReport.employee?.department?._id?.toString() ||
    gapReport.employee?.department?.toString() ||
    null;

  for (const mapping of mappings) {
    // Only published, active courses with active skills
    if (!mapping.course || !mapping.skill || !mapping.skill.isActive) {
      continue;
    }

    const courseIdStr = mapping.course._id.toString();

    // Exclude completed courses
    if (completedCourseIds.has(courseIdStr)) {
      continue;
    }

    // Department filtering:
    // If course belongs to a specific department and employee belongs to a department,
    // only recommend course if it belongs to employee's department (or course is explicitly global)
    const courseDeptId =
      mapping.course.department?._id?.toString() ||
      mapping.course.department?.toString() ||
      null;
    const isGlobalCourse = mapping.course.isGlobal === true || !courseDeptId;

    if (empDeptId && courseDeptId && !isGlobalCourse && empDeptId !== courseDeptId) {
      continue;
    }

    const gapItem = gapItems.find((g) => g.skill._id.toString() === mapping.skill._id.toString());
    if (!gapItem) {
      continue;
    }

    const { score, matchedSkillData } = calculateMatchedSkillScore(gapItem, mapping);

    if (!courseMap.has(courseIdStr)) {
      courseMap.set(courseIdStr, {
        course: mapping.course,
        isDeptMatch: Boolean(empDeptId && courseDeptId && empDeptId === courseDeptId),
        matchedSkills: [matchedSkillData],
        skillScores: [score]
      });
    } else {
      const entry = courseMap.get(courseIdStr);
      entry.matchedSkills.push(matchedSkillData);
      entry.skillScores.push(score);
    }
  }

  // 6. Calculate course-level aggregated score and bonuses
  const candidateRecommendations = [];

  for (const [courseIdStr, entry] of courseMap.entries()) {
    const avgScore =
      entry.skillScores.reduce((sum, s) => sum + s, 0) / entry.skillScores.length;

    // Breadth bonus: +5 if covering 2 or more gap skills
    const breadthBonus = entry.matchedSkills.length >= 2 ? 5 : 0;

    const mandatoryGapCount = entry.matchedSkills.filter((s) => s.mandatory).length;
    const optionalGapCount = entry.matchedSkills.filter((s) => !s.mandatory).length;

    // Mandatory bonus: +5 if covering at least 1 mandatory gap
    const mandatoryBonus = mandatoryGapCount >= 1 ? 5 : 0;

    // Department match bonus: +5 if explicitly matching employee's department
    const deptBonus = entry.isDeptMatch ? 5 : 0;

    const finalScore = Math.min(
      100,
      Number((avgScore + breadthBonus + mandatoryBonus + deptBonus).toFixed(2))
    );

    candidateRecommendations.push({
      course: entry.course,
      score: finalScore,
      mandatoryGapCount,
      optionalGapCount,
      matchedSkills: entry.matchedSkills,
      enrollmentStatus: enrollmentStatusMap.get(courseIdStr) || null
    });
  }

  const candidateCourses = candidateRecommendations.length;

  // 7. Deterministic sorting:
  // 1. score descending
  // 2. mandatoryGapCount descending
  // 3. number of matchedSkills descending
  // 4. course title ascending
  // 5. course ID ascending (tie breaker)
  candidateRecommendations.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (a.mandatoryGapCount !== b.mandatoryGapCount) {
      return b.mandatoryGapCount - a.mandatoryGapCount;
    }
    if (a.matchedSkills.length !== b.matchedSkills.length) {
      return b.matchedSkills.length - a.matchedSkills.length;
    }
    const titleA = (a.course.title || '').toLowerCase();
    const titleB = (b.course.title || '').toLowerCase();
    const titleCmp = titleA.localeCompare(titleB);
    if (titleCmp !== 0) {
      return titleCmp;
    }
    return a.course._id.toString().localeCompare(b.course._id.toString());
  });

  // 8. Server-side filtering
  let filtered = [...candidateRecommendations];

  if (query.minScore !== undefined) {
    const min = Number(query.minScore);
    filtered = filtered.filter((r) => r.score >= min);
  }

  if (query.mandatoryOnly === 'true' || query.mandatoryOnly === true) {
    filtered = filtered.filter((r) => r.mandatoryGapCount > 0);
  }

  // 9. Pagination
  let paginated = filtered;
  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    const page = query.page !== undefined ? Number(query.page) : 1;
    const startIndex = (page - 1) * limit;
    paginated = filtered.slice(startIndex, startIndex + limit);
  }

  return {
    employee: gapReport.employee,
    jobRole: gapReport.jobRole,
    summary: {
      totalGapSkills,
      mandatoryGapSkills,
      optionalGapSkills,
      candidateCourses,
      returnedCourses: paginated.length
    },
    recommendations: paginated
  };
}

module.exports = {
  calculateMatchedSkillScore,
  getCourseRecommendations
};
