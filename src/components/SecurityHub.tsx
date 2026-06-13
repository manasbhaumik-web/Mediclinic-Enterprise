import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Lock, Key, Eye, Activity, 
  ServerCrash, Fingerprint, Database, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';

export default function SecurityHub() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rbac' | 'audit'>('overview');

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
            Security & Compliance Hub
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Zero-Trust Architecture, RBAC, Blockchain Audit Trails, and AI Anomaly Detection.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200">
            <ShieldCheck className="w-4 h-4" /> SECURE
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'overview' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Threat Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('rbac')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'rbac' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          RBAC & Access
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'audit' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Blockchain Audit Trail
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Anomaly Detection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-rose-600">
              <Activity className="w-5 h-5" />
              AI Anomaly Detection (Live)
            </h3>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="bg-rose-500/20 p-2 rounded-lg mt-1">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold text-xs uppercase tracking-wider">Severity: Medium</span>
                    <span className="text-slate-500 text-[10px]">Just now</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-1">Unusual Data Access Pattern</p>
                  <p className="text-xs text-slate-500 mt-1">Account 'Dr. Lim' exported 150 patient records within 2 minutes. Auto-blocking bulk export.</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg mt-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Resolved</span>
                    <span className="text-slate-500 text-[10px]">45 mins ago</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-1">Failed Login Spike Mitigated</p>
                  <p className="text-xs text-slate-500 mt-1">IP range automatically blocked after 50 failed authentication attempts at API Gateway.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Encryption Status */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-800">
              <Lock className="w-5 h-5 text-indigo-600" />
              Encryption Status
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-600 font-bold">Data at Rest (EHR)</span>
                  <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">AES-256-GCM</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-600 font-bold">Data in Transit</span>
                  <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">TLS 1.3</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-600 font-bold">Internal Messaging</span>
                  <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">End-to-End</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">Key Rotation</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Every 30 Days</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rbac' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-slate-800">
            <Key className="w-5 h-5 text-blue-600" />
            Role-Based Access Control (RBAC)
          </h3>
          <p className="text-xs text-slate-500 mb-6">Manage granular permissions down to the feature and data field level. Zero-Trust model enforced.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold rounded-tl-lg">Role</th>
                  <th className="px-4 py-3 font-bold">Clinical Records</th>
                  <th className="px-4 py-3 font-bold">Billing Data</th>
                  <th className="px-4 py-3 font-bold">System Config</th>
                  <th className="px-4 py-3 font-bold rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-slate-800 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-rose-600" /> Super Admin</td>
                  <td className="px-4 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">Full Access</span></td>
                  <td className="px-4 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">Full Access</span></td>
                  <td className="px-4 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">Full Access</span></td>
                  <td className="px-4 py-4"><button className="text-blue-600 font-bold hover:underline">Edit Policy</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-slate-800 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-emerald-600" /> Physician</td>
                  <td className="px-4 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">Read/Write</span></td>
                  <td className="px-4 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">No Access</span></td>
                  <td className="px-4 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">No Access</span></td>
                  <td className="px-4 py-4"><button className="text-blue-600 font-bold hover:underline">Edit Policy</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Billing Clerk</td>
                  <td className="px-4 py-4"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">Read Only (Masked)</span></td>
                  <td className="px-4 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">Full Access</span></td>
                  <td className="px-4 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">No Access</span></td>
                  <td className="px-4 py-4"><button className="text-blue-600 font-bold hover:underline">Edit Policy</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
              <Database className="w-5 h-5 text-emerald-600" />
              Blockchain Audit Trail
            </h3>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold animate-pulse">
              SYNCING BLOCK 884920...
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Immutable record of all system access and changes for continuous HIPAA / GDPR compliance auditing.</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px]">
              <span className="text-slate-400">10:45:02 UTC</span>
              <span className="text-rose-500 font-bold w-16">UPDATE</span>
              <span className="text-slate-700 flex-1 truncate">Physician #102 appended SOAP notes to Patient #PT-8891</span>
              <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x8f9a...2b1c</span>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px]">
              <span className="text-slate-400">10:42:15 UTC</span>
              <span className="text-blue-500 font-bold w-16">ACCESS</span>
              <span className="text-slate-700 flex-1 truncate">Clerk #501 viewed billing record for Patient #PT-8891</span>
              <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x4e2d...9a0f</span>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px]">
              <span className="text-slate-400">10:40:00 UTC</span>
              <span className="text-emerald-500 font-bold w-16">LOGIN</span>
              <span className="text-slate-700 flex-1 truncate">Physician #102 authenticated via biometric MFA</span>
              <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x1a7c...5d3e</span>
            </div>
             <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px] opacity-70">
              <span className="text-slate-400">10:35:11 UTC</span>
              <span className="text-amber-500 font-bold w-16">SYSTEM</span>
              <span className="text-slate-700 flex-1 truncate">Automated compliance check passed</span>
              <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x9b4f...1c8a</span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-900 transition-colors flex items-center gap-2">
              <Eye className="w-4 h-4" /> Export Immutable Ledger
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
