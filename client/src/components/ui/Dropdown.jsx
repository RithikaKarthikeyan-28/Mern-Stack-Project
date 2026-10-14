import React, { useState, useRef, useEffect } from 'react';

export const Dropdown = ({
  trigger,
  items = [],
  children,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const alignStyles = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignStyles} mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 focus:outline-none z-50 animate-in fade-in zoom-in-95`}
        >
          {children ? (
            <div className="py-1" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          ) : (
            <div className="py-1">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setIsOpen(false);
                    if (item.onClick) item.onClick();
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    item.danger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-700 hover:bg-slate-50'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
