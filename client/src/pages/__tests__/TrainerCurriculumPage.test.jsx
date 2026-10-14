import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TrainerCurriculumPage from '../TrainerCurriculumPage';
import trainerService from '../../services/trainerService';

vi.mock('../../services/trainerService', () => ({
  default: {
    getCourseById: vi.fn(),
    getFullCurriculum: vi.fn(),
    createModule: vi.fn(),
    updateModule: vi.fn(),
    deleteModule: vi.fn(),
    createLesson: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
  },
}));

describe('TrainerCurriculumPage', () => {
  const mockCourse = {
    _id: 'c-101',
    title: 'Distributed Systems',
    description: 'Advanced distributed computing.',
    category: 'Engineering',
    level: 'advanced',
    status: 'published',
  };

  const mockCurriculum = [
    {
      _id: 'm-1',
      title: 'Consensus Algorithms',
      description: 'Paxos and Raft fundamentals',
      order: 1,
      lessons: [
        {
          _id: 'l-1',
          title: 'Understanding Raft',
          content: 'Lesson content about Raft leader election.',
          contentType: 'text',
          order: 1,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (courseId = 'c-101') =>
    render(
      <MemoryRouter initialEntries={[`/trainer/courses/${courseId}/curriculum`]}>
        <Routes>
          <Route
            path="/trainer/courses/:courseId/curriculum"
            element={<TrainerCurriculumPage />}
          />
        </Routes>
      </MemoryRouter>
    );

  it('renders course summary and loads curriculum modules and lessons', async () => {
    trainerService.getCourseById.mockResolvedValueOnce(mockCourse);
    trainerService.getFullCurriculum.mockResolvedValueOnce(mockCurriculum);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
      expect(screen.getByText('Consensus Algorithms')).toBeInTheDocument();
      expect(screen.getByText('Understanding Raft')).toBeInTheDocument();
      expect(screen.getByText('1 lesson')).toBeInTheDocument();
    });
  });

  it('adds a new module via module modal', async () => {
    trainerService.getCourseById.mockResolvedValueOnce(mockCourse);
    trainerService.getFullCurriculum.mockResolvedValueOnce(mockCurriculum);

    const newModule = {
      _id: 'm-2',
      title: 'Vector Clocks & Causality',
      order: 2,
    };
    trainerService.createModule.mockResolvedValueOnce(newModule);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Consensus Algorithms')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Add Module$/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Module Title \*/i), {
      target: { value: 'Vector Clocks & Causality' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^Add Module$/i })
    );

    await waitFor(() => {
      expect(trainerService.createModule).toHaveBeenCalledWith({
        course: 'c-101',
        title: 'Vector Clocks & Causality',
        description: '',
        order: 2,
      });
      expect(screen.getByText('Vector Clocks & Causality')).toBeInTheDocument();
    });
  });

  it('adds a new lesson to a module', async () => {
    trainerService.getCourseById.mockResolvedValueOnce(mockCourse);
    trainerService.getFullCurriculum.mockResolvedValueOnce(mockCurriculum);

    const newLesson = {
      _id: 'l-2',
      title: 'Paxos Implementation',
      content: 'Deep dive into multi-Paxos.',
      contentType: 'text',
      order: 2,
    };
    trainerService.createLesson.mockResolvedValueOnce(newLesson);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Understanding Raft')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByLabelText(/Add lesson to Consensus Algorithms/i)
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Lesson Title \*/i), {
      target: { value: 'Paxos Implementation' },
    });
    fireEvent.change(screen.getByLabelText(/Lesson Content/i), {
      target: { value: 'Deep dive into multi-Paxos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Add Lesson$/i }));

    await waitFor(() => {
      expect(trainerService.createLesson).toHaveBeenCalledWith(
        'm-1',
        expect.objectContaining({
          title: 'Paxos Implementation',
        })
      );
      expect(screen.getByText('Paxos Implementation')).toBeInTheDocument();
    });
  });

  it('handles deleting a module with confirmation', async () => {
    trainerService.getCourseById.mockResolvedValueOnce(mockCourse);
    trainerService.getFullCurriculum.mockResolvedValueOnce(mockCurriculum);
    trainerService.deleteModule.mockResolvedValueOnce({ _id: 'm-1', isActive: false });

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Consensus Algorithms')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByLabelText(/Delete module Consensus Algorithms/i)
    );

    await waitFor(() => {
      expect(trainerService.deleteModule).toHaveBeenCalledWith('m-1');
      expect(screen.queryByText('Consensus Algorithms')).not.toBeInTheDocument();
    });
  });

  it('renders ErrorState with retry when API fails', async () => {
    trainerService.getCourseById.mockRejectedValueOnce(new Error('Course not found'));
    trainerService.getFullCurriculum.mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Could Not Load Curriculum')).toBeInTheDocument();
      expect(screen.getByText('Course not found')).toBeInTheDocument();
    });
  });
});
