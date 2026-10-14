import React from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';

export const AuthLoadingScreen = ({ message = 'Restoring your session...' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 text-slate-800"
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-5">
          <GraduationCap className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
          Skill<span className="text-indigo-600">Track</span>
        </h2>
        
        <div className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
          <span>{message}</span>
        </div>
        
        <p className="mt-2 text-xs text-slate-400">
          Verifying security credentials & access permissions
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
