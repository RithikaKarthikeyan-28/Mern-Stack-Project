import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Reusable PageHeader with breadcrumbs, title, description, actions, and contextual horizontal tabs.
 */
export const PageHeader = ({
  title,
  description,
  badge,
  breadcrumbs = [],
  actions,
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-slate-400 hover:text-teal-700 transition-colors"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label || idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-teal-700 transition-colors truncate max-w-[200px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`truncate max-w-[220px] ${isLast ? 'text-teal-800 font-medium' : ''}`}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#102A2A] tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Contextual Horizontal Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-slate-200/80 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-teal-700 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
