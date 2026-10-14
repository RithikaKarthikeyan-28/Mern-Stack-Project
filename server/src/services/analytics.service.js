const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Certificate = require('../models/Certificate');
const ComplianceRequirement = require('../models/ComplianceRequirement');
const ComplianceAssignment = require('../models/ComplianceAssignment');
const config = require('../config');
const complianceService = require('./compliance.service');

/**
 * Safely rounds a number to 2 decimal places.
 */
function round2(val) {
  if (val === null || val === undefined || isNaN(val)) return 0;
  return Math.round(Number(val) * 100) / 100;
}

/**
 * Builds a date range match query object using normalized dates if available.
 */
function buildDateMatch(field, from, to, fromNorm, toNorm) {
  const match = {};
  const f = fromNorm || from;
  const t = toNorm || to;
  if (f || t) {
    match[field] = {};
    if (f) match[field].$gte = new Date(f);
    if (t) match[field].$lte = new Date(t);
  }
  return match;
}

/**
 * Resolves active employee ObjectIds belonging to a department.
 */
async function getEmployeeIdsForDepartment(departmentId) {
  return Employee.find({
    department: new mongoose.Types.ObjectId(departmentId),
    isActive: true
  }).distinct('_id');
}

/**
 * 1. GET /api/analytics/overview
 * High-level executive overview across all domains.
 */
async function getOverviewAnalytics(filters = {}) {
  const empDateMatch = buildDateMatch('createdAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  const enrDateMatch = buildDateMatch('createdAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  const attDateMatch = buildDateMatch('submittedAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  const certDateMatch = buildDateMatch('issuedAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  const compDateMatch = buildDateMatch('assignedAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);

  const now = new Date();

  const [
    employeeStats,
    deptStats,
    courseStats,
    enrollmentStats,
    assessmentCount,
    assessmentPublishedCount,
    attemptStats,
    certStats,
    complianceStats
  ] = await Promise.all([
    // Employees
    Employee.aggregate([
      { $match: empDateMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } }
        }
      }
    ]),

    // Departments
    Department.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
        }
      }
    ]),

    // Courses
    Course.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } }
        }
      }
    ]),

    // Enrollments
    Enrollment.aggregate([
      { $match: { isActive: true, ...enrDateMatch } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          enrolled: { $sum: { $cond: [{ $eq: ['$status', 'enrolled'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          dropped: { $sum: { $cond: [{ $eq: ['$status', 'dropped'] }, 1, 0] } }
        }
      }
    ]),

    // Assessments
    Assessment.countDocuments({ isActive: true }),
    Assessment.countDocuments({ isActive: true, status: 'published' }),

    // Assessment Attempts (submitted & evaluated)
    AssessmentAttempt.aggregate([
      { $match: { ...attDateMatch, result: { $in: ['passed', 'failed'] } } },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ['$result', 'passed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$result', 'failed'] }, 1, 0] } }
        }
      }
    ]),

    // Certificates
    Certificate.aggregate([
      { $match: certDateMatch },
      {
        $group: {
          _id: null,
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', now] }] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$expiresAt', null] },
                    { $lte: ['$expiresAt', now] }
                  ]
                },
                1,
                0
              ]
            }
          },
          revoked: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } }
        }
      }
    ]),

    // Compliance
    ComplianceAssignment.aggregate([
      { $match: { isActive: true, ...compDateMatch } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          compliant: { $sum: { $cond: [{ $eq: ['$status', 'COMPLIANT'] }, 1, 0] } },
          dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'DUE_SOON'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'NOT_STARTED'] }, 1, 0] } }
        }
      }
    ])
  ]);

  const emp = employeeStats[0] || { total: 0, active: 0, inactive: 0 };
  const dept = deptStats[0] || { total: 0, active: 0 };
  const c = courseStats[0] || { total: 0, published: 0, draft: 0, archived: 0 };
  const enr = enrollmentStats[0] || { total: 0, enrolled: 0, inProgress: 0, completed: 0, dropped: 0 };
  const att = attemptStats[0] || { attempts: 0, passed: 0, failed: 0 };
  const cert = certStats[0] || { active: 0, expired: 0, revoked: 0 };
  const comp = complianceStats[0] || {
    total: 0,
    compliant: 0,
    dueSoon: 0,
    overdue: 0,
    inProgress: 0,
    notStarted: 0
  };

  const passRate = att.attempts > 0 ? round2((att.passed / att.attempts) * 100) : 100;
  const complianceRate = comp.total > 0 ? round2((comp.compliant / comp.total) * 100) : 100;

  return {
    employees: {
      total: emp.total,
      active: emp.active,
      inactive: emp.inactive
    },
    departments: {
      total: dept.total,
      active: dept.active
    },
    courses: {
      total: c.total,
      published: c.published,
      draft: c.draft,
      archived: c.archived
    },
    enrollments: {
      total: enr.total,
      enrolled: enr.enrolled,
      inProgress: enr.inProgress,
      completed: enr.completed,
      dropped: enr.dropped
    },
    assessments: {
      total: assessmentCount,
      published: assessmentPublishedCount,
      attempts: att.attempts,
      passed: att.passed,
      failed: att.failed,
      passRate
    },
    certificates: {
      active: cert.active,
      expired: cert.expired,
      revoked: cert.revoked
    },
    compliance: {
      total: comp.total,
      compliant: comp.compliant,
      dueSoon: comp.dueSoon,
      overdue: comp.overdue,
      inProgress: comp.inProgress,
      notStarted: comp.notStarted,
      complianceRate
    }
  };
}

