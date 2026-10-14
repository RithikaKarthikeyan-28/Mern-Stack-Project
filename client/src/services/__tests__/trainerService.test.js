import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import trainerService from '../trainerService';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('trainerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Course Management', () => {
    it('getMyCourses requests /courses with correct params and extracts courses', async () => {
      const mockCourses = [{ _id: 'c1', title: 'Course 1', status: 'published' }];
      api.get.mockResolvedValueOnce({ data: { data: { courses: mockCourses } } });

      const result = await trainerService.getMyCourses({ trainer: 'u1', status: 'published' });

      expect(api.get).toHaveBeenCalledWith('/courses', {
        params: { trainer: 'u1', status: 'published' },
      });
      expect(result).toEqual(mockCourses);
    });

    it('getCourseById requests /courses/:id', async () => {
      const mockCourse = { _id: 'c1', title: 'Course 1' };
      api.get.mockResolvedValueOnce({ data: { data: { course: mockCourse } } });

      const result = await trainerService.getCourseById('c1');

      expect(api.get).toHaveBeenCalledWith('/courses/c1');
      expect(result).toEqual(mockCourse);
    });

    it('createCourse posts payload to /courses', async () => {
      const payload = {
        title: 'New Course',
        description: 'Course description',
        category: 'Engineering',
        level: 'beginner',
        duration: 10,
        status: 'draft',
      };
      const created = { _id: 'c2', ...payload };
      api.post.mockResolvedValueOnce({ data: { data: { course: created } } });

      const result = await trainerService.createCourse(payload);

      expect(api.post).toHaveBeenCalledWith('/courses', payload);
      expect(result).toEqual(created);
    });

    it('updateCourse patches payload to /courses/:id', async () => {
      const updates = { title: 'Updated Title' };
      const updated = { _id: 'c1', title: 'Updated Title' };
      api.patch.mockResolvedValueOnce({ data: { data: { course: updated } } });

      const result = await trainerService.updateCourse('c1', updates);

      expect(api.patch).toHaveBeenCalledWith('/courses/c1', updates);
      expect(result).toEqual(updated);
    });

    it('publishCourse calls updateCourse with status published', async () => {
      api.patch.mockResolvedValueOnce({ data: { data: { course: { _id: 'c1', status: 'published' } } } });

      const result = await trainerService.publishCourse('c1');

      expect(api.patch).toHaveBeenCalledWith('/courses/c1', { status: 'published' });
      expect(result.status).toBe('published');
    });

    it('archiveCourse calls updateCourse with status archived', async () => {
      api.patch.mockResolvedValueOnce({ data: { data: { course: { _id: 'c1', status: 'archived' } } } });

      const result = await trainerService.archiveCourse('c1');

      expect(api.patch).toHaveBeenCalledWith('/courses/c1', { status: 'archived' });
      expect(result.status).toBe('archived');
    });
  });

  describe('Curriculum Management', () => {
    it('getCourseModules requests /courses/:id/modules', async () => {
      const modules = [{ _id: 'm1', title: 'Mod 1', order: 1 }];
      api.get.mockResolvedValueOnce({ data: { data: { modules } } });

      const result = await trainerService.getCourseModules('c1');

      expect(api.get).toHaveBeenCalledWith('/courses/c1/modules');
      expect(result).toEqual(modules);
    });

    it('createModule posts to /modules', async () => {
      const payload = { course: 'c1', title: 'Module 1', order: 1 };
      api.post.mockResolvedValueOnce({ data: { data: { module: payload } } });

      const result = await trainerService.createModule(payload);

      expect(api.post).toHaveBeenCalledWith('/modules', payload);
      expect(result).toEqual(payload);
    });

    it('updateModule patches to /modules/:id', async () => {
      const payload = { title: 'New Module Title' };
      api.patch.mockResolvedValueOnce({ data: { data: { module: { _id: 'm1', ...payload } } } });

      const result = await trainerService.updateModule('m1', payload);

      expect(api.patch).toHaveBeenCalledWith('/modules/m1', payload);
      expect(result.title).toBe('New Module Title');
    });

    it('deleteModule sends DELETE to /modules/:id', async () => {
      api.delete.mockResolvedValueOnce({ data: { data: { module: { _id: 'm1', isActive: false } } } });

      const result = await trainerService.deleteModule('m1');

      expect(api.delete).toHaveBeenCalledWith('/modules/m1');
      expect(result.isActive).toBe(false);
    });

    it('getModuleLessons requests /modules/:id/lessons', async () => {
      const lessons = [{ _id: 'l1', title: 'Lesson 1', order: 1 }];
      api.get.mockResolvedValueOnce({ data: { data: { lessons } } });

      const result = await trainerService.getModuleLessons('m1');

      expect(api.get).toHaveBeenCalledWith('/modules/m1/lessons');
      expect(result).toEqual(lessons);
    });

    it('createLesson posts to /modules/:moduleId/lessons with module injected', async () => {
      const payload = { title: 'Lesson 1', content: 'Text', contentType: 'text', order: 1 };
      api.post.mockResolvedValueOnce({ data: { data: { lesson: { _id: 'l1', ...payload, module: 'm1' } } } });

      const result = await trainerService.createLesson('m1', payload);

      expect(api.post).toHaveBeenCalledWith('/modules/m1/lessons', { ...payload, module: 'm1' });
      expect(result._id).toBe('l1');
    });

    it('updateLesson patches to /lessons/:id', async () => {
      const payload = { title: 'Updated Lesson' };
      api.patch.mockResolvedValueOnce({ data: { data: { lesson: { _id: 'l1', ...payload } } } });

      const result = await trainerService.updateLesson('l1', payload);

      expect(api.patch).toHaveBeenCalledWith('/lessons/l1', payload);
      expect(result.title).toBe('Updated Lesson');
    });

    it('deleteLesson sends DELETE to /lessons/:id', async () => {
      api.delete.mockResolvedValueOnce({ data: { data: { lesson: { _id: 'l1', isActive: false } } } });

      const result = await trainerService.deleteLesson('l1');

      expect(api.delete).toHaveBeenCalledWith('/lessons/l1');
      expect(result.isActive).toBe(false);
    });

    it('getFullCurriculum aggregates modules and lessons', async () => {
      const mockModules = [
        { _id: 'm1', title: 'Mod 1', order: 1 },
        { _id: 'm2', title: 'Mod 2', order: 2 },
      ];
      const mockLessonsM1 = [{ _id: 'l1', title: 'Lesson 1' }];
      const mockLessonsM2 = [{ _id: 'l2', title: 'Lesson 2' }];

      api.get
        .mockResolvedValueOnce({ data: { data: { modules: mockModules } } })
        .mockResolvedValueOnce({ data: { data: { lessons: mockLessonsM1 } } })
        .mockResolvedValueOnce({ data: { data: { lessons: mockLessonsM2 } } });

      const result = await trainerService.getFullCurriculum('c1');

      expect(result).toHaveLength(2);
      expect(result[0].lessons).toEqual(mockLessonsM1);
      expect(result[1].lessons).toEqual(mockLessonsM2);
    });
  });

  describe('Assessment & Question Management', () => {
    it('getAssessments requests /assessments with query params', async () => {
      const mockAssessments = [{ _id: 'a1', title: 'Quiz 1', status: 'published' }];
      api.get.mockResolvedValueOnce({ data: { data: { assessments: mockAssessments } } });

      const result = await trainerService.getAssessments({ status: 'published' });

      expect(api.get).toHaveBeenCalledWith('/assessments', { params: { status: 'published' } });
      expect(result).toEqual(mockAssessments);
    });

    it('createAssessment posts to /assessments', async () => {
      const payload = { title: 'Final Quiz', course: 'c1', passingPercentage: 70 };
      api.post.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a1', ...payload } } } });

      const result = await trainerService.createAssessment(payload);

      expect(api.post).toHaveBeenCalledWith('/assessments', payload);
      expect(result._id).toBe('a1');
    });

    it('publishAssessment calls PATCH on /assessments/:id/publish', async () => {
      api.patch.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a1', status: 'published' } } } });

      const result = await trainerService.publishAssessment('a1');

      expect(api.patch).toHaveBeenCalledWith('/assessments/a1/publish');
      expect(result.status).toBe('published');
    });

    it('archiveAssessment calls PATCH on /assessments/:id/archive', async () => {
      api.patch.mockResolvedValueOnce({ data: { data: { assessment: { _id: 'a1', status: 'archived' } } } });

      const result = await trainerService.archiveAssessment('a1');

      expect(api.patch).toHaveBeenCalledWith('/assessments/a1/archive');
      expect(result.status).toBe('archived');
    });

    it('getAssessmentPerformance requests /assessments/:id/performance', async () => {
      const stats = { totalAttempts: 5, averagePercentage: 80 };
      api.get.mockResolvedValueOnce({ data: { data: stats } });

      const result = await trainerService.getAssessmentPerformance('a1');

      expect(api.get).toHaveBeenCalledWith('/assessments/a1/performance');
      expect(result).toEqual(stats);
    });

    it('getQuestions requests /assessments/:id/questions', async () => {
      const questions = [{ _id: 'q1', questionText: 'Q1', correctAnswers: ['A'] }];
      api.get.mockResolvedValueOnce({ data: { data: { questions } } });

      const result = await trainerService.getQuestions('a1');

      expect(api.get).toHaveBeenCalledWith('/assessments/a1/questions');
      expect(result).toEqual(questions);
    });

    it('createQuestion posts to /assessments/:id/questions', async () => {
      const payload = {
        questionText: 'What is React?',
        questionType: 'single_choice',
        options: [{ key: 'A', text: 'Library' }, { key: 'B', text: 'Framework' }],
        correctAnswers: ['A'],
        marks: 1,
        order: 1,
      };
      api.post.mockResolvedValueOnce({ data: { data: { question: { _id: 'q1', ...payload } } } });

      const result = await trainerService.createQuestion('a1', payload);

      expect(api.post).toHaveBeenCalledWith('/assessments/a1/questions', payload);
      expect(result._id).toBe('q1');
    });

    it('deleteQuestion sends DELETE to /assessments/:assessmentId/questions/:questionId', async () => {
      api.delete.mockResolvedValueOnce({ data: { data: { question: { _id: 'q1', isActive: false } } } });

      const result = await trainerService.deleteQuestion('a1', 'q1');

      expect(api.delete).toHaveBeenCalledWith('/assessments/a1/questions/q1');
      expect(result._id).toBe('q1');
    });
  });

  describe('Learners & Dashboard Overview', () => {
    it('getLearnerEnrollments requests /enrollments with params', async () => {
      const enrollments = [{ _id: 'e1', status: 'in_progress', progressPercentage: 50 }];
      api.get.mockResolvedValueOnce({ data: { data: { enrollments } } });

      const result = await trainerService.getLearnerEnrollments({ status: 'in_progress' });

      expect(api.get).toHaveBeenCalledWith('/enrollments', { params: { status: 'in_progress' } });
      expect(result).toEqual(enrollments);
    });

    it('getDashboardOverview aggregates courses, assessments, and enrollments safely', async () => {
      const courses = [
        { _id: 'c1', status: 'published' },
        { _id: 'c2', status: 'draft' },
      ];
      const assessments = [
        { _id: 'a1', status: 'published' },
      ];
      const enrollments = [
        { _id: 'e1', status: 'in_progress', progressPercentage: 60 },
        { _id: 'e2', status: 'completed', progressPercentage: 100 },
      ];

      api.get
        .mockResolvedValueOnce({ data: { data: { courses } } })
        .mockResolvedValueOnce({ data: { data: { assessments } } })
        .mockResolvedValueOnce({ data: { data: { enrollments } } });

      const overview = await trainerService.getDashboardOverview('trainer-1');

      expect(overview.courses.total).toBe(2);
      expect(overview.courses.published).toBe(1);
      expect(overview.courses.draft).toBe(1);
      expect(overview.assessments.total).toBe(1);
      expect(overview.learners.total).toBe(2);
      expect(overview.learners.inProgress).toBe(1);
      expect(overview.learners.completed).toBe(1);
      expect(overview.learners.averageProgress).toBe(80);
    });
  });
});
