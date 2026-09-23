import React, { useState } from 'react';
import { Activity, Lock, User, UserCog, ArrowLeft, ShieldCheck, Stethoscope, Pill, ClipboardList, Users, Building2 } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModuleProps {
  onLogin: (role: UserRole) => void;
  onNavigate: (view: 'landing' | 'login') => void;
}

export default function LoginModule({ onLogin, onNavigate }: LoginModuleProps) {
  const [role, setRole] = useState<UserRole>('doctor');

  return (
    <div className="min-h-screen bg-[#f7fdfd] flex items-center justify-center p-4 sm:p-8 font-sans text-slate-900 selection:bg-[#0d9488] selection:text-white">
      <div className="max-w-5xl w-full flex flex-col md:flex-row rounded-3xl border border-[#ccfbf1] bg-[#f7fdfd] shadow-xl overflow-hidden animate-fadeIn">

        {/* Left Side: Branding & Info Panel */}
        <div className="md:w-5/12 bg-[#e0f5f2] border-r border-[#b2f5ea] text-slate-900 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          
          <div className="relative z-10 space-y-10">
            {/* Header Branding */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0d9488] flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                  MEDICLINIC <span className="text-[#0d9488]">ENTERPRISE</span>
                </h1>
                <span className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase block mt-1">Clinical Suite v2.4</span>
              </div>
            </div>

            {/* Core Value Headline */}
            <div className="space-y-3 pt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0d9488] bg-[#f7fdfd] px-3 py-1 rounded-full border border-[#ccfbf1] inline-block">
                Staff Authentication
              </span>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                Clinical Excellence <br />
                <span className="text-[#0d9488]">Unified.</span>
              </h2>
              <p className="text-slate-600 text-xs leading-relaxed">
                Secure access to patient EMR telemetry, instant TPA billing ledgers, and dispensary compounding queues.
              </p>
            </div>
          </div>

          {/* Security Footer Badge */}
          <div className="relative z-10 pt-8 border-t border-[#b2f5ea]">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-[#f7fdfd] px-3 py-1.5 rounded-xl border border-[#ccfbf1] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AES-256 Encrypted Session</span>
            </div>
          </div>

        </div>

        {/* Right Side: Login Form Area */}
        <div className="md:w-7/12 bg-[#f0fdfa] p-8 sm:p-12 lg:p-14 flex flex-col justify-center relative">

          {/* Top Right Back Link */}
          <div className="absolute top-6 right-6">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl border border-[#ccfbf1] bg-[#f7fdfd] text-slate-700 hover:text-[#0d9488] hover:border-[#0d9488] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </button>
          </div>

          <div className="mb-6 space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Staff Portal Sign In</h3>
            <p className="text-slate-600 text-xs font-medium">Select your role and authenticate to access your module</p>
          </div>

          {/* Role Switcher Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                role === 'doctor' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
                  : 'bg-[#f7fdfd] text-slate-700 border-[#ccfbf1] hover:border-[#0d9488] hover:text-[#0d9488]'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('pharmacist')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                role === 'pharmacist' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
                  : 'bg-[#f7fdfd] text-slate-700 border-[#ccfbf1] hover:border-[#0d9488] hover:text-[#0d9488]'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Pharmacy</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('clinic-assistant')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                role === 'clinic-assistant' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
                  : 'bg-[#f7fdfd] text-slate-700 border-[#ccfbf1] hover:border-[#0d9488] hover:text-[#0d9488]'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Assistant</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                role === 'admin' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
                  : 'bg-[#f7fdfd] text-slate-700 border-[#ccfbf1] hover:border-[#0d9488] hover:text-[#0d9488]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('hr')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                role === 'hr' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
                  : 'bg-[#f7fdfd] text-slate-700 border-[#ccfbf1] hover:border-[#0d9488] hover:text-[#0d9488]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>HR</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            onLogin(role);
          }}>
            <div className="space-y-1">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                {(role === 'admin' || role === 'hr') ? 'Admin/HR Username' : 'Staff ID / Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {(role === 'admin' || role === 'hr') ? <UserCog className="w-4 h-4 text-[#0d9488]" /> : <User className="w-4 h-4 text-[#0d9488]" />}
                </div>
                <input
                  type="text"
                  defaultValue={(role === 'admin' || role === 'hr') ? (role === 'admin' ? 'sysadmin' : 'hr_admin') : `${role}@mediclinic.local`}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f7fdfd] border border-[#ccfbf1] rounded-xl focus:bg-white focus:border-[#0d9488] outline-none transition-all text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs text-[#0d9488] font-bold hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#0d9488]" />
                </div>
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f7fdfd] border border-[#ccfbf1] rounded-xl focus:bg-white focus:border-[#0d9488] outline-none transition-all text-xs font-bold text-slate-900 tracking-widest"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white py-3.5 rounded-xl font-black text-xs transition-all hover:scale-[1.01] cursor-pointer flex justify-center items-center gap-2 shadow-md shadow-teal-500/20"
              >
                <span>Authenticate Session</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