/**
 * 2. GET /api/analytics/learning
 * Enrollment metrics, progress percentage, completion time, course & department breakdowns.
 */
async function getLearningAnalytics(filters = {}) {
  const match = { isActive: true };

  const dateMatch = buildDateMatch('createdAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  if (dateMatch.createdAt) {
    match.createdAt = dateMatch.createdAt;
  }

  if (filters.courseId) {
    match.course = new mongoose.Types.ObjectId(filters.courseId);
  }

  if (filters.status) {
    match.status = filters.status;
  }

  if (filters.departmentId) {
    const empIds = await getEmployeeIdsForDepartment(filters.departmentId);
    match.employee = { $in: empIds };
  }

  const [summaryAgg, completionTimeAgg] = await Promise.all([
    Enrollment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          enrolled: { $sum: { $cond: [{ $eq: ['$status', 'enrolled'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          dropped: { $sum: { $cond: [{ $eq: ['$status', 'dropped'] }, 1, 0] } },
          avgProgress: { $avg: '$progressPercentage' }
        }
      }
    ]),

    // Average completion time in days
    Enrollment.aggregate([
      {
        $match: {
          ...match,
          status: 'completed',
          startedAt: { $ne: null },
          completedAt: { $ne: null }
        }
      },
      {
        $project: {
          durationDays: {
            $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 86400000]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$durationDays' }
        }
      }
    ])
  ]);

  const sum = summaryAgg[0] || {
    totalEnrollments: 0,
    enrolled: 0,
    inProgress: 0,
    completed: 0,
    dropped: 0,
    avgProgress: 0
  };

  const total = sum.totalEnrollments;
  const completionRate = total > 0 ? round2((sum.completed / total) * 100) : 100;
  const avgCompletionTime = completionTimeAgg[0] ? round2(completionTimeAgg[0].avgDays) : 0;

  // Course Breakdown
  const courseBreakdownAgg = await Course.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'enrollments',
        let: { courseId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$course', '$$courseId'] }, { $eq: ['$isActive', true] }] }
            }
          }
        ],
        as: 'enrollments'
      }
    },
    {
      $project: {
        courseId: '$_id',
        title: 1,
        enrollmentCount: { $size: '$enrollments' },
        completedCount: {
          $size: {
            $filter: {
              input: '$enrollments',
              as: 'e',
              cond: { $eq: ['$$e.status', 'completed'] }
            }
          }
        },
        inProgressCount: {
          $size: {
            $filter: {
              input: '$enrollments',
              as: 'e',
              cond: { $eq: ['$$e.status', 'in_progress'] }
            }
          }
        },
        droppedCount: {
          $size: {
            $filter: {
              input: '$enrollments',
              as: 'e',
              cond: { $eq: ['$$e.status', 'dropped'] }
            }
          }
        },
        averageProgressPercentage: {
          $cond: [
            { $gt: [{ $size: '$enrollments' }, 0] },
            { $round: [{ $avg: '$enrollments.progressPercentage' }, 2] },
            0
          ]
        }
      }
    },
    {
      $project: {
        courseId: 1,
        title: 1,
        enrollmentCount: 1,
        completedCount: 1,
        inProgressCount: 1,
        droppedCount: 1,
        averageProgressPercentage: 1,
        completionRate: {
          $cond: [
            { $gt: ['$enrollmentCount', 0] },
            {
              $round: [
                { $multiply: [{ $divide: ['$completedCount', '$enrollmentCount'] }, 100] },
                2
              ]
            },
            100
          ]
        }
      }
    },
    { $sort: { title: 1, courseId: 1 } }
  ]);

  // Department Breakdown
  const departmentBreakdownAgg = await Department.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'employees',
        let: { deptId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$department', '$$deptId'] }, { $eq: ['$isActive', true] }] }
            }
          }
        ],
        as: 'employees'
      }
    },
    {
      $lookup: {
        from: 'enrollments',
        let: { empIds: '$employees._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $in: ['$employee', '$$empIds'] }, { $eq: ['$isActive', true] }]
              }
            }
          }
        ],
        as: 'enrollments'
      }
    },
    {
      $project: {
        departmentId: '$_id',
        departmentName: '$name',
        employeeCount: { $size: '$employees' },
        enrollmentCount: { $size: '$enrollments' },
        completedEnrollments: {
          $size: {
            $filter: {
              input: '$enrollments',
              as: 'e',
              cond: { $eq: ['$$e.status', 'completed'] }
            }
          }
        },
        inProgressEnrollments: {
          $size: {
            $filter: {
              input: '$enrollments',
              as: 'e',
              cond: { $eq: ['$$e.status', 'in_progress'] }
            }
          }
        },
        averageProgressPercentage: {
          $cond: [
            { $gt: [{ $size: '$enrollments' }, 0] },
            { $round: [{ $avg: '$enrollments.progressPercentage' }, 2] },
            0
          ]
        }
      }
    },
    {
      $project: {
        departmentId: 1,
        departmentName: 1,
        employeeCount: 1,
        enrollmentCount: 1,
        completedEnrollments: 1,
        inProgressEnrollments: 1,
        averageProgressPercentage: 1,
        completionRate: {
          $cond: [
            { $gt: ['$enrollmentCount', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$completedEnrollments', '$enrollmentCount'] },
                    100
                  ]
                },
                2
              ]
            },
            100
          ]
        }
      }
    },
    { $sort: { departmentName: 1, departmentId: 1 } }
  ]);

  return {
    totalEnrollments: total,
    enrolled: sum.enrolled,
    inProgress: sum.inProgress,
    completed: sum.completed,
    dropped: sum.dropped,
    completionRate,
    averageProgressPercentage: round2(sum.avgProgress),
    averageCompletionTimeDays: avgCompletionTime,
    courseBreakdown: courseBreakdownAgg,
    departmentBreakdown: departmentBreakdownAgg
  };
}

