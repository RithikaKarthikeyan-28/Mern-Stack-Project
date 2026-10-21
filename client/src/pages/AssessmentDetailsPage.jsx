import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  BookOpen,
  Award,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { AttemptHistory } from '../components/assessments/AttemptHistory';
import assessmentService from '../services/assessmentService';
import { useToast } from '../context/ToastContext';

export const AssessmentDetailsPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assessmentData, historyData] = await Promise.all([
        assessmentService.getAssessmentById(assessmentId),
        assessmentService.getMyAssessmentHistory().catch(() => []),
      ]);
      setAssessment(assessmentData);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assessment details.');
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Filter attempts for this assessment
  const attemptsForThisAssessment = history.filter((att) => {
    const aId = att.assessmentId || att.assessment?._id || att.assessment;
    return aId === assessmentId;
  });

  const attemptsUsed = attemptsForThisAssessment.length;
  const maxAttempts = assessment?.maxAttempts ?? null;
  const maxAttemptsReached = maxAttempts != null && attemptsUsed >= maxAttempts;
  const passingPercentage = assessment?.passingPercentage ?? 60;
  const timeLimitMinutes = assessment?.timeLimitMinutes;

  const latestAttempt = attemptsForThisAssessment[0] || null;
  const hasPassed = attemptsForThisAssessment.some((att) => att.result === 'passed');

  const handleStartAttempt = async () => {
    if (isStarting || maxAttemptsReached) return;

    setIsStarting(true);
    try {
      const attempt = await assessmentService.startAttempt(assessmentId);
      const targetAttemptId = attempt._id || attempt.id;
      navigate(`/assessments/${assessmentId}/attempt/${targetAttemptId}`, {
        state: { attemptId: targetAttemptId, attempt },
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to start assessment attempt.';
      if (toast?.error) {
        toast.error(msg);
      }
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6" data-testid="assessment-details-skeleton">
        <Skeleton height="20px" width="120px" className="rounded-lg" />
        <Card className="p-8 space-y-4">
          <Skeleton height="32px" width="60%" className="rounded-lg" />
          <Skeleton height="16px" width="90%" className="rounded-lg" />
          <Skeleton height="16px" width="75%" className="rounded-lg" />
          <div className="grid grid-cols-3 gap-4 pt-6">
            <Skeleton height="60px" className="rounded-xl" />
            <Skeleton height="60px" className="rounded-xl" />
            <Skeleton height="60px" className="rounded-xl" />
          </div>
        </Card>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Assessment Unavailable"
          message={error}
          onRetry={fetchDetails}
        />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Assessment Not Found"
          message="The requested assessment could not be found or you do not have permission to view it."
          actionText="Back to Assessments"
          onAction={() => navigate('/assessments')}
        />
      </div>
    );
  }

  const courseTitle = assessment.course?.title || 'Associated Course';
  const courseId = assessment.course?._id || assessment.course?.id;
  const moduleTitle = assessment.module?.title || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12" data-testid="assessment-details-page">
      {/* Back Link */}
      <div>
        <Link
          to={courseId ? `/courses/${courseId}` : '/assessments'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{courseId ? 'Back to Course' : 'Back to Assessments'}</span>
        </Link>
      </div>

      {/* Hero Overview Card */}
      <Card className="p-6 sm:p-8 border-slate-200/90 shadow-sm" padding={false}>
        <div className="p-6 sm:p-8 space-y-4">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" size="md">
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              {courseTitle}
            </Badge>

            {moduleTitle && (
              <Badge variant="default" size="md">
                <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {moduleTitle}
              </Badge>
            )}

            {hasPassed ? (
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Passed
              </Badge>
            ) : attemptsUsed > 0 ? (
              <Badge variant="warning" size="md">
                Attempted ({attemptsUsed})
              </Badge>
            ) : null}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A2A] leading-tight">
              {assessment.title}
            </h1>
            {assessment.description && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {assessment.description}
              </p>
            )}
          </div>

          {/* Assessment Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Passing Score
              </span>
              <span className="text-xl font-bold text-[#102A2A] mt-0.5 block">
                {passingPercentage}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Time Limit
              </span>
              <span className="text-xl font-bold text-[#102A2A] mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {timeLimitMinutes ? `${timeLimitMinutes} min` : 'Untimed'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Allowed Attempts
              </span>
              <span className="text-xl font-bold text-[#102A2A] mt-0.5 block">
                {maxAttempts ? `${maxAttempts}` : 'Unlimited'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Attempts Used
              </span>
              <span className="text-xl font-bold text-teal-700 mt-0.5 block">
                {maxAttempts ? `${attemptsUsed} of ${maxAttempts}` : `${attemptsUsed}`}
              </span>
            </div>
          </div>
        </div>

        {/* Start Assessment CTA Footer */}
        <div className="p-6 sm:p-8 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
          <div className="text-xs text-slate-600 max-w-md">
            {maxAttemptsReached ? (
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                You have reached the maximum attempt limit for this assessment.
              </span>
            ) : hasPassed ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <Award className="w-4 h-4 shrink-0" />
                You have already passed this assessment! You may retake it to improve your score if attempts remain.
              </span>
            ) : attemptsUsed > 0 ? (
              <span>
                Your highest attempt score is {latestAttempt?.percentage}%. Click below to start your next attempt.
              </span>
            ) : (
              <span>
                Make sure you have reviewed all course modules and lessons before beginning your quiz attempt.
              </span>
            )}
          </div>

          <div className="w-full sm:w-auto shrink-0">
            {maxAttemptsReached ? (
              <Button
                variant="outline"
                size="lg"
                disabled
                className="w-full sm:w-auto"
              >
                Max Attempts Reached
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartAttempt}
                isLoading={isStarting}
                leftIcon={attemptsUsed > 0 ? <RotateCcw className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                className="w-full sm:w-auto font-bold px-8 shadow-md shadow-teal-900/10"
              >
                {attemptsUsed > 0 ? 'Retake Assessment' : 'Start Assessment'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Attempt History Section */}
      {attemptsForThisAssessment.length > 0 && (
        <AttemptHistory
          attempts={attemptsForThisAssessment}
          assessmentId={assessmentId}
          title="Your Previous Attempts"
          subtitle="Record of all previous submissions for this specific assessment"
        />
      )}
    </div>
  );
};

export default AssessmentDetailsPage;
