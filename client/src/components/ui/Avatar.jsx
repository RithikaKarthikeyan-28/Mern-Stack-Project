import React, { useState } from 'react';

export const Avatar = ({
  name = 'User',
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
  };

  const statusColorClasses = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-rose-500',
  };

  const colors = [
    'bg-teal-600 text-white',
    'bg-violet-500 text-white',
    'bg-blue-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-teal-500 text-white',
  ];
  const charCodeSum = (name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorScheme = colors[charCodeSum % colors.length];

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className={`rounded-full object-cover shadow-inner ${sizeClasses[size] || sizeClasses.md}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full font-semibold select-none shadow-inner ${
            colorScheme
          } ${sizeClasses[size] || sizeClasses.md}`}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white ${
            statusSizeClasses[size] || statusSizeClasses.md
          } ${statusColorClasses[status] || statusColorClasses.online}`}
        />
      )}
    </div>
  );
};

export default Avatar;