/**
 * 3. GET /api/analytics/assessments
 * Assessment attempts, pass rates, min/max percentages, and breakdown.
 */
async function getAssessmentAnalytics(filters = {}) {
  const match = { result: { $in: ['passed', 'failed'] } };

  const dateMatch = buildDateMatch('submittedAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  if (dateMatch.submittedAt) {
    match.submittedAt = dateMatch.submittedAt;
  }

  if (filters.courseId) {
    const assessmentIds = await Assessment.find({
      course: new mongoose.Types.ObjectId(filters.courseId),
      isActive: true
    }).distinct('_id');
    match.assessment = { $in: assessmentIds };
  }

  if (filters.departmentId) {
    const empIds = await getEmployeeIdsForDepartment(filters.departmentId);
    match.employee = { $in: empIds };
  }

  const [totalAttemptsCount, summaryAgg, uniqueEmployeesAgg] = await Promise.all([
    AssessmentAttempt.countDocuments(
      filters.courseId || filters.departmentId
        ? match
        : dateMatch.submittedAt ? { submittedAt: dateMatch.submittedAt } : {}
    ),

    AssessmentAttempt.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          submittedAttempts: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ['$result', 'passed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$result', 'failed'] }, 1, 0] } },
          averagePercentage: { $avg: '$percentage' },
          highestPercentage: { $max: '$percentage' },
          lowestPercentage: { $min: '$percentage' }
        }
      }
    ]),

    AssessmentAttempt.find(match).distinct('employee')
  ]);

  const sum = summaryAgg[0] || {
    submittedAttempts: 0,
    passed: 0,
    failed: 0,
    averagePercentage: 0,
    highestPercentage: 0,
    lowestPercentage: 0
  };

  const submittedAttempts = sum.submittedAttempts;
  const passRate =
    submittedAttempts > 0 ? round2((sum.passed / submittedAttempts) * 100) : 100;
  const uniqueEmployeesCount = uniqueEmployeesAgg.length;
  const avgAttemptsPerEmp =
    uniqueEmployeesCount > 0 ? round2(submittedAttempts / uniqueEmployeesCount) : 0;

  // Assessment Breakdown
  const assessmentBreakdownAgg = await Assessment.aggregate([
    { $match: { isActive: true, status: { $ne: 'archived' } } },
    {
      $lookup: {
        from: 'assessmentattempts',
        let: { assessId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$assessment', '$$assessId'] },
                  { $in: ['$result', ['passed', 'failed']] }
                ]
              }
            }
          }
        ],
        as: 'attempts'
      }
    },
    {
      $project: {
        assessmentId: '$_id',
        title: 1,
        courseId: '$course',
        attemptCount: { $size: '$attempts' },
        uniqueEmployees: {
          $size: { $setUnion: '$attempts.employee' }
        },
        passed: {
          $size: {
            $filter: {
              input: '$attempts',
              as: 'a',
              cond: { $eq: ['$$a.result', 'passed'] }
            }
          }
        },
        failed: {
          $size: {
            $filter: {
              input: '$attempts',
              as: 'a',
              cond: { $eq: ['$$a.result', 'failed'] }
            }
          }
        },
        averagePercentage: {
          $cond: [
            { $gt: [{ $size: '$attempts' }, 0] },
            { $round: [{ $avg: '$attempts.percentage' }, 2] },
            0
          ]
        },
        highestPercentage: {
          $cond: [
            { $gt: [{ $size: '$attempts' }, 0] },
            { $round: [{ $max: '$attempts.percentage' }, 2] },
            0
          ]
        },
        lowestPercentage: {
          $cond: [
            { $gt: [{ $size: '$attempts' }, 0] },
            { $round: [{ $min: '$attempts.percentage' }, 2] },
            0
          ]
        }
      }
    },
    {
      $project: {
        assessmentId: 1,
        title: 1,
        courseId: 1,
        attemptCount: 1,
        uniqueEmployees: 1,
        passed: 1,
        failed: 1,
        passRate: {
          $cond: [
            { $gt: ['$attemptCount', 0] },
            {
              $round: [{ $multiply: [{ $divide: ['$passed', '$attemptCount'] }, 100] }, 2]
            },
            100
          ]
        },
        averagePercentage: 1,
        highestPercentage: 1,
        lowestPercentage: 1
      }
    },
    { $sort: { title: 1, assessmentId: 1 } }
  ]);

  return {
    totalAttempts: totalAttemptsCount || submittedAttempts,
    submittedAttempts,
    passed: sum.passed,
    failed: sum.failed,
    passRate,
    averagePercentage: round2(sum.averagePercentage),
    highestPercentage: round2(sum.highestPercentage),
    lowestPercentage: round2(sum.lowestPercentage),
    averageAttemptsPerEmployee: avgAttemptsPerEmp,
    assessmentBreakdown: assessmentBreakdownAgg
  };
}

