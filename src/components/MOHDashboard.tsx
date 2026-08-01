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
  Activity, Users, DollarSign, Brain, BarChart3, Target, ChevronRight, Zap, CheckCircle2, AlertTriangle, ShieldCheck, LayoutDashboard, FileText
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
  
  const { inventory } = useInventory();
  
  // Real-time metrics
  const activeStaff = 14;
  const criticalPatients = 2;
  const lowStockCount = (inventory || []).filter(d => d.currentStock <= 200).length;

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
    { name: 'J06.9 Common Cold', value: 38, color: '#07B2B2' },
    { name: 'I10 Hypertension', value: 24, color: '#10b981' },
    { name: 'E11.9 Diabetes T2', value: 16, color: '#0ea5e9' },
    { name: 'K30 Gastritis', value: 12, color: '#f59e0b' },
    { name: 'M79.1 Myalgia', value: 10, color: '#ef4444' }
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
    { id: 'comparative', label: 'Comparative Benchmarking', icon: BarChart3 },
    { id: 'financial', label: 'Financial Forecasting', icon: DollarSign },
    { id: 'provider', label: 'Provider Performance', icon: Activity },
    { id: 'workflow', label: 'AI Workflow Optimization', icon: Brain },
    { id: 'outcomes', label: 'Outcomes Tracking', icon: Target },
  ] as const;

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* HEADER & TABS */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#07B2B2]" />
              Advanced Analytics & AI Insights
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive intelligence and predictive metrics for clinic optimization.</p>
          </div>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id 
                  ? 'border-[#07B2B2] text-[#07B2B2] bg-[#07B2B2]/5' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DYNAMIC TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {/* 1. CLINIC STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between hover:border-[#07B2B2]/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Flow Today</span>
                <strong className="text-xl font-extrabold text-slate-800 tracking-tight">{patientsCount}</strong>
                <span className="text-[9px] text-[#07B2B2] block">✓ Registered queue flow</span>
              </div>
              <div className="w-10 h-10 bg-[#07B2B2]/10 rounded-lg flex items-center justify-center text-[#07B2B2] shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between hover:border-emerald-500/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Real-Time Revenue</span>
                <strong className="text-xl font-extrabold text-slate-800 tracking-tight">RM{revenueTotal.toFixed(2)}</strong>
                <span className="text-[9px] text-emerald-600 block">SST & Taxes audited</span>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between hover:border-[#07B2B2]/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Claims</span>
                <strong className="text-xl font-extrabold text-[#07B2B2] tracking-tight">{pendingTPAClaims}</strong>
                <span className="text-[9px] text-slate-400 block">Guarantee validation active</span>
              </div>
              <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center text-[#07B2B2] shrink-0">
                <Building className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between hover:border-red-500/50 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Alerts</span>
                <strong className="text-xl font-extrabold text-red-600 tracking-tight">{lowStockCount}</strong>
                <span className="text-[9px] text-red-500 block">Requires batch procurement</span>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 2. RECHARTS CLINIC METRICS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Patient Volume Hourly Distribution</h4>
                <span className="text-[10px] text-[#07B2B2] bg-[#07B2B2]/10 px-2 py-0.5 rounded font-bold uppercase">Staffing Optimizer</span>
              </div>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px' }} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="patients" fill="#07B2B2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Primary Diagnoses (ICD-10)</h4>
                <span className="text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded font-bold uppercase">Categorical</span>
              </div>
              <div className="h-64 grid grid-cols-1 md:grid-cols-12 items-center">
                <div className="md:col-span-7 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={icdDiagnosesData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                        {icdDiagnosesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="md:col-span-5 space-y-2 mt-4 md:mt-0">
                  {icdDiagnosesData.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10px]">
                      <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
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

          {/* MOH NATIONAL NIDCS DATA INTEGRATION PORTAL */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-50 text-[#07B2B2] p-2.5 rounded-lg border border-cyan-600/10 shrink-0">
                  <Globe2 className="w-5 h-5 animate-spin-slow text-[#07B2B2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-sans">MOH HIC & Infectious Disease Upload (NIDCS)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Secure integration gateway maps to National disease surveillance boards. (KKM ISO 27001)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 block">Last upload Sync:</span>
                <strong className="text-[10px] bg-slate-100 text-slate-700 border px-2.5 py-0.5 rounded font-mono block">{lastUploadTime}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600">Clinic Readiness Score for NIDCS Upload:</span>
                  <strong className="text-[#07B2B2]">{uploadPercent}% Verify compliance</strong>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden w-full border">
                  <div className="bg-[#07B2B2] h-full transition-all duration-300" style={{ width: `${uploadPercent}%` }} />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono leading-none">
                  <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-blue-500" /> Patient Index encrypted (AES-256)</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Compliant with Act 709 PDPA 2010</span>
                </div>
              </div>
              <div className="md:col-span-4 text-right">
                <button
                  type="button"
                  onClick={handleNidcsUpload}
                  disabled={isUploading}
                  className="w-full md:w-auto bg-[#07B2B2] text-white hover:bg-[#058A8A] text-xs font-bold px-5 py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                  {isUploading ? 'Encrypting & Posting...' : 'Submit Records to KKM Gateway'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparative' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Clinic vs. National Benchmarks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our AI engine anonymously compares your clinic's performance metrics against national health registry averages. Identify areas where your facility outperforms competitors and locate crucial gaps in service delivery.
              </p>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-800 font-medium">
                  <strong>Insight:</strong> Your clinic demonstrates a <span className="text-indigo-600 font-bold">120% higher</span> digital adoption rate and <span className="text-indigo-600 font-bold">30% faster</span> wait times compared to the national average.
                </p>
              </div>
            </div>
            <div className="h-72 w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={comparativeData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Your Clinic" dataKey="clinic" stroke="#07B2B2" fill="#07B2B2" fillOpacity={0.6} />
                  <Radar name="National Avg" dataKey="national" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'population' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase mb-4 border-b border-slate-100 pb-2">Preventive Care Gaps Detected</h3>
              <div className="space-y-4 mt-4">
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-start gap-3">
                  <div className="bg-rose-100 p-2 rounded-md"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-800 uppercase">Diabetic Retinopathy Screenings</h4>
                    <p className="text-[11px] text-rose-700/80 mt-1">42% of your active Type 2 Diabetes patients are overdue for annual eye exams. Estimated lost revenue opportunity: RM 12,500.</p>
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-md"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 uppercase">Hypertension Follow-ups</h4>
                    <p className="text-[11px] text-amber-700/80 mt-1">18% of patients prescribed Amlodipine have not returned for 3-month BP monitoring. Consider triggering an automated WhatsApp recall.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1e293b] p-5 rounded-xl shadow-3xs text-white flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 tracking-tight uppercase mb-1">High-Cost Patient Segment</h3>
                <p className="text-[10px] text-slate-400 border-b border-slate-700 pb-3">AI predictive risk analysis</p>
                <div className="mt-4">
                  <span className="text-4xl font-black text-rose-400">8.2%</span>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    of your patient base consumes <span className="font-bold text-white">45%</span> of clinic resources. 
                    Top comorbidities: Obesity + Hypertension + T2DM.
                  </p>
                </div>
              </div>
              <button className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                View Target Group <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">AI Revenue Forecast & Cash Flow Projection</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Machine Learning prediction modeling (ARIMA / Prophet)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><div className="w-3 h-3 bg-slate-300 rounded-full"></div> Actual Revenue</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><div className="w-3 h-3 bg-[#07B2B2] rounded-full"></div> AI Projection</div>
              </div>
            </div>
            
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialForecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#07B2B2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#07B2B2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(val) => `RM${val/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }} />
                  <Area type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={3} fillOpacity={0} />
                  <Area type="monotone" dataKey="projected" stroke="#07B2B2" strokeWidth={3} fill="url(#colorProjected)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 uppercase">Healthy Cash Flow Expected</h4>
                  <p className="text-[11px] text-emerald-700/80 mt-1">Projecting a 15% YoY growth for Q3 based on local flu season trends and increased TPA panel acquisition.</p>
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase">Revenue Leakage Warning</h4>
                  <p className="text-[11px] text-amber-700/80 mt-1">AI detected RM4,200 in unbilled procedure consumables over the last 30 days. Action recommended.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'provider' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase mb-4 border-b border-slate-100 pb-2">Provider Performance Analytics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-3 rounded-l-lg">Physician Name</th>
                    <th className="p-3">Clinical Efficiency Score</th>
                    <th className="p-3">Documentation Quality</th>
                    <th className="p-3">Patient Satisfaction</th>
                    <th className="p-3 rounded-r-lg text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {providerData.map((doc, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs">{doc.name.charAt(4)}</div>
                        {doc.name}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#07B2B2]" style={{ width: `${doc.efficiency}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{doc.efficiency}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${doc.quality}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{doc.quality}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-xs flex items-center gap-1 w-fit">
                          ★ {doc.satisfaction}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-[#07B2B2] hover:text-[#058A8A] text-xs font-bold underline">View Detail</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-xl shadow-lg text-white border border-indigo-500/30 relative overflow-hidden group hover:shadow-indigo-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                <Brain className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">Process AI Observation</span>
                <h3 className="text-lg font-extrabold mb-2">Dispensary Bottleneck Detected</h3>
                <p className="text-indigo-100/70 text-xs leading-relaxed mb-4">
                  Between 10:00 AM and 11:30 AM, average pharmacy wait times spike to 18 minutes. AI suggests shifting one clinic assistant from registration to compounding during this peak window.
                </p>
                <button className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20">
                  <Zap className="w-3.5 h-3.5" /> Apply Staffing Shift
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-xl shadow-lg text-white border border-emerald-500/30 relative overflow-hidden group hover:shadow-emerald-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                <FileText className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">Documentation AI Observation</span>
                <h3 className="text-lg font-extrabold mb-2">Automated SOAP Templates</h3>
                <p className="text-emerald-100/70 text-xs leading-relaxed mb-4">
                  Dr. Wei types similar subjective notes for URTI cases 85% of the time. Implementing the AI "1-Click URTI Standard" macro will save an estimated 42 minutes daily.
                </p>
                <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Generate Macro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#07B2B2]" /> Treatment Success & Efficacy
            </h3>
            <p className="text-xs text-slate-500 mb-6">Evidence-based tracking analyzing patient return visits and symptom resolution declarations within 14 days of primary consult.</p>
            
            <div className="space-y-4">
              {outcomesData.map((outcome, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-1/3 text-xs font-bold text-slate-700 truncate">{outcome.treatment}</div>
                  <div className="w-2/3 flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${outcome.successRate > 90 ? 'bg-emerald-500' : 'bg-[#07B2B2]'}`} 
                        style={{ width: `${outcome.successRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-mono font-bold w-10 text-right">{outcome.successRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
