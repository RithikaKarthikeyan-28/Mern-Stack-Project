import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 focus:ring-teal-600 shadow-sm shadow-teal-900/20',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus:ring-teal-600',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-teal-50/50 hover:text-teal-900 active:bg-teal-100/60 focus:ring-teal-600 shadow-sm',
    'outline-light': 'border border-white/25 bg-white/10 text-white hover:bg-white/20 active:bg-white/30 focus:ring-white/40 shadow-sm backdrop-blur-sm',
    'outline-inverse': 'border border-white/25 bg-white/10 text-white hover:bg-white/20 active:bg-white/30 focus:ring-white/40 shadow-sm backdrop-blur-sm',
    ghost: 'text-slate-600 hover:bg-teal-50/60 hover:text-teal-900 active:bg-teal-100/80 focus:ring-teal-600',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm shadow-rose-200',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500 shadow-sm shadow-emerald-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
