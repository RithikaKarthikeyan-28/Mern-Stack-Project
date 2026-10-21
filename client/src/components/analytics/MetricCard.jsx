import React from 'react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

/**
 * MetricCard renders a high-level KPI card with icon, value, optional trend,
 * and optional progress indicator.
 */
export const MetricCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendLabel,
  progress,
  variant = 'default',
  badge,
  className = '',
  'data-testid': testId,
}) => {
  const variantStyles = {
    default: {
      iconBg: 'bg-teal-50 text-teal-700 border border-teal-100',
      valueColor: 'text-brand-ink-primary dark:text-white',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      valueColor: 'text-emerald-950',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      valueColor: 'text-amber-950',
    },
    danger: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      valueColor: 'text-rose-950',
    },
    info: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      valueColor: 'text-blue-950',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      valueColor: 'text-purple-950',
    },
  }[variant] || {
    iconBg: 'bg-slate-50 text-slate-600 border border-slate-100',
    valueColor: 'text-slate-900',
  };

  const getTrendColor = () => {
    if (!trend) return 'text-slate-500';
    if (trend > 0) return 'text-emerald-600';
    if (trend < 0) return 'text-rose-600';
    return 'text-slate-500';
  };

  return (
    <Card
      className={`p-5 relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
      data-testid={testId || `metric-card-${title?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${variantStyles.valueColor}`}>
              {value ?? '—'}
            </span>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${variantStyles.iconBg}`}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {typeof progress === 'number' && (
        <div className="mt-3">
          <ProgressBar
            value={progress}
            variant={variant === 'default' ? 'primary' : variant}
            size="sm"
            showPercentage={false}
          />
        </div>
      )}

      {(subtext || trendLabel || trend !== undefined) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          {trend !== undefined && (
            <span className={`font-semibold ${getTrendColor()}`}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          {trendLabel && <span className="text-slate-400">• {trendLabel}</span>}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
