import React from 'react';
import { Activity, ShieldCheck, Database, Building, ArrowRight, HeartPulse } from 'lucide-react';

interface LandingModuleProps {
  onNavigate: (view: 'login') => void;
}

export default function LandingModule({ onNavigate }: LandingModuleProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#07B2B2] p-2 rounded-lg shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase leading-none">
              MediClinic
            </h1>
            <span className="text-[10px] text-[#07B2B2] font-mono tracking-wider font-bold">ENTERPRISE OS</span>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="bg-[#07B2B2] hover:bg-[#069494] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
          >
            Staff Portal Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center animate-fadeIn">
        <div className="max-w-3xl space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold mb-4 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#07B2B2]"></span>
            </span>
            System Online & Operational v1.1.2
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            The Modern Operating System for <span className="text-[#07B2B2]">Clinical Excellence</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Unify your medical practice with an intelligent end-to-end suite. From patient queueing and e-prescriptions to intelligent billing and national health data reporting.
          </p>

          <div className="pt-8">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto cursor-pointer group"
            >
              Access Clinical Suite
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-4 text-[#07B2B2]">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Advanced Care</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Complete electronic medical records with intelligent templates, auto-ICD-10 tagging, and real-time alerts.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Secure & Compliant</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Enterprise-grade security. Compliant with PDPA 2010 and ISO 27001 standards for medical data protection.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">National Sync</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Seamless integration with MOH national surveillance boards (NIDCS) for immediate disease reporting.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center">
        <p className="text-xs font-mono text-slate-400">
          © 2026 MediClinic Enterprise Solutions. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
