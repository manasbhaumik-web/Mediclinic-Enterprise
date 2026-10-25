import React, { useState, useEffect, useMemo } from 'react';
import { Users, Globe, UserCheck, FolderCheck, Plus, UserPlus, Monitor, RotateCcw, Activity, ShieldAlert, ArrowRight, ArrowLeft, Search, Loader2, ShieldCheck, CheckCircle2, Clock, Check, Filter, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Patient, Visit, Language } from '../../types';
import MyKadScanner from './MyKadScanner';
import { useAuth } from '../../context/AuthContext';
import { maskICNumber } from '../../utils/piiMasker';
import FormField, { fieldBorder } from '../../components/ui/FormField';
import { formatNric, nricError, parseNric } from '../../utils/nric';
import type { SortKey } from './types';
import WaitingRoomMonitor from './WaitingRoomMonitor';
import DemographicsStep from './DemographicsStep';
import BillingAlertsStep from './BillingAlertsStep';
import PatientRegistryTable from './PatientRegistryTable';
import PatientDetailModal from '../patientAdmin/PatientDetailModal';
import PatientReportModal from '../patientAdmin/PatientReportModal';
import { UserRole } from '../../types';
import { useClinicDoctors } from '../../hooks/useClinicSetup';

interface PatientRegistrationModuleProps {
  t: any;
  activeLanguage: Language;
  searchPatients: (query: string) => Promise<Patient[]>;
  totalPatientCount: number;
  patientsList?: Patient[];
  triageQueue: Visit[];
  patientsMap: Record<string, Patient>;
  addPatientToDb: (p: Patient) => void;
  addVisitToDb: (v: Visit) => void;
  updateVisitInDb: (v: Visit) => void;
  /** Names (or clears) the doctor a waiting patient should see. */
  assignDoctor: (visitId: string, doctorId: string | null) => Promise<{ ok: true } | { ok: false; error: string }>;
  onNavigateTab: (tab: string) => void;
  userRole?: UserRole;
  updatePatientInDb?: (p: Patient) => Promise<any> | void;
  completedVisits?: Visit[];
}