/**
 * 4. GET /api/analytics/compliance
 * Compliance metrics, requirement breakdown, and department breakdown.
 */
async function getComplianceAnalytics(filters = {}) {
  const match = { isActive: true };

  const dateMatch = buildDateMatch('assignedAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  if (dateMatch.assignedAt) {
    match.assignedAt = dateMatch.assignedAt;
  }

  if (filters.requirementId) {
    match.complianceRequirement = new mongoose.Types.ObjectId(filters.requirementId);
  }

  if (filters.status) {
    match.status = filters.status;
  }

  if (filters.departmentId) {
    const empIds = await getEmployeeIdsForDepartment(filters.departmentId);
    match.employee = { $in: empIds };
  }

  const [summaryAgg, byRequirementAgg, byDepartmentAgg] = await Promise.all([
    ComplianceAssignment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          compliant: { $sum: { $cond: [{ $eq: ['$status', 'COMPLIANT'] }, 1, 0] } },
          dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'DUE_SOON'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'NOT_STARTED'] }, 1, 0] } }
        }
      }
    ]),

    ComplianceAssignment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$complianceRequirement',
          assignedEmployees: { $sum: 1 },
          compliant: { $sum: { $cond: [{ $eq: ['$status', 'COMPLIANT'] }, 1, 0] } },
          dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'DUE_SOON'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'NOT_STARTED'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'compliancerequirements',
          localField: '_id',
          foreignField: '_id',
          as: 'req'
        }
      },
      { $unwind: '$req' },
      {
        $project: {
          requirementId: '$_id',
          title: '$req.title',
          courseId: '$req.course',
          assignedEmployees: 1,
          compliant: 1,
          dueSoon: 1,
          overdue: 1,
          inProgress: 1,
          notStarted: 1,
          complianceRate: {
            $cond: [
              { $gt: ['$assignedEmployees', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$compliant', '$assignedEmployees'] }, 100] },
                  2
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { title: 1, requirementId: 1 } }
    ]),

    ComplianceAssignment.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $group: {
          _id: '$emp.department',
          assignedEmployees: { $sum: 1 },
          compliant: { $sum: { $cond: [{ $eq: ['$status', 'COMPLIANT'] }, 1, 0] } },
          dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'DUE_SOON'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'OVERDUE'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'NOT_STARTED'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      {
        $project: {
          departmentId: '$_id',
          departmentName: '$dept.name',
          assignedEmployees: 1,
          compliant: 1,
          dueSoon: 1,
          overdue: 1,
          inProgress: 1,
          notStarted: 1,
          complianceRate: {
            $cond: [
              { $gt: ['$assignedEmployees', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$compliant', '$assignedEmployees'] }, 100] },
                  2
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { departmentName: 1, departmentId: 1 } }
    ])
  ]);

  const sum = summaryAgg[0] || {
    totalAssignments: 0,
    compliant: 0,
    dueSoon: 0,
    overdue: 0,
    inProgress: 0,
    notStarted: 0
  };

  const total = sum.totalAssignments;
  const complianceRate = total > 0 ? round2((sum.compliant / total) * 100) : 100;

  return {
    totalAssignments: total,
    compliant: sum.compliant,
    dueSoon: sum.dueSoon,
    overdue: sum.overdue,
    inProgress: sum.inProgress,
    notStarted: sum.notStarted,
    complianceRate,
    requirementBreakdown: byRequirementAgg,
    departmentBreakdown: byDepartmentAgg
  };
}

/**
 * 5. GET /api/analytics/certifications
 * Certificate issuance, active, expired, revoked, expiring soon, renewals.
 */
async function getCertificationAnalytics(filters = {}) {
  const match = {};

  const dateMatch = buildDateMatch('issuedAt', filters.from, filters.to, filters.fromNormalized, filters.toNormalized);
  if (dateMatch.issuedAt) {
    match.issuedAt = dateMatch.issuedAt;
  }

  if (filters.courseId) {
    match.course = new mongoose.Types.ObjectId(filters.courseId);
  }

  if (filters.departmentId) {
    const empIds = await getEmployeeIdsForDepartment(filters.departmentId);
    match.employee = { $in: empIds };
  }

  const now = new Date();
  const renewalWindowDays = config.certificateRenewalWindowDays || 30;
  const renewalThresholdDate = new Date(now.getTime() + renewalWindowDays * 86400000);

  if (filters.status) {
    if (filters.status === 'revoked') {
      match.status = 'revoked';
    } else if (filters.status === 'expired') {
      match.status = 'active';
      match.expiresAt = { $ne: null, $lte: now };
    } else if (filters.status === 'active') {
      match.status = 'active';
      match.$or = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
    }
  }

  const [summaryAgg, byCourseAgg] = await Promise.all([
    Certificate.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalIssued: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', now] }] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$expiresAt', null] },
                    { $lte: ['$expiresAt', now] }
                  ]
                },
                1,
                0
              ]
            }
          },
          revoked: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } },
          expiringSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$expiresAt', null] },
                    { $gt: ['$expiresAt', now] },
                    { $lte: ['$expiresAt', renewalThresholdDate] }
                  ]
                },
                1,
                0
              ]
            }
          },
          renewed: { $sum: { $cond: [{ $ne: ['$renewedFrom', null] }, 1, 0] } }
        }
      }
    ]),

    Certificate.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$course',
          totalIssued: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', now] }] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$expiresAt', null] },
                    { $lte: ['$expiresAt', now] }
                  ]
                },
                1,
                0
              ]
            }
          },
          revoked: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } },
          renewed: { $sum: { $cond: [{ $ne: ['$renewedFrom', null] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          courseId: '$_id',
          courseTitle: '$course.title',
          totalIssued: 1,
          active: 1,
          expired: 1,
          revoked: 1,
          renewed: 1
        }
      },
      { $sort: { courseTitle: 1, courseId: 1 } }
    ])
  ]);

  const sum = summaryAgg[0] || {
    totalIssued: 0,
    active: 0,
    expired: 0,
    revoked: 0,
    expiringSoon: 0,
    renewed: 0
  };

  const renewalRate =
    sum.totalIssued > 0 ? round2((sum.renewed / sum.totalIssued) * 100) : 0;

  return {
    totalIssued: sum.totalIssued,
    active: sum.active,
    expired: sum.expired,
    revoked: sum.revoked,
    expiringSoon: sum.expiringSoon,
    renewed: sum.renewed,
    renewalRate,
    courseBreakdown: byCourseAgg
  };
}

