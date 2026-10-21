import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  color = 'teal',
  description,
  className = '',
}) => {
  const iconColorStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200/60',
    indigo: 'bg-teal-50 text-teal-700 border-teal-200/60',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    purple: 'bg-teal-50 text-teal-700 border-teal-200/60',
  };

  const trendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
    if (trend.direction === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  };

  const trendBadgeStyle = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (trend.direction === 'down') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <Card hover className={`p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              iconColorStyles[color] || iconColorStyles.teal
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-[#102A2A]">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${trendBadgeStyle()}`}
          >
            {trendIcon()}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {(description || trend?.label) && (
        <p className="mt-2 text-xs text-slate-400">
          {description || trend?.label}
        </p>
      )}
    </Card>
  );
};

export default StatCard;
