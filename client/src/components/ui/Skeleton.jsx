import React from 'react';

export const Skeleton = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((key) => (
        <div
          key={key}
          style={{ width, height }}
          className={`animate-pulse bg-slate-200/80 ${
            variantStyles[variant] || variantStyles.rectangular
          } ${className}`}
        />
      ))}
    </>
  );
};

export default Skeleton;
