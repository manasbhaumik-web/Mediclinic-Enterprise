import React from 'react';
import { Activity } from 'lucide-react';

export default function GlobalSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-0 bg-teal-500 rounded-full blur animate-ping opacity-20"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-slate-100 flex items-center justify-center animate-bounce">
          <Activity className="w-8 h-8 text-teal-600" />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Loading Module</h3>
        <p className="text-sm text-slate-500 font-medium">Please wait a moment...</p>
      </div>
    </div>
  );
}
