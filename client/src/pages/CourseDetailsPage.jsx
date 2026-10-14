import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  User,
  BookOpen,
  Layers,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import CurriculumAccordion from '../components/courses/CurriculumAccordion';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';

export const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState(null);

  // Enrollment button loading state
  const [enrolling, setEnrolling] = useState(false);

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details, curriculum, and user's enrollment
      const [courseRes, curriculumRes, enrollmentRes] = await Promise.allSettled([
        courseService.getCourseById(courseId),
        courseService.getCourseCurriculum(courseId),
        enrollmentService.getCourseEnrollment(courseId),
      ]);

      if (courseRes.status === 'fulfilled' && courseRes.value) {
        setCourse(courseRes.value);
      } else {
        throw new Error('Course not found or is no longer available.');
      }

      if (curriculumRes.status === 'fulfilled') {
        setCurriculum(curriculumRes.value || []);
      }

      if (enrollmentRes.status === 'fulfilled') {
        setEnrollment(enrollmentRes.value || null);
      } else {
        setEnrollment(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to load course details.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Handle Enrollment Action
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const newEnrollment = await enrollmentService.enroll(courseId);
      setEnrollment(newEnrollment);
      showSuccess(`Successfully enrolled in ${course?.title || 'the course'}!`);
    } catch (err) {
      if (err.response?.status === 409) {
        showWarning('You are already enrolled in this course.');
        // Refresh enrollment state
        const existing = await enrollmentService.getCourseEnrollment(courseId);
        if (existing) setEnrollment(existing);
      } else {
        const errorMsg = err.normalizedMessage || err.response?.data?.message || err.message;
        showError(errorMsg || 'Failed to enroll in this course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in" data-testid="course-details-skeleton">
        <Skeleton height="32px" width="160px" />
        <div className="rounded-3xl bg-slate-200 p-8 h-64 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton height="180px" />
            <Skeleton height="260px" />
          </div>
          <div>
            <Skeleton height="220px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6" data-testid="course-not-found">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </Link>
        <ErrorState
          title="Course Not Found"
          message={error || 'The requested course does not exist or you do not have permission to view it.'}
          onRetry={loadCourseData}
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/courses')}>
              Explore Available Courses
            </Button>
          }
        />
      </div>
    );
  }

  const isEnrolled = !!enrollment && enrollment.status !== 'dropped';
  const isCompleted = enrollment?.status === 'completed' || enrollment?.progressPercentage === 100;
  const progress = enrollment?.progressPercentage ?? 0;
  const completedLessons = enrollment?.completedLessons || [];

  // Count total lessons
  const totalLessons = curriculum.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);

  const levelVariant = {
    beginner: 'success',
    intermediate: 'primary',
    advanced: 'warning',
  }[course.level] || 'default';

  return (
    <div className="space-y-8" data-testid="course-details-page">
      {/* 1. Back Link */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Courses Catalog</span>
        </Link>
      </div>

      {/* 2. Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" size="sm">
              {course.category || 'General'}
            </Badge>
            {course.level && (
              <Badge variant={levelVariant} size="sm" className="capitalize">
                {course.level}
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="success" size="sm" dot>
                Completed
              </Badge>
            )}
            {isEnrolled && !isCompleted && (
              <Badge variant="primary" size="sm" dot>
                Enrolled
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {course.description}
          </p>

          {/* Metadata Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300">
            {course.duration ? (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{course.duration} minutes total</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{curriculum.length} modules</span>
            </div>

            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>{totalLessons} lessons</span>
            </div>

            {course.trainer?.name && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Instructor: {course.trainer.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Curriculum & Overview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Curriculum */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Course Curriculum</h3>
                <p className="text-xs text-slate-500">
                  {curriculum.length} modules • {totalLessons} lessons
                </p>
              </div>
            </div>

            <CurriculumAccordion
              modules={curriculum}
              completedLessonIds={completedLessons}
              isEnrolled={isEnrolled}
            />
          </section>
        </div>

        {/* Right Column: Enrollment Card */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6 border-slate-200/90 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900">
              {isCompleted
                ? 'Course Completed'
                : isEnrolled
                ? 'Your Progress'
                : 'Enrollment'}
            </h3>

            {isEnrolled ? (
              <div className="space-y-4">
                <ProgressBar
                  value={progress}
                  max={100}
                  showLabel
                  label="Completion Status"
                  color={isCompleted ? 'emerald' : 'indigo'}
                  size="md"
                />

                <p className="text-xs text-slate-500 leading-relaxed">
                  {isCompleted
                    ? 'Congratulations! You have completed all lessons in this course. You can review any lesson at any time.'
                    : `You have completed ${progress}% of the course. Resume learning to pick up where you left off.`}
                </p>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => navigate(`/learn/${courseId}`)}
                  leftIcon={
                    isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )
                  }
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isCompleted ? 'Review Course' : 'Continue Learning'}
                </Button>
              </div>
            ) : user?.role && user.role !== 'employee' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Course self-enrollment and completion tracking are designed for <strong>Employees</strong>.
                </p>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Signed in as {user.role === 'admin' ? 'Administrator' : 'Trainer'}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {user.role === 'admin'
                      ? 'As an Administrator, you manage course catalogs and assign training to employees through the Admin Portal.'
                      : 'As a Trainer, you author course content, manage curriculum, and evaluate learner progress.'}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => navigate(user.role === 'admin' ? '/admin/courses' : '/trainer/courses')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Manage Courses in {user.role === 'admin' ? 'Admin Portal' : 'Trainer Portal'}
                </Button>

                <p className="text-[11px] text-center text-slate-400">
                  To experience taking this course as a learner, sign in with an employee account.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enroll in this course to gain immediate access to all curriculum modules, lesson materials, and track your completion progress.
                </p>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Included in Enrollment:</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Full access to all {curriculum.length} modules</li>
                    <li>Interactive lessons & video streams</li>
                    <li>Verifiable certificate upon completion</li>
                  </ul>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={handleEnroll}
                  isLoading={enrolling}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enroll in Course
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
