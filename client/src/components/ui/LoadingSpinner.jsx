import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({
  size = 'md',
  color = 'indigo',
  label,
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const colorClasses = {
    indigo: 'text-indigo-600',
    white: 'text-white',
    slate: 'text-slate-500',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2
        className={`animate-spin ${sizeClasses[size] || sizeClasses.md} ${
          colorClasses[color] || colorClasses.indigo
        }`}
      />
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
