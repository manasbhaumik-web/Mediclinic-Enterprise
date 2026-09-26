import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Lock, Key, Eye, Activity, 
  ServerCrash, Fingerprint, Database, CheckCircle2, AlertTriangle, FileText, Stethoscope,
  RefreshCw, Download, Check
} from 'lucide-react';

export default function SecurityHub() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rbac' | 'audit'>('overview');

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* STRUCTURED CLINICAL HEADER BANNER */}
      <div className="bg-[#0a837f] text-white p-5 rounded-none shadow-md border-b border-[#086b68] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 text-teal-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wide">
              Zero-Trust Security & Audit
            </span>
            <span className="flex items-center gap-1 text-[11px] text-teal-200 bg-teal-900/40 px-2 py-0.5 rounded border border-teal-400/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              HIPAA & GDPR Compliant
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-teal-200" />
            Security & Compliance Hub
          </h1>
          <p className="text-xs text-teal-100/90 font-medium max-w-2xl leading-relaxed">
            Zero-Trust Architecture, Granular RBAC, Blockchain Audit Trails, and Real-time AI Anomaly Detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 border border-white/20 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>
          <button className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold px-3.5 py-2 rounded-md flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm">
            <Activity className="w-4 h-4 text-emerald-300" />
            Run Threat Scan
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zero-Trust Model</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">100% Enforced</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              <Check className="w-3 h-3" /> Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Anomaly Watch</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">1 Alert</h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium border border-amber-200">
              Auto-Blocked
            </span>
          </div>
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Encryption</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">AES-256</h3>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium border border-teal-200">
              TLS 1.3 Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blockchain Audit</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">#884920</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              Synced
            </span>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION SELECTION */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'overview' 
              ? 'border-[#0d9488] text-[#0d9488]' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Threat Dashboard & Encryption
        </button>
        <button 
          onClick={() => setActiveTab('rbac')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'rbac' 
              ? 'border-[#0d9488] text-[#0d9488]' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          RBAC & Granular Access
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'audit' 
              ? 'border-[#0d9488] text-[#0d9488]' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Blockchain Audit Trail
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Anomaly Detection */}
          <div className="bg-white p-6 rounded-none shadow-sm border border-slate-200 md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#0f3c4c]">
              <Activity className="w-5 h-5 text-[#0d9488]" />
              AI Anomaly Detection (Live Stream)
            </h3>
            
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-md mt-0.5 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-800 font-bold text-xs uppercase tracking-wider">Severity: Medium</span>
                    <span className="text-slate-500 text-[10px]">Just now</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mt-1">Unusual Data Access Pattern</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Account 'Dr. Lim' exported 150 patient records within 2 minutes. Auto-blocking bulk export.</p>
                </div>
              </div>
              
              <div className="bg-[#f7fdfd] p-4 rounded-md border border-teal-100 flex items-start gap-3">
                <div className="bg-teal-100 p-2 rounded-md mt-0.5 text-[#0d9488]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Resolved & Blocked</span>
                    <span className="text-slate-500 text-[10px]">45 mins ago</span>
                  </div>
                  <p className="text-sm font-bold text-[#0f3c4c] mt-1">Failed Login Spike Mitigated</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">IP range automatically blocked after 50 failed authentication attempts at API Gateway.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Encryption Status */}
          <div className="bg-white p-6 rounded-none shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#0f3c4c]">
              <Lock className="w-5 h-5 text-[#0d9488]" />
              Encryption Standards
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-[#0f3c4c] font-bold">Data at Rest (EHR)</span>
                  <span className="text-xs font-mono bg-teal-50 text-[#0d9488] border border-teal-200 px-2 py-0.5 rounded font-bold">AES-256-GCM</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-[#0f3c4c] font-bold">Data in Transit</span>
                  <span className="text-xs font-mono bg-teal-50 text-[#0d9488] border border-teal-200 px-2 py-0.5 rounded font-bold">TLS 1.3</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-[#0f3c4c] font-bold">Internal Messaging</span>
                  <span className="text-xs font-mono bg-teal-50 text-[#0d9488] border border-teal-200 px-2 py-0.5 rounded font-bold">End-to-End</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-[#0f3c4c] font-bold">KMS Key Rotation</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Every 30 Days</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rbac' && (
        <div className="bg-white p-6 rounded-none shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-[#0f3c4c]">
            <Key className="w-5 h-5 text-[#0d9488]" />
            Role-Based Access Control (RBAC Matrix)
          </h3>
          <p className="text-xs text-slate-500 mb-6">Manage granular permissions down to the feature and data field level. Zero-Trust model enforced.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7fdfd] text-[#0f3c4c] uppercase border-b border-teal-100 font-bold">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Clinical Records</th>
                  <th className="px-4 py-3">Billing Data</th>
                  <th className="px-4 py-3">System Config</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-[#0f3c4c] flex items-center gap-2"><Fingerprint className="w-4 h-4 text-[#0d9488]" /> Super Admin</td>
                  <td className="px-4 py-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-[10px] font-bold border border-teal-200">Full Access</span></td>
                  <td className="px-4 py-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-[10px] font-bold border border-teal-200">Full Access</span></td>
                  <td className="px-4 py-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-[10px] font-bold border border-teal-200">Full Access</span></td>
                  <td className="px-4 py-4"><button className="text-[#0d9488] font-bold hover:underline">Edit Policy</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-[#0f3c4c] flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[#0d9488]" /> Physician</td>
                  <td className="px-4 py-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-[10px] font-bold border border-teal-200">Read/Write</span></td>
                  <td className="px-4 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">No Access</span></td>
                  <td className="px-4 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">No Access</span></td>
                  <td className="px-4 py-4"><button className="text-[#0d9488] font-bold hover:underline">Edit Policy</button></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-bold text-[#0f3c4c] flex items-center gap-2"><FileText className="w-4 h-4 text-[#0d9488]" /> Billing Clinic Assistant</td>
                  <td className="px-4 py-4"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold border border-amber-200">Read Only (Masked)</span></td>
                  <td className="px-4 py-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-[10px] font-bold border border-teal-200">Full Access</span></td>
                  <td className="px-4 py-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">No Access</span></td>
                  <td className="px-4 py-4"><button className="text-[#0d9488] font-bold hover:underline">Edit Policy</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-none shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6 border-b border-teal-100 bg-[#f7fdfd] -mx-6 -mt-6 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[#0f3c4c]">
              <Database className="w-5 h-5 text-[#0d9488]" />
              Blockchain Audit Trail
            </h3>
            <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-[10px] font-bold border border-teal-200 font-mono">
              SYNCING BLOCK 884920...
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Immutable record of all system access and changes for continuous HIPAA / GDPR compliance auditing.</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-[#f7fdfd] p-3 rounded-md border border-teal-100 font-mono text-[10px]">
              <span className="text-slate-400">10:45:02 UTC</span>
              <span className="text-teal-700 font-bold w-16">UPDATE</span>
              <span className="text-[#0f3c4c] flex-1 truncate">Physician #102 appended SOAP notes to Patient #PT-8891</span>
              <span className="text-[#0d9488] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x8f9a...2b1c</span>
            </div>
            <div className="flex items-center gap-4 bg-[#f7fdfd] p-3 rounded-md border border-teal-100 font-mono text-[10px]">
              <span className="text-slate-400">10:42:15 UTC</span>
              <span className="text-teal-700 font-bold w-16">ACCESS</span>
              <span className="text-[#0f3c4c] flex-1 truncate">Clinic Assistant #501 viewed billing record for Patient #PT-8891</span>
              <span className="text-[#0d9488] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x4e2d...9a0f</span>
            </div>
            <div className="flex items-center gap-4 bg-[#f7fdfd] p-3 rounded-md border border-teal-100 font-mono text-[10px]">
              <span className="text-slate-400">10:40:00 UTC</span>
              <span className="text-emerald-600 font-bold w-16">LOGIN</span>
              <span className="text-[#0f3c4c] flex-1 truncate">Physician #102 authenticated via biometric MFA</span>
              <span className="text-[#0d9488] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x1a7c...5d3e</span>
            </div>
             <div className="flex items-center gap-4 bg-[#f7fdfd] p-3 rounded-md border border-teal-100 font-mono text-[10px] opacity-70">
              <span className="text-slate-400">10:35:11 UTC</span>
              <span className="text-amber-600 font-bold w-16">SYSTEM</span>
              <span className="text-[#0f3c4c] flex-1 truncate">Automated compliance check passed</span>
              <span className="text-[#0d9488] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded truncate max-w-[120px]">Hash: 0x9b4f...1c8a</span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2 rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
              <Eye className="w-4 h-4" /> Export Immutable Ledger
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
