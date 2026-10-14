import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((msg, duration) => addToast('success', msg, duration), [addToast]);
  const error = useCallback((msg, duration) => addToast('error', msg, duration), [addToast]);
  const info = useCallback((msg, duration) => addToast('info', msg, duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast('warning', msg, duration), [addToast]);

  const toastIcons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const toastStyles = {
    success: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
    error: 'border-rose-200 bg-rose-50/90 text-rose-900',
    warning: 'border-amber-200 bg-amber-50/90 text-amber-900',
    info: 'border-sky-200 bg-sky-50/90 text-sky-900',
  };

  return (
    <ToastContext.Provider
      value={{
        success,
        error,
        info,
        warning,
        dismiss,
        addToast,
        showSuccess: success,
        showError: error,
        showWarning: warning,
        showInfo: info,
      }}
    >
      {children}
      {/* Toast Container */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-top-2 ${toastStyles[toast.type] || toastStyles.info}`}
          >
            {toastIcons[toast.type] || toastIcons.info}
            <div className="flex-1 text-sm font-medium leading-snug break-words">
              {toast.message}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
