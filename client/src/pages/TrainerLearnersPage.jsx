import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import trainerService from '../services/trainerService';
import LearnerProgressTable from '../components/trainer/LearnerProgressTable';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export const TrainerLearnersPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const trainerUserId = user?._id || user?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enrollmentsRes, coursesRes] = await Promise.all([
        trainerService.getLearnerEnrollments(),
        trainerService.getMyCourses(trainerUserId ? { trainer: trainerUserId } : {}),
      ]);
      setEnrollments(enrollmentsRes);
      setCourses(coursesRes);
    } catch (err) {
      setError(err.message || 'Failed to load learner enrollments.');
    } finally {
      setLoading(false);
    }
  }, [trainerUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A2A] dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-700" />
            Learner Progress &amp; Performance
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor employee enrollment progress, completions, and cohort engagement across your courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh learners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Learners"
          message={error}
          onRetry={loadData}
        />
      ) : (
        <LearnerProgressTable
          enrollments={enrollments}
          courses={courses}
          selectedCourseId={selectedCourseId}
          onCourseChange={setSelectedCourseId}
        />
      )}
    </div>
  );
};

export default TrainerLearnersPage;
