import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SingleChoiceQuestion from '../SingleChoiceQuestion';
import MultipleChoiceQuestion from '../MultipleChoiceQuestion';
import QuestionNavigator from '../QuestionNavigator';
import AssessmentTimer, { formatTime } from '../AssessmentTimer';
import AssessmentReview from '../AssessmentReview';
import ResultSummary from '../ResultSummary';

describe('Assessment UI Components & Accessibility', () => {
  describe('formatTime utility', () => {
    it('formats seconds correctly into MM:SS and HH:MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(3665)).toBe('01:01:05');
      expect(formatTime(-10)).toBe('00:00');
    });
  });

  describe('SingleChoiceQuestion Accessibility', () => {
    const mockQuestion = {
      id: 'q1',
      questionText: 'What is JSX?',
      options: [
        { key: 'A', text: 'JavaScript XML' },
        { key: 'B', text: 'Java Syntax Extension' },
      ],
      marks: 2,
    };

    it('renders with accessible fieldset and radiogroup semantics', () => {
      const handleSelect = vi.fn();
      render(
        <SingleChoiceQuestion
          question={mockQuestion}
          selectedAnswer="A"
          onSelectAnswer={handleSelect}
          questionNumber={1}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      const radioA = screen.getByRole('radio', { name: /JavaScript XML/i });
      expect(radioA).toBeChecked();

      const radioB = screen.getByRole('radio', { name: /Java Syntax Extension/i });
      expect(radioB).not.toBeChecked();

      fireEvent.click(radioB);
      expect(handleSelect).toHaveBeenCalledWith('B');
    });
  });

  describe('MultipleChoiceQuestion Accessibility', () => {
    const mockQuestion = {
      id: 'q2',
      questionText: 'Select valid HTTP methods',
      options: [
        { key: 'A', text: 'GET' },
        { key: 'B', text: 'POST' },
        { key: 'C', text: 'SEND' },
      ],
      marks: 3,
    };

    it('renders accessible checkboxes with keyboard toggle', () => {
      const handleToggle = vi.fn();
      render(
        <MultipleChoiceQuestion
          question={mockQuestion}
          selectedAnswers={['A']}
          onToggleAnswer={handleToggle}
          questionNumber={2}
        />
      );

      const checkboxA = screen.getByRole('checkbox', { name: /GET/i });
      const checkboxB = screen.getByRole('checkbox', { name: /POST/i });

      expect(checkboxA).toBeChecked();
      expect(checkboxB).not.toBeChecked();

      fireEvent.click(checkboxB);
      expect(handleToggle).toHaveBeenCalledWith('B');
    });
  });

  describe('QuestionNavigator Accessibility', () => {
    const mockQuestions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];
    const mockAnswers = { q1: ['A'] };

    it('provides accessible aria-labels and indicators for question states', () => {
      const handleSelect = vi.fn();
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onSelectIndex={handleSelect}
        />
      );

      const q1Btn = screen.getByRole('button', { name: /Question 1: Answered, Current Question/i });
      const q2Btn = screen.getByRole('button', { name: /Question 2: Unanswered/i });

      expect(q1Btn).toHaveAttribute('aria-current', 'true');
      expect(q2Btn).not.toHaveAttribute('aria-current');

      fireEvent.click(q2Btn);
      expect(handleSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('AssessmentTimer Accessibility', () => {
    it('renders with role="timer" and accessible time label', () => {
      render(<AssessmentTimer initialSeconds={180} onTimeUp={vi.fn()} />);

      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute('aria-label', 'Time remaining: 03:00');
    });
  });

  describe('AssessmentReview Modal Accessibility', () => {
    const mockQuestions = [{ id: 'q1' }, { id: 'q2' }];
    const mockAnswers = { q1: ['A'] };

    it('renders modal with review summary and confirm controls', () => {
      const handleSubmit = vi.fn();
      const handleJump = vi.fn();
      render(
        <AssessmentReview
          isOpen={true}
          onClose={vi.fn()}
          questions={mockQuestions}
          answers={mockAnswers}
          onSubmit={handleSubmit}
          onJumpToQuestion={handleJump}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Review Assessment Before Submission/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm & submit/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /confirm & submit/i }));
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('ResultSummary Accessibility & Visual Hierarchy', () => {
    const mockResult = {
      obtainedMarks: 16,
      totalMarks: 20,
      percentage: 80,
      result: 'passed',
      assessment: {
        title: 'Security Architecture',
        passingPercentage: 70,
        course: { id: 'c1', title: 'Cybersecurity' },
      },
    };

    it('renders screen-reader friendly result status and score metrics', () => {
      render(
        <MemoryRouter>
          <ResultSummary resultData={mockResult} />
        </MemoryRouter>
      );

      expect(screen.getByText('Assessment Passed')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('/ 20')).toBeInTheDocument();
    });
  });
});
