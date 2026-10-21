import React from 'react';
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import Badge from '../ui/Badge';

export const MultipleChoiceQuestion = ({
  question,
  selectedAnswers = [],
  onToggleAnswer,
  questionNumber = 1,
}) => {
  if (!question) return null;

  const { id, questionText, options = [], marks = 1 } = question;

  const handleCheckboxChange = (key) => {
    onToggleAnswer(key);
  };

  return (
    <fieldset
      className="space-y-6"
      data-testid={`multiple-choice-question-${id}`}
    >
      <legend className="sr-only">
        Question {questionNumber}: {questionText}
      </legend>

      {/* Question Header & Prompt */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="primary" size="md">
            Question {questionNumber}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Multiple Choice
            </span>
            <Badge variant="default" size="sm">
              {marks} {marks === 1 ? 'Mark' : 'Marks'}
            </Badge>
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-[#102A2A] leading-relaxed">
          {questionText}
        </h3>
        <p className="text-xs text-teal-700 font-medium">
          Select all that apply. Multiple options may be correct.
        </p>
      </div>

      {/* Options Checkbox List */}
      <div className="space-y-3" role="group" aria-label={`Options for Question ${questionNumber}`}>
        {options.map((option) => {
          const isSelected = selectedAnswers.includes(option.key);
          const inputId = `question-${id}-option-${option.key}`;

          return (
            <label
              key={option.key}
              htmlFor={inputId}
              className={`flex items-start gap-3.5 p-4 sm:p-4.5 rounded-2xl border cursor-pointer transition-all duration-150 select-none ${
                isSelected
                  ? 'border-teal-700 bg-teal-50/70 shadow-sm ring-1 ring-teal-700'
                  : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                id={inputId}
                name={`question-${id}-${option.key}`}
                value={option.key}
                checked={isSelected}
                onChange={() => handleCheckboxChange(option.key)}
                className="sr-only"
              />

              {/* Option Key Badge Indicator */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                aria-hidden="true"
              >
                {option.key}
              </div>

              {/* Option Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <span className={`text-sm sm:text-base leading-relaxed ${
                  isSelected ? 'font-medium text-[#102A2A]' : 'text-slate-700'
                }`}>
                  {option.text}
                </span>
              </div>

              {/* Visual Checkbox Square */}
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-300 bg-white text-transparent'
                }`}
                aria-hidden="true"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

MultipleChoiceQuestion.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    questionText: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
      })
    ).isRequired,
    marks: PropTypes.number,
  }).isRequired,
  selectedAnswers: PropTypes.arrayOf(PropTypes.string),
  onToggleAnswer: PropTypes.func.isRequired,
  questionNumber: PropTypes.number,
};

export default MultipleChoiceQuestion;
