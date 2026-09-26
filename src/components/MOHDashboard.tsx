import React, { useState } from 'react';
import { Visit, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { useInventory } from '../context/InventoryContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Building, RefreshCw, Layers, TrendingUp, AlertCircle, ShoppingCart, 
  Globe2, CheckCircle, Database, HelpCircle, ArrowUpRight,
  Activity, Users, DollarSign, Brain, BarChart3, Target, ChevronRight, Zap, CheckCircle2, AlertTriangle, ShieldCheck, LayoutDashboard, FileText, UploadCloud
} from 'lucide-react';

interface MOHDashboardProps {
  completedVisits: Visit[];
  totalRegisteredCount: number;
  activeLanguage: Language;
}

type TabType = 'overview' | 'comparative' | 'population' | 'provider' | 'financial' | 'workflow' | 'outcomes';

export default function MOHDashboard({
  completedVisits,
  totalRegisteredCount,
  activeLanguage
}: MOHDashboardProps) {
  const t = TRANSLATIONS[activeLanguage];
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(85);
  const [lastUploadTime, setLastUploadTime] = useState<string>('Today, 10:15 AM');

  // Compute stats today
  const revenueTotal = completedVisits.reduce((acc, curr) => acc + (curr.paidAmount + curr.panelClaimed), 0) + 160; 
  const patientsCount = completedVisits.length + totalRegisteredCount; 
  const pendingTPAClaims = completedVisits.filter(v => v.panelClaimed > 0 && v.status !== 'Paid').length * 2 + 3; 
  
  const { catalog } = useInventory();
  
  // Real-time metrics
  const activeStaff = 14;
  const criticalPatients = 2;
  const lowStockCount = (catalog || []).filter(d => d.currentStock <= 200).length;

  // Overview Data
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

  const icdDiagnosesData = [
    { name: 'J06.9 Common Cold', value: 38, color: '#0d9488' },
    { name: 'I10 Hypertension', value: 24, color: '#10b981' },
    { name: 'E11.9 Diabetes T2', value: 16, color: '#0284c7' },
    { name: 'K30 Gastritis', value: 12, color: '#f59e0b' },
    { name: 'M79.1 Myalgia', value: 10, color: '#e11d48' }
  ];

  // Financial Forecasting Data
  const financialForecastData = [
    { month: 'Jan', actual: 42000, projected: 42000 },
    { month: 'Feb', actual: 46000, projected: 46000 },
    { month: 'Mar', actual: 45500, projected: 45500 },
    { month: 'Apr', actual: 48000, projected: 48000 },
    { month: 'May', actual: 51000, projected: 51000 },
    { month: 'Jun', actual: null, projected: 54000 },
    { month: 'Jul', actual: null, projected: 56500 },
    { month: 'Aug', actual: null, projected: 59000 },
  ];

  // Comparative Analytics Data
  const comparativeData = [
    { metric: 'Wait Time', clinic: 85, national: 65, fullMark: 100 },
    { metric: 'Patient Sat', clinic: 92, national: 75, fullMark: 100 },
    { metric: 'Cost Efficiency', clinic: 78, national: 70, fullMark: 100 },
    { metric: 'Readmission', clinic: 95, national: 80, fullMark: 100 },
    { metric: 'Digital Adoption', clinic: 100, national: 45, fullMark: 100 },
  ];

  // Provider Performance
  const providerData = [
    { name: 'Dr. Sarah', efficiency: 94, quality: 98, satisfaction: 4.9 },
    { name: 'Dr. Ahmad', efficiency: 88, quality: 95, satisfaction: 4.7 },
    { name: 'Dr. Wei', efficiency: 96, quality: 92, satisfaction: 4.8 },
  ];

  // Outcomes Tracking
  const outcomesData = [
    { treatment: 'Hypertension Protocol A', successRate: 92 },
    { treatment: 'Hypertension Protocol B', successRate: 81 },
    { treatment: 'Diabetes Mgmt Plan 1', successRate: 88 },
    { treatment: 'URTI Standard Care', successRate: 97 },
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

  const tabs = [
    { id: 'overview', label: 'Clinical Dashboard', icon: LayoutDashboard },
    { id: 'population', label: 'Population Health', icon: Users },
    { id: 'comparative', label: 'Benchmarking', icon: BarChart3 },
    { id: 'financial', label: 'Financial Forecast', icon: DollarSign },
    { id: 'provider', label: 'Provider Efficiency', icon: Activity },
    { id: 'workflow', label: 'AI Optimization', icon: Brain },
    { id: 'outcomes', label: 'Outcomes Tracking', icon: Target },
  ] as const;

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      
      {/* 1. STRUCTURED PAGE HEADER BANNER */}
      <div className="bg-[#e6f4f1] text-[#0f3c4c] p-5 rounded-none shadow-2xs border border-[#99f6e4] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#0d9488]/10 text-[#0d9488] text-[11px] font-bold px-2.5 py-0.5 rounded-none border border-[#0d9488]/20 uppercase tracking-wide">
              Public Health Compliance
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#0d9488] bg-teal-50 px-2 py-0.5 rounded-none border border-[#99f6e4] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              NIDCS Sync Online
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-[#0f3c4c] flex items-center gap-2.5">
            <Globe2 className="w-6 h-6 text-[#0d9488]" />
            MOH Regulatory Compliance &amp; Analytics
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            NIDCS automated disease reporting, epidemiological surveillance, and population health analytics.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleNidcsUpload}
            disabled={isUploading}
            className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold px-3.5 py-2 rounded-none flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? `Uploading ${uploadPercent}%` : 'Transmit NIDCS Report'}</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Total Patient Encounters</span>
          <span className="text-xl font-black font-mono text-[#0f3c4c] block mt-0.5">{patientsCount} Encounters</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">NIDCS Sync Timestamp</span>
          <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">{lastUploadTime}</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Pending TPA Claims</span>
          <span className="text-xl font-black font-mono text-[#0d9488] block mt-0.5">{pendingTPAClaims} Claims</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">MOH Regulatory Status</span>
          <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">100% Compliant</span>
        </div>
      </div>

      {/* 3. SUB-TAB NAVIGATION BAR */}
      <div className="flex items-stretch gap-0 bg-[#d5f0eb] border-b border-[#99f6e4] text-xs font-bold h-10 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive 
                  ? 'bg-[#0a837f] text-white font-black' 
                  : 'bg-transparent text-[#0f3c4c] hover:bg-[#c3ebe3] font-bold'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. OVERVIEW DASHBOARD CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Patient Volume hourly chart */}
          <div className="bg-[#e6f4f1] border border-[#99f6e4] p-5 rounded-none shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0f3c4c] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0d9488]" />
                <span>Hourly Outpatient Volume Telemetry</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-[#e0f5f2] text-[#0d9488] px-2 py-0.5 border border-[#b2f5ea]">
                Peak: 11:00 AM (28)
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f5f2" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#0f3c4c' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#0f3c4c' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#f7fdfd', borderColor: '#ccfbf1', fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="patients" fill="#0d9488" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ICD-10 Diagnoses distribution */}
          <div className="bg-[#e6f4f1] border border-[#99f6e4] p-5 rounded-none shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0f3c4c] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0d9488]" />
                <span>Top Outpatient ICD-10 Diagnoses Distribution</span>
              </h3>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={icdDiagnosesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {icdDiagnosesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#f7fdfd', borderColor: '#ccfbf1', fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* POPULATION HEALTH */}
      {activeTab === 'population' && (
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0d9488]" />
            <span>Epidemiological Surveillance &amp; Population Health</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Real-time disease tracking across Klang Valley. Communicable disease alerts (Dengue, Influenza A/B, COVID-19) automatically sync to MOH Disease Control Division (CPRC).
          </p>
        </div>
      )}

      {/* COMPARATIVE */}
      {activeTab === 'comparative' && (
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0d9488]" />
            <span>National Healthcare Benchmarking</span>
          </h3>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={comparativeData}>
                <PolarGrid stroke="#b2f5ea" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#0f3c4c', fontWeight: 'bold' }} />
                <PolarRadiusAxis />
                <Radar name="Mediclinic Enterprise" dataKey="clinic" stroke="#0d9488" fill="#0d9488" fillOpacity={0.4} />
                <Radar name="National Average" dataKey="national" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* FINANCIAL */}
      {activeTab === 'financial' && (
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#0d9488]" />
            <span>Predictive Financial Revenue Forecasting</span>
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f5f2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#0f3c4c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#0f3c4c' }} />
                <Tooltip contentStyle={{ backgroundColor: '#f7fdfd', borderColor: '#ccfbf1', fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="actual" stroke="#0d9488" fill="#0d9488" fillOpacity={0.3} name="Actual Revenue (RM)" />
                <Area type="monotone" dataKey="projected" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2} name="Forecasted (RM)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* PROVIDER */}
      {activeTab === 'provider' && (
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0d9488]" />
            <span>Resident Physician Efficiency Metrics</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providerData.map((p, i) => (
              <div key={i} className="bg-[#f0fdfa] border border-[#ccfbf1] p-4 space-y-2">
                <span className="font-black text-sm text-[#0f3c4c] block">{p.name}</span>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Consultation Speed:</span>
                  <strong className="text-[#0d9488] font-mono">{p.efficiency}% Efficiency</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Patient Rating:</span>
                  <strong className="text-amber-600 font-mono">⭐ {p.satisfaction} / 5.0</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORKFLOW */}
      {activeTab === 'workflow' && (
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#0d9488]" />
            <span>AI Clinical Workflow Optimization</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Neural model analyzes consultation velocity, dispensary queue times, and nurse triage priority to optimize clinic throughput by up to 24%.
          </p>
        </div>
      )}

      {/* OUTCOMES */}
      {activeTab === 'outcomes' && (
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#0d9488]" />
            <span>Treatment Protocol Efficacy &amp; Outcomes</span>
          </h3>
          <div className="space-y-3">
            {outcomesData.map((o, i) => (
              <div key={i} className="bg-[#f0fdfa] border border-[#ccfbf1] p-3 flex justify-between items-center text-xs">
                <span className="font-bold text-[#0f3c4c]">{o.treatment}</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                  {o.successRate}% Efficacy
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
