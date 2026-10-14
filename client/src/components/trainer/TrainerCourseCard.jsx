import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Edit2, Archive, CheckCircle, Layers } from 'lucide-react';
import TrainerStatusBadge from './TrainerStatusBadge';
import Button from '../ui/Button';

export const TrainerCourseCard = ({
  course,
  onEdit,
  onStatusChange,
  isMutating = false,
}) => {
  if (!course) return null;

  const courseId = course._id || course.id;
  const isDraft = course.status === 'draft';
  const isPublished = course.status === 'published';
  const isArchived = course.status === 'archived';

  const levelColor = {
    beginner: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
    intermediate: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
    advanced: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  }[course.level] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
      data-testid={`trainer-course-card-${courseId}`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {course.category}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${levelColor}`}
            >
              {course.level}
            </span>
            <TrainerStatusBadge status={course.status} />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {course.description || 'No description provided.'}
        </p>

        {/* Course Meta Info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration ? `${course.duration} hrs` : 'Self-paced'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.status}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <Link to={`/trainer/courses/${courseId}/curriculum`}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            aria-label={`Manage curriculum for ${course.title}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Curriculum
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(course)}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-300"
              aria-label={`Edit ${course.title}`}
              disabled={isMutating}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}

          {isDraft && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(course, 'published')}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1"
              aria-label={`Publish ${course.title}`}
              disabled={isMutating}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Publish
            </Button>
          )}

          {isPublished && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(course, 'archived')}
              className="text-slate-600 border-slate-300 hover:bg-slate-50 dark:text-slate-400 flex items-center gap-1"
              aria-label={`Archive ${course.title}`}
              disabled={isMutating}
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </Button>
          )}

          {isArchived && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(course, 'draft')}
              className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 flex items-center gap-1"
              aria-label={`Restore ${course.title} to draft`}
              disabled={isMutating}
            >
              Restore Draft
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerCourseCard;
