import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export const AssessmentReview = ({
  isOpen,
  onClose,
  questions = [],
  answers = {},
  onSubmit,
  onJumpToQuestion,
  isSubmitting = false,
}) => {
  const totalQuestions = questions.length;
  const unansweredIndices = [];

  questions.forEach((q, idx) => {
    const selected = answers[q.id];
    if (!Array.isArray(selected) || selected.length === 0) {
      unansweredIndices.push(idx);
    }
  });

  const answeredCount = totalQuestions - unansweredIndices.length;
  const hasUnanswered = unansweredIndices.length > 0;

  const handleJump = (idx) => {
    onJumpToQuestion(idx);
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button
        variant="outline"
        size="md"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Continue Review
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={onSubmit}
        isLoading={isSubmitting}
        leftIcon={<CheckCircle2 className="w-4 h-4" />}
        className="bg-teal-700 hover:bg-teal-800"
      >
        Confirm & Submit
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Assessment Before Submission"
      description="Review your question progress before submitting your assessment for grading."
      footer={footer}
      size="md"
    >
      <div className="space-y-5" data-testid="assessment-review-modal">
        {/* Progress Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-900">{answeredCount}</p>
              <p className="text-xs text-emerald-700 font-medium">Questions Answered</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            hasUnanswered
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`p-2 rounded-lg ${
              hasUnanswered
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xl font-bold ${
                hasUnanswered ? 'text-amber-900' : 'text-slate-800'
              }`}>
                {unansweredIndices.length}
              </p>
              <p className={`text-xs font-medium ${
                hasUnanswered ? 'text-amber-700' : 'text-slate-500'
              }`}>
                Unanswered
              </p>
            </div>
          </div>
        </div>

        {/* Unanswered Notice & Quick Jump */}
        {hasUnanswered ? (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                You have {unansweredIndices.length} unanswered {unansweredIndices.length === 1 ? 'question' : 'questions'}. Click below to jump directly to any unanswered question:
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {unansweredIndices.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJump(idx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100/70 transition-colors"
                >
                  <span>Question {idx + 1}</span>
                  <ArrowRight className="w-3 h-3 text-amber-600" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All {totalQuestions} questions have been answered. You are ready to submit!</span>
          </div>
        )}

        {/* Irreversible Submission Policy Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">
            Important Notice
          </p>
          <p>
            Once submitted, your answers will be automatically graded by the server. This attempt cannot be resumed or modified.
          </p>
        </div>
      </div>
    </Modal>
  );
};

AssessmentReview.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  questions: PropTypes.array.isRequired,
  answers: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onJumpToQuestion: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export default AssessmentReview;