/**
 * 6. GET /api/analytics/employees
 * Employee counts, participation, certificates, compliance gaps, and department breakdown.
 */
async function getEmployeeAnalytics(filters = {}) {
  const match = {};
  if (filters.departmentId) {
    match.department = new mongoose.Types.ObjectId(filters.departmentId);
  }

  const [totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
    Employee.countDocuments(match),
    Employee.countDocuments({ ...match, isActive: true }),
    Employee.countDocuments({ ...match, isActive: false })
  ]);

  const activeEmployeeIds = await Employee.find({ ...match, isActive: true }).distinct('_id');

  const [
    employeesWithEnrollments,
    employeesWithCompletedCourses,
    employeesWithCertificates,
    employeesWithComplianceGaps,
    deptBreakdown
  ] = await Promise.all([
    // Active employees with at least one active enrollment
    Enrollment.find({
      employee: { $in: activeEmployeeIds },
      isActive: true
    })
      .distinct('employee')
      .then((res) => res.length),

    // Active employees with at least one completed enrollment
    Enrollment.find({
      employee: { $in: activeEmployeeIds },
      status: 'completed',
      isActive: true
    })
      .distinct('employee')
      .then((res) => res.length),

    // Active employees with at least one active certificate
    Certificate.find({
      employee: { $in: activeEmployeeIds },
      status: 'active',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    })
      .distinct('employee')
      .then((res) => res.length),

    // Active employees with compliance gaps (status OVERDUE)
    ComplianceAssignment.find({
      employee: { $in: activeEmployeeIds },
      status: 'OVERDUE',
      isActive: true
    })
      .distinct('employee')
      .then((res) => res.length),

    // Department breakdown
    Employee.aggregate([
      ...(filters.departmentId ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$department',
          totalEmployees: { $sum: 1 },
          activeEmployees: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          inactiveEmployees: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          departmentId: '$_id',
          departmentName: '$dept.name',
          totalEmployees: 1,
          activeEmployees: 1,
          inactiveEmployees: 1
        }
      },
      { $sort: { departmentName: 1, departmentId: 1 } }
    ])
  ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    employeesWithEnrollments,
    employeesWithCompletedCourses,
    employeesWithCertificates,
    employeesWithComplianceGaps,
    departmentBreakdown: deptBreakdown
  };
}

