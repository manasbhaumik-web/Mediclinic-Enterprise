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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800 relative">
      
      <button 
        type="button"
        onClick={() => onNavigate('landing')}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-semibold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </button>

      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Top Branding */}
        <div className="bg-[#07B2B2] p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-3 rounded-xl mb-4 border border-white/20">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">MediClinic Access</h2>
            <p className="text-cyan-50 text-sm mt-1">Secure Enterprise Authentication</p>
          </div>
        </div>

        {/* Login Form Area */}
        <div className="p-8">
          
          {/* Role Switcher */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                role === 'doctor' ? 'bg-white text-[#07B2B2] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setRole('pharmacist')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                role === 'pharmacist' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Pill className="w-5 h-5" />
              Pharmacist
            </button>
            <button
              type="button"
              onClick={() => setRole('clerk')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                role === 'clerk' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              Clerk
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                role === 'admin' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRole('hr')}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                role === 'hr' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-5 h-5" />
              HR
            </button>
          </div>

          <form className="space-y-5" onSubmit={(e) => {
            e.preventDefault();
            onLogin(role);
          }}>
            <div className="space-y-1">
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#07B2B2] focus:border-[#07B2B2] outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs text-[#07B2B2] font-semibold hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  defaultValue="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#07B2B2] focus:border-[#07B2B2] outline-none transition-all text-sm font-medium tracking-widest"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-[#07B2B2] hover:bg-[#069494] text-white py-3 rounded-lg font-bold text-sm shadow-md transition-all cursor-pointer flex justify-center items-center gap-2"
              >
                Authenticate & Login
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-6 font-mono">
              Session is encrypted (AES-256-GCM). <br/> Authorized personnel only.
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
