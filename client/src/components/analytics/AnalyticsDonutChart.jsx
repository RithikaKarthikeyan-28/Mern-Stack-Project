import React from 'react';

/**
 * AnalyticsDonutChart renders an SVG donut chart with center metric and legend.
 * Pure SVG implementation ensures zero external dependencies and 100% test compatibility.
 */
export const AnalyticsDonutChart = ({
  title,
  subtitle,
  centerValue,
  centerLabel,
  items = [],
  size = 180,
  strokeWidth = 24,
  className = '',
  'data-testid': testId,
}) => {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDasharray and strokeDashoffset for each segment
  let cumulativeOffset = 0;
  const segments = items.map((item) => {
    const val = Number(item.value) || 0;
    const ratio = total > 0 ? val / total : 0;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += ratio * circumference;

    return {
      ...item,
      ratio,
      percentage: (ratio * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm ${className}`}
      data-testid={testId || 'analytics-donut-chart'}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-brand-ink-primary dark:text-white">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {total === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No data available
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* SVG Donut Circle */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
              role="img"
              aria-label={title || 'Donut chart distribution'}
            >
              {/* Background Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />

              {/* Data Segments */}
              {segments.map((seg, idx) => {
                if (seg.ratio <= 0) return null;
                return (
                  <circle
                    key={seg.label || idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color || '#0F766E'}
                    strokeWidth={strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              })}
            </svg>

            {/* Center Label */}
            {(centerValue || centerLabel) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                {centerValue && (
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-brand-ink-primary dark:text-white">
                    {centerValue}
                  </span>
                )}
                {centerLabel && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {centerLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-2">
            {segments.map((seg, idx) => (
              <div
                key={seg.label || idx}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color || '#0F766E' }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-700 truncate">{seg.label}</span>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="font-semibold text-brand-ink-primary dark:text-white">
                    {(Number(seg.value) || 0).toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-1.5">
                    ({seg.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDonutChart;
