import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Search, CheckCircle, AlertTriangle, X, Trash2, PenTool, ArrowRightLeft, History, Cpu, ShieldCheck, Check, RefreshCw } from 'lucide-react';
import EquipmentRegistration from './EquipmentRegistration';
import { supabase } from '../lib/supabase';

export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  modelNumber?: string;
  serialNumber: string;
  manufacturer?: string;
  purchaseDate?: string;
  costPrice?: number;
  warrantyExpiryDate?: string;
  vendor?: string;
  depreciationRate?: number;
  depreciationMethod?: string;
  status: 'Operational' | 'Maintenance' | 'Decommissioned';
  assignedRoom?: string;
  custodian?: string;
  lastCalibrationDate?: string;
  nextMaintenance: string; 
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

const DEFAULT_30_EQUIPMENT: EquipmentItem[] = [
  { id: 'EQ101', name: 'Digital 12-Lead ECG Machine', type: 'Diagnostic', serialNumber: 'SN-ECG-90812', status: 'Operational', nextMaintenance: '2026-10-15', manufacturer: 'Philips Healthcare', assignedRoom: 'Consultation Room 1', custodian: 'Dr. Sarah Tan' },
  { id: 'EQ102', name: 'Ultrasound Diagnostic System', type: 'Imaging', serialNumber: 'SN-US-77401', status: 'Operational', nextMaintenance: '2026-11-20', manufacturer: 'Mindray', assignedRoom: 'Imaging Suite 2', custodian: 'Dr. Priya Nair' },
  { id: 'EQ103', name: 'Automated External Defibrillator (AED)', type: 'Diagnostic', serialNumber: 'SN-AED-44102', status: 'Operational', nextMaintenance: '2026-09-30', manufacturer: 'Zoll Medical', assignedRoom: 'Emergency Triage', custodian: 'Nurse Siti Aminah' },
  { id: 'EQ104', name: 'Vital Signs Patient Monitor', type: 'Diagnostic', serialNumber: 'SN-MON-33921', status: 'Operational', nextMaintenance: '2026-12-05', manufacturer: 'Edan Instruments', assignedRoom: 'Observation Room A', custodian: 'Nurse Jessica Lim' },
  { id: 'EQ105', name: 'Digital Chest X-Ray Unit', type: 'Imaging', serialNumber: 'SN-XRAY-10293', status: 'Operational', nextMaintenance: '2026-10-30', manufacturer: 'Fujifilm Healthcare', assignedRoom: 'Radiology Room 1', custodian: 'Tech. Rajan Pillai' },
  { id: 'EQ106', name: 'Benchtop Autoclave Sterilizer', type: 'Sanitization', serialNumber: 'SN-STER-88392', status: 'Operational', nextMaintenance: '2026-10-10', manufacturer: 'Tuttnauer', assignedRoom: 'Sterilization Room', custodian: 'Nurse Azman Kassim' },
  { id: 'EQ107', name: 'Automated Hematology Analyzer', type: 'Laboratory', serialNumber: 'SN-HEM-55201', status: 'Operational', nextMaintenance: '2026-11-15', manufacturer: 'Sysmex Corporation', assignedRoom: 'Pathology Lab', custodian: 'Tech. Rajan Pillai' },
  { id: 'EQ108', name: 'Clinical Biochemistry Analyzer', type: 'Laboratory', serialNumber: 'SN-BIO-99201', status: 'Operational', nextMaintenance: '2026-12-01', manufacturer: 'Roche Diagnostics', assignedRoom: 'Pathology Lab', custodian: 'Tech. Rajan Pillai' },
  { id: 'EQ109', name: 'ENT Examination Workstation', type: 'Diagnostic', serialNumber: 'SN-ENT-33102', status: 'Operational', nextMaintenance: '2027-01-15', manufacturer: 'ATMOS Medical', assignedRoom: 'ENT Suite', custodian: 'Dr. Marcus Wong' },
  { id: 'EQ110', name: 'Slit Lamp Ophthalmoscope', type: 'Diagnostic', serialNumber: 'SN-OPHTH-66491', status: 'Operational', nextMaintenance: '2026-10-25', manufacturer: 'Carl Zeiss Meditec', assignedRoom: 'Eye Consultation Room', custodian: 'Dr. Kenneth Lee' },
  { id: 'EQ111', name: 'Dental Delivery Chair Unit', type: 'Surgical', serialNumber: 'SN-DEN-88392', status: 'Operational', nextMaintenance: '2026-11-05', manufacturer: 'Dentsply Sirona', assignedRoom: 'Dental Suite 1', custodian: 'Dr. Marcus Wong' },
  { id: 'EQ112', name: 'Electric ICU Patient Bed System', type: 'Furniture', serialNumber: 'SN-BED-11029', status: 'Operational', nextMaintenance: '2027-04-05', manufacturer: 'Hill-Rom', assignedRoom: 'Observation Room B', custodian: 'Nurse Chloe Tay' },
  { id: 'EQ113', name: 'Micro-Syringe Infusion Pump', type: 'Diagnostic', serialNumber: 'SN-PUMP-44392', status: 'Operational', nextMaintenance: '2026-10-10', manufacturer: 'Terumo Corporation', assignedRoom: 'Treatment Bay 1', custodian: 'Nurse Siti Aminah' },
  { id: 'EQ114', name: 'Medical High-Suction Unit', type: 'Surgical', serialNumber: 'SN-SUC-88219', status: 'Operational', nextMaintenance: '2026-10-11', manufacturer: 'Atmos Healthcare', assignedRoom: 'Procedure Room 1', custodian: 'Nurse Azman Kassim' },
  { id: 'EQ115', name: 'Heavy-Duty Nebulizer Compressor', type: 'Diagnostic', serialNumber: 'SN-NEB-22910', status: 'Operational', nextMaintenance: '2027-02-01', manufacturer: 'Omron Healthcare', assignedRoom: 'Pediatric Treatment Bay', custodian: 'Dr. Marcus Wong' },
  { id: 'EQ116', name: 'Vaccine Cold-Chain Refrigerator', type: 'Sanitization', serialNumber: 'SN-FRIG-99302', status: 'Operational', nextMaintenance: '2026-09-30', manufacturer: 'Dometic Medical', assignedRoom: 'Pharmacy Dispensary', custodian: 'Pharm. Ahmad Razak' },
  { id: 'EQ117', name: 'Medical Oxygen Concentrator 10L', type: 'Diagnostic', serialNumber: 'SN-O2-33920', status: 'Operational', nextMaintenance: '2026-11-14', manufacturer: 'Philips Respironics', assignedRoom: 'Emergency Bay 2', custodian: 'Nurse Siti Aminah' },
  { id: 'EQ118', name: 'Finger Pulse Oximeter Unit A', type: 'Diagnostic', serialNumber: 'SN-OXY-88102', status: 'Operational', nextMaintenance: '2027-03-01', manufacturer: 'Choicemmed', assignedRoom: 'Triage Counter', custodian: 'Nurse Jessica Lim' },
  { id: 'EQ119', name: 'Digital Blood Pressure Monitor B', type: 'Diagnostic', serialNumber: 'SN-BPM-55392', status: 'Operational', nextMaintenance: '2026-12-10', manufacturer: 'Omron Healthcare', assignedRoom: 'Triage Counter 2', custodian: 'Nurse Siti Aminah' },
  { id: 'EQ120', name: 'Refrigerated Laboratory Centrifuge', type: 'Laboratory', serialNumber: 'SN-CENT-77291', status: 'Operational', nextMaintenance: '2026-10-20', manufacturer: 'Beckman Coulter', assignedRoom: 'Pathology Lab', custodian: 'Tech. Rajan Pillai' },
  { id: 'EQ121', name: 'Binocular LED Microscope', type: 'Laboratory', serialNumber: 'SN-MIC-11928', status: 'Operational', nextMaintenance: '2027-03-22', manufacturer: 'Olympus Corporation', assignedRoom: 'Pathology Lab', custodian: 'Tech. Rajan Pillai' },
  { id: 'EQ122', name: 'Otoscope & Ophthalmoscope Wall Set', type: 'Diagnostic', serialNumber: 'SN-OTO-99201', status: 'Operational', nextMaintenance: '2027-01-10', manufacturer: 'Welch Allyn', assignedRoom: 'Consultation Room 3', custodian: 'Dr. Marcus Wong' },
  { id: 'EQ123', name: 'Non-Contact Infrared Thermometer', type: 'Diagnostic', serialNumber: 'SN-TEMP-44192', status: 'Operational', nextMaintenance: '2026-11-05', manufacturer: 'Braun Healthcare', assignedRoom: 'Front Desk Triage', custodian: 'Admin Mei Ling' },
  { id: 'EQ124', name: 'Surgical LED Shadowless Light', type: 'Surgical', serialNumber: 'SN-LIGHT-66392', status: 'Operational', nextMaintenance: '2026-11-18', manufacturer: 'Dr. Mach', assignedRoom: 'Minor Surgery Theatre', custodian: 'Dr. Sarah Tan' },
  { id: 'EQ125', name: 'Emergency Crash Cart Trolley', type: 'Surgical', serialNumber: 'SN-CART-22910', status: 'Operational', nextMaintenance: '2026-10-01', manufacturer: 'Metro Healthcare', assignedRoom: 'Emergency Resuscitation', custodian: 'Nurse Siti Aminah' },
  { id: 'EQ126', name: 'MyKad Smart Card Optical Reader', type: 'IT/Office', serialNumber: 'SN-MYKAD-99102', status: 'Operational', nextMaintenance: '2027-04-01', manufacturer: 'Identiv Systems', assignedRoom: 'Patient Registration Desk', custodian: 'Admin Mei Ling' },
  { id: 'EQ127', name: 'Thermal Direct Receipt Printer', type: 'IT/Office', serialNumber: 'SN-PRINT-44291', status: 'Operational', nextMaintenance: '2027-03-15', manufacturer: 'Epson POS', assignedRoom: 'Billing & Cashier Desk', custodian: 'Admin Mei Ling' },
  { id: 'EQ128', name: 'Wireless Barcode Scanner Unit', type: 'IT/Office', serialNumber: 'SN-BARCODE-88392', status: 'Operational', nextMaintenance: '2027-06-20', manufacturer: 'Honeywell', assignedRoom: 'Pharmacy Counter 1', custodian: 'Pharm. Ahmad Razak' },
  { id: 'EQ129', name: 'Digital Uroflowmeter System', type: 'Diagnostic', serialNumber: 'SN-URO-11209', status: 'Operational', nextMaintenance: '2026-11-30', manufacturer: 'Laborie Medical', assignedRoom: 'Urology Procedure Room', custodian: 'Dr. Sarah Tan' },
  { id: 'EQ130', name: 'Hydraulic Patient Stretcher Trolley', type: 'Furniture', serialNumber: 'SN-TROLLEY-77201', status: 'Operational', nextMaintenance: '2027-01-25', manufacturer: 'Stryker Medical', assignedRoom: 'Patient Holding Area', custodian: 'Nurse Azman Kassim' }
];

