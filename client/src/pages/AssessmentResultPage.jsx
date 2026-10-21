import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { ResultSummary } from '../components/assessments/ResultSummary';
import { AttemptHistory } from '../components/assessments/AttemptHistory';
import assessmentService from '../services/assessmentService';

export const AssessmentResultPage = () => {
  const { assessmentId, attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [resultData, setResultData] = useState(location.state?.result || null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);

  const fetchResult = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [resData, historyData] = await Promise.all([
        assessmentService.getAttemptResult(attemptId),
        assessmentService.getMyAssessmentHistory().catch(() => []),
      ]);

      setResultData(resData);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to retrieve evaluated assessment result.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6" data-testid="assessment-result-skeleton">
        <Skeleton height="20px" width="140px" className="rounded-lg" />
        <Skeleton height="320px" className="rounded-2xl" />
        <Skeleton height="200px" className="rounded-2xl" />
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Result Unavailable"
          message={error || 'Unable to load assessment result.'}
          actionText="Back to Assessments"
          onAction={() => navigate('/assessments')}
        />
      </div>
    );
  }

  // Filter attempt history for this assessment
  const attemptsForThisAssessment = history.filter((att) => {
    const aId = att.assessmentId || att.assessment?._id || att.assessment;
    return aId === assessmentId;
  });

  const maxAttempts = resultData?.assessment?.maxAttempts ?? null;
  const attemptsUsed = attemptsForThisAssessment.length > 0
    ? attemptsForThisAssessment.length
    : (resultData?.attemptNumber || 1);

  const canRetake = maxAttempts == null || attemptsUsed < maxAttempts;
  const remainingAttempts = maxAttempts != null ? Math.max(0, maxAttempts - attemptsUsed) : null;

  const handleRetake = () => {
    navigate(`/assessments/${assessmentId}`);
  };

  const courseId = resultData?.assessment?.course?._id || resultData?.assessment?.course?.id || resultData?.assessment?.course;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12" data-testid="assessment-result-page">
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

      {/* Authoritative Result Summary Card */}
      <ResultSummary
        resultData={resultData}
        onRetake={handleRetake}
        canRetake={canRetake}
        remainingAttempts={remainingAttempts}
      />

      {/* Attempt History Table */}
      {attemptsForThisAssessment.length > 0 && (
        <AttemptHistory
          attempts={attemptsForThisAssessment}
          assessmentId={assessmentId}
          title="All Attempts for This Assessment"
          subtitle="Your complete performance timeline for this evaluation"
        />
      )}
    </div>
  );
};

export default AssessmentResultPage;
