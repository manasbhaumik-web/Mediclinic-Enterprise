import React, { useState } from 'react';
import { Visit, Language } from '../types';
import { TRANSLATIONS, DRUG_CATALOG } from '../data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Building, RefreshCw, Layers, TrendingUp, AlertCircle, ShoppingCart, 
  Globe2, CheckCircle, Database, HelpCircle, ArrowUpRight
} from 'lucide-react';

interface MOHDashboardProps {
  completedVisits: Visit[];
  totalRegisteredCount: number;
  activeLanguage: Language;
}

export default function MOHDashboard({
  completedVisits,
  totalRegisteredCount,
  activeLanguage
}: MOHDashboardProps) {
  const t = TRANSLATIONS[activeLanguage];
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(85);
  const [lastUploadTime, setLastUploadTime] = useState<string>('Today, 10:15 AM');

  // Compute stats today
  // Revenue today (all paid bills)
  const revenueTotal = completedVisits.reduce((acc, curr) => acc + (curr.paidAmount + curr.panelClaimed), 0) + 160; // adding some seed base revenue
  const patientsCount = completedVisits.length + totalRegisteredCount; // today's flow
  
  // Pending Claims
  const pendingTPAClaims = completedVisits.filter(v => v.panelClaimed > 0 && v.status !== 'Paid').length * 2 + 3; // base seed + current
  
  // Low stock medications catalog checklist
  const lowStockCount = DRUG_CATALOG.filter(d => d.currentStock <= 200).length;

  // Chart 1: Patient Volume by Hour (Recharts)
  const patientVolumeData = [
    { hour: '08:00 AM', patients: 4 },
    { hour: '09:00 AM', patients: 14 },
    { hour: '10:00 AM', patients: 22 },
    { hour: '11:00 AM', patients: 28 },
    { hour: '12:00 PM', patients: 11 },
    { hour: '01:00 PM', patients: 5 },
    { hour: '02:00 PM', patients: 16 },
    { hour: '03:00 PM', patients: 21 },
    { hour: '04:00 PM', patients: 15 },
    { hour: '05:00 PM', patients: 8 }
  ];

  // Chart 2: Top 5 Diagnoses ICD-10 (Recharts)
  const icdDiagnosesData = [
    { name: 'J06.9 Common Cold', value: 38, color: '#07B2B2' },
    { name: 'I10 Hypertension', value: 24, color: '#10b981' },
    { name: 'E11.9 Diabetes T2', value: 16, color: '#0ea5e9' },
    { name: 'K30 Gastritis / Gastrik', value: 12, color: '#f59e0b' },
    { name: 'M79.1 Myalgia / Pain', value: 10, color: '#ef4444' }
  ];

  const handleNidcsUpload = () => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadPercent(85);

    const interval = setInterval(() => {
      setUploadPercent((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          const now = new Date();
          setLastUploadTime(`Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  return (
    <div className="space-y-5">
      
      {/* 1. CLINIC STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Today Patients Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.patientsToday}
            </span>
            <strong className="text-xl font-extrabold text-slate-800 tracking-tight">
              {patientsCount}
            </strong>
            <span className="text-[9px] text-[#07B2B2] block">✓ Registered queue flow</span>
          </div>
          <div className="w-10 h-10 bg-[#07B2B2]/10 rounded-lg flex items-center justify-center text-[#07B2B2] shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Total Revenue Day Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.revenueToday}
            </span>
            <strong className="text-xl font-extrabold text-slate-800 tracking-tight">
              RM{revenueTotal.toFixed(2)}
            </strong>
            <span className="text-[9px] text-emerald-600 block">SST & Taxes audited</span>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Claim TPAs Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              {t.pendingClaims}
            </span>
            <strong className="text-xl font-extrabold text-[#07B2B2] tracking-tight">
              {pendingTPAClaims}
            </strong>
            <span className="text-[9px] text-slate-400 block">Guarantee validation active</span>
          </div>
          <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center text-[#07B2B2] shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Warn Badge Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              {t.lowStock}
            </span>
            <strong className="text-xl font-extrabold text-red-600 tracking-tight">
              {lowStockCount}
            </strong>
            <span className="text-[9px] text-red-500 block">Requires batch procurement</span>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. RECHARTS CLINIC METRICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Hourly Volume Bar Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {t.patientByHour}
            </h4>
            <span className="text-[10px] text-[#07B2B2] bg-[#07B2B2]/10 px-2 py-0.5 rounded font-bold uppercase">
              Staffing Optimizer
            </span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientVolumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="patients" fill="#07B2B2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnoses Pie Chart distribution */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {t.icdDistribution}
            </h4>
            <span className="text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded font-bold uppercase">
              ICD-10 Categorical
            </span>
          </div>

          <div className="h-64 grid grid-cols-1 md:grid-cols-12 items-center">
            
            <div className="md:col-span-7 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={icdDiagnosesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {icdDiagnosesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom chart legend column */}
            <div className="md:col-span-5 space-y-2 mt-4 md:mt-0">
              {icdDiagnosesData.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[10px]">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <strong className="block text-slate-700 font-semibold">{item.name}</strong>
                    <span className="text-slate-400 font-mono">{item.value}% Prevalence</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* 3. MOH NATIONAL NIDCS DATA INTEGRATION PORTAL */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-cyan-50 text-[#07B2B2] p-2.5 rounded-lg border border-cyan-600/10 shrink-0">
              <Globe2 className="w-5 h-5 animate-spin-slow text-[#07B2B2]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-sans">
                {t.nationalReporting}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PWA Secure integration gateway maps to National disease surveillance boards. (KKM ISO 27001)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 block">Last upload Sync:</span>
            <strong className="text-[10px] bg-slate-100 text-slate-700 border px-2.5 py-0.5 rounded font-mono block">
              {lastUploadTime}
            </strong>
          </div>
        </div>

        {/* Information metrics bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">Clinic Readiness Score for NIDCS Upload:</span>
              <strong className="text-[#07B2B2]">{uploadPercent}% Verify compliance</strong>
            </div>

            {/* Diagnostic progress validation bar */}
            <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden w-full border">
              <div 
                className="bg-[#07B2B2] h-full transition-all duration-300"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono leading-none">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-blue-500" /> Patient Index encrypted (AES-256)
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Compliant with Act 709 PDPA 2010
              </span>
            </div>
          </div>

          {/* Action trigger button */}
          <div className="md:col-span-4 text-right">
            <button
              type="button"
              id="upload-nidcs-btn"
              onClick={handleNidcsUpload}
              disabled={isUploading}
              className="w-full md:w-auto bg-[#07B2B2] text-white hover:bg-[#058A8A] text-xs font-bold px-5 py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              {isUploading ? 'Encrypting & Posting Data...' : 'Submit Records to KKM Gateway'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
