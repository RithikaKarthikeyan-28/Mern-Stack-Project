import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import TrainerStatusBadge from '../TrainerStatusBadge';
import TrainerCourseCard from '../TrainerCourseCard';
import TrainerCourseModal from '../TrainerCourseModal';
import CurriculumModuleItem from '../CurriculumModuleItem';
import CurriculumLessonItem from '../CurriculumLessonItem';
import ModuleModal from '../ModuleModal';
import LessonModal from '../LessonModal';
import AssessmentModal from '../AssessmentModal';
import AssessmentPerformanceCard from '../AssessmentPerformanceCard';
import QuestionEditorModal from '../QuestionEditorModal';
import LearnerProgressTable from '../LearnerProgressTable';

describe('Trainer Component Library', () => {
  describe('TrainerStatusBadge', () => {
    it('renders published status correctly', () => {
      render(<TrainerStatusBadge status="published" />);
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByTestId('trainer-status-published')).toBeInTheDocument();
    });

    it('renders draft status correctly', () => {
      render(<TrainerStatusBadge status="draft" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByTestId('trainer-status-draft')).toBeInTheDocument();
    });

    it('renders archived status correctly', () => {
      render(<TrainerStatusBadge status="archived" />);
      expect(screen.getByText('Archived')).toBeInTheDocument();
      expect(screen.getByTestId('trainer-status-archived')).toBeInTheDocument();
    });
  });

  describe('TrainerCourseCard', () => {
    const mockCourse = {
      _id: 'c-101',
      title: 'Docker & Kubernetes Deep Dive',
      description: 'Comprehensive containerization course.',
      category: 'Engineering',
      level: 'intermediate',
      duration: 18,
      status: 'draft',
    };

    it('renders course information and badges', () => {
      render(
        <MemoryRouter>
          <TrainerCourseCard course={mockCourse} />
        </MemoryRouter>
      );

      expect(screen.getByText('Docker & Kubernetes Deep Dive')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive containerization course.')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('intermediate')).toBeInTheDocument();
      expect(screen.getByText('18 hrs')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('triggers onEdit callback when Edit button is clicked', () => {
      const handleEdit = vi.fn();
      render(
        <MemoryRouter>
          <TrainerCourseCard course={mockCourse} onEdit={handleEdit} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
      expect(handleEdit).toHaveBeenCalledWith(mockCourse);
    });

    it('triggers onStatusChange with published when Publish is clicked on a draft course', () => {
      const handleStatusChange = vi.fn();
      render(
        <MemoryRouter>
          <TrainerCourseCard course={mockCourse} onStatusChange={handleStatusChange} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Publish/i }));
      expect(handleStatusChange).toHaveBeenCalledWith(mockCourse, 'published');
    });

    it('triggers onStatusChange with archived when Archive is clicked on a published course', () => {
      const handleStatusChange = vi.fn();
      render(
        <MemoryRouter>
          <TrainerCourseCard
            course={{ ...mockCourse, status: 'published' }}
            onStatusChange={handleStatusChange}
          />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Archive/i }));
      expect(handleStatusChange).toHaveBeenCalledWith(expect.any(Object), 'archived');
    });
  });

  describe('TrainerCourseModal', () => {
    it('does not render when isOpen is false', () => {
      render(<TrainerCourseModal isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('validates required fields on submission', async () => {
      const handleSubmit = vi.fn();
      render(
        <TrainerCourseModal
          isOpen={true}
          onSubmit={handleSubmit}
          onClose={vi.fn()}
        />
      );

      // Attempt to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));

      expect(
        await screen.findByText('Title must be at least 3 characters long')
      ).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits valid course payload', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <TrainerCourseModal
          isOpen={true}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      );

      fireEvent.change(screen.getByLabelText(/Course Title \*/i), {
        target: { value: 'Mastering TypeScript' },
      });
      fireEvent.change(screen.getByLabelText(/Description \*/i), {
        target: { value: 'Complete guide to advanced TypeScript typing systems.' },
      });
      fireEvent.change(screen.getByLabelText(/Duration/i), {
        target: { value: '25' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));

      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Mastering TypeScript',
        description: 'Complete guide to advanced TypeScript typing systems.',
        category: 'Engineering',
        level: 'beginner',
        duration: 25,
        status: 'draft',
      });
    });
  });

  describe('CurriculumModuleItem & CurriculumLessonItem', () => {
    const mockModule = {
      _id: 'm-1',
      title: 'Module 1: Foundations',
      description: 'Basics of architecture',
      order: 1,
      lessons: [
        {
          _id: 'l-1',
          title: 'Introduction to Architecture',
          contentType: 'text',
          order: 1,
        },
        {
          _id: 'l-2',
          title: 'Deep Dive Video',
          contentType: 'video',
          resourceUrl: 'https://example.com/video.mp4',
          order: 2,
        },
      ],
    };

    it('renders module and its lessons', () => {
      render(<CurriculumModuleItem module={mockModule} />);

      expect(screen.getByText('Module 1: Foundations')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Architecture')).toBeInTheDocument();
      expect(screen.getByText('Deep Dive Video')).toBeInTheDocument();
      expect(screen.getByText('2 lessons')).toBeInTheDocument();
    });

    it('toggles collapse and expand when accordion toggle is clicked', () => {
      render(<CurriculumModuleItem module={mockModule} />);

      const toggleBtn = screen.getByLabelText(/Collapse module/i);
      fireEvent.click(toggleBtn);

      // Lessons hidden
      expect(screen.queryByText('Introduction to Architecture')).not.toBeInTheDocument();

      // Expand again
      const expandBtn = screen.getByLabelText(/Expand module/i);
      fireEvent.click(expandBtn);
      expect(screen.getByText('Introduction to Architecture')).toBeInTheDocument();
    });

    it('triggers onAddLesson when Add Lesson is clicked', () => {
      const handleAdd = vi.fn();
      render(<CurriculumModuleItem module={mockModule} onAddLesson={handleAdd} />);

      fireEvent.click(screen.getByRole('button', { name: /Add Lesson/i }));
      expect(handleAdd).toHaveBeenCalledWith(mockModule);
    });

    it('CurriculumLessonItem handles edit and delete triggers', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <CurriculumLessonItem
          lesson={mockModule.lessons[1]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );

      fireEvent.click(screen.getByLabelText(/Edit lesson Deep Dive Video/i));
      expect(handleEdit).toHaveBeenCalledWith(mockModule.lessons[1]);

      fireEvent.click(screen.getByLabelText(/Delete lesson Deep Dive Video/i));
      expect(handleDelete).toHaveBeenCalledWith(mockModule.lessons[1]);
    });
  });

  describe('ModuleModal', () => {
    it('validates module title and submits valid data', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <ModuleModal
          isOpen={true}
          defaultOrder={2}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      );

      fireEvent.change(screen.getByLabelText(/Module Title \*/i), {
        target: { value: 'Advanced Microservices' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Add Module/i }));

      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Advanced Microservices',
        description: '',
        order: 2,
      });
    });
  });

  describe('LessonModal', () => {
    it('validates url when contentType is video or link', async () => {
      const handleSubmit = vi.fn();

      render(
        <LessonModal
          isOpen={true}
          onSubmit={handleSubmit}
          onClose={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/Lesson Title \*/i), {
        target: { value: 'Video Overview' },
      });
      fireEvent.change(screen.getByLabelText(/Lesson Content/i), {
        target: { value: 'Overview content' },
      });
      fireEvent.change(screen.getByLabelText(/Content Type \*/i), {
        target: { value: 'video' },
      });

      // Submit without URL
      fireEvent.click(screen.getByRole('button', { name: /Add Lesson/i }));

      expect(
        await screen.findByText('Resource URL is required for video or link lessons')
      ).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits valid lesson with URL', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <LessonModal
          isOpen={true}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      );

      fireEvent.change(screen.getByLabelText(/Lesson Title \*/i), {
        target: { value: 'Video Overview' },
      });
      fireEvent.change(screen.getByLabelText(/Lesson Content/i), {
        target: { value: 'Overview content' },
      });
      fireEvent.change(screen.getByLabelText(/Content Type \*/i), {
        target: { value: 'video' },
      });
      fireEvent.change(screen.getByLabelText(/Resource URL \*/i), {
        target: { value: 'https://cdn.example.com/video.mp4' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Lesson/i }));

      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Video Overview',
        content: 'Overview content',
        contentType: 'video',
        resourceUrl: 'https://cdn.example.com/video.mp4',
        order: 1,
      });
    });
  });

  describe('AssessmentModal', () => {
    const mockCourses = [{ _id: 'c-1', title: 'Security 101' }];

    it('validates assessment title and passing percentage', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});

      render(
        <AssessmentModal
          isOpen={true}
          courses={mockCourses}
          onSubmit={handleSubmit}
          onClose={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/Assessment Title \*/i), {
        target: { value: 'Final Quiz' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Create Assessment/i }));

      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Final Quiz',
        description: '',
        course: 'c-1',
        module: null,
        passingPercentage: 60,
        timeLimitMinutes: null,
        maxAttempts: null,
        status: 'draft',
      });
    });
  });

  describe('AssessmentPerformanceCard', () => {
    it('renders authoritative metrics correctly', () => {
      const stats = {
        totalAttempts: 20,
        submittedAttempts: 18,
        passedAttempts: 15,
        failedAttempts: 3,
        averagePercentage: 82.5,
        highestPercentage: 100,
        lowestPercentage: 55,
        passPercentage: 83.3,
      };

      render(<AssessmentPerformanceCard performance={stats} />);

      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('83.3%')).toBeInTheDocument();
      expect(screen.getByText('82.5%')).toBeInTheDocument();
      expect(screen.getByText('100% / 55%')).toBeInTheDocument();
      expect(screen.getByText('Passed: 15')).toBeInTheDocument();
      expect(screen.getByText('Failed: 3')).toBeInTheDocument();
    });
  });

  describe('QuestionEditorModal', () => {
    it('renders single choice question options and toggles correct key', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});

      render(
        <QuestionEditorModal
          isOpen={true}
          onSubmit={handleSubmit}
          onClose={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/Question Prompt \*/i), {
        target: { value: 'What does CSS stand for?' },
      });

      // Fill in option text
      const inputs = screen.getAllByPlaceholderText(/Option [A-D] description/i);
      fireEvent.change(inputs[0], { target: { value: 'Cascading Style Sheets' } });
      fireEvent.change(inputs[1], { target: { value: 'Computer Style Syntax' } });
      fireEvent.change(inputs[2], { target: { value: 'Creative Sheet System' } });
      fireEvent.change(inputs[3], { target: { value: 'Central Style Standard' } });

      // Click option A button to ensure it is selected
      fireEvent.click(screen.getByLabelText(/Mark option A as correct/i));

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          questionText: 'What does CSS stand for?',
          questionType: 'single_choice',
          correctAnswers: ['A'],
          marks: 1,
          order: 1,
        })
      );
    });
  });

  describe('LearnerProgressTable', () => {
    const mockEnrollments = [
      {
        _id: 'e-1',
        employee: {
          employeeId: 'EMP-001',
          user: { name: 'Alice Smith', email: 'alice@company.com' },
          department: { name: 'Engineering' },
        },
        course: { _id: 'c-1', title: 'React Essentials' },
        status: 'in_progress',
        progressPercentage: 65,
      },
      {
        _id: 'e-2',
        employee: {
          employeeId: 'EMP-002',
          user: { name: 'Bob Jones', email: 'bob@company.com' },
          department: { name: 'Security' },
        },
        course: { _id: 'c-2', title: 'Cloud Architecture' },
        status: 'completed',
        progressPercentage: 100,
      },
    ];

    it('renders learners table rows with progress and badges', () => {
      render(<LearnerProgressTable enrollments={mockEnrollments} />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice@company.com')).toBeInTheDocument();
      expect(screen.getByText('EMP-001')).toBeInTheDocument();
      expect(screen.getByText('React Essentials')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('filters by status tab', () => {
      render(<LearnerProgressTable enrollments={mockEnrollments} />);

      fireEvent.click(screen.getByRole('button', { name: /Completed/i }));

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('filters by search keyword', () => {
      render(<LearnerProgressTable enrollments={mockEnrollments} />);

      const searchInput = screen.getByLabelText(/Search learners/i);
      fireEvent.change(searchInput, { target: { value: 'React' } });

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });
  });
});
