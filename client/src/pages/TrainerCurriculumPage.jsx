import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, FolderPlus, Layers } from 'lucide-react';
import trainerService from '../services/trainerService';
import CurriculumModuleItem from '../components/trainer/CurriculumModuleItem';
import ModuleModal from '../components/trainer/ModuleModal';
import LessonModal from '../components/trainer/LessonModal';
import TrainerStatusBadge from '../components/trainer/TrainerStatusBadge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export const TrainerCurriculumPage = () => {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module Modal State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [isModuleSubmitting, setIsModuleSubmitting] = useState(false);

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeModuleForLesson, setActiveModuleForLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isLessonSubmitting, setIsLessonSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseData, curriculumData] = await Promise.all([
        trainerService.getCourseById(courseId),
        trainerService.getFullCurriculum(courseId),
      ]);
      setCourse(courseData);
      setCurriculum(curriculumData);
    } catch (err) {
      setError(err.message || 'Failed to load course curriculum.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Module Actions
  const handleOpenAddModule = () => {
    setEditingModule(null);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod) => {
    setEditingModule(mod);
    setIsModuleModalOpen(true);
  };

  const handleModuleSubmit = async (formData) => {
    setIsModuleSubmitting(true);
    try {
      if (editingModule) {
        const modId = editingModule._id || editingModule.id;
        const updated = await trainerService.updateModule(modId, formData);
        setCurriculum((prev) =>
          prev.map((m) =>
            (m._id || m.id) === modId ? { ...updated, lessons: m.lessons } : m
          )
        );
      } else {
        const created = await trainerService.createModule({
          ...formData,
          course: courseId,
        });
        setCurriculum((prev) => [...prev, { ...created, lessons: [] }]);
      }
    } finally {
      setIsModuleSubmitting(false);
    }
  };

  const handleDeleteModule = async (mod) => {
    const modId = mod._id || mod.id;
    if (!window.confirm(`Are you sure you want to delete "${mod.title}"?`)) return;

    try {
      await trainerService.deleteModule(modId);
      setCurriculum((prev) => prev.filter((m) => (m._id || m.id) !== modId));
    } catch (err) {
      alert(`Failed to delete module: ${err.message}`);
    }
  };

  // Lesson Actions
  const handleOpenAddLesson = (mod) => {
    setActiveModuleForLesson(mod);
    setEditingLesson(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (mod, lesson) => {
    setActiveModuleForLesson(mod);
    setEditingLesson(lesson);
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (formData) => {
    if (!activeModuleForLesson) return;
    setIsLessonSubmitting(true);
    const modId = activeModuleForLesson._id || activeModuleForLesson.id;

    try {
      if (editingLesson) {
        const lessonId = editingLesson._id || editingLesson.id;
        const updated = await trainerService.updateLesson(lessonId, formData);
        setCurriculum((prev) =>
          prev.map((m) => {
            if ((m._id || m.id) !== modId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) =>
                (l._id || l.id) === lessonId ? updated : l
              ),
            };
          })
        );
      } else {
        const created = await trainerService.createLesson(modId, formData);
        setCurriculum((prev) =>
          prev.map((m) => {
            if ((m._id || m.id) !== modId) return m;
            return {
              ...m,
              lessons: [...m.lessons, created],
            };
          })
        );
      }
    } finally {
      setIsLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (mod, lesson) => {
    const modId = mod._id || mod.id;
    const lessonId = lesson._id || lesson.id;
    if (!window.confirm(`Are you sure you want to delete lesson "${lesson.title}"?`)) {
      return;
    }

    try {
      await trainerService.deleteLesson(lessonId);
      setCurriculum((prev) =>
        prev.map((m) => {
          if ((m._id || m.id) !== modId) return m;
          return {
            ...m,
            lessons: m.lessons.filter((l) => (l._id || l.id) !== lessonId),
          };
        })
      );
    } catch (err) {
      alert(`Failed to delete lesson: ${err.message}`);
    }
  };

  const nextModuleOrder = curriculum.length + 1;
  const nextLessonOrder = (activeModuleForLesson?.lessons?.length || 0) + 1;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/trainer/courses">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>
        </Link>
        <ErrorState
          title="Could Not Load Curriculum"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/trainer/courses" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Courses
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">Curriculum</span>
      </div>

      {/* Course Summary Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {course?.category}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 capitalize">
              {course?.level}
            </span>
            <TrainerStatusBadge status={course?.status} />
          </div>

          <h1 className="text-2xl font-bold text-[#102A2A] dark:text-white">
            {course?.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            {course?.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="flex items-center gap-1.5"
            aria-label="Refresh curriculum"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModule}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </Button>
        </div>
      </div>

      {/* Curriculum Module List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#102A2A] dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-700" />
            Curriculum Structure ({curriculum.length} modules)
          </h2>
        </div>

        {curriculum.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <FolderPlus className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No modules created yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Organize your course into structured modules, then populate each module with lessons and multimedia.
            </p>
            <div className="mt-5">
              <Button variant="primary" size="sm" onClick={handleOpenAddModule}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Module
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {curriculum.map((mod) => (
              <CurriculumModuleItem
                key={mod._id || mod.id}
                module={mod}
                onAddLesson={handleOpenAddLesson}
                onEditModule={handleOpenEditModule}
                onDeleteModule={handleDeleteModule}
                onEditLesson={handleOpenEditLesson}
                onDeleteLesson={handleDeleteLesson}
              />
            ))}
          </div>
        )}
      </div>

      {/* Module Modal */}
      <ModuleModal
        isOpen={isModuleModalOpen}
        module={editingModule}
        defaultOrder={nextModuleOrder}
        onClose={() => setIsModuleModalOpen(false)}
        onSubmit={handleModuleSubmit}
        isLoading={isModuleSubmitting}
      />

      {/* Lesson Modal */}
      <LessonModal
        isOpen={isLessonModalOpen}
        lesson={editingLesson}
        defaultOrder={nextLessonOrder}
        onClose={() => setIsLessonModalOpen(false)}
        onSubmit={handleLessonSubmit}
        isLoading={isLessonSubmitting}
      />
    </div>
  );
};

export default TrainerCurriculumPage;
