import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, BarChart2, PlayCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import RecommendationReason from './RecommendationReason';

export const RecommendedCourseCard = ({
  recommendation,
  className = '',
}) => {
  if (!recommendation) return null;

  const {
    course = {},
    score = 0,
    mandatoryGapCount = 0,
    matchedSkills = [],
    enrollmentStatus = null,
  } = recommendation;

  const {
    _id,
    title = 'Untitled Course',
    description = '',
    category = 'General',
    level = 'beginner',
    duration = 0,
  } = course;

  const isEnrolled = enrollmentStatus === 'enrolled' || enrollmentStatus === 'in_progress';

  return (
    <div
      data-testid="recommended-course-card"
      data-score={score}
      className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Top Header: Category & Score Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {category}
          </span>

          <div className="flex items-center gap-1.5">
            {mandatoryGapCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldCheck className="w-3 h-3 text-rose-600" />
                {mandatoryGapCount} Mandatory
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-700 to-teal-500 text-white shadow-sm"
              title="Calculated recommendation relevance score"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{Math.round(score)}% Match</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#102A2A] mb-2 leading-tight">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Course Metadata (Duration & Level) */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{duration > 0 ? `${duration} mins` : 'Self-paced'}</span>
          </div>
          <div className="flex items-center gap-1 capitalize">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{level}</span>
          </div>
        </div>

        {/* Recommendation Reasons / Skills Targeted */}
        <RecommendationReason
          matchedSkills={matchedSkills}
          className="mb-4"
        />
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {isEnrolled ? (
          <>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {enrollmentStatus === 'in_progress' ? 'In Progress' : 'Enrolled'}
            </span>
            <Link
              to={`/learn/${_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition shadow-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Continue Learning</span>
            </Link>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-400">Not enrolled</span>
            <Link
              to={`/courses/${_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
            >
              <span>Explore Course</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default RecommendedCourseCard;
