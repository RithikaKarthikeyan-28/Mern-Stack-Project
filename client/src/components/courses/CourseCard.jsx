import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';

export const CourseCard = ({ course, enrollment = null }) => {
  const navigate = useNavigate();
  const courseId = course._id || course.id;

  const isCompleted = enrollment?.status === 'completed' || enrollment?.progressPercentage === 100;
  const isEnrolled = !!enrollment && enrollment.status !== 'dropped';
  const progress = enrollment?.progressPercentage ?? 0;

  const levelVariant = {
    beginner: 'success',
    intermediate: 'primary',
    advanced: 'warning',
  }[course.level] || 'default';

  const handleCardClick = () => {
    navigate(`/courses/${courseId}`);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (isEnrolled) {
      navigate(`/learn/${courseId}`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  return (
    <Card
      hover
      className="flex flex-col justify-between h-full cursor-pointer border-slate-200/80 transition-all duration-200"
      onClick={handleCardClick}
      data-testid={`course-card-${courseId}`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="primary" size="sm">
            {course.category || 'General'}
          </Badge>
          <div className="flex items-center gap-1.5">
            {course.level && (
              <Badge variant={levelVariant} size="sm" className="capitalize">
                {course.level}
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="success" size="sm" dot>
                Completed
              </Badge>
            )}
            {isEnrolled && !isCompleted && (
              <Badge variant="primary" size="sm" dot>
                Enrolled
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#102A2A] leading-snug line-clamp-2 mb-2 group-hover:text-teal-700 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {course.description || 'No course description available.'}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100">
        {/* Metadata info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          {course.duration ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.duration} mins</span>
            </span>
          ) : (
            <span />
          )}

          {course.trainer?.name && (
            <span className="flex items-center gap-1 truncate max-w-[140px]" title={course.trainer.name}>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{course.trainer.name}</span>
            </span>
          )}
        </div>

        {/* Progress bar if enrolled */}
        {isEnrolled && (
          <div className="mb-3">
            <ProgressBar
              value={progress}
              max={100}
              showLabel
              label="Course Progress"
              color={isCompleted ? 'emerald' : 'teal'}
              size="sm"
            />
          </div>
        )}

        {/* CTA Button */}
        {isCompleted ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={handleActionClick}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Review Course
          </Button>
        ) : isEnrolled ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-between"
            onClick={handleActionClick}
            leftIcon={<PlayCircle className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Continue Learning
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200"
            onClick={handleActionClick}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    level: PropTypes.string,
    duration: PropTypes.number,
    trainer: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
  enrollment: PropTypes.shape({
    status: PropTypes.string,
    progressPercentage: PropTypes.number,
  }),
};

export default CourseCard;
