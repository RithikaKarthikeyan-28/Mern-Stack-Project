import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-lg font-semibold text-slate-800 mt-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved to another URL.
        </p>
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Return to Safety
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
