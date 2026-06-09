import React, { useState } from 'react';
import { Stethoscope, Plus, Search, CheckCircle, AlertTriangle, X, Trash2, PenTool, ArrowRightLeft, History } from 'lucide-react';
import EquipmentRegistration from './EquipmentRegistration';

export interface EquipmentItem {
  // 1. Asset Identification & Classification
  id: string;
  name: string;
  type: string;
  modelNumber?: string;
  serialNumber: string;
  manufacturer?: string;

  // 2. Purchase & Financial Details
  purchaseDate?: string;
  costPrice?: number;
  warrantyExpiryDate?: string;
  vendor?: string;
  depreciationRate?: number;
  depreciationMethod?: string;

  // 3. Location & Operational Status
  status: 'Operational' | 'Maintenance' | 'Decommissioned';
  assignedRoom?: string;
  custodian?: string;

  // 4. Calibration & Preventive Maintenance
  lastCalibrationDate?: string;
  nextMaintenance: string; // Next Calibration Due Date
  maintenanceFrequency?: string;
  safetyCertification?: string;
}

export interface EquipmentLog {
  id: string;
  date: string;
  equipmentName: string;
  action: 'Decommissioned' | 'Maintenance Logged' | 'Deployed';
  notes: string;
}

const INITIAL_EQUIPMENT: EquipmentItem[] = [
  { id: 'EQ-001', name: 'Digital BP Monitor (Room 1)', type: 'Diagnostic', status: 'Operational', nextMaintenance: '2026-08-12', serialNumber: 'BPM-8921-A' },
  { id: 'EQ-002', name: 'ECG Machine (Triage)', type: 'Diagnostic', status: 'Maintenance', nextMaintenance: '2026-06-01', serialNumber: 'ECG-X2-990' },
  { id: 'EQ-003', name: 'Autoclave Sterilizer', type: 'Sanitization', status: 'Operational', nextMaintenance: '2026-09-05', serialNumber: 'AC-1100-M' }
];

