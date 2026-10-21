import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';

export const QuestionCard = ({
  question,
  selectedAnswers = [],
  onSelectSingle,
  onToggleMultiple,
  questionNumber = 1,
  totalQuestions = 1,
  onPrevious,
  onNext,
  onOpenReview,
  isFirst = false,
  isLast = false,
}) => {
  if (!question) return null;

  const isSingle = question.questionType === 'single_choice';

  return (
    <Card className="shadow-sm border-slate-200/90" padding={false}>
      {/* Question Content Area */}
      <div className="p-6 sm:p-8">
        {isSingle ? (
          <SingleChoiceQuestion
            question={question}
            selectedAnswer={selectedAnswers[0] || null}
            onSelectAnswer={onSelectSingle}
            questionNumber={questionNumber}
          />
        ) : (
          <MultipleChoiceQuestion
            question={question}
            selectedAnswers={selectedAnswers}
            onToggleAnswer={onToggleMultiple}
            questionNumber={questionNumber}
          />
        )}
      </div>

      {/* Navigation Controls Footer */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl">
        <Button
          variant="outline"
          size="md"
          onClick={onPrevious}
          disabled={isFirst}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Previous question"
        >
          Previous
        </Button>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Question {questionNumber} of {totalQuestions}
        </div>

        {isLast ? (
          <Button
            variant="primary"
            size="md"
            onClick={onOpenReview}
            rightIcon={<CheckCircle2 className="w-4 h-4" />}
            className="bg-teal-700 hover:bg-teal-800"
          >
            Review & Submit
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            aria-label="Next question"
          >
            Next
          </Button>
        )}
      </div>
    </Card>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    questionText: PropTypes.string.isRequired,
    questionType: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    marks: PropTypes.number,
  }).isRequired,
  selectedAnswers: PropTypes.arrayOf(PropTypes.string),
  onSelectSingle: PropTypes.func.isRequired,
  onToggleMultiple: PropTypes.func.isRequired,
  questionNumber: PropTypes.number,
  totalQuestions: PropTypes.number,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onOpenReview: PropTypes.func.isRequired,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
};

export default QuestionCard;
