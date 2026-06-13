import React, { useState } from 'react';
import { 
  TrendingUp, Activity, DollarSign, FileText, AlertTriangle, 
  CheckCircle2, Target, BarChart3, Clock, Wallet, ShieldCheck, 
  Search, BrainCircuit
} from 'lucide-react';

export default function RevenueCycleHub() {
  const [activeTab, setActiveTab] = useState<'intelligent_billing' | 'leakage' | 'denials'>('intelligent_billing');

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#07B2B2]" />
            Revenue Cycle Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            AI-Driven Billing, Leakage Detection, and Denial Management.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200">
            <Activity className="w-4 h-4" /> AI Active
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('intelligent_billing')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'intelligent_billing' ? 'border-[#07B2B2] text-[#07B2B2]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Intelligent Billing & Collections
        </button>
        <button 
          onClick={() => setActiveTab('leakage')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'leakage' ? 'border-[#07B2B2] text-[#07B2B2]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Revenue Leakage AI
        </button>
        <button 
          onClick={() => setActiveTab('denials')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'denials' ? 'border-[#07B2B2] text-[#07B2B2]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Pre-Claim Denial Scanner
        </button>
      </div>

      {activeTab === 'intelligent_billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" /> First-Pass Rate
               </p>
               <p className="text-3xl font-black text-slate-800">96.8%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-amber-500" /> Avg Payout Time
               </p>
               <p className="text-3xl font-black text-slate-800">12 Days</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                 <Wallet className="w-4 h-4 text-blue-500" /> Patient Payment Plans
               </p>
               <p className="text-3xl font-black text-slate-800">14 Active</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-indigo-500" /> Insurances Verified
               </p>
               <p className="text-3xl font-black text-slate-800">Auto-Synced</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-800">
                <Target className="w-5 h-5 text-[#07B2B2]" />
                Patient Cost Estimator (Live)
              </h3>
              <p className="text-xs text-slate-500 mb-4">Simulating live TPA panel connection to estimate patient out-of-pocket limits before service delivery.</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Procedure: Endoscopy</span>
                  <span className="font-mono text-slate-800">$1,200.00</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">AIA Panel Coverage (80%)</span>
                  <span className="font-mono text-emerald-600">-$960.00</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-slate-800">Patient Out of Pocket:</span>
                  <span className="font-mono text-rose-600">$240.00</span>
                </div>
                <button className="w-full mt-2 bg-slate-800 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors">
                  Generate Estimate PDF for Patient
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#07B2B2]">
                <BarChart3 className="w-5 h-5" />
                Competitive Pricing Analysis
              </h3>
              <p className="text-xs text-slate-500 mb-6">Market intelligence: Your clinic's pricing versus regional averages within 10km.</p>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>General Consultation</span>
                    <span className="text-emerald-600">15% Below Market Avg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Comprehensive Blood Panel</span>
                    <span className="text-amber-600">At Market Avg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>ECG / EKG</span>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
              <Search className="w-5 h-5 text-indigo-600" />
              Revenue Leakage Detection AI
            </h3>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              $450.00 Missed Revenue Detected
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">AI actively scans Clinical SOAP notes and compares them against billed codes to identify missing or underbilled services.</p>
          
          <div className="space-y-4">
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">Missed Billing: Nebulizer Administration</h4>
                    <p className="text-xs text-rose-600 mt-1">EHR Note mentions "Patient administered Salbutamol via nebulizer in clinic" but CPT code 94640 is missing from invoice.</p>
                  </div>
                  <span className="font-mono font-bold text-rose-700 bg-rose-200 px-2 py-1 rounded text-xs">+$65.00</span>
                </div>
                <button className="mt-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">
                  1-Click Auto-Add to Invoice
                </button>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-4">
              <Search className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">Underbilled: Consultation Complexity</h4>
                    <p className="text-xs text-amber-600 mt-1">Patient was billed for 'Standard Consult' but time tracked in room was 45 mins with 3 complex diagnoses. Suggest upgrading to 'Extended Consult'.</p>
                  </div>
                  <span className="font-mono font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded text-xs">+$45.00</span>
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
        <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
              <BrainCircuit className="w-5 h-5 text-rose-600" />
              Pre-Claim Denial Risk Scanner
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">Claims are analyzed by predictive models *before* submission to prevent costly rejections from TPAs/Insurers.</p>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">Claim ID</th>
                  <th className="px-4 py-3 font-bold">Insurer</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">AI Risk Score</th>
                  <th className="px-4 py-3 font-bold">Detected Issue</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">CLM-88291</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">Prudential</td>
                  <td className="px-4 py-3 font-mono">$1,450.00</td>
                  <td className="px-4 py-3"><span className="bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold">94% Denial Risk</span></td>
                  <td className="px-4 py-3 text-slate-600">Missing Pre-Authorization Code for MRI</td>
                  <td className="px-4 py-3"><button className="text-blue-600 font-bold hover:underline">Fix Now</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">CLM-88292</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">AIA Panel</td>
                  <td className="px-4 py-3 font-mono">$245.00</td>
                  <td className="px-4 py-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">68% Denial Risk</span></td>
                  <td className="px-4 py-3 text-slate-600">ICD-10 Code Mismatch with Age Group</td>
                  <td className="px-4 py-3"><button className="text-blue-600 font-bold hover:underline">Review Coding</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">CLM-88293</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">Great Eastern</td>
                  <td className="px-4 py-3 font-mono">$85.00</td>
                  <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">Low Risk</span></td>
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