export default function EquipmentManagementModule() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');
  const [currentView, setCurrentView] = useState<'list' | 'registration'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [maintainEqId, setMaintainEqId] = useState<string | null>(null);
  const [disposeEqId, setDisposeEqId] = useState<string | null>(null);

  // Derived
  const filteredEq = equipmentList.filter(eq => 
    (eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) &&
    eq.status !== 'Decommissioned' // Hide decommissioned from active view
  );
  
  const issuesCount = equipmentList.filter(e => e.status === 'Maintenance').length;

  const handleAddEquipmentSubmit = (newEqData: Omit<EquipmentItem, 'id'>) => {
    const newEq: EquipmentItem = {
      id: `EQ-${Math.floor(Math.random() * 900) + 100}`,
      ...newEqData
    };

    setEquipmentList([...equipmentList, newEq]);
    setCurrentView('list');
  };

  const handleMaintain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintainEqId) return;

    const eq = equipmentList.find(e => e.id === maintainEqId);
    
    // Update to operational and set next date artificially 6 months from now
    setEquipmentList(prev => prev.map(item => 
      item.id === maintainEqId ? { ...item, status: 'Operational', nextMaintenance: '2026-12-01' } : item
    ));

    setLogs(prev => [{
      id: `EL-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      equipmentName: eq?.name || 'Unknown',
      action: 'Maintenance Logged',
      notes: 'Routine calibration and servicing completed.'
    }, ...prev]);

    setMaintainEqId(null);
  };

  const handleDispose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeEqId) return;

    const eq = equipmentList.find(e => e.id === disposeEqId);
    
    setEquipmentList(prev => prev.map(item => 
      item.id === disposeEqId ? { ...item, status: 'Decommissioned' } : item
    ));

    setLogs(prev => [{
      id: `EL-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      equipmentName: eq?.name || 'Unknown',
      action: 'Decommissioned',
      notes: 'Equipment marked for permanent disposal.'
    }, ...prev]);

    setDisposeEqId(null);
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
      
      {currentView === 'registration' ? (
        <EquipmentRegistration 
          onCancel={() => setCurrentView('list')} 
          onSubmit={handleAddEquipmentSubmit} 
        />
      ) : (
        <>
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-[#07B2B2]" />
                Equipment Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">Monitor medical device statuses, maintenance schedules, and calibration logs.</p>
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
              <ArrowRightLeft className="w-4 h-4" />
              Active Equipment
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
              Audit & Disposal Logs
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
             <div className="flex gap-4 w-full md:w-1/2">
                <div className={`p-3 rounded-xl border shadow-sm flex items-center gap-3 flex-1 ${issuesCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${issuesCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {issuesCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase ${issuesCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Calibration Issues</p>
                    <p className={`text-lg font-black ${issuesCount > 0 ? 'text-red-800' : 'text-emerald-800'}`}>{issuesCount} Devices</p>
                  </div>
                </div>
             </div>

             <div className="flex gap-3 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search serial number..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#07B2B2] outline-none w-64 shadow-sm" 
                  />
                </div>
                <button 
                  onClick={() => setCurrentView('registration')}
                  className="bg-[#07B2B2] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#058A8A] cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Log Equipment
                </button>
             </div>
          </div>

          {/* Grid View of Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEq.length === 0 ? (
               <div className="col-span-full p-10 text-center text-slate-400 font-medium">
                 No active equipment matches your criteria.
               </div>
            ) : filteredEq.map(eq => (
               <div key={eq.id} className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${eq.status === 'Maintenance' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="font-bold text-slate-800 leading-tight">{eq.name}</h3>
                   <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded tracking-wide ${eq.status === 'Maintenance' ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                     {eq.status}
                   </span>
                 </div>
                 
                 <div className="text-xs text-slate-500 space-y-1.5 mb-4">
                   <p className="flex justify-between"><strong>Category:</strong> <span>{eq.type}</span></p>
                   <p className="flex justify-between"><strong>S/N:</strong> <span className="font-mono">{eq.serialNumber}</span></p>
                   <p className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
                     <strong>Next Check:</strong> 
                     <span className={eq.status === 'Maintenance' ? 'text-red-600 font-bold' : 'font-mono'}>{eq.nextMaintenance}</span>
                   </p>
                 </div>

                 <div className="flex gap-2">
                   <button 
                     onClick={() => setMaintainEqId(eq.id)}
                     className="flex-1 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                   >
                     <PenTool className="w-3 h-3" /> Log Fix
                   </button>
                   <button 
                     onClick={() => setDisposeEqId(eq.id)}
                     className="flex-1 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                   >
                     <Trash2 className="w-3 h-3" /> Dispose
                   </button>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Equipment Audit & Disposal Logs
            </h3>
          </div>
          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-300" />
              <p className="text-sm font-medium">No maintenance or disposal logs found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Device Name</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{log.date}</td>
                    <td className="px-6 py-3 font-bold text-slate-800">{log.equipmentName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        log.action === 'Decommissioned' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600 text-xs italic">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Maintain Modal */}
      {maintainEqId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-blue-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><PenTool className="w-5 h-5 text-blue-600"/> Log Fix</h3>
              <button onClick={() => setMaintainEqId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleMaintain} className="p-5 space-y-4 text-center">
              <p className="text-sm text-slate-600">Mark <strong className="text-slate-800">{equipmentList.find(e => e.id === maintainEqId)?.name}</strong> as Operational and reset its calibration schedule?</p>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setMaintainEqId(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold text-sm shadow-sm cursor-pointer">Confirm Fix</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispose Modal */}
      {disposeEqId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-red-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-600"/> Decommission</h3>
              <button onClick={() => setDisposeEqId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDispose} className="p-5 space-y-4 text-center">
              <p className="text-sm text-slate-600">Are you sure you want to permanently decommission <strong className="text-slate-800">{equipmentList.find(e => e.id === disposeEqId)?.name}</strong>? It will be removed from the active grid.</p>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setDisposeEqId(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-sm shadow-sm cursor-pointer">Decommission</button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
}
