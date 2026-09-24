import React, { useState } from 'react';
import { 
  Activity, Lock, User, UserCog, ArrowLeft, ShieldCheck, Stethoscope, 
  Pill, ClipboardList, Users, Building2, Eye, EyeOff, CheckCircle2, Zap
} from 'lucide-react';
import { UserRole } from '../types';

interface LoginModuleProps {
  onLogin: (role: UserRole) => void;
  onNavigate: (view: 'landing' | 'login') => void;
}

export default function LoginModule({ onLogin, onNavigate }: LoginModuleProps) {
  const [role, setRole] = useState<UserRole>('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [isSmartCardScanning, setIsSmartCardScanning] = useState(false);

  // Persona Details Mapping for 10/10 Usability
  const personas = [
    {
      id: 'doctor' as UserRole,
      title: 'Doctor',
      name: 'Dr. Sarah Jenkins',
      detail: 'Suite 101 - Senior GP',
      icon: Stethoscope,
      username: 'doctor@mediclinic.local'
    },
    {
      id: 'pharmacist' as UserRole,
      title: 'Pharmacy',
      name: 'Pharm. Ahmad Razak',
      detail: 'Dispensary Suite',
      icon: Pill,
      username: 'pharmacist@mediclinic.local'
    },
    {
      id: 'clinic-assistant' as UserRole,
      title: 'Assistant',
      name: 'Siti Aishah',
      detail: 'Triage & MyKad Desk',
      icon: ClipboardList,
      username: 'assistant@mediclinic.local'
    },
    {
      id: 'admin' as UserRole,
      title: 'Admin',
      name: 'System Admin',
      detail: 'Full IT Control',
      icon: ShieldCheck,
      username: 'sysadmin'
    },
    {
      id: 'hr' as UserRole,
      title: 'HR Manager',
      name: 'Evelyn Tan',
      detail: 'Panel Claims & Payroll',
      icon: Users,
      username: 'hr_admin'
    }
  ];

  const currentPersona = personas.find(p => p.id === role) || personas[0];

  const handleSmartCardAuth = () => {
    setIsSmartCardScanning(true);
    setTimeout(() => {
      setIsSmartCardScanning(false);
      onLogin(role);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f7fdfd] flex items-center justify-center p-4 sm:p-8 font-sans text-slate-900 selection:bg-[#0d9488] selection:text-white">
      <div className="max-w-5xl w-full flex flex-col md:flex-row rounded-none border border-[#ccfbf1] bg-[#f7fdfd] shadow-2xl overflow-hidden animate-fadeIn">

        {/* ========================================================================= */}
        {/* 1. DEEP MEDICAL TEAL BRANDING PANEL (COLOR HARMONY 10/10)                 */}
        {/* ========================================================================= */}
        <div className="md:w-5/12 bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#047857] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          
          {/* Ambient Glow Graphic Overlays */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-10">
            
            {/* Header Branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-none overflow-hidden border border-white/30 shadow-md shrink-0 bg-white flex items-center justify-center">
                <img src="./logo_primary.jpg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white block leading-none">
                  MEDICLINIC <span className="text-teal-200">ENTERPRISE</span>
                </h1>
                <span className="text-[10px] text-teal-100/80 font-mono font-bold tracking-wider uppercase block mt-1">Clinical Suite v2.4</span>
              </div>
            </div>

            {/* Core Value Headline */}
            <div className="space-y-4 pt-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                Clinical Excellence <br />
                <span className="text-teal-200">Unified.</span>
              </h2>

              <p className="text-teal-50/90 text-xs sm:text-sm leading-relaxed font-normal">
                Seamless real-time EMR telemetry, biometric MyKad registration, instant panel GL approvals, and pharmacy compounding queues.
              </p>
            </div>

            {/* Live Operational Uptime Badge */}
            <div className="p-3.5 rounded-none bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  System Telemetry
                </span>
                <span className="text-emerald-300 font-mono text-[10px]">99.99% SLA</span>
              </div>
              <p className="text-[10px] text-teal-100/80 leading-tight">
                All 6 clinical nodes, biometric readers, and TPA claims gateways online.
              </p>
            </div>

          </div>

          {/* Security Footer Badge */}
          <div className="relative z-10 pt-8 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-teal-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              AES-256 Encrypted Session
            </span>
            <span className="font-mono text-[10px] opacity-75">PDPA 2010</span>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. FORM AREA WITH 2-STEP HIERARCHY & PERSONA CARDS (10/10 UX & HIERARCHY) */}
        {/* ========================================================================= */}
        <div className="md:w-7/12 bg-[#f0fdfa] p-8 sm:p-12 flex flex-col justify-between relative">

          {/* Top Right Back Link */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Staff Portal Sign In</h3>
              <p className="text-slate-600 text-xs font-medium">Select your staff persona to initialize session</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl border border-[#ccfbf1] bg-[#f7fdfd] text-slate-700 hover:text-[#0d9488] hover:border-[#0d9488] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </button>
          </div>

          {/* STEP 1: SELECT PERSONA */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5 text-[#0d9488]">
                <span className="w-5 h-5 rounded-full bg-[#0d9488] text-white flex items-center justify-center text-[10px] font-black">1</span>
                <span>Select Staff Persona</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                Auto-Fill Ready
              </span>
            </div>

            {/* Persona Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {personas.map((p) => {
                const IconComponent = p.icon;
                const isSelected = role === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRole(p.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-md shadow-teal-500/20 ring-2 ring-teal-500/30 scale-[1.02]'
                        : 'bg-[#f7fdfd] text-slate-700 border-[#ccfbf1] hover:border-[#0d9488] hover:text-[#0d9488]'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#0d9488]'}`} />
                    <span className="text-xs font-black block leading-none">{p.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Persona Sub-Banner */}
            <div className="p-3 bg-[#e0f5f2] border border-[#b2f5ea] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0d9488] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                  {currentPersona.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block leading-tight">{currentPersona.name}</span>
                  <span className="text-[10px] text-[#0d9488] font-bold block">{currentPersona.detail}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Persona
              </span>
            </div>
          </div>

          {/* STEP 2: AUTHENTICATE CREDENTIALS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5 text-[#0d9488]">
                <span className="w-5 h-5 rounded-full bg-[#0d9488] text-white flex items-center justify-center text-[10px] font-black">2</span>
                <span>Authenticate Credentials</span>
              </span>
            </div>

            <form className="space-y-3.5" onSubmit={(e) => {
              e.preventDefault();
              onLogin(role);
            }}>
              
              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                  {(role === 'admin' || role === 'hr') ? 'Admin/HR Username' : 'Staff ID / Clinical Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    {(role === 'admin' || role === 'hr') ? <UserCog className="w-4 h-4 text-[#0d9488]" /> : <User className="w-4 h-4 text-[#0d9488]" />}
                  </div>
                  <input
                    type="text"
                    key={currentPersona.username}
                    defaultValue={currentPersona.username}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f7fdfd] border border-[#ccfbf1] rounded-xl focus:bg-white focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30 outline-none transition-all text-xs font-bold text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Password Input with Eye Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <a href="#" className="text-[11px] text-[#0d9488] font-bold hover:underline">Forgot Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-[#0d9488]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    defaultValue="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f7fdfd] border border-[#ccfbf1] rounded-xl focus:bg-white focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30 outline-none transition-all text-xs font-bold text-slate-900 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0d9488] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                
                {/* Submit CTA Button */}
                <button
                  type="submit"
                  className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white py-3.5 rounded-none font-black text-xs transition-all hover:scale-[1.01] cursor-pointer flex justify-center items-center gap-2 shadow-md shadow-teal-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Clinical Session</span>
                </button>

                {/* Instant Biometric SmartCard Demo Button */}
                <button
                  type="button"
                  onClick={handleSmartCardAuth}
                  disabled={isSmartCardScanning}
                  className="w-full py-2.5 rounded-none bg-[#e0f5f2] hover:bg-[#ccfbf1] text-[#0d9488] border border-[#b2f5ea] font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Zap className={`w-3.5 h-3.5 text-[#0d9488] ${isSmartCardScanning ? 'animate-spin' : ''}`} />
                  <span>{isSmartCardScanning ? 'Scanning SmartCard...' : '⚡ Instant SmartCard / MyKad Login'}</span>
                </button>

              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