/**
 * 7. GET /api/analytics/departments
 * Department-by-department comparative metrics with pagination.
 */
async function getDepartmentAnalytics(filters = {}) {
  const match = { isActive: true };
  if (filters.departmentId) {
    match._id = new mongoose.Types.ObjectId(filters.departmentId);
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const totalDepartments = await Department.countDocuments(match);
  const departments = await Department.find(match)
    .sort({ name: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const departmentData = await Promise.all(
    departments.map(async (dept) => {
      const [allEmps, activeEmps] = await Promise.all([
        Employee.find({ department: dept._id }).select('_id isActive'),
        Employee.find({ department: dept._id, isActive: true }).distinct('_id')
      ]);

      const employeeCount = allEmps.length;
      const activeEmployeeCount = activeEmps.length;

      const [enrollmentAgg, attemptAgg, complianceAgg] = await Promise.all([
        Enrollment.aggregate([
          { $match: { employee: { $in: activeEmps }, isActive: true } },
          {
            $group: {
              _id: null,
              enrollmentCount: { $sum: 1 },
              completionCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              avgProgress: { $avg: '$progressPercentage' }
            }
          }
        ]),

        AssessmentAttempt.aggregate([
          { $match: { employee: { $in: activeEmps }, result: { $in: ['passed', 'failed'] } } },
          {
            $group: {
              _id: null,
              attempts: { $sum: 1 },
              passed: { $sum: { $cond: [{ $eq: ['$result', 'passed'] }, 1, 0] } }
            }
          }
        ]),

        ComplianceAssignment.aggregate([
          { $match: { employee: { $in: activeEmps }, isActive: true } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              compliant: { $sum: { $cond: [{ $eq: ['$status', 'COMPLIANT'] }, 1, 0] } }
            }
          }
        ])
      ]);

      const enr = enrollmentAgg[0] || { enrollmentCount: 0, completionCount: 0, avgProgress: 0 };
      const att = attemptAgg[0] || { attempts: 0, passed: 0 };
      const comp = complianceAgg[0] || { total: 0, compliant: 0 };

      const assessmentPassRate =
        att.attempts > 0 ? round2((att.passed / att.attempts) * 100) : 100;
      const complianceRate =
        comp.total > 0 ? round2((comp.compliant / comp.total) * 100) : 100;

      return {
        departmentId: dept._id.toString(),
        departmentName: dept.name,
        employeeCount,
        activeEmployeeCount,
        enrollmentCount: enr.enrollmentCount,
        completionCount: enr.completionCount,
        averageProgressPercentage: round2(enr.avgProgress),
        assessmentAttempts: att.attempts,
        assessmentPassRate,
        complianceAssignments: comp.total,
        compliantAssignments: comp.compliant,
        complianceRate
      };
    })
  );

  return {
    departments: departmentData,
    pagination: {
      page,
      limit,
      total: totalDepartments,
      pages: Math.ceil(totalDepartments / limit) || 1
    }
  };
}

/**
 * 8. GET /api/analytics/courses
 * Course performance, engagement, completions, assessments, certificates, compliance.
 */
async function getCourseAnalytics(filters = {}) {
  const match = { isActive: true };

  if (filters.courseId) {
    match._id = new mongoose.Types.ObjectId(filters.courseId);
  }

  if (filters.status) {
    match.status = filters.status;
  }

  if (filters.level) {
    match.level = filters.level;
  }

  if (filters.category) {
    match.category = new RegExp(`^${filters.category}$`, 'i');
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const totalCourses = await Course.countDocuments(match);
  const courses = await Course.find(match)
    .sort({ title: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const courseData = await Promise.all(
    courses.map(async (course) => {
      const courseId = course._id;

      const [enrollmentAgg, assessmentIds, certCount, complianceCount] = await Promise.all([
        Enrollment.aggregate([
          { $match: { course: courseId, isActive: true } },
          {
            $group: {
              _id: null,
              enrollmentCount: { $sum: 1 },
              completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              avgProgress: { $avg: '$progressPercentage' }
            }
          }
        ]),

        Assessment.find({ course: courseId, isActive: true }).distinct('_id'),

        Certificate.countDocuments({ course: courseId }),

        // Compliance requirements linking to this course
        ComplianceRequirement.find({ course: courseId, isActive: true })
          .distinct('_id')
          .then((reqIds) =>
            ComplianceAssignment.countDocuments({
              complianceRequirement: { $in: reqIds },
              isActive: true
            })
          )
      ]);

      const enr = enrollmentAgg[0] || {
        enrollmentCount: 0,
        completedCount: 0,
        avgProgress: 0
      };

      let attemptStats = { attempts: 0, passed: 0 };
      if (assessmentIds.length > 0) {
        const attAgg = await AssessmentAttempt.aggregate([
          { $match: { assessment: { $in: assessmentIds }, result: { $in: ['passed', 'failed'] } } },
          {
            $group: {
              _id: null,
              attempts: { $sum: 1 },
              passed: { $sum: { $cond: [{ $eq: ['$result', 'passed'] }, 1, 0] } }
            }
          }
        ]);
        if (attAgg[0]) {
          attemptStats = attAgg[0];
        }
      }

      const completionRate =
        enr.enrollmentCount > 0 ? round2((enr.completedCount / enr.enrollmentCount) * 100) : 100;
      const passRate =
        attemptStats.attempts > 0
          ? round2((attemptStats.passed / attemptStats.attempts) * 100)
          : 100;

      return {
        courseId: courseId.toString(),
        title: course.title,
        status: course.status,
        enrollmentCount: enr.enrollmentCount,
        completedCount: enr.completedCount,
        averageProgressPercentage: round2(enr.avgProgress),
        completionRate,
        assessmentAttempts: attemptStats.attempts,
        assessmentPassRate: passRate,
        certificateCount: certCount,
        complianceAssignmentCount: complianceCount
      };
    })
  );

  return {
    courses: courseData,
    pagination: {
      page,
      limit,
      total: totalCourses,
      pages: Math.ceil(totalCourses / limit) || 1
    }
  };
}

module.exports = {
  getOverviewAnalytics,
  getLearningAnalytics,
  getAssessmentAnalytics,
  getComplianceAnalytics,
  getCertificationAnalytics,
  getEmployeeAnalytics,
  getDepartmentAnalytics,
  getCourseAnalytics
};
