import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Folder } from 'lucide-react';
import Button from '../ui/Button';
import CurriculumLessonItem from './CurriculumLessonItem';

export const CurriculumModuleItem = ({
  module,
  onAddLesson,
  onEditModule,
  onDeleteModule,
  onEditLesson,
  onDeleteLesson,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!module) return null;

  const moduleId = module._id || module.id;
  const lessons = module.lessons || [];

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
      data-testid={`module-item-${moduleId}`}
    >
      {/* Module Header Bar */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none"
            aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center shrink-0">
              #{module.order}
            </span>
            <Folder className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <h4 className="text-base font-semibold text-[#102A2A] dark:text-white">
                {module.title}
              </h4>
              {module.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {module.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          </span>

          {onAddLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddLesson(module)}
              className="flex items-center gap-1 text-xs"
              aria-label={`Add lesson to ${module.title}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Lesson
            </Button>
          )}

          {onEditModule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditModule(module)}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={`Edit module ${module.title}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {onDeleteModule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteModule(module)}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
              aria-label={`Delete module ${module.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Module Lessons Accordion Body */}
      {isExpanded && (
        <div className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
          {lessons.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2 text-center">
              No lessons added yet. Click &quot;Add Lesson&quot; to build curriculum for this module.
            </p>
          ) : (
            lessons.map((lesson) => (
              <CurriculumLessonItem
                key={lesson._id || lesson.id}
                lesson={lesson}
                onEdit={(les) => onEditLesson && onEditLesson(module, les)}
                onDelete={(les) => onDeleteLesson && onDeleteLesson(module, les)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CurriculumModuleItem;
