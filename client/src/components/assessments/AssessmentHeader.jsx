import React from 'react';
import PropTypes from 'prop-types';
import { FileCheck, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import AssessmentTimer from './AssessmentTimer';

export const AssessmentHeader = ({
  assessment,
  totalQuestions = 0,
  currentIndex = 0,
  answeredCount = 0,
  timeRemainingSeconds = null,
  onTimeUp,
  onOpenReview,
  isSubmitting = false,
}) => {
  const progressPercent = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Assessment Title & Course Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <FileCheck className="w-4 h-4" />
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#102A2A] truncate">
                {assessment?.title || 'Assessment'}
              </h1>
            </div>
            {assessment?.course?.title && (
              <p className="text-xs text-slate-500 truncate mt-0.5 ml-8">
                {assessment.course.title}
              </p>
            )}
          </div>

          {/* Controls: Timer & Submit Action */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            {timeRemainingSeconds != null && (
              <AssessmentTimer
                initialSeconds={timeRemainingSeconds}
                onTimeUp={onTimeUp}
              />
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenReview}
              isLoading={isSubmitting}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
              className="bg-teal-700 hover:bg-teal-800 font-semibold"
            >
              Review & Submit
            </Button>
          </div>
        </div>

        {/* Progress & Question Counter Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-[#102A2A]">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">
              {answeredCount} answered
            </span>
            {unansweredCount > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700 font-medium">
                  {unansweredCount} unanswered
                </span>
              </>
            )}
          </div>

          <div className="w-36 sm:w-48">
            <ProgressBar
              value={progressPercent}
              max={100}
              size="sm"
              color="teal"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

AssessmentHeader.propTypes = {
  assessment: PropTypes.shape({
    title: PropTypes.string,
    course: PropTypes.shape({
      title: PropTypes.string,
    }),
  }),
  totalQuestions: PropTypes.number,
  currentIndex: PropTypes.number,
  answeredCount: PropTypes.number,
  timeRemainingSeconds: PropTypes.number,
  onTimeUp: PropTypes.func,
  onOpenReview: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export default AssessmentHeader;
