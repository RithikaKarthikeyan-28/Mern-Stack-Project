import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TrainerAssessmentDetailPage from '../TrainerAssessmentDetailPage';
import trainerService from '../../services/trainerService';

vi.mock('../../services/trainerService', () => ({
  default: {
    getAssessmentById: vi.fn(),
    getAssessmentPerformance: vi.fn(),
    getQuestions: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
  },
}));

describe('TrainerAssessmentDetailPage', () => {
  const mockAssessment = {
    _id: 'a-101',
    title: 'Cloud Architecture Final Exam',
    description: 'Comprehensive test of AWS and GCP concepts.',
    course: { _id: 'c-1', title: 'Cloud Mastery' },
    status: 'published',
    passingPercentage: 70,
  };

  const mockPerformance = {
    totalAttempts: 15,
    submittedAttempts: 14,
    passedAttempts: 12,
    failedAttempts: 2,
    averagePercentage: 81.2,
    highestPercentage: 98,
    lowestPercentage: 62,
    passPercentage: 85.7,
  };

  const mockQuestions = [
    {
      _id: 'q-1',
      questionText: 'Which service provides managed Kubernetes in AWS?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Amazon ECS' },
        { key: 'B', text: 'Amazon EKS' },
        { key: 'C', text: 'AWS Lambda' },
        { key: 'D', text: 'Amazon Fargate' },
      ],
      correctAnswers: ['B'],
      marks: 2,
      order: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (assessmentId = 'a-101') =>
    render(
      <MemoryRouter initialEntries={[`/trainer/assessments/${assessmentId}`]}>
        <Routes>
          <Route
            path="/trainer/assessments/:assessmentId"
            element={<TrainerAssessmentDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    );

  it('renders assessment details, authoritative performance card, and questions pool', async () => {
    trainerService.getAssessmentById.mockResolvedValueOnce(mockAssessment);
    trainerService.getAssessmentPerformance.mockResolvedValueOnce(mockPerformance);
    trainerService.getQuestions.mockResolvedValueOnce(mockQuestions);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Cloud Architecture Final Exam').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Authoritative Cohort Performance')).toBeInTheDocument();
      expect(screen.getByText('85.7%')).toBeInTheDocument(); // Pass rate
      expect(
        screen.getByText('Which service provides managed Kubernetes in AWS?')
      ).toBeInTheDocument();
      expect(screen.getByText('Amazon EKS')).toBeInTheDocument();
    });
  });

  it('adds a new question via question modal', async () => {
    trainerService.getAssessmentById.mockResolvedValueOnce(mockAssessment);
    trainerService.getAssessmentPerformance.mockResolvedValueOnce(mockPerformance);
    trainerService.getQuestions.mockResolvedValueOnce(mockQuestions);

    const newQuestion = {
      _id: 'q-2',
      questionText: 'What is the purpose of AWS VPC peering?',
      questionType: 'single_choice',
      options: [
        { key: 'A', text: 'Connect VPCs using private IPs' },
        { key: 'B', text: 'Public internet gateway' },
      ],
      correctAnswers: ['A'],
      marks: 1,
      order: 2,
    };
    trainerService.createQuestion.mockResolvedValueOnce(newQuestion);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Cloud Architecture Final Exam').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /^Add Question$/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Question Prompt \*/i), {
      target: { value: 'What is the purpose of AWS VPC peering?' },
    });

    const inputs = screen.getAllByPlaceholderText(/Option [A-D] description/i);
    fireEvent.change(inputs[0], {
      target: { value: 'Connect VPCs using private IPs' },
    });
    fireEvent.change(inputs[1], {
      target: { value: 'Public internet gateway' },
    });
    fireEvent.change(inputs[2], {
      target: { value: 'DNS routing service' },
    });
    fireEvent.change(inputs[3], {
      target: { value: 'Edge caching location' },
    });

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^Add Question$/i })
    );

    await waitFor(() => {
      expect(trainerService.createQuestion).toHaveBeenCalledWith(
        'a-101',
        expect.objectContaining({
          questionText: 'What is the purpose of AWS VPC peering?',
        })
      );
      expect(
        screen.getByText('What is the purpose of AWS VPC peering?')
      ).toBeInTheDocument();
    });
  });

  it('handles question deletion with confirmation', async () => {
    trainerService.getAssessmentById.mockResolvedValueOnce(mockAssessment);
    trainerService.getAssessmentPerformance.mockResolvedValueOnce(mockPerformance);
    trainerService.getQuestions.mockResolvedValueOnce(mockQuestions);
    trainerService.deleteQuestion.mockResolvedValueOnce({ _id: 'q-1', isActive: false });

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Which service provides managed Kubernetes in AWS?')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Delete question #1/i));

    await waitFor(() => {
      expect(trainerService.deleteQuestion).toHaveBeenCalledWith('a-101', 'q-1');
      expect(
        screen.queryByText('Which service provides managed Kubernetes in AWS?')
      ).not.toBeInTheDocument();
    });
  });

  it('handles ErrorState when assessment fails to load', async () => {
    trainerService.getAssessmentById.mockRejectedValueOnce(
      new Error('Assessment not accessible')
    );
    trainerService.getAssessmentPerformance.mockResolvedValueOnce(null);
    trainerService.getQuestions.mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Could Not Load Assessment')).toBeInTheDocument();
      expect(screen.getByText('Assessment not accessible')).toBeInTheDocument();
    });
  });
});
