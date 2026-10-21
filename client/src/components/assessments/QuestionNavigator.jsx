import React from 'react';
import PropTypes from 'prop-types';
import { Check, Circle } from 'lucide-react';
import Card from '../ui/Card';

export const QuestionNavigator = ({
  questions = [],
  answers = {},
  currentIndex = 0,
  onSelectIndex,
  className = '',
}) => {
  const answeredCount = questions.filter((q) => {
    const selected = answers[q.id];
    return Array.isArray(selected) && selected.length > 0;
  }).length;

  const unansweredCount = questions.length - answeredCount;

  return (
    <Card className={`border-slate-200/90 ${className}`} padding={false}>
      {/* Header with Counters */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-900">
          Question Navigator
        </h4>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {answeredCount} Answered
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            {unansweredCount} Unanswered
          </span>
        </div>
      </div>

      {/* Grid of Question Buttons */}
      <nav aria-label="Questions list" className="p-4 sm:p-5">
        <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const selected = answers[q.id];
            const isAnswered = Array.isArray(selected) && selected.length > 0;

            let buttonStyles = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
            let statusLabel = 'Unanswered';

            if (isAnswered) {
              buttonStyles = 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
              statusLabel = 'Answered';
            }

            if (isCurrent) {
              buttonStyles = 'border-teal-700 bg-teal-700 text-white font-bold ring-2 ring-teal-200/80 hover:bg-teal-800';
              statusLabel += ', Current Question';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectIndex(idx)}
                aria-label={`Question ${idx + 1}: ${statusLabel}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={`relative h-11 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-600 ${buttonStyles}`}
              >
                <span>{idx + 1}</span>
                {isAnswered && !isCurrent && (
                  <Check className="w-3 h-3 text-emerald-600 -mt-0.5 stroke-[3]" aria-hidden="true" />
                )}
                {!isAnswered && !isCurrent && (
                  <Circle className="w-1.5 h-1.5 text-slate-300 fill-slate-300 -mt-0.5" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Legend Footer */}
      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-teal-700 inline-block" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
          <span>Unanswered</span>
        </div>
      </div>
    </Card>
  );
};

QuestionNavigator.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ).isRequired,
  answers: PropTypes.object.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onSelectIndex: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default QuestionNavigator;
