import React from 'react';

/**
 * AnalyticsDistributionChart renders an accessible segmented bar or
 * progress breakdown with labels, counts, and percentages.
 * Works seamlessly across all browser viewports and test environments.
 */
export const AnalyticsDistributionChart = ({
  title,
  subtitle,
  items = [],
  total,
  className = '',
  'data-testid': testId,
}) => {
  const calculatedTotal =
    typeof total === 'number' && total > 0
      ? total
      : items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm ${className}`}
      data-testid={testId || 'analytics-distribution-chart'}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {calculatedTotal === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No distribution data available
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stacked Horizontal Progress Bar */}
          <div
            className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden shadow-inner"
            role="progressbar"
            aria-label={title || 'Distribution progress'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={100}
          >
            {items.map((item, idx) => {
              const val = Number(item.value) || 0;
              const pct = calculatedTotal > 0 ? (val / calculatedTotal) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={item.label || idx}
                  style={{ width: `${pct}%` }}
                  className={`h-full transition-all duration-300 ${item.colorClass || 'bg-teal-700'}`}
                  title={`${item.label}: ${val} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Legend and Item Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {items.map((item, idx) => {
              const val = Number(item.value) || 0;
              const pct = calculatedTotal > 0 ? (val / calculatedTotal) * 100 : 0;
              return (
                <div key={item.label || idx} className="flex items-start gap-2 text-xs">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5 ${item.colorClass || 'bg-teal-700'}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">{item.label}</p>
                    <p className="text-slate-500 text-[11px]">
                      {val.toLocaleString()} <span className="text-slate-400">({pct.toFixed(1)}%)</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDistributionChart;
