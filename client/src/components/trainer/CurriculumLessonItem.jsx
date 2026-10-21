import React from 'react';
import { FileText, Video, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

export const CurriculumLessonItem = ({ lesson, onEdit, onDelete }) => {
  if (!lesson) return null;

  const lessonId = lesson._id || lesson.id;

  const iconByContentType = {
    video: <Video className="w-4 h-4 text-rose-500" />,
    link: <ExternalLink className="w-4 h-4 text-sky-500" />,
    text: <FileText className="w-4 h-4 text-amber-500" />,
  };

  const badgeByContentType = {
    video: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    link: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    text: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  };

  return (
    <div
      className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      data-testid={`lesson-item-${lessonId}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
          {lesson.order}
        </span>
        <div className="shrink-0">{iconByContentType[lesson.contentType] || iconByContentType.text}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {lesson.title}
            </h5>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                badgeByContentType[lesson.contentType] || badgeByContentType.text
              }`}
            >
              {lesson.contentType}
            </span>
          </div>
          {lesson.resourceUrl && (
            <a
              href={lesson.resourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-teal-700 hover:underline truncate block max-w-xs"
            >
              {lesson.resourceUrl}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(lesson)}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={`Edit lesson ${lesson.title}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(lesson)}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
            aria-label={`Delete lesson ${lesson.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CurriculumLessonItem;
