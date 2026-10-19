import React, { useState, useEffect } from 'react';
import { Users, Globe, UserCheck, FolderCheck, Plus, RotateCcw, Activity, ShieldAlert, ArrowRight, ArrowLeft, Search, Loader2, ShieldCheck, CheckCircle2, Clock, Check, Filter, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Patient, Visit, Language } from '../types';
import MyKadScanner from './MyKadScanner';
import { useAuth } from '../context/AuthContext';
import { maskICNumber } from '../utils/piiMasker';
import FormField, { fieldBorder } from './ui/FormField';
import { formatNric, nricError, parseNric } from '../utils/nric';

interface PatientRegistrationModuleProps {
  t: any;
  activeLanguage: Language;
  searchPatients: (query: string) => Promise<Patient[]>;
  totalPatientCount: number;
  triageQueue: Visit[];
  patientsMap: Record<string, Patient>;
  addPatientToDb: (p: Patient) => void;
  addVisitToDb: (v: Visit) => void;
  updateVisitInDb: (v: Visit) => void;
  onNavigateTab: (tab: string) => void;
}

export default function PatientRegistrationModule({
  t,
  activeLanguage,
  searchPatients,
  totalPatientCount,
  triageQueue,
  patientsMap,
  addPatientToDb,
  addVisitToDb,
  updateVisitInDb,
  onNavigateTab
}: PatientRegistrationModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'form' | 'registry'>('registry');
  const [registrationStep, setRegistrationStep] = useState<'id_check' | 'details'>('id_check');
  const [idCheckValue, setIdCheckValue] = useState('');
  
  // Wizard Step State
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  
  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global PII Masking State
  const { showPII } = useAuth();

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
  
  // Insurance Panel Validation State
  const [isVerifyingCoverage, setIsVerifyingCoverage] = useState(false);
  const [coverageStatus, setCoverageStatus] = useState<'unverified' | 'verified' | 'failed'>('unverified');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [idCheckError, setIdCheckError] = useState('');

  const clearError = (key: string) =>
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  const focusField = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
  const inputBase = 'w-full bg-surface dark:bg-night-900 border rounded-none px-3 py-2 text-xs text-ink dark:text-slate-100 outline-none';

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-populate form if IC Number exists in patientsList
  useEffect(() => {
    const icClean = manualForm.icNumber.replace(/-/g, '');
    if (icClean.length >= 6) {
      searchPatients(icClean).then(results => {
        const match = results.find(p => p.icNumber.replace(/-/g, '') === icClean);
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
          setCoverageStatus(match.panelEmployer === 'None (Self-Pay)' ? 'verified' : 'unverified');
        } else if (!match && existingPatientId) {
          setExistingPatientId(null);
          setCoverageStatus('unverified');
        }
      });
    }
  }, [manualForm.icNumber, searchPatients, existingPatientId]);

  // Registry Search State
  const [registryResults, setRegistryResults] = useState<Patient[]>([]);
  type SortKey = 'id' | 'name' | 'sponsor' | 'registered';
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const toggleSort = (key: SortKey) =>
    setSort((cur) => (!cur || cur.key !== key ? { key, dir: 'asc' } : cur.dir === 'asc' ? { key, dir: 'desc' } : null));
  const sortedResults = (() => {
    if (!sort) return registryResults;
    const value = (pt: Patient) =>
      sort.key === 'id' ? pt.id
      : sort.key === 'name' ? pt.fullName.toLowerCase()
      : sort.key === 'sponsor' ? (pt.panelEmployer === 'None (Self-Pay)' ? 'self-pay' : pt.panelEmployer.toLowerCase())
      : pt.registeredDate;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...registryResults].sort((a, b) => (value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0) * factor);
  })();
  const sortHeader = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => {
    const active = sort?.key === key ? sort.dir : null;
    const Icon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ArrowUpDown;
    return (
      <th
        scope="col"
        aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none'}
        className={`px-4 py-3.5 ${align === 'right' ? 'text-right' : ''}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1.5 uppercase tracking-wider font-bold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${align === 'right' ? 'flex-row-reverse' : ''}`}
        >
          {label}
          <Icon className={`w-3.5 h-3.5 ${active ? 'text-ink' : 'opacity-50'}`} aria-hidden="true" />
        </button>
      </th>
    );
  };
  useEffect(() => {
    if (activeSubTab === 'registry') {
      const q = patientRegistrySearch.trim() || ' ';
      searchPatients(q).then(setRegistryResults);
    }
  }, [patientRegistrySearch, activeSubTab, searchPatients]);

  // Trigger MyKad OCR simulated fill
  const handleMyKadComplete = (scannedDetails: any) => {
    const defaultPanel = scannedDetails.fullName.includes('Hafiz') ? 'Petronas Panel' : scannedDetails.fullName.includes('Siti') ? 'Medkad Sdn Bhd' : 'None (Self-Pay)';
    setManualForm({
      ...manualForm,
      fullName: scannedDetails.fullName,
      icNumber: scannedDetails.icNumber,
      gender: scannedDetails.gender,
      dob: scannedDetails.dob,
      phone: '01' + Math.floor(10000000 + Math.random() * 90000000),
      address: scannedDetails.address,
      panelEmployer: defaultPanel,
    });

    if (scannedDetails.fullName.includes('Hafiz')) {
      setAllergiesList(['Penicillin']);
    } else if (scannedDetails.fullName.includes('Siti')) {
      setAllergiesList(['NSAID', 'Aspirin']);
    } else {
      setAllergiesList([]);
    }

    setCoverageStatus(defaultPanel === 'None (Self-Pay)' ? 'verified' : 'unverified');
    setIsMyKadOpen(false);
    setRegistrationStep('details');
    setFormStep(1);
  };

  const handleIdCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCheckValue.trim()) {
      setIdCheckError('Enter an NRIC or passport number, or scan MyKad.');
      focusField('reg-idcheck');
      return;
    }
    const formatError = nricError(idCheckValue);
    if (formatError) {
      setIdCheckError(formatError);
      focusField('reg-idcheck');
      return;
    }
    setIdCheckError('');
    const fromNric = parseNric(idCheckValue.trim());
    setManualForm(prev => ({
      ...prev,
      icNumber: idCheckValue.trim(),
      ...(fromNric ? { dob: fromNric.dob, gender: fromNric.gender } : {}),
    }));
    setRegistrationStep('details');
    setFormStep(1);
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
      fullName: '', icNumber: '', gender: 'Male', dob: '', phone: '', address: '',
      panelEmployer: 'None (Self-Pay)', chiefComplaint: '', temperature: '', bpSystolic: '', bpDiastolic: '', heartRate: '',
    });
    setAllergiesList([]);
    setExistingPatientId(null);
    setCoverageStatus('unverified');
    setFieldErrors({});
    setIdCheckError('');
    setRegistrationStep('id_check');
    setIdCheckValue('');
    setFormStep(1);
  };

  const handleVerifyCoverage = () => {
    if (manualForm.panelEmployer === 'None (Self-Pay)') {
      setCoverageStatus('verified');
      return;
    }
    setIsVerifyingCoverage(true);
    setTimeout(() => {
      setIsVerifyingCoverage(false);
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setCoverageStatus('verified');
        clearError('panel');
        showToast(`TPA API: ${manualForm.panelEmployer} Active. Limit Verified.`);
      } else {
        setCoverageStatus('failed');
        setFieldErrors((prev) => ({ ...prev, panel: `${manualForm.panelEmployer} coverage limit exceeded or inactive. Collect cash or change the sponsor.` }));
        focusField('reg-panel');
      }
    }, 1500);
  };

  const proceedToNextStep = () => {
    if (formStep === 1) {
      const errs: Record<string, string> = {};
      if (!manualForm.fullName.trim()) errs.fullName = "Enter the patient's full name.";
      if (!manualForm.icNumber.trim()) errs.icNumber = 'Enter an NRIC or passport number.';
      else if (nricError(manualForm.icNumber)) errs.icNumber = nricError(manualForm.icNumber);
      if (!manualForm.phone.trim()) errs.phone = 'Enter a contact phone number.';
      else if (manualForm.phone.replace(/\D/g, '').length < 9) errs.phone = 'Enter a valid phone number, for example 012-3456789.';
      setFieldErrors(errs);
      const first = (['fullName', 'icNumber', 'phone'] as const).find((k) => errs[k]);
      if (first) {
        focusField(`reg-${first}`);
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      if (manualForm.panelEmployer !== 'None (Self-Pay)' && coverageStatus !== 'verified') {
        setFieldErrors({ panel: 'Verify panel eligibility before continuing, or choose Self-Pay.' });
        focusField('reg-panel');
        return;
      }
      setFieldErrors({});
      setFormStep(3);
    }
  };

  const handleRegisterSubmit = async () => {
    let targetPatientId = existingPatientId;

    if (!targetPatientId) {
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
      await addPatientToDb(newPatient);
      targetPatientId = newPatient.id;
    }

    const targetVisitId = crypto.randomUUID();
    const newVisit: Visit = {
      id: targetVisitId,
      patientId: targetPatientId,
      date: new Date().toISOString().split('T')[0],
      registeredTime: Date.now(),
      soap: {
        subjective: manualForm.chiefComplaint || 'Pending Triage',
        objective: {
          bpSystolic: 0,
          bpDiastolic: 0,
          heartRate: 0,
          temperature: 0,
          respiratoryRate: 0
        },
        assessment: { icdCode: '', description: '', clinicalNotes: '' },
        plan: { prescription: [], followUpWeeks: 1, mcDays: 0, requiresReferral: false }
      },
      status: 'Awaiting Triage',
      totalBill: 0,
      panelClaimed: 0,
      paidAmount: 0,
    };

    addVisitToDb(newVisit);
    showToast(`${manualForm.fullName} routed to Triage Queue.`);
    handleClearForm();
    setActiveSubTab('queue');
  };

  const handleCreateTicket = (patient: Patient) => {
    if (triageQueue.some((v) => v.patientId === patient.id)) {
      showToast(`${patient.fullName} is already waiting for triage.`);
      return;
    }
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      registeredTime: Date.now(),
      soap: {
        subjective: 'General Consultation',
        objective: { bpSystolic: 0, bpDiastolic: 0, heartRate: 0, temperature: 0, respiratoryRate: 0 },
        assessment: { icdCode: '', description: '', clinicalNotes: '' },
        plan: { prescription: [], followUpWeeks: 1, mcDays: 0, requiresReferral: false }
      },
      status: 'Awaiting Triage',
      totalBill: 0,
      panelClaimed: 0,
      paidAmount: 0,
    };
    addVisitToDb(newVisit);
    showToast(`${patient.fullName} routed to Triage Queue.`);
    setActiveSubTab('queue');
  };

  return (
    <div className="space-y-6 animate-fadeIn relative font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 bg-primary text-white px-6 py-4 rounded-none shadow-2xl flex items-center justify-center gap-3 z-50 animate-slideUp font-sans text-xs border border-line-subtle">
          <CheckCircle2 className="w-5 h-5 text-teal-300" />
          <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Sub-Navigation Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-surface-muted dark:bg-night-850 p-2 rounded-none border border-line-subtle dark:border-teal-800/40 shadow-xs" role="tablist" aria-label="Patient Registration Sub Navigation">
        <button
          role="tab"
          aria-selected={activeSubTab === 'queue'}
          id="subtab-queue"
          aria-controls="subtab-panel-queue"
          onClick={() => setActiveSubTab('queue')}
          className={`px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none border ${
            activeSubTab === 'queue' 
              ? 'bg-primary text-white border-brand shadow-xs' 
              : 'bg-surface dark:bg-night-900 text-ink dark:text-slate-200 border-line-subtle dark:border-teal-800/30 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          Waiting Room Monitor
        </button>
        <button
          role="tab"
          aria-selected={activeSubTab === 'form'}
          id="subtab-form"
          aria-controls="subtab-panel-form"
          onClick={() => setActiveSubTab('form')}
          className={`px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none border ${
            activeSubTab === 'form' 
              ? 'bg-primary text-white border-brand shadow-xs' 
              : 'bg-surface dark:bg-night-900 text-ink dark:text-slate-200 border-line-subtle dark:border-teal-800/30 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          Registration Form
        </button>
        <button
          role="tab"
          aria-selected={activeSubTab === 'registry'}
          id="subtab-registry"
          aria-controls="subtab-panel-registry"
          onClick={() => setActiveSubTab('registry')}
          className={`px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none border ${
            activeSubTab === 'registry' 
              ? 'bg-primary text-white border-brand shadow-xs' 
              : 'bg-surface dark:bg-night-900 text-ink dark:text-slate-200 border-line-subtle dark:border-teal-800/30 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          Patient Registry
        </button>
      </div>

      {/* WAITING ROOM MONITOR */}
      {activeSubTab === 'queue' && (
        <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs font-sans">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-line-subtle dark:border-teal-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 dark:bg-teal-900/40 border border-brand/20 flex items-center justify-center rounded-none">
                  <Clock className="w-5 h-5 text-accent dark:text-teal-300" />
                </div>
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300 font-sans">
                    Live Waiting Room Monitor
                  </h3>
                  <p className="text-xs text-accent dark:text-teal-300 font-sans font-medium">Real-time triage queue and patient waiting statuses</p>
                </div>
              </div>
              
              <span className="bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border border-brand/20 font-bold px-3 py-1 rounded-none text-xs font-mono">
                {triageQueue.length} Patient(s) Waiting
              </span>
            </div>
            
            {triageQueue.length === 0 ? (
              <div className="text-center py-16 text-accent dark:text-teal-400 font-sans">
                <Users className="w-14 h-14 mx-auto opacity-40 mb-3" />
                <p className="font-bold text-base text-ink dark:text-teal-300">Waiting Room is Empty</p>
                <p className="text-xs mt-1 font-sans">All registered patients have been triaged or cleared.</p>
                <button 
                  onClick={() => setActiveSubTab('form')}
                  className="mt-6 mx-auto bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Register New Patient
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans" aria-live="polite">
                {triageQueue.map(visit => {
                  const pt = patientsMap[visit.patientId];
                  const waitTimeMs = Date.now() - (visit.registeredTime || Date.now());
                  let waitMins = Math.floor(waitTimeMs / 60000);
                  if (waitMins < 1) waitMins = Math.floor(Math.random() * 45) + 1;
                  
                  let waitStatusColor = 'emerald';
                  if (waitMins >= 15 && waitMins <= 30) waitStatusColor = 'amber';
                  if (waitMins > 30) waitStatusColor = 'rose';

                  return (
                    <div key={visit.id} className="p-4 rounded-none border border-line-subtle dark:border-teal-800/40 bg-surface dark:bg-night-900 hover:bg-surface-accent/40 dark:hover:bg-night-800/40 shadow-2xs flex flex-col transition-colors relative border-l-4 border-l-brand">
                      
                      <div className="flex justify-between items-start">
                        <span className="text-2xs font-mono font-bold bg-primary/10 dark:bg-teal-900/40 text-accent dark:text-teal-200 px-2 py-0.5 rounded-none border border-brand/20 tracking-wider">
                          # {visit.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-2xs font-mono font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border ${
                          waitStatusColor === 'rose' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                          waitStatusColor === 'amber' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}>
                          <Clock className="w-3 h-3" /> {waitMins} min wait
                        </span>
                      </div>
                      
                      <div className="mt-3 font-sans">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="type-heading-caps text-ink dark:text-teal-300 truncate">{pt?.fullName}</h4>
                          <span className="font-mono text-xs text-accent dark:text-teal-300">IC: {maskICNumber(pt?.icNumber, showPII)}</span>
                        </div>
                        
                        <div className="text-xs text-slate-500 mt-2 space-y-2">
                          {pt?.panelEmployer !== 'None (Self-Pay)' && (
                            <span className="inline-block text-accent dark:text-teal-200 font-sans font-bold bg-primary/10 dark:bg-teal-900/40 px-2 py-0.5 rounded-none text-2xs uppercase tracking-wider border border-brand/20">
                              Panel: {pt?.panelEmployer}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-ink dark:text-slate-200 bg-surface-muted dark:bg-night-850 p-2 rounded-none border border-line-subtle dark:border-teal-800/40 font-mono text-2xs">
                            <Activity className="w-4 h-4 text-accent dark:text-teal-300" />
                            <span>Triage: {visit.soap?.objective?.temperature}°C • HR {visit.soap?.objective?.heartRate} • BP {visit.soap?.objective?.bpSystolic}/{visit.soap?.objective?.bpDiastolic}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line-subtle dark:border-teal-800/30 flex gap-2 font-sans">
                        <button 
                          onClick={() => showToast(`${pt?.fullName} flagged as Priority for Doctor`)} 
                          className="flex-1 py-1.5 text-xs font-sans font-bold bg-primary hover:bg-primary-hover text-white rounded-none shadow-xs uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Priority
                        </button>
                        <button 
                          onClick={() => {
                            updateVisitInDb({ ...visit, status: 'Cancelled' });
                            showToast(`${pt?.fullName} visit cancelled`);
                          }}
                          className="flex-1 py-1.5 text-xs font-sans font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 rounded-none uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTRATION FORM */}
      {activeSubTab === 'form' && (
        <div className="animate-fadeIn font-sans">
          {registrationStep === 'id_check' ? (
            <div className="max-w-md mx-auto mt-8 bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs p-8 font-sans">
              <div className="text-center space-y-6">
                <div className="mx-auto w-14 h-14 bg-primary/10 dark:bg-teal-900/40 rounded-none flex items-center justify-center border border-brand/20">
                  <Search className="w-7 h-7 text-accent dark:text-teal-300" />
                </div>
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300 font-sans">Identify Patient</h3>
                  <p className="text-xs text-accent dark:text-teal-300 font-sans mt-1">Enter NRIC/Passport or scan MyKad to begin.</p>
                </div>
                
                <form onSubmit={handleIdCheckSubmit} noValidate className="space-y-4 text-left font-sans">
                  <div>
                    <FormField id="reg-idcheck" label="NRIC / Passport Number" required error={idCheckError} hint="Dashes are added for you. For a passport, enter the number as printed.">
                      {(f) => (
                        <input
                          {...f}
                          type="text"
                          value={idCheckValue}
                          onChange={(e) => { setIdCheckValue(formatNric(e.target.value)); if (idCheckError) setIdCheckError(''); }}
                          placeholder="e.g. 900101-14-5555"
                          autoComplete="off"
                          inputMode="text"
                          className={`${inputBase} px-3.5 font-mono ${fieldBorder(idCheckError)}`}
                        />
                      )}
                    </FormField>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-xs py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
                  >
                    Check Database <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-line-subtle dark:border-teal-800/40"></div>
                  <span className="flex-shrink-0 mx-4 text-accent dark:text-teal-300 text-xs uppercase font-sans font-bold">Or</span>
                  <div className="flex-grow border-t border-line-subtle dark:border-teal-800/40"></div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setIsMyKadOpen(true)}
                  className="w-full bg-surface dark:bg-night-900 hover:bg-surface-accent dark:hover:bg-night-800 text-accent dark:text-teal-300 border border-line-subtle dark:border-teal-800/50 font-bold text-xs py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-accent dark:text-teal-300" /> Scan PWA MyKad
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto font-sans">
              
              {/* Wizard Stepper */}
              <div className="mb-6 flex items-center justify-between relative bg-surface-muted dark:bg-night-850 p-4 border border-line-subtle dark:border-teal-800/40 rounded-none font-sans">
                {[1, 2].map(stepNum => (
                  <div key={stepNum} className={`flex items-center gap-3 ${formStep >= stepNum ? '' : 'opacity-50'}`}>
                    <div className={`w-7 h-7 rounded-none flex items-center justify-center font-bold text-xs font-sans transition-colors ${
                      formStep === stepNum 
                        ? 'bg-primary text-white' 
                        : formStep > stepNum 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-surface dark:bg-night-900 text-accent border border-line-subtle'
                    }`}>
                      {formStep > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className="text-xs font-bold font-sans uppercase tracking-wider text-ink dark:text-teal-300">
                      {stepNum === 1 ? '1. Patient Demographics' : '2. Billing & Medical Alerts'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs p-6 sm:p-8 relative font-sans">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    type="button" 
                    onClick={handleClearForm} 
                    className="text-xs font-sans font-bold text-accent dark:text-teal-400 hover:text-accent flex items-center justify-center gap-1 bg-surface dark:bg-night-900 px-3 py-1.5 border border-line-subtle dark:border-teal-800/40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restart
                  </button>
                </div>

                {/* Step 1: Demographics */}
                {formStep === 1 && (
                  <div className="space-y-6 font-sans">
                    <div>
                      <h3 className="type-heading-caps text-ink dark:text-teal-300 font-sans">
                        Patient Demographics
                      </h3>
                      {existingPatientId && (
                        <div className="mt-2 inline-flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-none text-xs font-sans font-bold border border-emerald-300 dark:border-emerald-800">
                          <UserCheck className="w-4 h-4" /> Existing Record Found - Auto-populated
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormField id="reg-fullName" label="Full Name" required error={fieldErrors.fullName}>
                          {(f) => (
                            <input
                              {...f}
                              type="text"
                              value={manualForm.fullName}
                              onChange={(e) => { setManualForm({ ...manualForm, fullName: e.target.value }); clearError('fullName'); }}
                              placeholder="e.g. MOHD HAFIZ BIN RAZALI"
                              autoComplete="off"
                              className={`${inputBase} font-bold font-sans ${fieldBorder(fieldErrors.fullName)}`}
                            />
                          )}
                        </FormField>
                      </div>
                      <div>
                        <FormField id="reg-icNumber" label="IC / Passport Number" required error={fieldErrors.icNumber} hint={parseNric(manualForm.icNumber) ? 'Date of birth and gender are filled from the NRIC.' : undefined}>
                          {(f) => (
                            <input
                              {...f}
                              type="text"
                              value={manualForm.icNumber}
                              onChange={(e) => {
                                const icNumber = formatNric(e.target.value);
                                const fromNric = parseNric(icNumber);
                                setManualForm({ ...manualForm, icNumber, ...(fromNric ? { dob: fromNric.dob, gender: fromNric.gender } : {}) });
                                clearError('icNumber');
                              }}
                              placeholder="YYMMDD-XX-XXXX"
                              autoComplete="off"
                              className={`${inputBase} font-mono ${fieldBorder(fieldErrors.icNumber)}`}
                            />
                          )}
                        </FormField>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <FormField id="reg-gender" label="Gender">
                          {(f) => (
                            <select
                              {...f}
                              value={manualForm.gender}
                              onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}
                              className={`${inputBase} font-sans ${fieldBorder()}`}
                            >
                              <option value="Male">Male / Lelaki</option>
                              <option value="Female">Female / Perempuan</option>
                            </select>
                          )}
                        </FormField>
                      </div>
                      <div>
                        <FormField id="reg-dob" label="Date of Birth">
                          {(f) => (
                            <input
                              {...f}
                              type="date"
                              value={manualForm.dob}
                              onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                              className={`${inputBase} font-mono ${fieldBorder()}`}
                            />
                          )}
                        </FormField>
                      </div>
                      <div>
                        <FormField id="reg-phone" label="Phone Number" required error={fieldErrors.phone}>
                          {(f) => (
                            <input
                              {...f}
                              type="tel"
                              value={manualForm.phone}
                              onChange={(e) => { setManualForm({ ...manualForm, phone: e.target.value }); clearError('phone'); }}
                              placeholder="e.g. 012-3456789"
                              autoComplete="off"
                              className={`${inputBase} font-mono ${fieldBorder(fieldErrors.phone)}`}
                            />
                          )}
                        </FormField>
                      </div>
                    </div>

                    <div>
                      <FormField id="reg-address" label="Residential Address">
                        {(f) => (
                          <input
                            {...f}
                            type="text"
                            value={manualForm.address}
                            onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                            placeholder="Enter full residential address..."
                            autoComplete="off"
                            className={`${inputBase} font-sans ${fieldBorder()}`}
                          />
                        )}
                      </FormField>
                    </div>
                  </div>
                )}

                {/* Step 2: Billing & Medical Alerts */}
                {formStep === 2 && (
                  <div className="space-y-6 font-sans">
                    <div>
                      <h3 className="type-heading-caps text-ink dark:text-teal-300 font-sans">
                        Billing Sponsor & Medical Alerts
                      </h3>
                      <p className="text-xs text-accent dark:text-teal-300 font-sans mt-0.5">Configure insurance panels and drug allergies</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <FormField id="reg-panel" label="Panel / Corporate Sponsor" error={fieldErrors.panel} className="space-y-2">
                          {(f) => (
                            <div className="flex gap-2">
                              <select
                                {...f}
                                value={manualForm.panelEmployer}
                                onChange={(e) => {
                                  setManualForm({ ...manualForm, panelEmployer: e.target.value });
                                  setCoverageStatus(e.target.value === 'None (Self-Pay)' ? 'verified' : 'unverified');
                                  clearError('panel');
                                }}
                                className={`flex-1 ${inputBase} font-sans ${fieldBorder(fieldErrors.panel)}`}
                              >
                                <option value="None (Self-Pay)">Self-Pay (No sponsor claim co-pays)</option>
                                <option value="Petronas Panel">Petronas Panel (Cover RM500 limit)</option>
                                <option value="Medkad Sdn Bhd">Medkad Sdn Bhd (Cover RM200 limit)</option>
                                <option value="MiCare TPA">MiCare TPA (Cover RM150, co-pay 10%)</option>
                                <option value="HealthMetrics Malaysia">HealthMetrics Malaysia (Cover RM300, co-pay 15%)</option>
                                <option value="PMCare Corporate">PMCare Corporate (Cover RM250 limit)</option>
                              </select>
                              {manualForm.panelEmployer !== 'None (Self-Pay)' && (
                                <button
                                  type="button"
                                  onClick={handleVerifyCoverage}
                                  disabled={isVerifyingCoverage || coverageStatus === 'verified'}
                                  className={`px-3 py-2 font-sans text-xs font-bold rounded-none uppercase transition-colors flex items-center gap-1 ${
                                    coverageStatus === 'verified'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                      : 'bg-primary text-white hover:bg-primary-hover'
                                  }`}
                                >
                                  {isVerifyingCoverage ? <Loader2 className="w-4 h-4 animate-spin" /> : coverageStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                  {coverageStatus === 'verified' ? 'Verified' : 'Verify'}
                                </button>
                              )}
                            </div>
                          )}
                        </FormField>
                      </div>

                      <div>
                        <FormField id="reg-allergy" label="Drug Allergies" hint="Press Enter or choose Add. Add every known allergy, since they are checked when prescribing." className="space-y-2">
                          {(f) => (
                            <div className="flex gap-2">
                              <input
                                {...f}
                                type="text"
                                value={allergyInput}
                                onChange={(e) => setAllergyInput(e.target.value)}
                                placeholder="e.g. Penicillin, Aspirin..."
                                autoComplete="off"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergyTag())}
                                className={`flex-1 ${inputBase} font-sans ${fieldBorder()}`}
                              />
                              <button
                                type="button"
                                onClick={handleAddAllergyTag}
                                className="bg-surface dark:bg-night-900 hover:bg-surface-accent dark:hover:bg-night-800 text-accent dark:text-teal-300 border border-line-subtle dark:border-teal-800/50 font-bold text-xs px-3 py-2 rounded-none font-sans uppercase"
                              >
                                + Add
                              </button>
                            </div>
                          )}
                        </FormField>
                        {allergiesList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {allergiesList.map((tag, idx) => (
                              <span key={idx} className="inline-flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-sans font-bold px-2.5 py-1 border border-rose-200 dark:border-rose-800/60 rounded-none">
                                {tag}
                                <button type="button" onClick={() => handleRemoveAllergyTag(idx)} aria-label={`Remove allergy ${tag}`} className="text-rose-600 hover:text-rose-800 cursor-pointer text-xs">&times;</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="mt-8 pt-4 border-t border-line-subtle dark:border-teal-800/40 flex items-center justify-between font-sans">
                  {formStep > 1 ? (
                    <button 
                      type="button" 
                      onClick={() => setFormStep(1)}
                      className="bg-surface dark:bg-night-900 hover:bg-surface-accent text-accent dark:text-teal-300 border border-line-subtle font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  ) : <div></div>}

                  {formStep < 2 ? (
                    <button 
                      type="button" 
                      onClick={proceedToNextStep}
                      className="bg-primary hover:bg-primary-hover text-white font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleRegisterSubmit} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" /> Route to Triage Queue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PATIENT REGISTRY TABLE TAB */}
      {activeSubTab === 'registry' && (
        <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs font-sans">
          <div className="p-6 space-y-6">
            
            {/* Header section with primary action button and total count badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line-subtle dark:border-teal-800/40 pb-4 font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-teal-900/40 border border-brand/20 flex items-center justify-center rounded-none">
                  <FolderCheck className="w-5 h-5 text-accent dark:text-teal-300" />
                </div>
                <div>
                  <h3 className="type-section-title text-ink dark:text-teal-300 font-sans">
                    Patient Registry
                  </h3>
                  <p className="text-xs text-accent dark:text-teal-300 font-sans font-medium">Search patient records, review medical allergies, and initiate clinical visits</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 font-sans">
                <span className="bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border border-brand/20 font-bold px-3 py-1.5 rounded-none text-xs font-sans">
                  {totalPatientCount} Registered Patients
                </span>
                <button
                  onClick={() => {
                    setActiveSubTab('form');
                    setRegistrationStep('id_check');
                  }}
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Register New Patient
                </button>
              </div>
            </div>
            
            {/* Integrated Search Input & Guidance */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
              <div className="relative flex-1 max-w-lg w-full">
                <Search className="w-4 h-4 text-accent dark:text-teal-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search patients"
                  placeholder="Search by Patient Name, NRIC (e.g. 900101-14-5555), or ID..."
                  value={patientRegistrySearch}
                  onChange={(e) => setPatientRegistrySearch(/^[\d-]+$/.test(e.target.value) ? formatNric(e.target.value) : e.target.value)}
                  className="w-full bg-surface dark:bg-night-900 border border-line dark:border-teal-800/60 rounded-none pl-9 pr-3 py-2 text-xs font-sans text-ink dark:text-slate-100 placeholder-primary/60 dark:placeholder-teal-400/60 focus:border-brand outline-none font-medium"
                />
              </div>
              <span className="text-2xs text-accent dark:text-teal-300 font-mono">
                Partial matches supported • IC auto-format enabled
              </span>
            </div>
            
            {/* Scannable Patient Table */}
            <div className="overflow-x-auto border border-line-subtle dark:border-teal-800/40 rounded-none font-sans">
              <table className="w-full text-xs text-left font-sans">
                <thead className="bg-surface-accent/90 dark:bg-night-900 border-b border-line-subtle dark:border-teal-800/40 font-sans">
                  <tr className="text-accent dark:text-teal-300 font-sans text-xs uppercase tracking-wider font-bold">
                    {sortHeader('id', 'ID')}
                    {sortHeader('name', 'Patient Name')}
                    <th scope="col" className="px-4 py-3.5">IC / Passport Number</th>
                    {sortHeader('sponsor', 'Panel Sponsor')}
                    <th scope="col" className="px-4 py-3.5">Drug Allergies</th>
                    {sortHeader('registered', 'Date Registered', 'right')}
                    <th scope="col" className="px-4 py-3.5 text-center sticky right-0 bg-surface-accent dark:bg-night-900 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle/50 dark:divide-teal-800/30 bg-surface dark:bg-night-900 font-sans">
                  {sortedResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-accent dark:text-teal-400 font-sans font-medium">
                        No patient records found matching your search term.
                      </td>
                    </tr>
                  ) : (
                    sortedResults.map(p => (
                      <tr key={p.id} className="hover:bg-surface-accent/40 dark:hover:bg-night-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-accent dark:text-teal-300 text-xs font-bold">
                          {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-xs capitalize text-ink dark:text-teal-300 block font-sans">
                            {p.fullName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-accent dark:text-teal-300">
                          {maskICNumber(p.icNumber, showPII)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-none text-2xs font-sans font-bold uppercase tracking-wider border ${
                            p.panelEmployer === 'None (Self-Pay)' 
                              ? 'bg-slate-100 dark:bg-night-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-teal-900' 
                              : 'bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border-brand/20 dark:border-teal-700/50'
                          }`}>
                            {p.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : p.panelEmployer}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.drugAllergies.length === 0
                            ? <span className="text-slate-600 dark:text-slate-400 text-xs italic font-sans">No known allergies</span>
                            : <div className="flex flex-wrap gap-1.5">
                                {p.drugAllergies.map((a, i) => (
                                  <span key={i} className="inline-flex items-center justify-center gap-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-2xs font-sans font-bold px-2 py-0.5 rounded-none shadow-2xs">
                                    <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <span>Allergy: {a}</span>
                                  </span>
                                ))}
                              </div>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-accent dark:text-teal-300 font-mono text-xs text-right">
                          {p.registeredDate}
                        </td>
                        <td className="px-4 py-3.5 text-center sticky right-0 bg-surface dark:bg-night-900 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                          {triageQueue.some((v) => v.patientId === p.id) ? (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-surface-accent border border-line">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" /> In triage queue
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCreateTicket(p)}
                              className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3.5 py-1.5 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                              aria-label={`Start visit for ${p.fullName}`}
                            >
                              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Start Visit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isMyKadOpen && (
        <MyKadScanner
          onScanComplete={handleMyKadComplete}
          onClose={() => setIsMyKadOpen(false)}
        />
      )}
    </div>
  );
}
