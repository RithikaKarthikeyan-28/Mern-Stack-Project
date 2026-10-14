import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import LearningSidebar from '../components/player/LearningSidebar';
import LessonContentRenderer from '../components/player/LessonContentRenderer';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';

export const LearningPlayerPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState(null);

  // Active module and lesson states
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  // Mobile sidebar toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Updating progress loader
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Load course, curriculum, and enrollment
  const loadPlayerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [courseRes, curriculumRes, enrollmentRes] = await Promise.allSettled([
        courseService.getCourseById(courseId),
        courseService.getCourseCurriculum(courseId),
        enrollmentService.getCourseEnrollment(courseId),
      ]);

      if (courseRes.status !== 'fulfilled' || !courseRes.value) {
        throw new Error('Course not found or is no longer available.');
      }
      setCourse(courseRes.value);

      const loadedCurriculum = curriculumRes.status === 'fulfilled' ? curriculumRes.value || [] : [];
      setCurriculum(loadedCurriculum);

      let loadedEnrollment = null;
      if (enrollmentRes.status === 'fulfilled' && enrollmentRes.value) {
        loadedEnrollment = enrollmentRes.value;
        setEnrollment(loadedEnrollment);
      } else {
        // Unenrolled employee trying to access player
        navigate(`/courses/${courseId}`, { replace: true });
        return;
      }

      // Determine initial lesson to display:
      // Flatten all lessons with their module
      const allLessonsWithModule = [];
      loadedCurriculum.forEach((mod) => {
        (mod.lessons || []).forEach((les) => {
          allLessonsWithModule.push({ module: mod, lesson: les });
        });
      });

      if (allLessonsWithModule.length === 0) {
        return;
      }

      const completedSet = new Set(
        (loadedEnrollment.completedLessons || []).map((id) =>
          typeof id === 'object' ? id._id || id.id : id
        )
      );

      let targetItem = null;

      // 1. If URL has lessonId, find it
      if (lessonId) {
        targetItem = allLessonsWithModule.find(
          (item) => (item.lesson._id || item.lesson.id) === lessonId
        );
      }

      // 2. Otherwise find the first incomplete lesson (Resume logic)
      if (!targetItem) {
        targetItem = allLessonsWithModule.find(
          (item) => !completedSet.has(item.lesson._id || item.lesson.id)
        );
      }

      // 3. Fallback to first lesson
      if (!targetItem) {
        targetItem = allLessonsWithModule[0];
      }

      setCurrentModule(targetItem.module);
      setCurrentLesson(targetItem.lesson);
    } catch (err) {
      setError(err.message || 'Unable to load course player.');
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId, navigate]);

  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Flattened list of all lessons in curriculum order
  const flattenedLessons = useMemo(() => {
    const list = [];
    curriculum.forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        list.push({ module: mod, lesson: les });
      });
    });
    return list;
  }, [curriculum]);

  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1;
    const curId = currentLesson._id || currentLesson.id;
    return flattenedLessons.findIndex(
      (item) => (item.lesson._id || item.lesson.id) === curId
    );
  }, [currentLesson, flattenedLessons]);

  const prevItem = currentIndex > 0 ? flattenedLessons[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < flattenedLessons.length - 1
      ? flattenedLessons[currentIndex + 1]
      : null;

  // Completed lessons set
  const completedLessonIds = useMemo(() => {
    return (enrollment?.completedLessons || []).map((id) =>
      typeof id === 'object' ? id._id || id.id : id
    );
  }, [enrollment]);

  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  const isCurrentCompleted = currentLesson
    ? completedSet.has(currentLesson._id || currentLesson.id)
    : false;

  const handleSelectLesson = (mod, les) => {
    setCurrentModule(mod);
    setCurrentLesson(les);
    const lesId = les._id || les.id;
    const modId = mod._id || mod.id;
    navigate(`/learn/${courseId}/module/${modId}/lesson/${lesId}`, { replace: true });
  };

  const handleNavigateLesson = (item) => {
    if (!item) return;
    handleSelectLesson(item.module, item.lesson);
  };

  // Toggle Lesson Completion
  const handleToggleCompletion = async () => {
    if (!currentLesson || !enrollment) return;

    const lessonIdToUpdate = currentLesson._id || currentLesson.id;
    const nextState = !isCurrentCompleted;

    try {
      setUpdatingProgress(true);
      const updatedEnrollment = await enrollmentService.updateProgress(
        enrollment._id || enrollment.id,
        lessonIdToUpdate,
        nextState
      );

      setEnrollment(updatedEnrollment);

      if (nextState) {
        showSuccess('Lesson marked as completed!');
      } else {
        showSuccess('Lesson marked as incomplete.');
      }
    } catch (err) {
      showError(err.message || 'Failed to update lesson progress.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] bg-white rounded-2xl overflow-hidden border border-slate-200" data-testid="player-loading-skeleton">
        <div className="hidden lg:block w-80 bg-slate-900 p-5 space-y-4">
          <Skeleton height="32px" />
          <Skeleton height="20px" width="60%" />
          <div className="space-y-2 pt-4">
            <Skeleton height="40px" count={5} />
          </div>
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton height="24px" width="30%" />
          <Skeleton height="36px" width="70%" />
          <Skeleton height="300px" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-8">
        <ErrorState
          title="Learning Player Error"
          message={error || 'Course content could not be loaded.'}
          onRetry={loadPlayerData}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col lg:flex-row h-[calc(100vh-5.5rem)] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm"
      data-testid="learning-player-page"
    >
      {/* 1. Sidebar (Desktop Persistent / Mobile Drawer) */}
      <LearningSidebar
        course={course}
        curriculum={curriculum}
        currentLessonId={currentLesson?._id || currentLesson?.id}
        completedLessonIds={completedLessonIds}
        progressPercentage={enrollment?.progressPercentage ?? 0}
        onSelectLesson={handleSelectLesson}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Lesson Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Top Control Bar */}
        <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open curriculum sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={`/courses/${courseId}`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Course</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="primary" size="sm">
              {enrollment?.progressPercentage ?? 0}% Complete
            </Badge>

            {/* Quick Completion Button */}
            <Button
              variant={isCurrentCompleted ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleCompletion}
              isLoading={updatingProgress}
              leftIcon={
                isCurrentCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4" />
                )
              }
            >
              {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
            </Button>
          </div>
        </div>

        {/* Scrollable Lesson Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
          {currentLesson ? (
            <LessonContentRenderer
              lesson={currentLesson}
              currentModule={currentModule}
            />
          ) : (
            <div className="text-center py-12 text-slate-400">
              No lesson selected.
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="h-16 px-4 sm:px-8 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateLesson(prevItem)}
            disabled={!prevItem}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous Lesson
          </Button>

          <span className="text-xs text-slate-400 font-medium">
            {currentIndex >= 0 ? `${currentIndex + 1} of ${flattenedLessons.length}` : ''}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateLesson(nextItem)}
            disabled={!nextItem}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next Lesson
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LearningPlayerPage;
