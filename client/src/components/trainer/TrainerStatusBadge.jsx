import React from 'react';

export const TrainerStatusBadge = ({ status = 'draft', className = '' }) => {
  const normalized = (status || 'draft').toLowerCase();

  const styles = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    draft: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    archived: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const dots = {
    published: 'bg-emerald-500',
    draft: 'bg-amber-500',
    archived: 'bg-slate-400',
  };

  const currentStyle = styles[normalized] || styles.draft;
  const currentDot = dots[normalized] || dots.draft;

  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle} ${className}`}
      data-testid={`trainer-status-${normalized}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} aria-hidden="true" />
      {label}
    </span>
  );
};

export default TrainerStatusBadge;
