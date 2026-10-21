import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  Award,
  PlayCircle,
  ArrowRight,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import ComplianceStatusBadge from './ComplianceStatusBadge';

const FREQUENCY_LABELS = {
  one_time: 'One-Time Requirement',
  annual: 'Annual Certification',
  biennial: 'Biennial Certification',
};

export const ComplianceRequirementCard = ({ assignment, className = '' }) => {
  if (!assignment) return null;

  const {
    dueAt,
    completedAt,
    status = 'NOT_STARTED',
    daysRemaining,
    enrollmentStatus = 'not_enrolled',
    certificationStatus = 'none',
  } = assignment;

  const req = assignment.complianceRequirement || assignment.requirement || {};
  const course = req.course || assignment.course || {};

  const reqTitle = req.title || 'Compliance Requirement';
  const reqDesc = req.description || '';
  const frequency = req.frequency || 'annual';
  const frequencyLabel = FREQUENCY_LABELS[frequency] || 'Mandatory Policy';

  const courseId = course._id || course.id;
  const courseTitle = course.title || 'Required Training Course';
  const courseCode = course.code;

  // Format dates
  const formatIsoDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formattedDueDate = formatIsoDate(dueAt);
  const formattedCompletedDate = formatIsoDate(completedAt);

  const isCompliant = status === 'COMPLIANT';
  const isEnrolledOrInProgress = enrollmentStatus === 'in_progress' || enrollmentStatus === 'enrolled';

  return (
    <div
      data-testid="compliance-card"
      data-status={status}
      className={`bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Top Header: Frequency & Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <Repeat className="w-3 h-3 text-slate-400" />
            <span>{frequencyLabel}</span>
          </span>

          <ComplianceStatusBadge
            status={status}
            daysRemaining={daysRemaining}
            size="sm"
          />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#102A2A] mb-1 leading-snug">
          {reqTitle}
        </h3>

        {/* Description */}
        {reqDesc && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {reqDesc}
          </p>
        )}

        {/* Associated Course Box */}
        {courseId && (
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-100 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>Mandatory Curriculum</span>
              {courseCode && (
                <span className="text-[10px] text-slate-400 font-mono">
                  [{courseCode}]
                </span>
              )}
            </div>
            <Link
              to={`/courses/${courseId}`}
              className="text-xs font-semibold text-slate-800 hover:text-teal-700 transition-colors line-clamp-1"
            >
              {courseTitle}
            </Link>
          </div>
        )}

        {/* Dates & Certification Details */}
        <div className="space-y-2 mb-4 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Deadline</span>
            </span>
            <span className={`font-semibold ${status === 'OVERDUE' ? 'text-rose-600' : 'text-slate-800'}`}>
              {formattedDueDate || 'Immediate'}
            </span>
          </div>

          {formattedCompletedDate && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed</span>
              </span>
              <span className="font-semibold text-slate-800">
                {formattedCompletedDate}
              </span>
            </div>
          )}

          {certificationStatus && certificationStatus !== 'none' && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Certificate Status</span>
              </span>
              <span
                className={`font-semibold capitalize ${
                  certificationStatus === 'active'
                    ? 'text-emerald-600'
                    : certificationStatus === 'expired'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {certificationStatus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {isCompliant ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fulfilled</span>
            </span>
            {certificationStatus === 'active' ? (
              <Link
                to="/certificates"
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 py-1 px-2.5 rounded-xl hover:bg-teal-50 transition"
              >
                <span>View Certificate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : courseId ? (
              <Link
                to={`/courses/${courseId}`}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Review Materials
              </Link>
            ) : null}
          </>
        ) : isEnrolledOrInProgress && courseId ? (
          <>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              {enrollmentStatus === 'in_progress' ? 'In Progress' : 'Enrolled'}
            </span>
            <Link
              to={`/learn/${courseId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition shadow-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{enrollmentStatus === 'in_progress' ? 'Continue Learning' : 'Start Course'}</span>
            </Link>
          </>
        ) : courseId ? (
          <>
            <span className="text-xs text-slate-400">Not enrolled</span>
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
            >
              <span>Start Required Training</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        ) : (
          <span className="text-xs text-slate-400 italic">No course attached</span>
        )}
      </div>
    </div>
  );
};

ComplianceRequirementCard.propTypes = {
  assignment: PropTypes.shape({
    _id: PropTypes.string,
    dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    completedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
    daysRemaining: PropTypes.number,
    enrollmentStatus: PropTypes.string,
    certificationStatus: PropTypes.string,
    complianceRequirement: PropTypes.object,
    requirement: PropTypes.object,
    course: PropTypes.object,
  }),
  className: PropTypes.string,
};

export default ComplianceRequirementCard;
