import React, { useState } from 'react';
import { Activity, Lock, User, UserCog, ArrowLeft, Shield, Stethoscope, Pill, ClipboardList, Users } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModuleProps {
  onLogin: (role: UserRole) => void;
  onNavigate: (view: 'landing' | 'login') => void;
}

export default function LoginModule({ onLogin, onNavigate }: LoginModuleProps) {
  const [role, setRole] = useState<UserRole>('doctor');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-sans text-slate-800">
      <div className="enterprise-card max-w-5xl w-full flex flex-col md:flex-row overflow-hidden shadow-2xl">

        {/* Left Side: Branding & Info */}
        <div className="md:w-5/12 bg-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white via-slate-900 to-black"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                <Activity className="w-6 h-6 text-[#07B2B2]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight uppercase leading-none">
                  MediClinic
                </h1>
                <span className="text-xs text-slate-400 font-mono tracking-wider">Enterprise v1.2</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Clinical Excellence <br />
              <span className="text-[#07B2B2]">Unified.</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Secure access to patient records, billing ledgers, and consultation histories across your healthcare network.
            </p>
          </div>

          <div className="relative z-10 mt-12 md:mt-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <Shield className="w-4 h-4 text-emerald-500" />
              AES-256-GCM Encrypted Session
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Area */}
        <div className="md:w-7/12 bg-white p-10 lg:p-16 flex flex-col justify-center relative">

          <div className="absolute top-6 right-6">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="text-xs font-semibold text-slate-500 hover:text-[#0D9488] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Sign In</h3>
            <p className="text-slate-500 text-sm mt-1">Authenticate to access the clinical suite</p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${role === 'doctor' ? 'bg-teal-50 text-[#07B2B2] border-[#07B2B2]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setRole('pharmacist')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${role === 'pharmacist' ? 'bg-orange-50 text-orange-600 border-orange-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              <Pill className="w-4 h-4" />
              Pharmacy
            </button>
            <button
              type="button"
              onClick={() => setRole('clinic-assistant')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${role === 'clinic-assistant' ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              <ClipboardList className="w-4 h-4" />
              Clinic Assistant
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${role === 'admin' ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRole('hr')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${role === 'hr' ? 'bg-indigo-50 text-indigo-600 border-indigo-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              <Users className="w-4 h-4" />
              HR
            </button>
          </div>

          <form className="space-y-5" onSubmit={(e) => {
            e.preventDefault();
            onLogin(role);
          }}>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                {(role === 'admin' || role === 'hr') ? 'Admin/HR Username' : 'Staff ID / Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {(role === 'admin' || role === 'hr') ? <UserCog className="w-4 h-4 text-slate-400" /> : <User className="w-4 h-4 text-slate-400" />}
                </div>
                <input
                  type="text"
                  defaultValue={(role === 'admin' || role === 'hr') ? (role === 'admin' ? 'sysadmin' : 'hr_admin') : `${role}@mediclinic.local`}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#07B2B2] focus:border-[#07B2B2] outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs text-[#07B2B2] font-semibold hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#07B2B2] focus:border-[#07B2B2] outline-none transition-all text-sm font-medium tracking-widest"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-[#07B2B2] hover:bg-[#058A8A] text-white py-3 rounded-lg font-bold text-sm transition-colors cursor-pointer flex justify-center items-center gap-2"
              >
                Authenticate Session
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