export default function EquipmentManagementModule() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(DEFAULT_30_EQUIPMENT);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');
  const [currentView, setCurrentView] = useState<'list' | 'registration'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [maintainEqId, setMaintainEqId] = useState<string | null>(null);
  const [disposeEqId, setDisposeEqId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      const { data, error } = await supabase.from('equipment').select('*').order('name');
      if (data && data.length > 0 && !error) {
        setEquipmentList(data.map(eq => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
          status: eq.status as any,
          serialNumber: eq.serial_number,
          nextMaintenance: eq.next_maintenance,
          manufacturer: eq.manufacturer,
          assignedRoom: eq.assigned_room,
          custodian: eq.custodian
        })));
      } else {
        setEquipmentList(DEFAULT_30_EQUIPMENT);
      }
    };
    
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('equipment_logs')
        .select('*, equipment(name)')
        .order('date', { ascending: false });
        
      if (data && !error) {
        setLogs(data.map(l => ({
          id: l.id,
          date: new Date(l.date).toISOString().split('T')[0],
          equipmentName: l.equipment?.name || 'Unknown',
          action: l.action as any,
          notes: l.notes
        })));
      }
    };
    
    fetchEquipment();
    fetchLogs();
    
    const eqChannel = supabase.channel('eq_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, fetchEquipment)
      .subscribe();
      
    const logChannel = supabase.channel('eq_logs_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_logs' }, fetchLogs)
      .subscribe();
      
    return () => {
      supabase.removeChannel(eqChannel);
      supabase.removeChannel(logChannel);
    };
  }, []);

  const filteredEq = equipmentList.filter(eq => 
    (eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     eq.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    eq.status !== 'Decommissioned' // Hide decommissioned from active view
  );
  
  const issuesCount = equipmentList.filter(e => e.status === 'Maintenance').length;
  const operationalCount = equipmentList.filter(e => e.status === 'Operational').length;
  const operationalPercentage = equipmentList.length > 0 
    ? Math.round((operationalCount / equipmentList.length) * 100) 
    : 100;

  const handleAddEquipmentSubmit = async (newEqData: Omit<EquipmentItem, 'id'>) => {
    const { data: newEq, error } = await supabase.from('equipment').insert([{
      name: newEqData.name,
      type: newEqData.type,
      status: newEqData.status,
      serial_number: newEqData.serialNumber,
      next_maintenance: newEqData.nextMaintenance
    }]).select().single();
    
    if (newEq && !error) {
      await supabase.from('equipment_logs').insert([{
        equipment_id: newEq.id,
        action: 'Deployed',
        notes: 'Initial registration and deployment.'
      }]);
    }

    setCurrentView('list');
  };

  const handleMaintain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintainEqId) return;

    // Update to operational and set next date artificially 6 months from now
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);

    await supabase.from('equipment').update({ 
      status: 'Operational', 
      next_maintenance: nextDate.toISOString().split('T')[0] 
    }).eq('id', maintainEqId);

    await supabase.from('equipment_logs').insert([{
      equipment_id: maintainEqId,
      action: 'Maintenance Logged',
      notes: 'Routine calibration and servicing completed.'
    }]);

    setMaintainEqId(null);
  };

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeEqId) return;

    await supabase.from('equipment').update({ 
      status: 'Decommissioned' 
    }).eq('id', disposeEqId);

    await supabase.from('equipment_logs').insert([{
      equipment_id: disposeEqId,
      action: 'Decommissioned',
      notes: 'Equipment marked for permanent disposal.'
    }]);

    setDisposeEqId(null);
  };

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      
      {currentView === 'registration' ? (
        <EquipmentRegistration 
          onCancel={() => setCurrentView('list')} 
          onSubmit={handleAddEquipmentSubmit} 
        />
      ) : (
        <>
          {/* STRUCTURED CLINICAL HEADER BANNER */}
          <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
                  Medical Hardware Lifecycle
                </span>
                <span className="flex items-center justify-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {operationalPercentage}% Fleet Operational
                </span>
              </div>
              <h1 className="type-page-title text-ink flex items-center justify-center gap-2.5">
                <Stethoscope className="w-6 h-6 text-accent" />
                Equipment & Asset Management
              </h1>
              <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                Monitor medical device statuses, preventive maintenance schedules, calibration logs, and safety certifications.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => setActiveTab(activeTab === 'catalog' ? 'logs' : 'catalog')}
                className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs"
              >
                <History className="w-3.5 h-3.5 text-accent" />
                {activeTab === 'catalog' ? 'View Audit Logs' : 'View Catalog'}
              </button>
              <button 
                onClick={() => setCurrentView('registration')}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-none flex items-center justify-center gap-1.5 border border-teal-500/30 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log Equipment
              </button>
            </div>
          </div>

          {/* TOP 4 SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-accent rounded-none border border-line p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fleet Assets</span>
                <div className="p-2 bg-teal-50 rounded-none text-accent">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="type-metric text-ink">{equipmentList.length} Units</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium">
                  Registered
                </span>
              </div>
            </div>

            <div className="bg-surface-accent rounded-none border border-line p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calibration Flags</span>
                <div className={`p-2 rounded-none ${issuesCount > 0 ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-accent'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="type-metric text-ink">{issuesCount} Devices</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium ${issuesCount > 0 ? 'text-red-600 bg-red-50 border border-red-200' : 'text-emerald-600 bg-emerald-50'}`}>
                  {issuesCount > 0 ? 'Requires Service' : 'All Clear'}
                </span>
              </div>
            </div>

            <div className="bg-surface-accent rounded-none border border-line p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operational Health</span>
                <div className="p-2 bg-teal-50 rounded-none text-accent">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="type-metric text-ink">{operationalPercentage}%</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium">
                  {operationalCount} Ready
                </span>
              </div>
            </div>

            <div className="bg-surface-accent rounded-none border border-line p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Records</span>
                <div className="p-2 bg-teal-50 rounded-none text-accent">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="type-metric text-ink">{logs.length} Logs</h3>
                <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium border border-teal-200">
                  Audited
                </span>
              </div>
            </div>
          </div>

          {/* TAB SELECTION BAR */}
          <div className="flex justify-between items-center border-b border-slate-200">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('catalog')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'catalog' 
                    ? 'border-brand text-accent' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Active Equipment Fleet
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'logs' 
                    ? 'border-brand text-accent' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-4 h-4" />
                Audit & Disposal Logs
              </button>
            </div>

            {activeTab === 'catalog' && (
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search serial number or device..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-none text-xs focus:ring-2 focus:ring-brand outline-none w-64 shadow-sm" 
                />
              </div>
            )}
          </div>

          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Grid View of Equipment */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEq.length === 0 ? (
                   <div className="col-span-full p-10 text-center text-slate-400 font-medium bg-white border border-slate-200">
                     No active equipment matches your criteria.
                   </div>
                ) : filteredEq.map(eq => (
                   <div key={eq.id} className={`flex flex-col h-full p-5 rounded-none border shadow-sm transition-all hover:shadow-md ${eq.status === 'Maintenance' ? 'border-red-200 bg-red-50/50' : 'border-line bg-surface-accent'}`}>
                     <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-ink leading-tight">{eq.name}</h3>
                       <span className={`text-2xs uppercase font-bold px-2 py-0.5 rounded tracking-wider ${eq.status === 'Maintenance' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                         {eq.status}
                       </span>
                     </div>
                     
                     <div className="text-xs text-slate-500 space-y-1.5 mb-4">
                       <p className="flex justify-between"><strong>Category:</strong> <span>{eq.type}</span></p>
                       <p className="flex justify-between"><strong>S/N:</strong> <span className="font-mono">{eq.serialNumber}</span></p>
                       <p className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                         <strong>Next Maintenance:</strong> 
                         <span className={eq.status === 'Maintenance' ? 'text-red-600 font-bold' : 'font-mono text-slate-700'}>{eq.nextMaintenance}</span>
                       </p>
                     </div>

                     <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                       <button 
                         onClick={() => setMaintainEqId(eq.id)}
                         className="flex-1 py-1.5 border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 hover:text-accent text-slate-700 rounded-none text-2xs font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                       >
                         <PenTool className="w-3 h-3" /> Log Service
                       </button>
                       <button 
                         onClick={() => setDisposeEqId(eq.id)}
                         className="flex-1 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-none text-2xs font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
            <div className="bg-surface-accent border border-line rounded-none shadow-sm overflow-hidden animate-fadeIn">
              <div className="bg-surface px-5 py-3 border-b border-teal-100 flex justify-between items-center">
                <h3 className="type-card-title text-ink flex items-center justify-center gap-2">
                  <History className="w-4 h-4 text-accent" />
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
                  <thead className="bg-surface text-ink font-bold text-xs uppercase border-b border-teal-100">
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
                        <td className="px-6 py-3 font-bold text-ink">{log.equipmentName}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-2xs font-bold uppercase ${
                            log.action === 'Decommissioned' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-teal-100 text-teal-800 border border-teal-200'
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
              <div className="bg-white w-full max-w-sm rounded-none shadow-xl overflow-hidden animate-slideUp border border-slate-200">
                <div className="flex items-center justify-between p-4 border-b border-teal-100 bg-surface">
                  <h3 className="type-card-title text-ink flex items-center justify-center gap-2"><PenTool className="w-4 h-4 text-accent"/> Log Service / Calibration</h3>
                  <button onClick={() => setMaintainEqId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleMaintain} className="p-5 space-y-4 text-center">
                  <p className="text-xs text-slate-600 leading-relaxed">Mark <strong className="text-ink">{equipmentList.find(e => e.id === maintainEqId)?.name}</strong> as Operational and reset its calibration schedule?</p>
                  <div className="pt-2 flex gap-3">
                    <button type="button" onClick={() => setMaintainEqId(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-none font-bold text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-primary text-white hover:bg-primary-hover rounded-none font-bold text-xs shadow-sm cursor-pointer">Confirm Service</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dispose Modal */}
          {disposeEqId && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-none shadow-xl overflow-hidden animate-slideUp border border-slate-200">
                <div className="flex items-center justify-between p-4 border-b border-red-100 bg-red-50">
                  <h3 className="type-card-title text-red-900 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4 text-red-600"/> Decommission Device</h3>
                  <button onClick={() => setDisposeEqId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleDispose} className="p-5 space-y-4 text-center">
                  <p className="text-xs text-slate-600 leading-relaxed">Are you sure you want to permanently decommission <strong className="text-ink">{equipmentList.find(e => e.id === disposeEqId)?.name}</strong>? It will be removed from active fleet grid.</p>
                  <div className="pt-2 flex gap-3">
                    <button type="button" onClick={() => setDisposeEqId(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-none font-bold text-xs cursor-pointer">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-red-600 text-white hover:bg-red-700 rounded-none font-bold text-xs shadow-sm cursor-pointer">Decommission</button>
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