export default function PatientRegistrationModule({
  t,
  activeLanguage,
  searchPatients,
  totalPatientCount,
  patientsList,
  triageQueue,
  patientsMap,
  addPatientToDb,
  addVisitToDb,
  updateVisitInDb,
  assignDoctor,
  onNavigateTab,
  userRole,
  updatePatientInDb,
  completedVisits = []
}: PatientRegistrationModuleProps) {
  const doctors = useClinicDoctors();
  const [assignedDoctorId, setAssignedDoctorId] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'form' | 'registry'>('registry');
  const [registrationStep, setRegistrationStep] = useState<'id_check' | 'details'>('id_check');
  const [idCheckValue, setIdCheckValue] = useState('');
  
  // Wizard Step State
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  
  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Patient Admin & Reports Modals
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<'profile' | 'visits' | 'medications' | 'billing' | 'dossier'>('profile');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPreselectedPatientId, setReportPreselectedPatientId] = useState<string | null>(null);

  const handleOpenPatientDetail = (patient: Patient, initialTab: 'profile' | 'visits' | 'medications' | 'billing' | 'dossier' = 'profile') => {
    setSelectedPatientForDetail(patient);
    setDetailInitialTab(initialTab);
    setDetailModalOpen(true);
  };

  const handleOpenReports = (patientId?: string) => {
    setReportPreselectedPatientId(patientId || 'ALL');
    setReportModalOpen(true);
  };

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
  const inputBase = 'w-full bg-surface border border-line rounded-none px-3 py-2 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand';

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allPatients = useMemo(() => {
    if (patientsList && patientsList.length > 0) return patientsList;
    return Object.values(patientsMap);
  }, [patientsList, patientsMap]);

  // Auto-populate form if IC Number exists in patientsList
  useEffect(() => {
    const icClean = manualForm.icNumber.replace(/-/g, '');
    if (icClean.length >= 6) {
      const localMatch = allPatients.find(p => p.icNumber.replace(/-/g, '') === icClean);
      if (localMatch && localMatch.id !== existingPatientId) {
        setExistingPatientId(localMatch.id);
        setManualForm(prev => ({
          ...prev,
          fullName: localMatch.fullName,
          gender: localMatch.gender as any,
          dob: localMatch.dob,
          phone: localMatch.phone,
          address: localMatch.address,
          panelEmployer: localMatch.panelEmployer,
        }));
        setAllergiesList(localMatch.drugAllergies);
        setCoverageStatus(localMatch.panelEmployer === 'None (Self-Pay)' ? 'verified' : 'unverified');
        return;
      }
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
        } else if (!match && !localMatch && existingPatientId) {
          setExistingPatientId(null);
          setCoverageStatus('unverified');
        }
      });
    }
  }, [manualForm.icNumber, searchPatients, existingPatientId, allPatients]);

  // Registry Search State
  const [registryResults, setRegistryResults] = useState<Patient[]>(allPatients);
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
      const q = patientRegistrySearch.trim().toLowerCase();
      if (!q) {
        setRegistryResults(allPatients);
        return;
      }
      const cleanQ = q.replace(/[\s-]/g, '');
      const localMatches = allPatients.filter((p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.icNumber.replace(/-/g, '').includes(cleanQ) ||
        p.phone.replace(/[\s-]/g, '').includes(cleanQ) ||
        p.id.toLowerCase().includes(q)
      );
      setRegistryResults(localMatches);

      if (q.length >= 2) {
        searchPatients(q).then((remoteResults) => {
          if (remoteResults && remoteResults.length > 0) {
            setRegistryResults((prev) => {
              const map = new Map<string, Patient>();
              prev.forEach((p) => map.set(p.id, p));
              remoteResults.forEach((p) => map.set(p.id, p));
              return Array.from(map.values());
            });
          }
        }).catch(() => {
          // retain local matches
        });
      }
    }
  }, [patientRegistrySearch, activeSubTab, searchPatients, allPatients]);

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
    setAssignedDoctorId('');
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
      doctorId: assignedDoctorId || undefined,
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
    <div className="space-y-3.5 animate-fadeIn relative font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 bg-primary text-white px-6 py-4 rounded-none shadow-2xl flex items-center justify-center gap-3 z-50 animate-slideUp font-sans text-xs border border-line-subtle">
          <CheckCircle2 className="w-5 h-5 text-teal-300" />
          <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* REDESIGNED REGISTRATION & TRIAGE SUB-NAVIGATION TAB BAR */}
      <div className="bg-surface border border-line rounded-none shadow-2xs p-1.5 flex flex-wrap items-center justify-between gap-2" role="tablist" aria-label="Patient Registration Sub Navigation">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'queue'}
            id="subtab-queue"
            aria-controls="subtab-panel-queue"
            title="Waiting Room Monitor: Live check-in queue, triage status, and doctor room assignments"
            onClick={() => setActiveSubTab('queue')}
            className={`h-9 px-3.5 text-xs font-bold transition-all cursor-pointer rounded-none border inline-flex items-center gap-2 ${
              activeSubTab === 'queue' 
                ? 'bg-primary text-white border-primary shadow-xs font-bold' 
                : 'bg-surface text-ink/75 border-transparent hover:bg-surface-accent hover:text-ink'
            }`}
          >
            <Monitor className={`w-4 h-4 ${activeSubTab === 'queue' ? 'text-white' : 'text-muted'}`} />
            <span>Waiting Room Monitor</span>
            {triageQueue.length > 0 && (
              <span className={`font-mono text-2xs px-1.5 py-0.2 rounded-none font-bold tabular-nums ${
                activeSubTab === 'queue' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {triageQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'form'}
            id="subtab-form"
            aria-controls="subtab-panel-form"
            title="New Registration Form: MyKad biometric intake, patient demographics, and corporate panel selection"
            onClick={() => setActiveSubTab('form')}
            className={`h-9 px-3.5 text-xs font-bold transition-all cursor-pointer rounded-none border inline-flex items-center gap-2 ${
              activeSubTab === 'form' 
                ? 'bg-primary text-white border-primary shadow-xs font-bold' 
                : 'bg-surface text-ink/75 border-transparent hover:bg-surface-accent hover:text-ink'
            }`}
          >
            <UserPlus className={`w-4 h-4 ${activeSubTab === 'form' ? 'text-white' : 'text-muted'}`} />
            <span>Registration Form</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'registry'}
            id="subtab-registry"
            aria-controls="subtab-panel-registry"
            title="Patient Master Registry: Search existing patient EHR records, contact details, and past visit logs"
            onClick={() => setActiveSubTab('registry')}
            className={`h-9 px-3.5 text-xs font-bold transition-all cursor-pointer rounded-none border inline-flex items-center gap-2 ${
              activeSubTab === 'registry' 
                ? 'bg-primary text-white border-primary shadow-xs font-bold' 
                : 'bg-surface text-ink/75 border-transparent hover:bg-surface-accent hover:text-ink'
            }`}
          >
            <FolderCheck className={`w-4 h-4 ${activeSubTab === 'registry' ? 'text-white' : 'text-muted'}`} />
            <span>Patient Registry</span>
            <span className={`font-mono text-2xs px-1.5 py-0.2 rounded-none font-bold tabular-nums ${
              activeSubTab === 'registry' ? 'bg-white/20 text-white' : 'bg-surface-muted text-muted border border-line-subtle'
            }`}>
              {totalPatientCount}
            </span>
          </button>
        </div>

        {/* Quick status pill on right */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 font-mono text-2xs text-muted">
          <span>Active Station: <strong className="text-accent uppercase font-bold">Front Desk 01</strong></span>
        </div>
      </div>

      {/* WAITING ROOM MONITOR */}
      {activeSubTab === 'queue' && (
        <WaitingRoomMonitor triageQueue={triageQueue} setActiveSubTab={setActiveSubTab} patientsMap={patientsMap} showPII={showPII} showToast={showToast} updateVisitInDb={updateVisitInDb} doctors={doctors} assignDoctor={assignDoctor} />
      )}

      {/* REGISTRATION FORM */}
      {activeSubTab === 'form' && (
        <div className="animate-fadeIn font-sans">
          {registrationStep === 'id_check' ? (
            <div className="max-w-md mx-auto mt-4 bg-surface border border-line rounded-none shadow-none p-5 font-sans">
              <div className="text-center space-y-6">
                <div className="mx-auto w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center border border-brand/20">
                  <Search className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="type-heading-caps text-ink font-sans">Identify Patient</h3>
                  <p className="text-xs text-muted font-sans mt-1">Enter NRIC/Passport or scan MyKad to begin.</p>
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
                  <div className="flex-grow border-t border-line"></div>
                  <span className="flex-shrink-0 mx-4 text-muted text-xs uppercase font-sans font-bold">Or</span>
                  <div className="flex-grow border-t border-line"></div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setIsMyKadOpen(true)}
                  className="w-full btn-secondary font-bold text-xs py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-accent" /> Scan PWA MyKad
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto font-sans">
              
              {/* Wizard Stepper */}
              <div className="mb-3 flex items-center justify-between relative bg-surface p-2.5 border border-line rounded-none font-sans">
                {[1, 2].map(stepNum => (
                  <div key={stepNum} className={`flex items-center gap-3 ${formStep >= stepNum ? '' : 'opacity-50'}`}>
                    <div className={`w-7 h-7 rounded-none flex items-center justify-center font-bold text-xs font-sans transition-colors ${
                      formStep === stepNum 
                        ? 'bg-primary text-white' 
                        : formStep > stepNum 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-surface text-muted border border-line-subtle'
                    }`}>
                      {formStep > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className="text-xs font-bold font-sans uppercase tracking-wider text-ink">
                      {stepNum === 1 ? '1. Patient Demographics' : '2. Billing & Medical Alerts'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-surface-muted border border-line rounded-none shadow-xs p-4 sm:p-5 relative font-sans">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    type="button" 
                    onClick={handleClearForm} 
                    className="text-xs font-sans font-bold text-accent hover:text-primary-hover flex items-center justify-center gap-1 bg-surface px-3 py-1.5 border border-line"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restart
                  </button>
                </div>

                {/* Step 1: Demographics */}
                {formStep === 1 && (
                  <DemographicsStep existingPatientId={existingPatientId} fieldErrors={fieldErrors} manualForm={manualForm} setManualForm={setManualForm} clearError={clearError} inputBase={inputBase} />
                )}

                {/* Step 2: Billing & Medical Alerts */}
                {formStep === 2 && (
                  <BillingAlertsStep fieldErrors={fieldErrors} manualForm={manualForm} setManualForm={setManualForm} setCoverageStatus={setCoverageStatus} clearError={clearError} inputBase={inputBase} handleVerifyCoverage={handleVerifyCoverage} isVerifyingCoverage={isVerifyingCoverage} coverageStatus={coverageStatus} allergyInput={allergyInput} setAllergyInput={setAllergyInput} handleAddAllergyTag={handleAddAllergyTag} allergiesList={allergiesList} handleRemoveAllergyTag={handleRemoveAllergyTag} doctors={doctors} assignedDoctorId={assignedDoctorId} onAssignedDoctorChange={setAssignedDoctorId} />
                )}

                {/* Footer buttons */}
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between font-sans">
                  {formStep > 1 ? (
                    <button 
                      type="button" 
                      onClick={() => setFormStep(1)}
                      className="btn-secondary font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center justify-center gap-1.5"
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
        <PatientRegistryTable
          totalPatientCount={totalPatientCount}
          setActiveSubTab={setActiveSubTab}
          setRegistrationStep={setRegistrationStep}
          patientRegistrySearch={patientRegistrySearch}
          setPatientRegistrySearch={setPatientRegistrySearch}
          sortHeader={sortHeader}
          sortedResults={sortedResults}
          showPII={showPII}
          triageQueue={triageQueue}
          handleCreateTicket={handleCreateTicket}
          userRole={userRole}
          onOpenPatientDetail={handleOpenPatientDetail}
          onOpenReports={handleOpenReports}
          activeLanguage={activeLanguage}
        />
      )}

      {isMyKadOpen && (
        <MyKadScanner
          onScanComplete={handleMyKadComplete}
          onClose={() => setIsMyKadOpen(false)}
        />
      )}

      {/* Patient Detail / Longitudinal Clinical History Modal */}
      <PatientDetailModal
        patient={selectedPatientForDetail}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSavePatient={async (updatedPatient) => {
          if (updatePatientInDb) {
            await updatePatientInDb(updatedPatient);
          }
          setSelectedPatientForDetail(updatedPatient);
          setToastMessage(activeLanguage === 'BM' ? 'Rekod pesakit berjaya dikemaskini.' : 'Patient record updated successfully.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        visits={[...completedVisits, ...triageQueue]}
        activeLanguage={activeLanguage}
        canEdit={true}
        initialTab={detailInitialTab}
        onGenerateReport={(patientId) => {
          setDetailModalOpen(false);
          handleOpenReports(patientId);
        }}
      />

      {/* Patient & Encounters Reports Generator Modal */}
      <PatientReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        patientsList={allPatients}
        completedVisits={[...completedVisits, ...triageQueue]}
        activeLanguage={activeLanguage}
        preselectedPatientId={reportPreselectedPatientId}
      />
    </div>
  );
}
