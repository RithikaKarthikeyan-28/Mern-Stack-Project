import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle2,
  Circle,
  Award,
  ArrowRight,
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
import assessmentService from '../services/assessmentService';

export const LearningPlayerPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
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

      // Fetch assessment status to get assessment ID if available
      try {
        const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
        if (asmStatus?.assessment?.id) {
          setAssessmentId(asmStatus.assessment.id);
        }
      } catch (e) {
        // graceful fallback
      }

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

  // Direct navigation without completion action
  const navigateToLesson = (mod, les) => {
    setCurrentModule(mod);
    setCurrentLesson(les);
    const lesId = les._id || les.id;
    const modId = mod._id || mod.id;
    navigate(`/learn/${courseId}/module/${modId}/lesson/${lesId}`, { replace: true });
  };

  // Automatic Lesson Completion on "Next Lesson"
  const handleNextLesson = async () => {
    if (updatingProgress || !nextItem || !currentLesson) return;

    // If current lesson is already completed, advance immediately without duplicate API call
    if (isCurrentCompleted) {
      navigateToLesson(nextItem.module, nextItem.lesson);
      return;
    }

    try {
      setUpdatingProgress(true);
      const currentLesId = currentLesson._id || currentLesson.id;
      const currentModId = currentModule?._id || currentModule?.id;

      const updatedEnrollment = await enrollmentService.updateProgress(
        enrollment._id || enrollment.id,
        currentLesId,
        true,
        { moduleId: currentModId, courseId }
      );

      setEnrollment(updatedEnrollment);

      const isCourseNowComplete =
        updatedEnrollment.progressPercentage === 100 ||
        updatedEnrollment.status === 'completed';

      if (isCourseNowComplete) {
        showSuccess('Congratulations! Course completed. Certification assessment unlocked!');
        try {
          const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
          if (asmStatus?.assessment?.id) {
            setAssessmentId(asmStatus.assessment.id);
          }
        } catch (_) {}
      } else {
        showSuccess('Lesson completed!');
      }

      // Navigate to next lesson only AFTER successful persistence
      navigateToLesson(nextItem.module, nextItem.lesson);
    } catch (err) {
      showError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save lesson completion. Please retry.'
      );
      // Stay on the current lesson
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Completion on final lesson
  const handleCompleteFinalLesson = async () => {
    if (updatingProgress || !currentLesson || !enrollment) return;

    if (isCurrentCompleted) {
      if (assessmentId) {
        navigate(`/assessments/${assessmentId}`);
      } else {
        navigate(`/courses/${courseId}`);
      }
      return;
    }

    try {
      setUpdatingProgress(true);
      const currentLesId = currentLesson._id || currentLesson.id;
      const currentModId = currentModule?._id || currentModule?.id;

      const updatedEnrollment = await enrollmentService.updateProgress(
        enrollment._id || enrollment.id,
        currentLesId,
        true,
        { moduleId: currentModId, courseId }
      );

      setEnrollment(updatedEnrollment);
      showSuccess('Congratulations! Course completed. Certification assessment unlocked!');

      try {
        const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
        if (asmStatus?.assessment?.id) {
          setAssessmentId(asmStatus.assessment.id);
        }
      } catch (_) {}
    } catch (err) {
      showError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save final lesson completion.'
      );
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Navigate Previous
  const handlePrevLesson = () => {
    if (!prevItem || updatingProgress) return;
    navigateToLesson(prevItem.module, prevItem.lesson);
  };

  // Select lesson from sidebar: if jumping forward, automatically completes current lesson
  const handleSelectLesson = async (targetMod, targetLes) => {
    if (updatingProgress || !targetLes) return;

    const targetId = targetLes._id || targetLes.id;
    const curId = currentLesson ? currentLesson._id || currentLesson.id : null;
    if (targetId === curId) return;

    const targetIndex = flattenedLessons.findIndex(
      (item) => (item.lesson._id || item.lesson.id) === targetId
    );

    // If navigating forward to an upcoming section and current lesson is incomplete
    if (targetIndex > currentIndex && !isCurrentCompleted && currentLesson && enrollment) {
      try {
        setUpdatingProgress(true);
        const currentModId = currentModule?._id || currentModule?.id;

        const updatedEnrollment = await enrollmentService.updateProgress(
          enrollment._id || enrollment.id,
          curId,
          true,
          { moduleId: currentModId, courseId }
        );

        setEnrollment(updatedEnrollment);

        if (
          updatedEnrollment.progressPercentage === 100 ||
          updatedEnrollment.status === 'completed'
        ) {
          showSuccess('Congratulations! Course completed. Certification assessment unlocked!');
          try {
            const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
            if (asmStatus?.assessment?.id) {
              setAssessmentId(asmStatus.assessment.id);
            }
          } catch (_) {}
        } else {
          showSuccess('Lesson completed!');
        }

        navigateToLesson(targetMod, targetLes);
      } catch (err) {
        showError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to complete lesson before advancing.'
        );
      } finally {
        setUpdatingProgress(false);
      }
    } else {
      // Navigating backwards or current lesson is already complete
      navigateToLesson(targetMod, targetLes);
    }
  };

  // Retain manual toggle completion button
  const handleToggleCompletion = async () => {
    if (!currentLesson || !enrollment || updatingProgress) return;

    const lessonIdToUpdate = currentLesson._id || currentLesson.id;
    const currentModId = currentModule?._id || currentModule?.id;
    const nextState = !isCurrentCompleted;

    try {
      setUpdatingProgress(true);
      const updatedEnrollment = await enrollmentService.updateProgress(
        enrollment._id || enrollment.id,
        lessonIdToUpdate,
        nextState,
        { moduleId: currentModId, courseId }
      );

      setEnrollment(updatedEnrollment);

      if (nextState) {
        if (
          updatedEnrollment.progressPercentage === 100 ||
          updatedEnrollment.status === 'completed'
        ) {
          showSuccess('Congratulations! Course completed. Certification assessment unlocked!');
          try {
            const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
            if (asmStatus?.assessment?.id) {
              setAssessmentId(asmStatus.assessment.id);
            }
          } catch (_) {}
        } else {
          showSuccess('Lesson marked as completed!');
        }
      } else {
        showSuccess('Lesson marked as incomplete.');
      }
    } catch (err) {
      showError(err?.response?.data?.message || err.message || 'Failed to update lesson progress.');
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
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
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
          {/* Assessment Unlock Banner on 100% Course Completion */}
          {(enrollment?.progressPercentage === 100 || enrollment?.status === 'completed') && (
            <div
              className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-lg shadow-teal-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
              data-testid="assessment-unlock-banner"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-600/50 border border-teal-400/40 text-teal-200 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Course Complete! Assessment Unlocked
                  </h4>
                  <p className="text-xs text-teal-100/90 mt-0.5 leading-relaxed">
                    You have finished 100% of the lessons. You are now eligible to take the certification exam.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-teal-50 text-teal-950 font-bold text-xs sm:text-sm shadow-md transition-all duration-150 inline-flex items-center gap-2 border border-white focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                style={{ color: '#042f2e', backgroundColor: '#ffffff' }}
                onClick={() =>
                  navigate(
                    assessmentId ? `/assessments/${assessmentId}` : `/courses/${courseId}`
                  )
                }
              >
                <span className="font-bold text-teal-950" style={{ color: '#042f2e' }}>
                  Take Certification Exam
                </span>
                <ArrowRight className="w-4 h-4 text-teal-950 shrink-0" style={{ color: '#042f2e' }} />
              </button>
            </div>
          )}

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
            onClick={handlePrevLesson}
            disabled={!prevItem || updatingProgress}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous Lesson
          </Button>

          <div className="text-center hidden sm:block">
            <span className="text-xs text-slate-500 font-medium">
              {currentIndex >= 0
                ? `Lesson ${currentIndex + 1} of ${flattenedLessons.length} • ${completedSet.size} completed (${enrollment?.progressPercentage ?? 0}%)`
                : ''}
            </span>
          </div>

          {nextItem ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNextLesson}
              isLoading={updatingProgress}
              disabled={updatingProgress}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next Lesson
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className={
                isCurrentCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }
              onClick={handleCompleteFinalLesson}
              isLoading={updatingProgress}
              disabled={updatingProgress}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isCurrentCompleted
                ? assessmentId
                  ? 'Take Certification Assessment'
                  : 'Course Completed'
                : 'Complete Course'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPlayerPage;
