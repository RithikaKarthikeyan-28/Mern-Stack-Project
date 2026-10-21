import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const AssessmentCard = ({
  assessment,
  latestAttempt = null,
  totalAttemptsUsed = 0,
}) => {
  if (!assessment) return null;

  const assessmentId = assessment._id || assessment.id;
  const courseTitle = assessment.course?.title || assessment.courseTitle || 'Course';
  const passingPercentage = assessment.passingPercentage ?? 60;
  const timeLimitMinutes = assessment.timeLimitMinutes;
  const maxAttempts = assessment.maxAttempts;

  const isPassed = latestAttempt?.result === 'passed';
  const hasAttempted = latestAttempt != null;

  const maxAttemptsReached = maxAttempts != null && totalAttemptsUsed >= maxAttempts;

  return (
    <Card hover className="flex flex-col justify-between h-full border-slate-200/90" data-testid={`assessment-card-${assessmentId}`}>
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <Badge variant="primary" size="sm" className="font-semibold">
            {courseTitle}
          </Badge>

          {hasAttempted ? (
            <Badge
              variant={isPassed ? 'success' : 'danger'}
              size="sm"
              className="font-medium"
            >
              {isPassed ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Passed ({latestAttempt.percentage}%)
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Failed ({latestAttempt.percentage}%)
                </span>
              )}
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Not Attempted
            </Badge>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
          {assessment.title}
        </h3>
        {assessment.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {assessment.description}
          </p>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Pass Mark
            </span>
            <span className="text-xs font-bold text-slate-800">
              {passingPercentage}%
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Time
            </span>
            <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {timeLimitMinutes ? `${timeLimitMinutes}m` : 'Untimed'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Attempts
            </span>
            <span className="text-xs font-bold text-slate-800">
              {maxAttempts ? `${totalAttemptsUsed}/${maxAttempts}` : 'Unlimited'}
            </span>
          </div>
        </div>
      </div>

      {/* CTA Button Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link to={`/assessments/${assessmentId}`} className="w-full">
          {isPassed ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              <span>View Details</span>
            </Button>
          ) : maxAttemptsReached ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-full justify-center"
            >
              Max Attempts Reached
            </Button>
          ) : hasAttempted ? (
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-between bg-teal-700 hover:bg-teal-800 shadow-sm shadow-teal-700/20"
              rightIcon={<RotateCcw className="w-4 h-4" />}
            >
              <span>Retake Quiz</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-between bg-teal-700 hover:bg-teal-800 shadow-sm shadow-teal-700/20"
              rightIcon={<FileCheck className="w-4 h-4" />}
            >
              <span>Start Assessment</span>
            </Button>
          )}
        </Link>
      </div>
    </Card>
  );
};

AssessmentCard.propTypes = {
  assessment: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    course: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    courseTitle: PropTypes.string,
    passingPercentage: PropTypes.number,
    timeLimitMinutes: PropTypes.number,
    maxAttempts: PropTypes.number,
  }).isRequired,
  latestAttempt: PropTypes.shape({
    result: PropTypes.string,
    percentage: PropTypes.number,
  }),
  totalAttemptsUsed: PropTypes.number,
};

export default AssessmentCard;
