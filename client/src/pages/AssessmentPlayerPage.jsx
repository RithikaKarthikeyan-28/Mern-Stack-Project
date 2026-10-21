import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { AssessmentHeader } from '../components/assessments/AssessmentHeader';
import { QuestionCard } from '../components/assessments/QuestionCard';
import { QuestionNavigator } from '../components/assessments/QuestionNavigator';
import { AssessmentReview } from '../components/assessments/AssessmentReview';
import assessmentService from '../services/assessmentService';
import { useToast } from '../context/ToastContext';

export const AssessmentPlayerPage = () => {
  const { assessmentId, attemptId: paramAttemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [attemptId, setAttemptId] = useState(paramAttemptId || location.state?.attemptId || null);
  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [error, setError] = useState(null);

  // Initialize or fetch attempt and questions
  useEffect(() => {
    let isMounted = true;

    const initializeQuiz = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch attempt data (contains sanitized questions without correctAnswers)
        const attemptData = await assessmentService.getAttemptData(assessmentId);
        if (!isMounted) return;

        const loadedAssessment = attemptData?.assessment || null;
        const loadedQuestions = Array.isArray(attemptData?.questions) ? attemptData.questions : [];

        setAssessment(loadedAssessment);
        setQuestions(loadedQuestions);

        // 2. Ensure we have an active attempt
        let activeAttemptId = paramAttemptId || location.state?.attemptId || null;
        let activeAttempt = location.state?.attempt || null;

        if (!activeAttemptId) {
          activeAttempt = await assessmentService.startAttempt(assessmentId);
          if (!isMounted) return;
          activeAttemptId = activeAttempt._id || activeAttempt.id;
        } else if (!activeAttempt) {
          try {
            activeAttempt = await assessmentService.getAttemptById(activeAttemptId);
          } catch {
            activeAttempt = await assessmentService.startAttempt(assessmentId);
            activeAttemptId = activeAttempt._id || activeAttempt.id;
          }
          if (!isMounted) return;
        }

        setAttemptId(activeAttemptId);
        setAttempt(activeAttempt);

        // If attempt already has previous answers saved in-progress
        if (activeAttempt?.answers && Array.isArray(activeAttempt.answers)) {
          const initialAnswers = {};
          activeAttempt.answers.forEach((ans) => {
            const qId = ans.question?._id || ans.question?.id || ans.question;
            if (qId && Array.isArray(ans.selectedAnswers) && ans.selectedAnswers.length > 0) {
              initialAnswers[qId] = ans.selectedAnswers;
            }
          });
          if (Object.keys(initialAnswers).length > 0) {
            setAnswers(initialAnswers);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Unable to load assessment workspace. You may not be enrolled in this course.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeQuiz();

    return () => {
      isMounted = false;
    };
  }, [assessmentId, paramAttemptId, location.state]);

  // Real-time draft answer autosave
  const saveDraft = useCallback(
    async (currentAnswers) => {
      if (!attemptId) return;
      try {
        const payloadAnswers = Object.entries(currentAnswers)
          .filter(([_, sel]) => Array.isArray(sel) && sel.length > 0)
          .map(([qId, sel]) => ({
            question: qId,
            selectedAnswers: sel,
          }));

        if (assessmentService.saveDraftAnswers) {
          await assessmentService.saveDraftAnswers(attemptId, { answers: payloadAnswers });
        }
      } catch (err) {
        // Silent catch for background autosave
      }
    },
    [attemptId]
  );

  // Answer selection handlers with real-time persistence
  const handleSelectSingle = (key) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const newAnswers = {
      ...answers,
      [currentQ.id]: [key],
    };
    setAnswers(newAnswers);
    saveDraft(newAnswers);
  };

  const handleToggleMultiple = (key) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentList = answers[currentQ.id] || [];
    const nextList = currentList.includes(key)
      ? currentList.filter((k) => k !== key)
      : [...currentList, key];
    const newAnswers = {
      ...answers,
      [currentQ.id]: nextList,
    };
    setAnswers(newAnswers);
    saveDraft(newAnswers);
  };

  // Compute stats
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const sel = answers[q.id];
      return Array.isArray(sel) && sel.length > 0;
    }).length;
  }, [questions, answers]);

  // Calculate remaining seconds synced with server expiresAt
  const timeRemainingSeconds = useMemo(() => {
    const timeLimitMinutes = assessment?.timeLimitMinutes;
    if (!timeLimitMinutes) return null;

    if (attempt?.expiresAt) {
      const expiresTime = new Date(attempt.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
      return remaining;
    }

    if (attempt?.startedAt) {
      const startedTime = new Date(attempt.startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedTime) / 1000);
      const remaining = timeLimitMinutes * 60 - elapsedSeconds;
      return remaining > 0 ? remaining : 0;
    }
    return timeLimitMinutes * 60;
  }, [assessment?.timeLimitMinutes, attempt?.expiresAt, attempt?.startedAt]);

  // Submission handler
  const handleSubmit = async () => {
    if (isSubmitting || !attemptId) return;

    setIsSubmitting(true);
    setIsReviewOpen(false);

    try {
      // Build safe answer payload: strictly filter questions with non-empty selected answers
      const payloadAnswers = Object.entries(answers)
        .filter(([_, sel]) => Array.isArray(sel) && sel.length > 0)
        .map(([qId, sel]) => ({
          question: qId,
          selectedAnswers: sel,
        }));

      // Submit only { answers } — NEVER score, percentage, result, or employee info
      const submittedResult = await assessmentService.submitAttempt(attemptId, {
        answers: payloadAnswers,
      });

      const finalAttemptId = submittedResult?._id || submittedResult?.id || attemptId;
      if (toast?.success) {
        toast.success('Assessment submitted and graded successfully!');
      }

      navigate(`/assessments/${assessmentId}/result/${finalAttemptId}`, {
        replace: true,
        state: { result: submittedResult },
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit assessment attempt.';
      if (toast?.error) {
        toast.error(msg);
      }
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    if (toast?.warning) {
      toast.warning('Time has expired! Submitting your answers automatically.');
    }
    handleSubmit();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="assessment-player-skeleton">
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Skeleton height="24px" width="220px" className="rounded-lg" />
            <Skeleton height="36px" width="120px" className="rounded-xl" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-8 space-y-4">
              <Skeleton height="20px" width="100px" className="rounded-lg" />
              <Skeleton height="28px" width="80%" className="rounded-lg" />
              <div className="space-y-3 pt-6">
                <Skeleton height="54px" className="rounded-xl" />
                <Skeleton height="54px" className="rounded-xl" />
                <Skeleton height="54px" className="rounded-xl" />
              </div>
            </Card>
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <Card className="p-6">
              <Skeleton height="20px" width="140px" className="rounded-lg mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} height="40px" className="rounded-lg" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <ErrorState
          title="Unable to Access Assessment"
          message={error}
          actionText="Back to Course Details"
          onAction={() => navigate(`/assessments/${assessmentId}`)}
        />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Questions Available
          </h3>
          <p className="text-sm text-slate-500">
            This assessment does not currently have any active questions published.
          </p>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(`/assessments/${assessmentId}`)}
          >
            Back to Assessment Details
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col" data-testid="assessment-player-page">
      {/* Sticky Header with Progress & Timer */}
      <AssessmentHeader
        assessment={assessment}
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        answeredCount={answeredCount}
        timeRemainingSeconds={timeRemainingSeconds}
        onTimeUp={handleTimeUp}
        onOpenReview={() => setIsReviewOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Question Active Card Area (Left 3 columns) */}
          <div className="lg:col-span-3 space-y-4">
            <QuestionCard
              question={currentQuestion}
              selectedAnswers={answers[currentQuestion.id] || []}
              onSelectSingle={handleSelectSingle}
              onToggleMultiple={handleToggleMultiple}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              onOpenReview={() => setIsReviewOpen(true)}
              isFirst={isFirst}
              isLast={isLast}
            />

            {/* Mobile Navigator Drawer Toggle */}
            <div className="lg:hidden flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl">
              <span className="text-xs text-slate-600 font-medium">
                {answeredCount} of {questions.length} Answered
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileNavOpen(true)}
                leftIcon={<Menu className="w-4 h-4" />}
              >
                Question Navigator
              </Button>
            </div>
          </div>

          {/* Desktop Question Navigator Sidebar (Right 1 column) */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-28">
            <QuestionNavigator
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onSelectIndex={(idx) => setCurrentIndex(idx)}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Navigator Modal / Drawer */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden flex items-end sm:items-center justify-center p-0 sm:p-4"
          data-testid="mobile-question-navigator"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Question Navigator
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                aria-label="Close question navigator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuestionNavigator
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onSelectIndex={(idx) => {
                setCurrentIndex(idx);
                setIsMobileNavOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Pre-Submission Review Modal */}
      <AssessmentReview
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        questions={questions}
        answers={answers}
        onSubmit={handleSubmit}
        onJumpToQuestion={(idx) => setCurrentIndex(idx)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AssessmentPlayerPage;
