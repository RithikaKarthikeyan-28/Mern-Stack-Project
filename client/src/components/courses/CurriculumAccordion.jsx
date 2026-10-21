import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Link2,
  CheckCircle2,
  Circle,
  PlayCircle,
} from 'lucide-react';
import Badge from '../ui/Badge';

export const CurriculumAccordion = ({
  modules = [],
  completedLessonIds = [],
  currentLessonId = null,
  onSelectLesson = null,
  isEnrolled = false,
}) => {
  // All modules expanded by default
  const [expandedModuleIds, setExpandedModuleIds] = useState(() =>
    modules.map((m) => m._id || m.id)
  );

  const toggleModule = (moduleId) => {
    setExpandedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const completedSet = new Set(
    completedLessonIds.map((id) => (typeof id === 'object' ? id._id || id.id : id))
  );

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-4 h-4 text-sky-500" />;
      case 'link':
        return <Link2 className="w-4 h-4 text-emerald-500" />;
      case 'text':
      default:
        return <FileText className="w-4 h-4 text-teal-700" />;
    }
  };

  if (!modules || modules.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-100">
        No curriculum modules have been published for this course yet.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="curriculum-accordion">
      {modules.map((mod, modIdx) => {
        const modId = mod._id || mod.id;
        const isExpanded = expandedModuleIds.includes(modId);
        const lessons = mod.lessons || [];

        // Count completed lessons in this module
        const completedInMod = lessons.filter((l) =>
          completedSet.has(l._id || l.id)
        ).length;

        return (
          <div
            key={modId}
            className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white transition-all shadow-sm"
          >
            {/* Module Header Bar */}
            <button
              type="button"
              onClick={() => toggleModule(modId)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`module-content-${modId}`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <span className="w-7 h-7 rounded-lg bg-teal-100/80 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {mod.order || modIdx + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#102A2A] truncate">
                    {mod.title}
                  </h4>
                  {mod.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {mod.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  {isEnrolled && lessons.length > 0
                    ? `${completedInMod}/${lessons.length} completed`
                    : `${lessons.length} lesson${lessons.length === 1 ? '' : 's'}`}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Lesson List */}
            {isExpanded && (
              <div id={`module-content-${modId}`} className="divide-y divide-slate-100 border-t border-slate-100">
                {lessons.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 italic">
                    No active lessons in this module.
                  </div>
                ) : (
                  lessons.map((lesson, lessonIdx) => {
                    const lessonId = lesson._id || lesson.id;
                    const isCompleted = completedSet.has(lessonId);
                    const isCurrent = currentLessonId === lessonId;

                    return (
                      <div
                        key={lessonId}
                        onClick={() => onSelectLesson && onSelectLesson(mod, lesson)}
                        className={`flex items-center justify-between p-3.5 sm:px-5 transition-colors ${
                          onSelectLesson
                            ? 'cursor-pointer hover:bg-slate-50/80'
                            : ''
                        } ${isCurrent ? 'bg-teal-50/60 font-semibold' : ''}`}
                        role={onSelectLesson ? 'button' : undefined}
                        tabIndex={onSelectLesson ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (onSelectLesson && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onSelectLesson(mod, lesson);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          {/* Completion / Status icon */}
                          {isEnrolled ? (
                            isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : isCurrent ? (
                              <PlayCircle className="w-4 h-4 text-teal-700 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono w-4 shrink-0 text-center">
                              {lesson.order || lessonIdx + 1}
                            </span>
                          )}

                          <span className="shrink-0">{getContentTypeIcon(lesson.contentType)}</span>

                          <span
                            className={`text-xs sm:text-sm truncate ${
                              isCurrent
                                ? 'text-teal-800 font-bold'
                                : isCompleted
                                ? 'text-slate-700'
                                : 'text-slate-800'
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="default" size="sm" className="capitalize text-[10px]">
                            {lesson.contentType}
                          </Badge>
                          {isCurrent && (
                            <Badge variant="primary" size="sm" dot>
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

CurriculumAccordion.propTypes = {
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      order: PropTypes.number,
      lessons: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string,
          id: PropTypes.string,
          title: PropTypes.string.isRequired,
          contentType: PropTypes.string.isRequired,
          order: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  completedLessonIds: PropTypes.array,
  currentLessonId: PropTypes.string,
  onSelectLesson: PropTypes.func,
  isEnrolled: PropTypes.bool,
};

export default CurriculumAccordion;
