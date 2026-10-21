import React from 'react';
import Card from '../components/ui/Card';
import { Layers } from 'lucide-react';

export const PlaceholderPage = ({ title = 'Module Coming Soon', description = 'This module will be fully activated in the next development phase.' }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#102A2A] tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <Card className="p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#102A2A] mb-1">{title}</h3>
        <p className="text-sm text-slate-500 max-w-md">
          {description} The underlying backend APIs are fully prepared and tested.
        </p>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
