import React, { useState } from 'react';
import { 
  Plus, Search, PackagePlus, AlertTriangle, Pill, X, Edit2, Trash2, Trash, 
  Syringe, History, CheckCircle, Info, ShieldAlert, Zap, CalendarDays, 
  TrendingDown, ShoppingCart, BrainCircuit, Activity, CheckCircle2, RefreshCw, FileSpreadsheet 
} from 'lucide-react';
import { useInventory, DrugItem } from '../context/InventoryContext';
import DrugRegistration from './DrugRegistration';

import ProgressBar from './ui/ProgressBar';
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
  const controlledRxCount = catalog.filter(d => d.isControlledDrug).length;

  const handleAddDrugSubmit = (newDrugData: Omit<DrugItem, 'id'>) => {
    addDrug(newDrugData);
    setCurrentView('list');
  };

  const handleLoadSampleCatalog = () => {
    addDrug({
      name: 'Paracetamol 500mg',
      category: 'Analgesics',
      unit: 'Tablet',
      currentStock: 450,
      minThreshold: 100,
      price: 0.50,
      isControlledDrug: false
    });
    addDrug({
      name: 'Amoxicillin 500mg',
      category: 'Antibiotics',
      unit: 'Capsule',
      currentStock: 80,
      minThreshold: 100,
      price: 1.80,
      isControlledDrug: true
    });
    addDrug({
      name: 'Cetirizine 10mg',
      category: 'Antihistamines',
      unit: 'Tablet',
      currentStock: 200,
      minThreshold: 50,
      price: 0.80,
      isControlledDrug: false
    });
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockDrugId) return;

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) return;

    restockDrug(restockDrugId, amount, restockExpiryDate || undefined);

    setRestockDrugId(null);
    setRestockAmount('100');
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
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      
      {currentView === 'registration' ? (
        <DrugRegistration 
          onCancel={() => setCurrentView('list')} 
          onSubmit={handleAddDrugSubmit} 
        />
      ) : (
        <>
          {/* 1. STRUCTURED PAGE HEADER BANNER */}
          <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
                  Clinical Pharmacy Governance
                </span>
                <span className="flex items-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Dispensary Ready
                </span>
              </div>
              <h1 className="type-page-title text-ink flex items-center gap-2.5">
                <Pill className="w-6 h-6 text-accent" />
                Medicine &amp; Inventory Management
              </h1>
              <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                Track pharmaceutical drug catalogs, monitor stock thresholds, and handle automated procurement.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {activeTab === 'catalog' && (
                <button 
                  type="button"
                  onClick={() => setCurrentView('registration')}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-none flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Medication</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. TOP METRICS SUMMARY ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
              <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Total Catalog Items</span>
              <span className="text-xl font-bold font-mono text-ink block mt-0.5">{totalItems} Formulations</span>
            </div>

            <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
              <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Low Stock Alerts</span>
              <span className={`text-xl font-bold font-mono block mt-0.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {lowStockCount} {lowStockCount > 0 ? 'Critical' : 'Adequate'}
              </span>
            </div>

            <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
              <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Controlled Substances (Rx)</span>
              <span className="text-xl font-bold font-mono text-accent block mt-0.5">{controlledRxCount} Formulations</span>
            </div>

            <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
              <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Dispensary Fulfillment</span>
              <span className="text-xl font-bold font-mono text-emerald-700 block mt-0.5">100% Ready</span>
            </div>
          </div>

          {/* 3. SUB-TAB NAVIGATION BAR */}
          <div className="flex items-stretch gap-0 bg-surface-strong border-b border-line text-xs font-bold h-10 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'catalog' 
                  ? 'bg-chrome text-white font-bold' 
                  : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              <span>Catalog &amp; Stock Levels ({totalItems})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'logs' 
                  ? 'bg-chrome text-white font-bold' 
                  : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Dispensary &amp; Usage Logs ({logs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('supply_chain')}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'supply_chain' 
                  ? 'bg-chrome text-white font-bold' 
                  : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Supply Chain AI &amp; Forecasting</span>
            </button>
          </div>

          {/* 4. CATALOG TAB CONTENT */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              
              {/* Search Bar (Only when items exist) */}
              {catalog.length > 0 && (
                <div className="bg-surface-muted border border-line-subtle p-3.5 rounded-none shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search medication name, category..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-surface border border-line-subtle text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-brand" 
                    />
                  </div>

                  <div className="text-xs text-slate-600 font-bold">
                    Showing <strong className="text-accent font-mono">{filteredCatalog.length}</strong> of {totalItems} Formulations
                  </div>
                </div>
              )}

              {/* ONBOARDING EMPTY STATE (When NO drugs exist in catalog) */}
              {catalog.length === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
                  
                  {/* Left Hero Card */}
                  <div className="lg:col-span-7 bg-surface border border-line-subtle p-8 rounded-none shadow-xs space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-none bg-surface-accent border border-line text-accent flex items-center justify-center shadow-md">
                        <Pill className="w-7 h-7" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="type-section-title text-ink">Your medication catalog is empty</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Register pharmaceuticals, configure minimum reorder thresholds, and manage batch expiration tracking for dispensary safety.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentView('registration')}
                        className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-none shadow-md transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register First Medication</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleCatalog}
                        className="w-full sm:w-auto px-5 py-3 bg-surface-accent hover:bg-surface-strong text-accent font-bold text-xs border border-line rounded-none transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <PackagePlus className="w-4 h-4 text-accent" />
                        <span>Load Sample KKM Catalog</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Workflow Guide */}
                  <div className="lg:col-span-5 bg-surface-muted border border-line-subtle p-6 rounded-none space-y-4 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="type-label text-accent flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-accent" />
                        <span>Inventory Management Guide</span>
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                          <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">1</span>
                          <div>
                            <strong className="text-ink block font-bold">Register Formulation</strong>
                            <span className="text-2xs text-slate-600">Enter generic name, unit, unit price, and controlled substance flag.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                          <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">2</span>
                          <div>
                            <strong className="text-ink block font-bold">Set Minimum Threshold</strong>
                            <span className="text-2xs text-slate-600">Automate low-stock alerts before stock falls below safety levels.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                          <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">3</span>
                          <div>
                            <strong className="text-ink block font-bold">Track Expiry &amp; Restock</strong>
                            <span className="text-2xs text-slate-600">Receive automated alerts for expiring batch numbers.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line-subtle text-2xs text-accent font-bold flex items-center justify-between">
                      <span>KKM Approved Pharmaceutical Standards</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                </div>
              )}

              {/* SEARCH NO RESULTS STATE */}
              {catalog.length > 0 && filteredCatalog.length === 0 && (
                <div className="bg-surface border border-line-subtle p-10 text-center space-y-4">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="type-card-title text-ink">
                    No medications found matching &ldquo;{searchQuery}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-500">
                    Try refining your drug name or category search terms.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-surface-accent hover:bg-surface-strong text-accent font-bold text-xs border border-line cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Search Filter</span>
                  </button>
                </div>
              )}

              {/* CATALOG TABLE (When items exist) */}
              {filteredCatalog.length > 0 && (
                <div className="bg-surface border border-line-subtle rounded-none shadow-2xs overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-surface-accent text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
                      <tr>
                        <th className="px-6 py-3.5">Medication Name</th>
                        <th className="px-6 py-3.5">Stock Level &amp; Threshold</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle">
                      {filteredCatalog.map((drug) => {
                        const isLowStock = drug.currentStock <= drug.minThreshold;
                        const stockPercentage = Math.min(100, Math.max(0, (drug.currentStock / (drug.minThreshold * 3)) * 100));

                        return (
                          <tr key={drug.id} className="hover:bg-surface-muted transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-ink text-xs">{drug.name}</p>
                                {drug.isControlledDrug && (
                                  <span className="bg-amber-100 text-amber-900 text-2xs font-bold px-1.5 py-0.5 rounded-none uppercase border border-amber-300">
                                    Rx Controlled
                                  </span>
                                )}
                              </div>
                              <p className="text-2xs font-bold text-slate-500 tracking-wider">
                                {drug.category} • ID: <span className="font-mono text-accent">{drug.id}</span> • RM {drug.price.toFixed(2)} / {drug.unit}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 w-44">
                                <div className="flex justify-between items-center text-xs font-bold">
                                  <span className="font-mono text-ink">{drug.currentStock} {drug.unit}s</span>
                                  <span className="text-2xs text-slate-500 font-mono">Min: {drug.minThreshold}</span>
                                </div>
                                <ProgressBar value={stockPercentage} size="sm" tone={isLowStock ? 'danger' : 'primary'} />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isLowStock ? (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-1 rounded-none text-2xs font-bold uppercase border border-rose-300">
                                  <AlertTriangle className="w-3 h-3" /> Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none text-2xs font-bold uppercase border border-emerald-300">
                                  <CheckCircle className="w-3 h-3" /> Adequate
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => setRestockDrugId(drug.id)}
                                  className="px-2.5 py-1 text-2xs font-bold uppercase bg-primary hover:bg-primary-hover text-white rounded-none flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Restock medication inventory"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  <span>Restock</span>
                                </button>
                                
                                <button 
                                  type="button"
                                  onClick={() => setDetailsDrugId(drug.id)}
                                  className="px-2 py-1 text-2xs font-bold uppercase bg-surface-accent hover:bg-surface-strong text-accent border border-line rounded-none flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Pharmacology details"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>
                                
                                <button 
                                  type="button"
                                  onClick={() => handleDelete(drug.id)}
                                  className="p-1 text-slate-500 hover:text-rose-600 bg-rose-50 border border-rose-200 rounded-none cursor-pointer"
                                  title="Delete drug"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="bg-surface border border-line-subtle rounded-none shadow-2xs p-5 space-y-4">
              <h3 className="type-card-title text-ink flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                <span>Dispensary Usage &amp; Restock History</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-accent text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action Type</th>
                      <th className="px-4 py-3">Medication</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Details / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No dispensary transactions recorded yet.
                        </td>
                      </tr>
                    ) : logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-muted">
                        <td className="px-4 py-3 font-mono text-slate-500">{log.timestamp}</td>
                        <td className="px-4 py-3 font-bold uppercase text-2xs">
                          <span className={`px-2 py-0.5 border ${
                            log.type === 'Restock' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">{log.drugName}</td>
                        <td className="px-4 py-3 font-mono font-bold text-accent">{log.amount} units</td>
                        <td className="px-4 py-3 text-slate-600">{log.reason || 'Routine Dispensary'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPLY CHAIN TAB */}
          {activeTab === 'supply_chain' && (
            <div className="bg-surface border border-line-subtle rounded-none shadow-2xs p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
                <div className="w-10 h-10 bg-surface-accent border border-line text-accent flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="type-card-title text-ink">Supply Chain AI &amp; Predictive Forecasting</h3>
                  <p className="text-xs text-slate-600">Automated reorder triggers and expiry risk assessment for clinical pharmaceutical inventory.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-surface-muted border border-line-subtle p-4 space-y-2">
                  <strong className="text-ink font-bold block">Automated Purchase Orders</strong>
                  <p className="text-slate-600">Calculates lead-time buffer and creates purchase orders before low-stock thresholds are breached.</p>
                </div>
                <div className="bg-surface-muted border border-line-subtle p-4 space-y-2">
                  <strong className="text-ink font-bold block">Batch Expiry Risk Analysis</strong>
                  <p className="text-slate-600">Flags near-expiry batches 60 days in advance to prevent pharmaceutical waste.</p>
                </div>
              </div>
            </div>
          )}

        </>
      )}

      {/* Restock Modal */}
      {restockDrugId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface border border-line-subtle max-w-md w-full p-6 shadow-2xl space-y-4 text-ink">
            <div className="flex items-center justify-between border-b border-line-subtle pb-3">
              <h3 className="type-card-title flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-accent" />
                <span>Restock Inventory Batch</span>
              </h3>
              <button type="button" onClick={() => setRestockDrugId(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleRestock} className="space-y-4 text-xs">
              <div>
                <label className="block text-2xs uppercase font-bold text-slate-500 mb-1">Quantity to Add (Units) *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={restockAmount}
                  onChange={e => setRestockAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-muted border border-line-subtle text-ink font-mono text-sm font-bold focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-2xs uppercase font-bold text-slate-500 mb-1">Batch Expiry Date</label>
                <input 
                  type="date"
                  value={restockExpiryDate}
                  onChange={e => setRestockExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-muted border border-line-subtle text-ink focus:outline-none" 
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Confirm Inventory Restock
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
