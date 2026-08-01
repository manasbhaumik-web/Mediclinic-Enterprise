import React, { useState } from 'react';
import { Plus, Search, PackagePlus, AlertTriangle, Pill, X, Edit2, Trash2, Trash, Syringe, History, CheckCircle, Info, ShieldAlert, Zap, CalendarDays, TrendingDown, ShoppingCart, BrainCircuit } from 'lucide-react';
import { useInventory, DrugItem } from '../context/InventoryContext';
import DrugRegistration from './DrugRegistration';

export default function MedicineManagementModule() {
  const { catalog, logs, addDrug, restockDrug, deleteDrug, disposeDrug, useDrugInternally } = useInventory();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs' | 'supply_chain'>('catalog');
  const [currentView, setCurrentView] = useState<'list' | 'registration'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [detailsDrugId, setDetailsDrugId] = useState<string | null>(null);
  const [restockDrugId, setRestockDrugId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState('100');
  const [restockExpiryDate, setRestockExpiryDate] = useState('');
  
  const [disposeDrugId, setDisposeDrugId] = useState<string | null>(null);
  const [disposeAmount, setDisposeAmount] = useState('1');
  const [disposeReason, setDisposeReason] = useState('Expired');

  const [useDrugId, setUseDrugId] = useState<string | null>(null);
  const [useAmount, setUseAmount] = useState('1');
  const [useReason, setUseReason] = useState('Emergency Treatment');

  // Derived State
  const filteredCatalog = catalog.filter(drug => 
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = catalog.length;
  const lowStockCount = catalog.filter(d => d.currentStock <= d.minThreshold).length;

  const handleAddDrugSubmit = (newDrugData: Omit<DrugItem, 'id'>) => {
    addDrug(newDrugData);
    setCurrentView('list');
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockDrugId) return;

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) return;

    restockDrug(restockDrugId, amount, restockExpiryDate || undefined);

    setRestockDrugId(null);
    setRestockAmount('100'); // reset default
    setRestockExpiryDate('');
  };

  const handleDispose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeDrugId) return;

    const amount = parseInt(disposeAmount);
    if (isNaN(amount) || amount <= 0) return;

    disposeDrug(disposeDrugId, amount, disposeReason);

    setDisposeDrugId(null);
    setDisposeAmount('1'); 
    setDisposeReason('Expired');
  };

  const handleUse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useDrugId) return;

    const amount = parseInt(useAmount);
    if (isNaN(amount) || amount <= 0) return;

    useDrugInternally(useDrugId, amount, useReason);

    setUseDrugId(null);
    setUseAmount('1');
    setUseReason('Emergency Treatment');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to completely remove this medication from the catalog?')) {
      deleteDrug(id);
    }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
      
      {currentView === 'registration' ? (
        <DrugRegistration 
          onCancel={() => setCurrentView('list')} 
          onSubmit={handleAddDrugSubmit} 
        />
      ) : (
        <>
          {/* Header Area & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Pill className="w-6 h-6 text-[#07B2B2]" />
                Medicine & Inventory Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">Track drug catalogs, manage stock thresholds, and handle procurement.</p>
            </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
              activeTab === 'catalog' 
                ? 'bg-[#07B2B2] text-white' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4" />
              Catalog & Stock
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
              activeTab === 'logs' 
                ? 'bg-[#07B2B2] text-white' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Usage Logs
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('supply_chain')}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'supply_chain' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            Supply Chain AI
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Bar for Catalog */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex gap-4 w-full md:w-1/2">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center text-[#07B2B2]">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Items</p>
                  <p className="text-lg font-black text-slate-800">{totalItems}</p>
                </div>
              </div>
              <div className={`p-3 rounded-xl border shadow-sm flex items-center gap-3 flex-1 ${lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {lowStockCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase ${lowStockCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Low Stock Alerts</p>
                  <p className={`text-lg font-black ${lowStockCount > 0 ? 'text-red-800' : 'text-emerald-800'}`}>{lowStockCount}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search inventory..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#07B2B2] outline-none w-64 shadow-sm" 
                />
              </div>
              <button 
                onClick={() => setCurrentView('registration')}
                className="bg-[#07B2B2] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#058A8A] cursor-pointer shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Drug
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Medication Name</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                      No medications found matching your search.
                    </td>
                  </tr>
                ) : filteredCatalog.map((drug) => {
                  const isLowStock = drug.currentStock <= drug.minThreshold;
                  const stockPercentage = Math.min(100, Math.max(0, (drug.currentStock / (drug.minThreshold * 3)) * 100));

                  return (
                    <tr key={drug.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">{drug.name}</p>
                          {drug.isControlledDrug && (
                            <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-purple-200" title="Controlled Substance">Rx</span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {drug.category} • ID: {drug.id} • RM {drug.price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-40">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-bold text-slate-700">{drug.currentStock} Units</span>
                            <span className="text-[10px] text-slate-400">Min: {drug.minThreshold}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                            <div 
                              className={`h-1.5 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-[#07B2B2]'}`}
                              style={{ width: `${stockPercentage}%` }}
                            ></div>
                          </div>
                          {drug.batches && drug.batches.length > 0 && (
                            <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded w-fit uppercase">
                              {drug.batches.filter(b => b.stock > 0).length} Active Batches
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border border-red-100">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          {/* Main Action */}
                          <button 
                            onClick={() => setRestockDrugId(drug.id)}
                            className={`p-1.5 rounded border transition-all cursor-pointer flex items-center gap-1 px-2 ${
                              isLowStock 
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#07B2B2]'
                            }`}
                            title="Restock"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Restock</span>
                          </button>
                          
                          <button 
                            onClick={() => setDetailsDrugId(drug.id)}
                            className="p-1.5 text-slate-500 bg-white hover:bg-cyan-50 hover:text-cyan-600 border border-slate-200 rounded transition-all cursor-pointer flex items-center gap-1 px-2"
                            title="View Pharmacology Details"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Details</span>
                          </button>
                          
                          {/* Log Actions */}
                          <button 
                            onClick={() => setDisposeDrugId(drug.id)}
                            className="p-1.5 text-slate-500 bg-white hover:bg-orange-50 hover:text-orange-600 border border-slate-200 rounded transition-all cursor-pointer flex items-center gap-1 px-2"
                            title="Dispose"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Dispose</span>
                          </button>
                          <button 
                            onClick={() => setUseDrugId(drug.id)}
                            className="p-1.5 text-slate-500 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded transition-all cursor-pointer flex items-center gap-1 px-2"
                            title="Use Internally"
                          >
                            <Syringe className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase">Use</span>
                          </button>
                          
                          {/* Admin Actions */}
                          <div className="w-px bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => handleDelete(drug.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-all cursor-pointer"
                            title="Delete from Catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Inventory Audit Trail
                </h3>
             </div>
             
             {logs.length === 0 ? (
               <div className="p-10 text-center text-slate-400">
                 <History className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-300" />
                 <p className="text-sm font-medium">No inventory logs found.</p>
                 <p className="text-xs mt-1">Disposals, internal usage, and dispensations will appear here.</p>
               </div>
             ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Drug Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Units Deducted</th>
                      <th className="px-6 py-3">Reason / Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-mono text-xs text-slate-500">{log.date}</td>
                        <td className="px-6 py-3 font-bold text-slate-800">{log.drugName}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            log.type === 'Disposal' ? 'bg-orange-100 text-orange-700' :
                            log.type === 'Internal Use' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-red-600 font-bold">
                          -{log.amount}
                        </td>
                        <td className="px-6 py-3 text-slate-600 text-xs italic">
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
          </div>
        </div>
      )}

      {activeTab === 'supply_chain' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500/10" />
            <h3 className="text-indigo-900 font-black text-lg mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI Supply Chain & Predictive Restocking
            </h3>
            <p className="text-sm text-indigo-700 max-w-2xl">
              MediClinic AI analyzes dispensing velocity and expiration dates to automatically suggest purchase orders (POs) and prevent inventory waste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Expiry Radar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-orange-50">
                <h3 className="font-bold text-orange-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" /> Expiry Radar (90 Days)
                </h3>
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold">Action Required</span>
              </div>
              <div className="p-4 flex-1">
                <div className="space-y-3">
                  {catalog.filter(d => {
                    if(!d.expiryDate) return false;
                    const daysToExpiry = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
                    return daysToExpiry < 90 && daysToExpiry > 0;
                  }).map(drug => (
                    <div key={drug.id} className="bg-white border border-orange-200 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{drug.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Stock: {drug.currentStock} units • Expires: {drug.expiryDate}</p>
                      </div>
                      <button className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded text-xs font-bold transition-colors">
                        Mark for Return
                      </button>
                    </div>
                  ))}
                  {catalog.filter(d => d.expiryDate && ((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24)) < 90).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No medications expiring within 90 days.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Smart PO Generator */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
                <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" /> Smart PO Suggestions
                </h3>
                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-bold">AI Suggested</span>
              </div>
              <div className="p-4 flex-1">
                <div className="space-y-3">
                  {catalog.filter(d => d.consumptionVelocity && d.currentStock < d.consumptionVelocity * 2).map(drug => (
                    <div key={drug.id} className="bg-white border border-indigo-100 p-3 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{drug.name}</p>
                          <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 inline-block px-1 rounded mt-0.5">
                            High Velocity: ~{drug.consumptionVelocity} units/week
                          </p>
                        </div>
                        <p className="text-xs font-mono font-bold text-red-500 text-right">
                          Runout in <br/>{Math.floor(drug.currentStock / (drug.consumptionVelocity! / 7))} days
                        </p>
                      </div>
                      <button className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded text-xs font-bold transition-colors flex justify-center items-center gap-1.5 shadow-sm">
                        <ShoppingCart className="w-3.5 h-3.5" /> Generate 1-Click PO ({(drug.consumptionVelocity! * 4).toFixed(0)} Units)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -- ALL MODALS -- */}

      {/* Restock Modal */}
      {restockDrugId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-[#07B2B2]" />
                Restock Inventory
              </h3>
              <button onClick={() => setRestockDrugId(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRestock} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Adding stock to <span className="font-bold text-slate-800">{catalog.find(d => d.id === restockDrugId)?.name}</span>.</p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Amount to Add (Units)</label>
                <input type="number" required min="1" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} className="w-full px-3 py-3 text-lg font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#07B2B2] outline-none text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase flex justify-between">
                  <span>Batch Expiry Date</span>
                  <span className="text-[10px] font-normal text-slate-400">Optional</span>
                </label>
                <input type="date" value={restockExpiryDate} onChange={(e) => setRestockExpiryDate(e.target.value)} className="w-full px-3 py-3 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#07B2B2] outline-none text-center" />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setRestockDrugId(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#07B2B2] text-white hover:bg-[#058A8A] rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm">Confirm Restock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispose Modal */}
      {disposeDrugId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-orange-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trash className="w-5 h-5 text-orange-600" />
                Dispose Medication
              </h3>
              <button onClick={() => setDisposeDrugId(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDispose} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Disposing <span className="font-bold text-slate-800">{catalog.find(d => d.id === disposeDrugId)?.name}</span>.</p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Amount to Dispose</label>
                <input type="number" required min="1" max={catalog.find(d => d.id === disposeDrugId)?.currentStock || 1} value={disposeAmount} onChange={(e) => setDisposeAmount(e.target.value)} className="w-full px-3 py-3 text-lg font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Reason for Disposal</label>
                <select value={disposeReason} onChange={(e) => setDisposeReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Expired</option>
                  <option>Damaged Packaging</option>
                  <option>Contaminated</option>
                  <option>Recalled by Manufacturer</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setDisposeDrugId(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm">Confirm Disposal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drug Details Modal */}
      {detailsDrugId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            {catalog.filter(d => d.id === detailsDrugId).map(drug => (
              <div key={drug.id}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#07B2B2]" />
                      Pharmacology Profile
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">ID: {drug.id}</p>
                  </div>
                  <button onClick={() => setDetailsDrugId(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-5 space-y-5">
                  {/* Header Details */}
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-800">{drug.name}</h2>
                      {drug.isControlledDrug && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-purple-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Controlled (Rx)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1"><span className="font-bold">Generic:</span> {drug.genericName || 'N/A'}</p>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Category</p>
                      <p className="text-sm font-semibold text-slate-700">{drug.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Form / Type</p>
                      <p className="text-sm font-semibold text-slate-700">{drug.drugType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Manufacturer</p>
                      <p className="text-sm font-semibold text-slate-700">{drug.manufacturer || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Unit Price</p>
                      <p className="text-sm font-semibold text-[#07B2B2]">RM {drug.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Pharmacology Details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Indications (Used For)</p>
                      <p className="text-sm text-slate-700">{drug.indications || 'No indication details provided.'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Potential Side Effects</p>
                      <p className="text-sm text-slate-700">{drug.sideEffects || 'No side effects documented.'}</p>
                    </div>
                  </div>

                  {/* Dosage Box */}
                  <div className="border border-cyan-100 bg-cyan-50/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-[#07B2B2] uppercase mb-2 flex items-center gap-1">
                      <Pill className="w-4 h-4" /> Suggested Dosage
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Adults</p>
                        <p className="text-sm text-slate-700">{drug.suggestedDosage?.adults || 'Consult physician.'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Children</p>
                        <p className="text-sm text-slate-700">{drug.suggestedDosage?.children || 'Consult pediatrician.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* FIFO Batch Tracking Table */}
                  {drug.batches && drug.batches.length > 0 && (
                    <div className="border border-indigo-100 rounded-xl overflow-hidden mt-4">
                      <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">FIFO Batch Tracking</h4>
                      </div>
                      <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2">Batch ID</th>
                            <th className="px-4 py-2">Stock Level</th>
                            <th className="px-4 py-2">Expiry Date</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {drug.batches.sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(batch => {
                            const isDepleted = batch.stock <= 0;
                            const isExpiring = new Date(batch.expiryDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
                            return (
                              <tr key={batch.batchId} className={isDepleted ? 'opacity-40 bg-slate-50/50' : ''}>
                                <td className="px-4 py-2 font-mono font-bold text-slate-600">{batch.batchId}</td>
                                <td className="px-4 py-2 font-mono">{batch.stock} units</td>
                                <td className="px-4 py-2 font-mono">{batch.expiryDate}</td>
                                <td className="px-4 py-2">
                                  {isDepleted ? (
                                    <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-200 px-1.5 py-0.5 rounded">Depleted</span>
                                  ) : isExpiring ? (
                                    <span className="text-[9px] font-bold text-orange-700 uppercase bg-orange-100 px-1.5 py-0.5 rounded">Expiring Soon</span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">Active</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
}
