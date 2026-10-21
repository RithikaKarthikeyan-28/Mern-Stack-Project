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
  Award,
  Lock,
  FileText,
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
import assessmentService from '../services/assessmentService';

export const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState(null);
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

      // Fetch assessment status safely
      try {
        const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
        setAssessmentStatus(asmStatus);
      } catch (asmErr) {
        setAssessmentStatus(null);
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
      try {
        const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
        setAssessmentStatus(asmStatus);
      } catch (e) {
        // Non-blocking assessment status fetch
      }
      showSuccess(`Successfully enrolled in ${course?.title || 'the course'}!`);
    } catch (err) {
      if (err.response?.status === 409) {
        showWarning('You are already enrolled in this course.');
        // Refresh enrollment state
        const existing = await enrollmentService.getCourseEnrollment(courseId);
        if (existing) {
          setEnrollment(existing);
          try {
            const asmStatus = await assessmentService.getCourseAssessmentStatus(courseId);
            setAssessmentStatus(asmStatus);
          } catch (e) {
            // Non-blocking assessment status fetch
          }
        }
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Courses Catalog</span>
        </Link>
      </div>

      {/* 2. Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-teal-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

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
                <Clock className="w-4 h-4 text-teal-400" />
                <span>{course.duration} minutes total</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>{curriculum.length} modules</span>
            </div>

            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>{totalLessons} lessons</span>
            </div>

            {course.trainer?.name && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-400" />
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
                  color={isCompleted ? 'emerald' : 'teal'}
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

                <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
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

          {/* Certification Assessment Card */}
          {assessmentStatus?.hasAssessment && (
            <Card
              className="p-6 border-slate-200/90 shadow-sm space-y-5"
              data-testid="certification-assessment-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-700" />
                    <h3 className="text-base font-bold text-slate-900">
                      Certification Exam
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Official assessment required to earn your verified credential
                  </p>
                </div>
                {assessmentStatus.hasPassed ? (
                  <Badge variant="success" size="sm" dot>
                    Certified
                  </Badge>
                ) : assessmentStatus.isUnlocked ? (
                  <Badge variant="primary" size="sm">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    Locked
                  </Badge>
                )}
              </div>

              {/* Assessment Meta Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>{assessmentStatus.assessment.totalQuestions || 10} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>{assessmentStatus.assessment.timeLimitMinutes || 30} Mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Pass: {assessmentStatus.assessment.passingPercentage || 70}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  <span>{assessmentStatus.assessment.totalMarks || 20} Marks</span>
                </div>
              </div>

              {/* Action and Status based on user role and completion */}
              {user?.role && user.role !== 'employee' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Course assessments and grading rubrics are administered through the {user.role === 'admin' ? 'Admin' : 'Trainer'} portal.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => navigate(user.role === 'admin' ? '/admin/assessments' : '/trainer/assessments')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    View in Assessment Manager
                  </Button>
                </div>
              ) : assessmentStatus.hasPassed ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Assessment Passed</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      You passed with a score of {assessmentStatus.latestAttempt?.percentage || 0}% ({assessmentStatus.latestAttempt?.obtainedMarks || 0}/{assessmentStatus.latestAttempt?.totalMarks || 0} marks).
                    </p>
                  </div>

                  {assessmentStatus.certificate ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center bg-teal-700 hover:bg-teal-800 text-white"
                      onClick={() => navigate(`/certificates/${assessmentStatus.certificate.id}`)}
                      leftIcon={<Award className="w-4 h-4" />}
                    >
                      View Certificate
                    </Button>
                  ) : null}

                  {assessmentStatus.latestAttempt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-slate-600"
                      onClick={() =>
                        navigate(
                          `/assessments/${assessmentStatus.assessment.id}/result/${assessmentStatus.latestAttempt.id}`
                        )
                      }
                    >
                      Review Assessment Results
                    </Button>
                  )}
                </div>
              ) : assessmentStatus.isUnlocked ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/70 text-teal-950 space-y-1">
                    <p className="text-xs font-semibold text-teal-900">
                      Prerequisites Met!
                    </p>
                    <p className="text-[11px] text-teal-700 leading-relaxed">
                      You have completed 100% of the lessons in this course. You are eligible to take the certification exam.
                    </p>
                  </div>

                  {assessmentStatus.latestAttempt && assessmentStatus.latestAttempt.result === 'failed' && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800">
                      Last attempt: {assessmentStatus.latestAttempt.percentage}% (Need {assessmentStatus.assessment.passingPercentage}% to pass). You can retake the test.
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center bg-teal-700 hover:bg-teal-800 text-white"
                    onClick={() => navigate(`/assessments/${assessmentStatus.assessment.id}`)}
                    leftIcon={<Award className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {assessmentStatus.attemptsCount > 0 ? 'Retake Assessment' : 'Start Assessment'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Prerequisites Incomplete</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {assessmentStatus.lockReason ||
                        'Complete all modules and lessons in this course to unlock the certification assessment.'}
                    </p>
                    {isEnrolled && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Course Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} max={100} size="xs" color="teal" />
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="md"
                    disabled
                    className="w-full justify-center opacity-60 cursor-not-allowed"
                    leftIcon={<Lock className="w-4 h-4" />}
                  >
                    Assessment Locked
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
