import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  PlayCircle,
  Award,
  Clock,
  Search,
  CheckCircle2,
  Layers,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import enrollmentService from '../services/enrollmentService';
import assessmentService from '../services/assessmentService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export const MyLearningPage = () => {

  const [enrollments, setEnrollments] = useState([]);
  const [assessmentStatuses, setAssessmentStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'in_progress' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMyLearning = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await enrollmentService.getMyEnrollments();
      const list = Array.isArray(data) ? data : [];
      setEnrollments(list);

      // Fetch assessment & certificate status for each enrolled course in parallel
      const statusMap = {};
      await Promise.all(
        list.map(async (enr) => {
          const cId = enr.course?._id || enr.course?.id || enr.course;
          if (cId) {
            try {
              const asmStatus = await assessmentService.getCourseAssessmentStatus(cId);
              if (asmStatus) {
                statusMap[cId.toString()] = asmStatus;
              }
            } catch {
              // Non-blocking assessment status discovery
            }
          }
        })
      );
      setAssessmentStatuses(statusMap);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load your learning enrollments. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLearning();
  }, [fetchMyLearning]);

  // Compute stats
  const stats = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let notStarted = 0;

    enrollments.forEach((e) => {
      const prog = e.progressPercentage || 0;
      if (e.status === 'completed' || prog === 100) {
        completed++;
      } else if (prog > 0) {
        inProgress++;
      } else {
        notStarted++;
      }
    });

    return {
      total: enrollments.length,
      inProgress,
      completed,
      notStarted,
    };
  }, [enrollments]);

  // Filter list by tab and search
  const filteredEnrollments = useMemo(() => {
    let result = enrollments;

    if (activeTab === 'in_progress') {
      result = result.filter(
        (e) => (e.progressPercentage || 0) > 0 && (e.progressPercentage || 0) < 100 && e.status !== 'completed'
      );
    } else if (activeTab === 'completed') {
      result = result.filter((e) => (e.progressPercentage || 0) === 100 || e.status === 'completed');
    } else if (activeTab === 'not_started') {
      result = result.filter((e) => (e.progressPercentage || 0) === 0 && e.status !== 'completed');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const title = (e.course?.title || '').toLowerCase();
        const category = (e.course?.category || '').toLowerCase();
        const desc = (e.course?.description || '').toLowerCase();
        return title.includes(q) || category.includes(q) || desc.includes(q);
      });
    }

    return result;
  }, [enrollments, activeTab, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12" data-testid="my-learning-loading">
        <Skeleton height="140px" className="rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton height="80px" className="rounded-2xl" />
          <Skeleton height="80px" className="rounded-2xl" />
          <Skeleton height="80px" className="rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton height="320px" className="rounded-2xl" />
          <Skeleton height="320px" className="rounded-2xl" />
          <Skeleton height="320px" className="rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <ErrorState
          title="Unable to Load My Learning"
          message={error}
          onRetry={fetchMyLearning}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" data-testid="my-learning-page">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#0D544F] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#ECFDF5] text-[#0F766E] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[#A7DCCB]">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Enrolled Curriculum Progress</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            My Learning
          </h1>
          <p className="text-sm text-teal-100/95 leading-relaxed">
            Continue learning your enrolled courses, track lesson progress toward 100% completion, and unlock official certification exams.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <Button
            variant="outline-light"
            size="sm"
            onClick={fetchMyLearning}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh my learning courses"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Courses ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('in_progress')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'in_progress'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>

        {/* Search Input & Browse Courses Action */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search enrolled courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border-slate-200 rounded-xl w-full"
            />
          </div>

          <Link to="/courses">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              <span>Browse Courses</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Course Cards Grid or Empty State */}
      {filteredEnrollments.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center border border-slate-200 rounded-2xl bg-white shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-100">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#102A2A] mb-1">
            {enrollments.length === 0 ? 'No Enrolled Courses Yet' : 'No Matching Courses Found'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            {enrollments.length === 0
              ? 'You have not enrolled in any learning courses yet. Browse our comprehensive technical curriculum to build in-demand skills and earn certificates.'
              : 'Try clearing your search query or switching tabs to view other enrolled courses.'}
          </p>
          {enrollments.length === 0 ? (
            <Link to="/courses">
              <Button variant="primary" size="md" className="bg-[#0F766E] hover:bg-[#115E59] text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>Browse All Courses</span>
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="enrolled-courses-grid">
          {filteredEnrollments.map((enrollment) => {
            const course = enrollment.course || {};
            const courseId = course._id || course.id || course;
            const progress = enrollment.progressPercentage || 0;
            const isCompleted = enrollment.status === 'completed' || progress === 100;
            const isNotStarted = progress === 0 && !isCompleted;
            const isInProgress = progress > 0 && !isCompleted;

            const totalLessons = enrollment.totalLessons || (enrollment.completedLessons?.length ? enrollment.completedLessons.length : 4);
            const completedLessons = enrollment.completedLessonsCount !== undefined
              ? enrollment.completedLessonsCount
              : (Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0);

            const asmInfo = assessmentStatuses[courseId?.toString()] || null;
            const hasCertificate = asmInfo?.hasPassed || asmInfo?.certificate;
            const certId = asmInfo?.certificate?.id || asmInfo?.certificate?._id;

            return (
              <Card
                key={enrollment._id || enrollment.id}
                className="flex flex-col border border-slate-200/90 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 bg-white"
                data-testid={`enrolled-course-${courseId}`}
              >
                {/* Course Header Bar */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                      {course.category || 'Technology'}
                    </span>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <Badge variant="success" size="sm" className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </Badge>
                    ) : isInProgress ? (
                      <Badge variant="info" size="sm" className="font-bold flex items-center gap-1 bg-teal-50 text-teal-800 border-teal-200">
                        <Clock className="w-3 h-3 text-teal-700" />
                        <span>In Progress</span>
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm" className="font-medium text-slate-600 bg-slate-100">
                        <span>Not Started</span>
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#102A2A] line-clamp-1 group-hover:text-teal-700 transition-colors">
                    {course.title || 'Untitled Course'}
                  </h3>

                  {enrollment.isMandatory && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Mandatory Department Assignment
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {course.description || 'Comprehensive curriculum with practical lessons and hands-on exercises.'}
                  </p>
                </div>

                {/* Meta details & Lesson counter */}
                <div className="px-5 py-2.5 bg-slate-50 border-t border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.duration ? `${course.duration} hrs` : 'Self-paced'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {completedLessons} of {totalLessons} lessons
                    </span>
                  </div>
                </div>

                {/* Progress bar section */}
                <div className="p-5 pt-4 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Course Progress</span>
                    <span className={`font-black ${isCompleted ? 'text-emerald-700' : 'text-teal-700'}`}>
                      {progress}%
                    </span>
                  </div>
                  <ProgressBar
                    progress={progress}
                    size="sm"
                    className="h-2 rounded-full"
                    color={isCompleted ? 'emerald' : 'teal'}
                  />

                  {/* Assessment / Certification status notification banner */}
                  {isCompleted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-teal-900 font-semibold truncate">
                        <Award className="w-4 h-4 text-teal-700 shrink-0" />
                        <span className="truncate">
                          {hasCertificate ? 'Certificate Earned!' : 'Assessment Unlocked!'}
                        </span>
                      </div>
                      {hasCertificate ? (
                        <Link to={certId ? `/certificates/${certId}` : '/certificates'}>
                          <span className="text-[11px] font-bold text-teal-800 underline hover:text-teal-950 whitespace-nowrap">
                            View Cert
                          </span>
                        </Link>
                      ) : asmInfo?.assessmentId ? (
                        <Link to={`/assessments/${asmInfo.assessmentId}`}>
                          <span className="text-[11px] font-bold text-teal-800 underline hover:text-teal-950 whitespace-nowrap">
                            Take Exam
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="p-5 pt-0 mt-auto flex flex-wrap items-center gap-2">
                  <Link to={`/learn/${courseId}`} className="flex-1">
                    <Button
                      variant={isCompleted ? 'outline' : 'primary'}
                      size="sm"
                      className={`w-full justify-center ${
                        isCompleted
                          ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          : 'bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs'
                      }`}
                      leftIcon={<PlayCircle className="w-4 h-4" />}
                    >
                      {isNotStarted ? 'Start Learning' : isCompleted ? 'Review Lessons' : 'Continue Learning'}
                    </Button>
                  </Link>

                  {/* Secondary Action: Assessment or Certificate */}
                  {isCompleted && hasCertificate && (
                    <Link to={certId ? `/certificates/${certId}` : '/certificates'}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        title="View Official Certificate"
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}

                  {isCompleted && !hasCertificate && asmInfo?.assessmentId && (
                    <Link to={`/assessments/${asmInfo.assessmentId}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                        title="Take Certification Exam"
                      >
                        <FileCheck className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyLearningPage;
