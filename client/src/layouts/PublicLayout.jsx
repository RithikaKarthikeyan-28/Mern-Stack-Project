import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Skill<span className="text-indigo-600">Track</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              to="/login"
              className="text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-indigo-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SkillTrack Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-700 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-700 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-700 cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
