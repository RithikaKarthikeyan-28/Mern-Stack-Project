import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TrainerAssessmentsPage from '../TrainerAssessmentsPage';
import trainerService from '../../services/trainerService';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/trainerService', () => ({
  default: {
    getAssessments: vi.fn(),
    getMyCourses: vi.fn(),
    createAssessment: vi.fn(),
    updateAssessment: vi.fn(),
    publishAssessment: vi.fn(),
    archiveAssessment: vi.fn(),
    getCourseModules: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('TrainerAssessmentsPage', () => {
  const mockUser = { _id: 'trainer-123', name: 'Sarah Connor', role: 'trainer' };

  const mockCourses = [
    { _id: 'c-1', title: 'Network Security Fundamentals' },
  ];

  const mockAssessments = [
    {
      _id: 'a-1',
      title: 'Firewall Configuration Quiz',
      description: 'Test on iptables and subnet masks.',
      course: { _id: 'c-1', title: 'Network Security Fundamentals' },
      passingPercentage: 75,
      timeLimitMinutes: 45,
      maxAttempts: 2,
      status: 'draft',
    },
    {
      _id: 'a-2',
      title: 'Intrusion Detection Assessment',
      description: 'Comprehensive evaluation.',
      course: { _id: 'c-1', title: 'Network Security Fundamentals' },
      passingPercentage: 80,
      timeLimitMinutes: 60,
      maxAttempts: 3,
      status: 'published',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    trainerService.getCourseModules.mockResolvedValue([]);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <TrainerAssessmentsPage />
      </MemoryRouter>
    );

  it('renders assessments list and course details', async () => {
    trainerService.getAssessments.mockResolvedValueOnce(mockAssessments);
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Assessment Management')).toBeInTheDocument();
      expect(screen.getByText('Firewall Configuration Quiz')).toBeInTheDocument();
      expect(screen.getByText('Intrusion Detection Assessment')).toBeInTheDocument();
      expect(screen.getByText('Pass: 75%')).toBeInTheDocument();
    });
  });

  it('filters assessments by status tabs', async () => {
    trainerService.getAssessments.mockResolvedValueOnce(mockAssessments);
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Firewall Configuration Quiz')).toBeInTheDocument();
    });

    // Click Published tab
    fireEvent.click(screen.getByRole('button', { name: /Published/i }));

    expect(screen.queryByText('Firewall Configuration Quiz')).not.toBeInTheDocument();
    expect(screen.getByText('Intrusion Detection Assessment')).toBeInTheDocument();
  });

  it('creates a new assessment via modal', async () => {
    trainerService.getAssessments.mockResolvedValueOnce(mockAssessments);
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);

    const newAssessment = {
      _id: 'a-3',
      title: 'VPN Protocols & IPSec',
      description: 'VPN evaluation quiz.',
      course: { _id: 'c-1', title: 'Network Security Fundamentals' },
      passingPercentage: 70,
      status: 'draft',
    };
    trainerService.createAssessment.mockResolvedValueOnce(newAssessment);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Firewall Configuration Quiz')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Assessment/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Assessment Title \*/i), {
      target: { value: 'VPN Protocols & IPSec' },
    });
    fireEvent.change(screen.getByLabelText(/Passing % \*/i), {
      target: { value: '70' },
    });

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^Create Assessment$/i })
    );

    await waitFor(() => {
      expect(trainerService.createAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'VPN Protocols & IPSec',
          passingPercentage: 70,
        })
      );
      expect(screen.getByText('VPN Protocols & IPSec')).toBeInTheDocument();
    });
  });

  it('publishes a draft assessment', async () => {
    trainerService.getAssessments.mockResolvedValueOnce(mockAssessments);
    trainerService.getMyCourses.mockResolvedValueOnce(mockCourses);
    trainerService.publishAssessment.mockResolvedValueOnce({
      ...mockAssessments[0],
      status: 'published',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Firewall Configuration Quiz')).toBeInTheDocument();
    });

    const publishBtn = screen.getByLabelText(/Publish Firewall Configuration Quiz/i);
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(trainerService.publishAssessment).toHaveBeenCalledWith('a-1');
    });
  });

  it('handles error state with retry button', async () => {
    trainerService.getAssessments.mockRejectedValueOnce(new Error('Assessment server error'));
    trainerService.getMyCourses.mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Could Not Load Assessments')).toBeInTheDocument();
      expect(screen.getByText('Assessment server error')).toBeInTheDocument();
    });
  });
});
