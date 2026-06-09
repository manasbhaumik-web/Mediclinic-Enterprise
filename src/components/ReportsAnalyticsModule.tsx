import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  FileText, TrendingUp, Users, DollarSign, Package, Download, 
  Activity, Clock, AlertTriangle, CheckCircle, RefreshCw, Filter
} from 'lucide-react';

// --- MOCK DATA FOR ENTERPRISE ANALYTICS ---

const REVENUE_DATA = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },
  { month: 'Feb', revenue: 52000, expenses: 34000 },
  { month: 'Mar', revenue: 48000, expenses: 33000 },
  { month: 'Apr', revenue: 61000, expenses: 38000 },
  { month: 'May', revenue: 59000, expenses: 36000 },
  { month: 'Jun', revenue: 68000, expenses: 40000 },
];

const WAIT_TIME_DATA = [
  { time: '08:00 AM', wait: 12, consultation: 15 },
  { time: '10:00 AM', wait: 25, consultation: 14 },
  { time: '12:00 PM', wait: 35, consultation: 12 },
  { time: '02:00 PM', wait: 18, consultation: 15 },
  { time: '04:00 PM', wait: 28, consultation: 16 },
  { time: '06:00 PM', wait: 10, consultation: 18 },
];

const ICD10_DATA = [
  { name: 'J06.9 (Cold)', value: 350, color: '#07B2B2' },
  { name: 'I10 (Hypertension)', value: 240, color: '#10b981' },
  { name: 'E11.9 (Diabetes)', value: 180, color: '#3b82f6' },
  { name: 'K30 (Gastritis)', value: 120, color: '#f59e0b' },
  { name: 'M79.1 (Myalgia)', value: 90,  color: '#ef4444' },
];

const TPA_AGING_DATA = [
  { range: '0-30 Days', amount: 15400 },
  { range: '31-60 Days', amount: 8200 },
  { range: '61-90 Days', amount: 3100 },
  { range: '>90 Days', amount: 1200 },
];

const DEPT_REVENUE_DATA = [
  { name: 'Consultation', value: 45000 },
  { name: 'Pharmacy', value: 68000 },
  { name: 'Lab / Imaging', value: 22000 },
  { name: 'Procedures', value: 15000 },
];

export default function ReportsAnalyticsModule() {
  const [activeTab, setActiveTab] = useState<'executive' | 'clinical' | 'financial' | 'inventory' | 'generator'>('executive');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('Report successfully generated and downloaded as PDF!');
    }, 1500);
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#07B2B2]" />
            Enterprise Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">Comprehensive BI dashboards for clinical, financial, and operational insights.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'executive', label: 'Executive' },
            { id: 'clinical', label: 'Clinical' },
            { id: 'financial', label: 'Financial' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'generator', label: 'Export' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-[#07B2B2] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EXECUTIVE SUMMARY */}
      {activeTab === 'executive' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">YTD Revenue</span>
                <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg"><DollarSign className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">RM 333,000</h3>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> +14.5% vs last year</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg"><Users className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">8,421</h3>
              <p className="text-[10px] font-bold text-blue-600 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> +5.2% vs last year</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TPA Outstanding</span>
                <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">RM 27,900</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center">Accrued over 90 days</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Value</span>
                <div className="bg-cyan-100 text-[#07B2B2] p-1.5 rounded-lg"><Package className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">RM 142,500</h3>
              <p className="text-[10px] font-bold text-[#07B2B2] mt-1 flex items-center">Across all warehouses</p>
            </div>
          </div>

          {/* Master Trend Chart */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Revenue vs Operating Expenses (H1 2026)</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#07B2B2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#07B2B2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `RM${val/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#07B2B2" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLINICAL & OPERATIONAL */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-6">Patient Wait vs Consultation Time</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={WAIT_TIME_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="wait" name="Avg Wait Time (mins)" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="consultation" name="Avg Consult Time (mins)" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-6">ICD-10 Diagnostic Distribution</h3>
            <div className="h-64 grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-7 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ICD10_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {ICD10_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="md:col-span-5 space-y-2 mt-4 md:mt-0">
                {ICD10_DATA.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[10px]">
                    <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                    <div>
                      <strong className="block text-slate-700 font-semibold">{item.name}</strong>
                      <span className="text-slate-400 font-mono">{item.value} cases</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: FINANCIAL & BILLING */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-6">Revenue by Department (MTD)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart layout="vertical" data={DEPT_REVENUE_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `RM${val/1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" name="Revenue" fill="#07B2B2" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-6">TPA Claims Aging Report</h3>
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                {TPA_AGING_DATA.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-600">{item.range}</span>
                      <span className="font-mono text-slate-800">RM {item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${idx === 3 ? 'bg-red-500' : idx === 2 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                        style={{ width: `${(item.amount / 15400) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800"><strong>Attention:</strong> RM 4,300 in claims have exceeded the standard 60-day payout window. Follow-up required with AIA and PMCare.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: INVENTORY & ASSETS */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
              Fast Moving Inventory 
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">High Turnover</span>
            </h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Stock Level</th><th className="px-3 py-2">Velocity (30d)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr><td className="px-3 py-2 font-bold text-slate-800">Paracetamol 500mg</td><td className="px-3 py-2 text-red-600 font-bold">120 tabs</td><td className="px-3 py-2">3,400 tabs</td></tr>
                <tr><td className="px-3 py-2 font-bold text-slate-800">Amoxicillin 250mg</td><td className="px-3 py-2">850 caps</td><td className="px-3 py-2">1,200 caps</td></tr>
                <tr><td className="px-3 py-2 font-bold text-slate-800">Loratadine 10mg</td><td className="px-3 py-2 text-amber-600 font-bold">450 tabs</td><td className="px-3 py-2">800 tabs</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
              Equipment Depreciation Book Value
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">CAPEX Audit</span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Digital ECG Machine (CX-5000)</h4>
                  <p className="text-[10px] text-slate-500">Purchased: 2024 (RM 12,000)</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-800">RM 8,400</span>
                  <p className="text-[10px] text-red-500">-RM 3,600 (Depreciated)</p>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Autoclave Sterilizer</h4>
                  <p className="text-[10px] text-slate-500">Purchased: 2022 (RM 8,500)</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-800">RM 1,700</span>
                  <p className="text-[10px] text-red-500">-RM 6,800 (Depreciated)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORT GENERATOR */}
      {activeTab === 'generator' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto animate-fadeIn">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="bg-cyan-50 p-2 rounded-lg"><Filter className="w-5 h-5 text-[#07B2B2]" /></div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Custom Report Generator</h3>
              <p className="text-xs text-slate-500">Select parameters to compile and download PDF/CSV data exports.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Start Date</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#07B2B2] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">End Date</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#07B2B2] outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Report Module</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#07B2B2] outline-none bg-white">
                <option>Consolidated Executive Summary</option>
                <option>Financial: Revenue & Claims Ledger</option>
                <option>Clinical: MOH Disease Audit (NIDCS format)</option>
                <option>Inventory: Stock Movement & Valuation</option>
                <option>Operational: Staff Utilization Timesheets</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-600">Export Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" defaultChecked className="accent-[#07B2B2]" />
                  <span className="text-sm font-semibold text-slate-700">PDF Document</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" className="accent-[#07B2B2]" />
                  <span className="text-sm font-semibold text-slate-700">CSV Excel Data</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="bg-[#07B2B2] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#058A8A] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Compiling Data...</>
                ) : (
                  <><Download className="w-4 h-4" /> Generate Report</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
