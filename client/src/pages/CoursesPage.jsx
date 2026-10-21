import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Compass, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import CourseCard from '../components/courses/CourseCard';
import CourseFilters from '../components/courses/CourseFilters';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';

export const CoursesPage = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [enrollmentFilter, setEnrollmentFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesRes, enrollmentsRes] = await Promise.allSettled([
        courseService.getCourses(),
        enrollmentService.getMyEnrollments(),
      ]);

      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value || []);
      } else {
        throw new Error('Failed to load courses catalog.');
      }

      if (enrollmentsRes.status === 'fulfilled') {
        setEnrollments(enrollmentsRes.value || []);
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load course catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map enrollments by course ID for fast lookups
  const enrollmentsMap = useMemo(() => {
    const map = new Map();
    for (const enr of enrollments) {
      const cId = enr.course?._id || enr.course?.id || enr.course;
      if (cId) {
        map.set(cId.toString(), enr);
      }
    }
    return map;
  }, [enrollments]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const cId = (course._id || course.id).toString();
      const enrollment = enrollmentsMap.get(cId);

      // Search match (title or description)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = course.title?.toLowerCase().includes(query);
        const matchesDesc = course.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Category match
      if (selectedCategory && course.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Level match
      if (selectedLevel && course.level !== selectedLevel) {
        return false;
      }

      // Enrollment status match
      if (enrollmentFilter === 'enrolled') {
        if (!enrollment || enrollment.status === 'dropped') return false;
      } else if (enrollmentFilter === 'available') {
        if (enrollment && enrollment.status !== 'dropped') return false;
      } else if (enrollmentFilter === 'completed') {
        if (enrollment?.status !== 'completed' && enrollment?.progressPercentage !== 100) return false;
      }

      return true;
    });
  }, [courses, enrollmentsMap, search, selectedCategory, selectedLevel, enrollmentFilter]);

  const hasActiveFilters = Boolean(
    search.trim() || selectedCategory || selectedLevel || enrollmentFilter !== 'all'
  );

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLevel('');
    setEnrollmentFilter('all');
  };

  return (
    <div className="space-y-8" data-testid="courses-page">
      {/* 1. Page Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-teal-100 border border-white/10 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              Course Catalog
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Explore Courses
            </h1>
            <p className="mt-2 text-teal-100/90 text-sm sm:text-base leading-relaxed">
              Discover courses that help you build skills, complete required training, and grow in your role.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5"
              aria-label="Refresh course catalog"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        enrollmentFilter={enrollmentFilter}
        onEnrollmentFilterChange={setEnrollmentFilter}
        categories={categories}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 3. Main Course Content Grid */}
      {loading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="courses-loading-skeleton"
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-4">
              <Skeleton height="24px" width="40%" />
              <Skeleton height="20px" width="80%" />
              <Skeleton height="60px" />
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <Skeleton height="20px" width="30%" />
                <Skeleton height="36px" width="35%" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load courses"
          message={error}
          onRetry={loadData}
        />
      ) : filteredCourses.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Compass className="w-8 h-8 text-teal-700" />}
            title="No courses found"
            description="No courses match your current search and filter criteria. Try adjusting your keywords or clearing filters."
            action={
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-teal-700" />}
            title="No published courses available"
            description="There are currently no active published courses available for enrollment. Please check back later."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="courses-grid">
          {filteredCourses.map((course) => {
            const courseId = (course._id || course.id).toString();
            const enrollment = enrollmentsMap.get(courseId);
            return (
              <CourseCard
                key={courseId}
                course={course}
                enrollment={enrollment}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
