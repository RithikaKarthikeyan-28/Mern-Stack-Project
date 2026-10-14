import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const ResultSummary = ({
  resultData,
  onRetake,
  canRetake = false,
  remainingAttempts = null,
}) => {
  if (!resultData) return null;

  const {
    assessment = {},
    attemptNumber,
    totalMarks = 0,
    obtainedMarks = 0,
    percentage = 0,
    result,
    evaluatedAt,
  } = resultData;

  const isPassed = result === 'passed';
  const passingPercentage = assessment?.passingPercentage ?? 60;
  const courseId = assessment?.course?._id || assessment?.course?.id || assessment?.course;
  const courseTitle = assessment?.course?.title || 'Associated Course';

  const formattedDate = evaluatedAt
    ? new Date(evaluatedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

  return (
    <Card
      className={`border overflow-hidden shadow-md ${
        isPassed ? 'border-emerald-200' : 'border-rose-200'
      }`}
      padding={false}
      data-testid="assessment-result-summary"
    >
      {/* Hero Banner */}
      <div
        className={`p-6 sm:p-8 text-center relative ${
          isPassed
            ? 'bg-linear-to-b from-emerald-500/10 via-emerald-500/5 to-white'
            : 'bg-linear-to-b from-rose-500/10 via-rose-500/5 to-white'
        }`}
      >
        {/* Status Icon */}
        <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 shadow-sm bg-white border border-slate-100">
          {isPassed ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          ) : (
            <XCircle className="w-12 h-12 text-rose-600" />
          )}
        </div>

        {/* Status Headline */}
        <div className="space-y-1.5">
          <Badge
            variant={isPassed ? 'success' : 'danger'}
            size="md"
            className="font-bold text-xs uppercase tracking-wider"
          >
            {isPassed ? 'Assessment Passed' : 'Assessment Not Passed'}
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {isPassed ? 'Congratulations!' : 'Keep Learning'}
          </h2>

          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {isPassed
              ? `You achieved ${percentage}% and exceeded the required ${passingPercentage}% passing threshold.`
              : `You scored ${percentage}%. A minimum score of ${passingPercentage}% is required to pass this assessment.`}
          </p>
        </div>

        {/* Score Metacards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mt-6 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Percentage
            </span>
            <span className={`text-2xl font-black ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
              {percentage}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Marks Obtained
            </span>
            <span className="text-2xl font-black text-slate-900">
              {obtainedMarks} <span className="text-sm text-slate-400 font-normal">/ {totalMarks}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Passing Mark
            </span>
            <span className="text-2xl font-black text-slate-900">
              {passingPercentage}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Attempt #
            </span>
            <span className="text-2xl font-black text-indigo-700">
              {attemptNumber || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">{courseTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Evaluated on {formattedDate}</span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-6 sm:p-8 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          {!isPassed && canRetake && remainingAttempts != null && (
            <p className="text-slate-600 font-medium">
              You have {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
            </p>
          )}
          {!isPassed && !canRetake && (
            <p className="text-rose-600 font-medium">
              Maximum allowed attempts reached for this assessment.
            </p>
          )}
          {isPassed && (
            <p className="text-emerald-700 font-medium flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Assessment complete.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {courseId && (
            <Link to={`/learn/${courseId}`}>
              <Button
                variant={isPassed ? 'primary' : 'outline'}
                size="md"
                leftIcon={<BookOpen className="w-4 h-4" />}
                className={isPassed ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
              >
                {isPassed ? 'Continue Learning' : 'Back to Course'}
              </Button>
            </Link>
          )}

          {!isPassed && canRetake && onRetake && (
            <Button
              variant="primary"
              size="md"
              onClick={onRetake}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Retake Assessment
            </Button>
          )}

          <Link to="/assessments">
            <Button
              variant="ghost"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              All Assessments
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

ResultSummary.propTypes = {
  resultData: PropTypes.shape({
    assessment: PropTypes.object,
    attemptNumber: PropTypes.number,
    totalMarks: PropTypes.number,
    obtainedMarks: PropTypes.number,
    percentage: PropTypes.number,
    result: PropTypes.string,
    evaluatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  onRetake: PropTypes.func,
  canRetake: PropTypes.bool,
  remainingAttempts: PropTypes.number,
};

export default ResultSummary;
