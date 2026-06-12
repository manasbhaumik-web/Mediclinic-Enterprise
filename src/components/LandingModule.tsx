import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, Building, ArrowRight, HeartPulse, Smartphone, X, FileText, Pill } from 'lucide-react';

interface LandingModuleProps {
  onNavigate: (view: 'login') => void;
}

export default function LandingModule({ onNavigate }: LandingModuleProps) {
  const [showPatientPortal, setShowPatientPortal] = useState(false);
  const [patientIc, setPatientIc] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsLoggedIn(true);
    }, 1500);
  };

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPatientPortal(true)}
            className="text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-[#07B2B2]" />
            Patient Portal
          </button>
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
      {/* Patient Portal Modal */}
      {showPatientPortal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#07B2B2] to-teal-500 p-6 relative">
              <button 
                onClick={() => {
                  setShowPatientPortal(false);
                  setIsLoggedIn(false);
                  setPatientIc('');
                }} 
                className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Smartphone className="w-6 h-6" />
                Patient Portal
              </h2>
              <p className="text-teal-50 text-sm mt-1">Access your health records & prescriptions.</p>
            </div>

            {!isLoggedIn ? (
              <form onSubmit={handlePatientLogin} className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    MyKad / IC Number
                  </label>
                  <input 
                    type="text" 
                    required
                    value={patientIc}
                    onChange={(e) => setPatientIc(e.target.value)}
                    placeholder="e.g. 900101-14-5555"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#07B2B2] outline-none font-mono text-lg"
                  />
                  <p className="text-[10px] text-slate-400">Enter your MyKad number to verify your identity.</p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-[#07B2B2] hover:bg-[#058A8A] text-white rounded-xl font-bold text-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : 'Access My Records'}
                </button>
              </form>
            ) : (
              <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Welcome Back,</p>
                    <p className="text-lg font-black text-slate-800">Mock Patient Data</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-bold text-slate-700 text-sm uppercase px-1 mt-6">Recent Records</h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        <span className="font-bold text-slate-800">Medical Certificate (MC)</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">10 May 2026</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Issued for 2 days. Valid until 12 May 2026.</p>
                    <button className="text-indigo-600 text-xs font-bold uppercase hover:underline">Download PDF</button>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-slate-800">Active Prescriptions</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">10 May 2026</span>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-1 mb-3 list-disc pl-4">
                      <li>Amoxicillin 250mg (1 capsule every 8 hours)</li>
                      <li>Paracetamol 500mg (1-2 tablets every 6 hours)</li>
                    </ul>
                    <button className="text-orange-600 text-xs font-bold uppercase hover:underline">Request Refill</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
