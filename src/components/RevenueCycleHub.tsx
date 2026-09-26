import React, { useState } from 'react';
import { 
  TrendingUp, Activity, DollarSign, FileText, AlertTriangle, 
  CheckCircle2, Target, BarChart3, Clock, Wallet, ShieldCheck, 
  Search, BrainCircuit, RefreshCw, FileCheck
} from 'lucide-react';

export default function RevenueCycleHub() {
  const [activeTab, setActiveTab] = useState<'intelligent_billing' | 'leakage' | 'denials'>('intelligent_billing');

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* STRUCTURED CLINICAL HEADER BANNER */}
      <div className="bg-[#0a837f] text-white p-5 rounded-none shadow-md border-b border-[#086b68] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 text-teal-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wide">
              AI Revenue Engine
            </span>
            <span className="flex items-center gap-1 text-[11px] text-teal-200 bg-teal-900/40 px-2 py-0.5 rounded border border-teal-400/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              96.8% First-Pass Clean Rate
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-teal-200" />
            Revenue Cycle Management (RCM)
          </h1>
          <p className="text-xs text-teal-100/90 font-medium max-w-2xl leading-relaxed">
            AI-driven billing, leakage detection, TPA claim scrubbing, and pre-submission denial prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 border border-white/20 transition-all">
            <FileCheck className="w-3.5 h-3.5" />
            Export Audit Log
          </button>
          <button className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold px-3.5 py-2 rounded-md flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm">
            <BrainCircuit className="w-4 h-4" />
            Run Denial Scanner
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First-Pass Rate</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">96.8%</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              Top 1% Tier
            </span>
          </div>
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Claim Payout</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">12 Days</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              -4 Days faster
            </span>
          </div>
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Payment Plans</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">14 Active</h3>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium border border-teal-200">
              Auto-Debited
            </span>
          </div>
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pre-Claim Scrubbing</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">3 Flagged</h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium border border-amber-200">
              RM 1,760 Saved
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('intelligent_billing')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'intelligent_billing' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Intelligent Billing & Collections
        </button>
        <button 
          onClick={() => setActiveTab('leakage')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'leakage' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Revenue Leakage AI
        </button>
        <button 
          onClick={() => setActiveTab('denials')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'denials' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Pre-Claim Denial Risk Scanner
        </button>
      </div>

      {activeTab === 'intelligent_billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#0f3c4c]">
                <Target className="w-5 h-5 text-[#0d9488]" />
                Patient Cost Estimator (Live TPA)
              </h3>
              <p className="text-xs text-slate-500 mb-4">Simulating live TPA panel connection to estimate patient out-of-pocket limits before service delivery.</p>
              
              <div className="bg-[#f7fdfd] p-4 rounded-md border border-teal-100 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-teal-100 pb-2">
                  <span className="font-bold text-[#0f3c4c]">Procedure: Endoscopy</span>
                  <span className="font-mono text-slate-800">RM 1,200.00</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-teal-100 pb-2">
                  <span className="font-bold text-[#0f3c4c]">AIA Panel Coverage (80%)</span>
                  <span className="font-mono text-emerald-600">-RM 960.00</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-[#0f3c4c]">Patient Out of Pocket:</span>
                  <span className="font-mono text-rose-600">RM 240.00</span>
                </div>
                <button className="w-full mt-2 bg-[#0d9488] hover:bg-[#0f766e] text-white py-2 rounded-md text-xs font-bold transition-colors shadow-sm">
                  Generate Estimate PDF for Patient
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm text-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#0f3c4c]">
                <BarChart3 className="w-5 h-5 text-[#0d9488]" />
                Competitive Pricing Analysis
              </h3>
              <p className="text-xs text-slate-500 mb-6">Market intelligence: Your clinic's pricing versus regional averages within 10km radius.</p>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#0f3c4c]">General Consultation</span>
                    <span className="text-emerald-600">15% Below Market Avg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#0f3c4c]">Comprehensive Blood Panel</span>
                    <span className="text-amber-600">At Market Avg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#0f3c4c]">ECG / EKG</span>
                    <span className="text-rose-600">8% Above Market Avg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leakage' && (
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[#0f3c4c]">
              <Search className="w-5 h-5 text-[#0d9488]" />
              Revenue Leakage Detection AI
            </h3>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse border border-amber-200">
              RM 450.00 Missed Revenue Detected
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">AI actively scans Clinical SOAP notes and compares them against billed codes to identify missing or underbilled services.</p>
          
          <div className="space-y-4">
            <div className="bg-rose-50 p-4 rounded-md border border-rose-200 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Missed Billing: Nebulizer Administration</h4>
                    <p className="text-xs text-rose-800 mt-1">EHR Note mentions "Patient administered Salbutamol via nebulizer in clinic" but CPT code 94640 is missing from invoice.</p>
                  </div>
                  <span className="font-mono font-bold text-rose-700 bg-rose-200 px-2 py-1 rounded text-xs">+RM 65.00</span>
                </div>
                <button className="mt-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">
                  1-Click Auto-Add to Invoice
                </button>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-4">
              <Search className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Underbilled: Consultation Complexity</h4>
                    <p className="text-xs text-amber-800 mt-1">Patient was billed for 'Standard Consult' but time tracked in room was 45 mins with 3 complex diagnoses. Suggest upgrading to 'Extended Consult'.</p>
                  </div>
                  <span className="font-mono font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded text-xs">+RM 45.00</span>
                </div>
                <button className="mt-3 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">
                  Review & Upgrade Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'denials' && (
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[#0f3c4c]">
              <BrainCircuit className="w-5 h-5 text-[#0d9488]" />
              Pre-Claim Denial Risk Scanner
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">Claims are analyzed by predictive models *before* submission to prevent costly rejections from TPAs/Insurers.</p>
          
          <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7fdfd] text-[#0f3c4c] uppercase border-b border-teal-100 font-bold">
                <tr>
                  <th className="px-4 py-3">Claim ID</th>
                  <th className="px-4 py-3">Insurer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">AI Risk Score</th>
                  <th className="px-4 py-3">Detected Issue</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">CLM-88291</td>
                  <td className="px-4 py-3 font-semibold text-[#0f3c4c]">Prudential</td>
                  <td className="px-4 py-3 font-mono">RM 1,450.00</td>
                  <td className="px-4 py-3"><span className="bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold border border-rose-200">94% Denial Risk</span></td>
                  <td className="px-4 py-3 text-slate-600">Missing Pre-Authorization Code for MRI</td>
                  <td className="px-4 py-3"><button className="text-[#0d9488] font-bold hover:underline">Fix Now</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">CLM-88292</td>
                  <td className="px-4 py-3 font-semibold text-[#0f3c4c]">AIA Panel</td>
                  <td className="px-4 py-3 font-mono">RM 245.00</td>
                  <td className="px-4 py-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold border border-amber-200">68% Denial Risk</span></td>
                  <td className="px-4 py-3 text-slate-600">ICD-10 Code Mismatch with Age Group</td>
                  <td className="px-4 py-3"><button className="text-[#0d9488] font-bold hover:underline">Review Coding</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">CLM-88293</td>
                  <td className="px-4 py-3 font-semibold text-[#0f3c4c]">Great Eastern</td>
                  <td className="px-4 py-3 font-mono">RM 85.00</td>
                  <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold border border-emerald-200">Low Risk</span></td>
                  <td className="px-4 py-3 text-slate-400">None detected</td>
                  <td className="px-4 py-3"><button className="text-slate-400 font-bold cursor-not-allowed">Auto-Submit</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
