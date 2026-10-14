import React from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

export const CourseFilters = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
  enrollmentFilter,
  onEnrollmentFilterChange,
  categories = [],
  onClear,
  hasActiveFilters,
}) => {
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const enrollmentOptions = [
    { value: 'all', label: 'All Courses' },
    { value: 'enrolled', label: 'Enrolled' },
    { value: 'available', label: 'Not Enrolled' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            id="course-search"
            placeholder="Search courses by title or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="w-full"
            aria-label="Search courses"
          />
        </div>

        {/* Category Select */}
        <div className="w-full md:w-48">
          <Select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={categoryOptions}
            aria-label="Filter by category"
          />
        </div>

        {/* Level Select */}
        <div className="w-full md:w-40">
          <Select
            id="level-filter"
            value={selectedLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            options={levelOptions}
            aria-label="Filter by level"
          />
        </div>

        {/* Enrollment Status Select */}
        <div className="w-full md:w-44">
          <Select
            id="enrollment-filter"
            value={enrollmentFilter}
            onChange={(e) => onEnrollmentFilterChange(e.target.value)}
            options={enrollmentOptions}
            aria-label="Filter by enrollment status"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            leftIcon={<X className="w-3.5 h-3.5" />}
            className="text-slate-500 hover:text-slate-700 whitespace-nowrap self-center"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

CourseFilters.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  selectedLevel: PropTypes.string.isRequired,
  onLevelChange: PropTypes.func.isRequired,
  enrollmentFilter: PropTypes.string.isRequired,
  onEnrollmentFilterChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string),
  onClear: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool.isRequired,
};

export default CourseFilters;
