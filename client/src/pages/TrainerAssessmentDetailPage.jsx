import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Edit2, Trash2, HelpCircle, RefreshCw } from 'lucide-react';
import trainerService from '../services/trainerService';
import AssessmentPerformanceCard from '../components/trainer/AssessmentPerformanceCard';
import QuestionEditorModal from '../components/trainer/QuestionEditorModal';
import TrainerStatusBadge from '../components/trainer/TrainerStatusBadge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export const TrainerAssessmentDetailPage = () => {
  const { assessmentId } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessmentRes, perfRes, questionsRes] = await Promise.all([
        trainerService.getAssessmentById(assessmentId),
        trainerService.getAssessmentPerformance(assessmentId).catch(() => null),
        trainerService.getQuestions(assessmentId),
      ]);
      setAssessment(assessmentRes);
      setPerformance(perfRes);
      setQuestions(questionsRes);
    } catch (err) {
      setError(err.message || 'Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setIsQuestionModalOpen(true);
  };

  const handleQuestionSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingQuestion) {
        const qId = editingQuestion._id || editingQuestion.id;
        const updated = await trainerService.updateQuestion(assessmentId, qId, formData);
        setQuestions((prev) =>
          prev.map((q) => ((q._id || q.id) === qId ? updated : q))
        );
      } else {
        const created = await trainerService.createQuestion(assessmentId, formData);
        setQuestions((prev) => [...prev, created]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (q) => {
    const qId = q._id || q.id;
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await trainerService.deleteQuestion(assessmentId, qId);
      setQuestions((prev) => prev.filter((item) => (item._id || item.id) !== qId));
    } catch (err) {
      alert(`Failed to delete question: ${err.message}`);
    }
  };

  const nextQuestionOrder = questions.length + 1;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/trainer/assessments">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Button>
        </Link>
        <ErrorState
          title="Could Not Load Assessment"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          to="/trainer/assessments"
          className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Assessments
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">
          {assessment?.title}
        </span>
      </div>

      {/* Assessment Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {assessment?.course?.title || 'Assigned Course'}
            </span>
            <TrainerStatusBadge status={assessment?.status} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {assessment?.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            {assessment?.description || 'No special instructions provided.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="flex items-center gap-1.5"
            aria-label="Refresh assessment"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddQuestion}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Cohort Performance Statistics */}
      {performance && <AssessmentPerformanceCard performance={performance} />}

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#102A2A] dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-700" />
            Question Pool ({questions.length} questions)
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#102A2A] dark:text-white">
              No questions authored yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Add multiple choice or single choice questions, specify point values, and configure the correct answer keys.
            </p>
            <div className="mt-5">
              <Button variant="primary" size="sm" onClick={handleOpenAddQuestion}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const qId = q._id || q.id;
              const correctAnswers = q.correctAnswers || [];

              return (
                <div
                  key={qId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow transition-shadow space-y-3"
                  data-testid={`question-item-${qId}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        #{q.order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {q.questionType?.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                          </span>
                        </div>
                        <h4 className="text-base font-medium text-slate-900 dark:text-white">
                          {q.questionText}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        aria-label={`Edit question #${q.order}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(q)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label={`Delete question #${q.order}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Options List with Highlighted Correct Answer */}
                  <div className="pl-10 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options?.map((opt) => {
                      const isCorrect = correctAnswers.includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="truncate">{opt.text}</span>
                          {isCorrect && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Editor Modal */}
      <QuestionEditorModal
        isOpen={isQuestionModalOpen}
        question={editingQuestion}
        defaultOrder={nextQuestionOrder}
        onClose={() => setIsQuestionModalOpen(false)}
        onSubmit={handleQuestionSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default TrainerAssessmentDetailPage;
