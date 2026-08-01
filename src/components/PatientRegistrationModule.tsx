import React, { useState, useEffect } from 'react';
import { Users, Globe, UserCheck, FolderCheck, Plus, RotateCcw, Activity, ShieldAlert } from 'lucide-react';
import { Patient, Visit, Language } from '../types';
import MyKadScanner from './MyKadScanner';

interface PatientRegistrationModuleProps {
  t: any;
  activeLanguage: Language;
  patientsList: Patient[];
  addPatientToDb: (p: Patient) => void;
  addVisitToDb: (v: Visit) => void;
  onNavigateTab: (tab: string) => void;
}

export default function PatientRegistrationModule({
  t,
  activeLanguage,
  patientsList,
  addPatientToDb,
  addVisitToDb,
  onNavigateTab
}: PatientRegistrationModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'registry'>('form');

  // Registration Form state
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);
  const [isMyKadOpen, setIsMyKadOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    icNumber: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    phone: '',
    address: '',
    panelEmployer: 'None (Self-Pay)',
    chiefComplaint: '',
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [patientRegistrySearch, setPatientRegistrySearch] = useState('');

  // Auto-populate form if IC Number exists in patientsList
  useEffect(() => {
    const icClean = manualForm.icNumber.replace(/-/g, '');
    if (icClean.length >= 6) {
      const match = patientsList.find(p => p.icNumber.replace(/-/g, '') === icClean);
      if (match && match.id !== existingPatientId) {
        setExistingPatientId(match.id);
        setManualForm(prev => ({
          ...prev,
          fullName: match.fullName,
          gender: match.gender as any,
          dob: match.dob,
          phone: match.phone,
          address: match.address,
          panelEmployer: match.panelEmployer,
        }));
        setAllergiesList(match.drugAllergies);
      } else if (!match && existingPatientId) {
        setExistingPatientId(null);
      }
    }
  }, [manualForm.icNumber, patientsList]);

  // Trigger MyKad OCR simulated fill
  const handleMyKadComplete = (scannedDetails: any) => {
    setManualForm({
      fullName: scannedDetails.fullName,
      icNumber: scannedDetails.icNumber,
      gender: scannedDetails.gender,
      dob: scannedDetails.dob,
      phone: '01' + Math.floor(10000000 + Math.random() * 90000000), // realistic phone
      address: scannedDetails.address,
      panelEmployer: scannedDetails.fullName.includes('Hafiz') ? 'Petronas Panel' : scannedDetails.fullName.includes('Siti') ? 'Medkad Sdn Bhd' : 'None (Self-Pay)',
      chiefComplaint: '',
      temperature: '',
      bpSystolic: '',
      bpDiastolic: '',
      heartRate: '',
    });

    // Populate default demographic allergies if mapped
    if (scannedDetails.fullName.includes('Hafiz')) {
      setAllergiesList(['Penicillin']);
    } else if (scannedDetails.fullName.includes('Siti')) {
      setAllergiesList(['NSAID', 'Aspirin']);
    } else {
      setAllergiesList([]);
    }

    setIsMyKadOpen(false);
  };

  const handleAddAllergyTag = () => {
    if (allergyInput.trim() === '') return;
    if (!allergiesList.includes(allergyInput.trim())) {
      setAllergiesList([...allergiesList, allergyInput.trim()]);
    }
    setAllergyInput('');
  };

  const handleRemoveAllergyTag = (index: number) => {
    setAllergiesList(allergiesList.filter((_, idx) => idx !== index));
  };

  const handleClearForm = () => {
    setManualForm({
      fullName: '',
      icNumber: '',
      gender: 'Male',
      dob: '',
      phone: '',
      address: '',
      panelEmployer: 'None (Self-Pay)',
      chiefComplaint: '',
      temperature: '',
      bpSystolic: '',
      bpDiastolic: '',
      heartRate: '',
    });
    setAllergiesList([]);
    setExistingPatientId(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualForm.fullName.trim() || !manualForm.icNumber.trim()) {
      alert(activeLanguage === 'EN' ? 'Please complete Patient Full Name and IC number.' : 'Sila lengkapkan Nama Penuh dan No. Kad Pengenalan Pesakit.');
      return;
    }

    // Basic Malaysian IC pattern review (YYMMDD-XX-XXXX or just 12 digits)
    const icClean = manualForm.icNumber.replace(/-/g, '');
    if (icClean.length !== 12) {
      alert(activeLanguage === 'EN' ? 'Invalid MyKad formatting format. Must be 12 numeric digits.' : 'Format No. IC MyKad tidak sah. Mestilah 12 digit nombor.');
      return;
    }

    // Format phone sequence check
    if (!manualForm.phone.startsWith('01') && !manualForm.phone.startsWith('+60')) {
      alert(activeLanguage === 'EN' ? 'Please supply a standard Malaysian mobile sequence starting with 01xx.' : 'Sila berikan nombor telefon Malaysia yang sah bermula dengan 01xx.');
      return;
    }

    let targetPatientId = existingPatientId;

    if (!targetPatientId) {
      // Register active Patient
      const newPatient: Patient = {
        id: crypto.randomUUID(),
        fullName: manualForm.fullName,
        icNumber: manualForm.icNumber,
        gender: manualForm.gender as any,
        dob: manualForm.dob || '1990-01-01',
        address: manualForm.address || 'No Address, Malaysia',
        phone: manualForm.phone,
        panelEmployer: manualForm.panelEmployer,
        drugAllergies: allergiesList,
        registeredDate: new Date().toISOString().split('T')[0]
      };
      addPatientToDb(newPatient);
      targetPatientId = newPatient.id;
    }

    // Dispatch a new Visit record immediately into Doctor's Consulting queue
    const targetVisitId = crypto.randomUUID();
    const newVisit: Visit = {
      id: targetVisitId,
      patientId: targetPatientId,
      date: new Date().toISOString().split('T')[0],
      soap: {
        subjective: manualForm.chiefComplaint,
        objective: {
          bpSystolic: parseInt(manualForm.bpSystolic) || 120,
          bpDiastolic: parseInt(manualForm.bpDiastolic) || 80,
          heartRate: parseInt(manualForm.heartRate) || 72,
          temperature: parseFloat(manualForm.temperature) || 36.6,
          respiratoryRate: 16
        },
        assessment: { icdCode: '', description: '', clinicalNotes: '' },
        plan: { prescription: [], followUpWeeks: 1, mcDays: 0, requiresReferral: false }
      },
      status: 'Awaiting Consult',
      totalBill: 0,
      panelClaimed: 0,
      paidAmount: 0,
    };

    addVisitToDb(newVisit);
    handleClearForm();

    // Redirect back to dashboard to prevent blank screen for restricted roles
    onNavigateTab('dashboard');
  };

  const handleCreateTicket = (patient: Patient) => {
    const newVisit: Visit = {
      id: `V-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      registeredTime: Date.now(),
      soap: {
        subjective: 'General Consultation',
        objective: {
          bpSystolic: 120,
          bpDiastolic: 80,
          heartRate: 72,
          temperature: 36.6,
          respiratoryRate: 16
        },
        assessment: { icdCode: '', description: '', clinicalNotes: '' },
        plan: { prescription: [], followUpWeeks: 1, mcDays: 0, requiresReferral: false }
      },
      status: 'Awaiting Consult',
      totalBill: 0,
      panelClaimed: 0,
      paidAmount: 0,
    };

    addVisitToDb(newVisit);
    onNavigateTab('dashboard');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('form')}
          className={`pb-3 font-semibold text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeSubTab === 'form' ? 'text-[#07B2B2] border-[#07B2B2]' : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Registration Form
        </button>
        <button
          onClick={() => setActiveSubTab('registry')}
          className={`pb-3 font-semibold text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeSubTab === 'registry' ? 'text-[#07B2B2] border-[#07B2B2]' : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Patient Registry
        </button>
      </div>

      {activeSubTab === 'form' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          {/* Card: Demographics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-4">
              <div>
                <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#07B2B2]" />
                  1. {t.registerNew}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Malaysian demographic database validations integrated.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMyKadOpen(true)}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-semibold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
              >
                <Globe className="w-4 h-4 text-teal-600" />
                {t.scanMyKad}
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 text-xs">
                    {t.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                    value={manualForm.fullName}
                    onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                    placeholder="e.g. MOHD HAFIZ BIN RAZALI"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 text-xs">
                    {t.icNumber} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                    value={manualForm.icNumber}
                    onChange={(e) => setManualForm({ ...manualForm, icNumber: e.target.value })}
                    placeholder="YYMMDD-XX-XXXX"
                    required
                  />
                  {existingPatientId && (
                    <div className="mt-1 flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold">
                      <UserCheck className="w-3 h-3" />
                      Existing Record Found - Auto-populated
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 text-xs">
                    {t.gender}
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                    value={manualForm.gender}
                    onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}
                  >
                    <option value="Male">Male / Lelaki</option>
                    <option value="Female">Female / Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 text-xs">
                    {t.dob}
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                    value={manualForm.dob}
                    onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 text-xs">
                    {t.phone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="e.g. 012-3456789"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-slate-700 text-xs">
                  {t.address}
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  placeholder="Enter patient full residential address in Malaysia..."
                />
              </div>
            </div>
          </div>

          {/* Card: Billing & Medical Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <ShieldAlert className="w-4 h-4 text-indigo-500" />
              2. Billing & Medical Alerts
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Panel Search Dropdown */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-700 text-xs">
                  {t.panelEmployer}
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all shadow-sm"
                  value={manualForm.panelEmployer}
                  onChange={(e) => setManualForm({ ...manualForm, panelEmployer: e.target.value })}
                >
                  <option value="None (Self-Pay)">Self-Pay (No sponsor claim co-pays)</option>
                  <option value="Petronas Panel">Petronas Panel (Cover RM500 limit)</option>
                  <option value="Medkad Sdn Bhd">Medkad Sdn Bhd (Cover RM200 limit)</option>
                  <option value="MiCare TPA">MiCare TPA (Cover RM150, co-pay 10%)</option>
                  <option value="HealthMetrics Malaysia">HealthMetrics Malaysia (Cover RM300, co-pay 15%)</option>
                  <option value="PMCare Corporate">PMCare Corporate (Cover RM250 limit)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Select the primary sponsor or self-pay option.</p>
              </div>

              {/* Drug allergies builder tags */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-700 text-xs">
                  {t.drugAllergies}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none text-xs transition-all shadow-sm"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="e.g. Penicillin, Aspirin..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergyTag())}
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergyTag}
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Alert
                  </button>
                </div>

                {/* Allergy tags chips */}
                {allergiesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergiesList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergyTag(idx)}
                          className="text-red-400 hover:text-red-700 cursor-pointer leading-none hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Triage / Initial Assessment */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <Activity className="w-4 h-4 text-emerald-500" />
              3. Initial Triage (Optional)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="space-y-1.5">
                <label className="block text-slate-600 text-xs font-medium uppercase tracking-wider">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                  value={manualForm.temperature}
                  onChange={(e) => setManualForm({ ...manualForm, temperature: e.target.value })}
                  placeholder="36.6"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-slate-600 text-xs font-medium uppercase tracking-wider">BP Systolic</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                  value={manualForm.bpSystolic}
                  onChange={(e) => setManualForm({ ...manualForm, bpSystolic: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-slate-600 text-xs font-medium uppercase tracking-wider">BP Diastolic</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                  value={manualForm.bpDiastolic}
                  onChange={(e) => setManualForm({ ...manualForm, bpDiastolic: e.target.value })}
                  placeholder="80"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-slate-600 text-xs font-medium uppercase tracking-wider">Heart Rate</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                  value={manualForm.heartRate}
                  onChange={(e) => setManualForm({ ...manualForm, heartRate: e.target.value })}
                  placeholder="72"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-medium text-xs">
                Chief Complaint / Reason for Visit
              </label>
              <textarea
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-none transition-all shadow-sm"
                value={manualForm.chiefComplaint}
                onChange={(e) => setManualForm({ ...manualForm, chiefComplaint: e.target.value })}
                placeholder="Patient's primary complaint or presenting symptoms..."
              />
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClearForm}
              className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Form
            </button>
            <button
              type="submit"
              className="bg-[#07B2B2] hover:bg-[#058A8A] text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              <UserCheck className="w-4 h-4" />
              {t.saveRegistration}
            </button>
          </div>
        </form>
      )}

      {activeSubTab === 'registry' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-[#07B2B2]" />
              Registered Patient Registry
            </h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
              {patientsList.length} total patients
            </span>
          </div>
          
          <input
            type="text"
            placeholder={t.searchPatient}
            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none mb-4 transition-all shadow-sm"
            value={patientRegistrySearch}
            onChange={(e) => setPatientRegistrySearch(e.target.value)}
          />
          
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">IC Number</th>
                  <th className="px-4 py-3">Panel</th>
                  <th className="px-4 py-3">Allergies</th>
                  <th className="px-4 py-3 text-right">Registered</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {patientsList
                  .filter(p =>
                    p.fullName.toLowerCase().includes(patientRegistrySearch.toLowerCase()) ||
                    p.icNumber.includes(patientRegistrySearch)
                  )
                  .map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400 text-xs">
                        {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.fullName}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">{p.icNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${p.panelEmployer === 'None (Self-Pay)' ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                          {p.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : p.panelEmployer}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.drugAllergies.length === 0
                          ? <span className="text-slate-300 text-xs italic">None</span>
                          : <div className="flex flex-wrap gap-1">
                              {p.drugAllergies.map((a, i) => (
                                <span key={i} className="inline-block bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{a}</span>
                              ))}
                            </div>
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs text-right">{p.registeredDate}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleCreateTicket(p)}
                          className="bg-[#07B2B2] hover:bg-[#058A8A] text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                {patientsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center gap-2">
                        <FolderCheck className="w-8 h-8 text-slate-300" />
                        <p>No patients registered yet. Switch to the form to register a new patient.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulated MyKad Modal Screen Popup */}
      {isMyKadOpen && (
        <MyKadScanner
          onScanComplete={handleMyKadComplete}
          onClose={() => setIsMyKadOpen(false)}
        />
      )}
    </div>
  );
}
