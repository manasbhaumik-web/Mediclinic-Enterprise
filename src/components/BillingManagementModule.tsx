import React, { useState } from 'react';
import { CreditCard, DollarSign, Search, FileText, CheckCircle, Clock, ShieldCheck, FileSpreadsheet, Plus } from 'lucide-react';
import { useFinancials } from '../context/FinancialContext';
import { useSettings } from '../context/SettingsContext';

export default function BillingManagementModule() {
  const { transactions, markClaimAsPaid } = useFinancials();
  const { settings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'ledger' | 'claims'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate Metrics
  const totalRevenue = transactions
    .filter(t => t.status === 'Completed' || t.status === 'Claim Paid')
    .reduce((sum, t) => sum + t.paidAmount + t.panelClaimed, 0);

  const pendingClaims = transactions
    .filter(t => t.status === 'Pending Claim')
    .reduce((sum, t) => sum + t.panelClaimed, 0);

  // Approximate SST based on global tax rate assuming revenue includes tax
  const TAX_RATE = settings.billing.taxRate / 100;
  // Tax = Revenue - (Revenue / (1 + TAX_RATE))
  const taxLiability = totalRevenue - (totalRevenue / (1 + TAX_RATE));

  // Filtered lists
  const filteredLedger = transactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.visitId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const claimsList = transactions.filter(t => t.paymentMethod === 'Panel');
  const filteredClaims = claimsList.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.glNumber && t.glNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
      
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#07B2B2]" />
            Billing Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">Oversee clinic revenue, TPA panel claims, and invoice reconciliation.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Financials
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">MTD Revenue</p>
            <div className="p-1.5 bg-emerald-50 rounded-md text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">RM {totalRevenue.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pending Claims</p>
            <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">RM {pendingClaims.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tax Liability (SST {settings.billing.taxRate}%)</p>
            <div className="p-1.5 bg-slate-50 rounded-md text-slate-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">RM {taxLiability.toFixed(2)}</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 rounded-t-lg text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'ledger' 
              ? 'border-[#07B2B2] text-[#07B2B2] bg-cyan-50/30' 
              : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Transactions Ledger
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2.5 rounded-t-lg text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'claims' 
              ? 'border-[#07B2B2] text-[#07B2B2] bg-cyan-50/30' 
              : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          TPA Panel Claims
          {pendingClaims > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full ml-1">
              {transactions.filter(t => t.status === 'Pending Claim').length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input 
          type="text" 
          placeholder="Search ID, Patient, or GL Number..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#07B2B2] outline-none shadow-sm" 
        />
      </div>

      {/* Ledger Tab View */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                    No transactions found.
                  </td>
                </tr>
              ) : filteredLedger.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{trx.id}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(trx.date).toLocaleString()} • Visit: {trx.visitId} • Pt: {trx.patientId}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      trx.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' :
                      trx.paymentMethod === 'Panel' ? 'bg-sky-100 text-sky-700' :
                      trx.paymentMethod === 'Credit Card' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {trx.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      trx.status === 'Completed' || trx.status === 'Claim Paid' ? 'text-emerald-600' : 'text-amber-500'
                    }`}>
                      {trx.status === 'Completed' || trx.status === 'Claim Paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-slate-800">RM {(trx.paidAmount + trx.panelClaimed).toFixed(2)}</p>
                    {trx.panelClaimed > 0 && (
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        (RM {trx.paidAmount.toFixed(2)} copay + RM {trx.panelClaimed.toFixed(2)} panel)
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TPA Claims Tab View */}
      {activeTab === 'claims' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Claim Details</th>
                <th className="px-6 py-4">Patient / Visit</th>
                <th className="px-6 py-4">Amount Claimed</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-300" />
                    <p className="text-sm font-medium">No panel claims match your criteria.</p>
                  </td>
                </tr>
              ) : filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      {claim.id}
                      {claim.status === 'Pending Claim' ? (
                        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Pending</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Paid</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      GL Number: <span className="font-mono font-bold text-slate-700">{claim.glNumber || 'N/A'}</span>
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-700 font-medium">Pt ID: {claim.patientId}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Visit: {claim.visitId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#07B2B2]">RM {claim.panelClaimed.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {claim.status === 'Pending Claim' ? (
                      <button 
                        onClick={() => markClaimAsPaid(claim.id)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark as Paid
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Reconciled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
