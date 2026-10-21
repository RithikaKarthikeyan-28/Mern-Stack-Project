import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Video,
  FileText,
  Link2,
  X,
} from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

export const LearningSidebar = ({
  course,
  curriculum = [],
  currentLessonId,
  completedLessonIds = [],
  progressPercentage = 0,
  onSelectLesson,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const completedSet = new Set(
    completedLessonIds.map((id) => (typeof id === 'object' ? id._id || id.id : id))
  );

  let totalLessonsCount = 0;
  (curriculum || []).forEach((mod) => {
    totalLessonsCount += (mod.lessons || []).length;
  });
  const completedLessonsCount = completedSet.size;
  const remainingLessonsCount = Math.max(0, totalLessonsCount - completedLessonsCount);

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'link':
        return <Link2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'text':
      default:
        return <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    }
  };

  const courseId = course?._id || course?.id;

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Sidebar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Course Details</span>
          </Link>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <h3 className="text-base font-bold text-white line-clamp-2 leading-tight">
          {course?.title || 'Learning Course'}
        </h3>

        {/* Course Progress */}
        <div className="pt-1 space-y-1.5">
          <ProgressBar
            value={progressPercentage}
            max={100}
            showLabel
            label="Course Progress"
            color="teal"
            size="sm"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
            <span>
              {completedLessonsCount} of {totalLessonsCount} completed
            </span>
            <span>
              {progressPercentage === 100
                ? 'All Complete'
                : `${remainingLessonsCount} remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Curriculum Module Tree */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-2">
        {curriculum.map((mod, modIdx) => {
          const modId = mod._id || mod.id;
          const lessons = mod.lessons || [];

          return (
            <div key={modId} className="pt-2 first:pt-0">
              <div className="px-3 py-2">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Module {mod.order || modIdx + 1}
                </span>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mt-0.5">
                  {mod.title}
                </h4>
              </div>

              <div className="mt-1 space-y-0.5">
                {lessons.map((lesson) => {
                  const lessonId = lesson._id || lesson.id;
                  const isCurrent = currentLessonId === lessonId;
                  const isCompleted = completedSet.has(lessonId);

                  return (
                    <button
                      key={lessonId}
                      type="button"
                      onClick={() => {
                        onSelectLesson(mod, lesson);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                        isCurrent
                          ? 'bg-teal-700 text-white font-bold shadow-md shadow-teal-950/40'
                          : isCompleted
                          ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                      }`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      {isCompleted ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isCurrent ? 'text-white' : 'text-emerald-400'
                          }`}
                        />
                      ) : isCurrent ? (
                        <PlayCircle className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                      )}

                      <span className="shrink-0">{getContentTypeIcon(lesson.contentType)}</span>

                      <span className="truncate flex-1">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 border-r border-slate-800 h-full overflow-hidden">
        {content}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-4/5 max-w-xs h-full bg-slate-900 shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

LearningSidebar.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string,
  }),
  curriculum: PropTypes.array,
  currentLessonId: PropTypes.string,
  completedLessonIds: PropTypes.array,
  progressPercentage: PropTypes.number,
  onSelectLesson: PropTypes.func.isRequired,
  isMobileOpen: PropTypes.bool,
  onCloseMobile: PropTypes.func,
};

export default LearningSidebar;
