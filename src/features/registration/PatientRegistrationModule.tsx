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
import { PageHeading, StationTabs, StatStrip } from '../../components/ui/StationChrome';
import { formatWait } from '../../utils/waitTime';

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
  const inputBase = 'w-full min-h-11 bg-surface border border-line rounded-none px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-accent';

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
          className={`inline-flex items-center gap-1.5 font-semibold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${align === 'right' ? 'flex-row-reverse' : ''}`}
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

  const waitingRoomAside = (
      <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="reg-waiting-title">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="reg-waiting-title" className="text-base font-bold text-ink">Waiting room</h2>
          <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">{triageQueue.length} waiting</span>
        </div>
        {triageQueue.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No one is waiting for triage.</p>
        ) : (
          <ol className="flex flex-col">
            {triageQueue.slice(0, 8).map((v) => {
              const pt = patientsMap[v.patientId];
              const pname = pt?.fullName ?? `Visit ${v.id}`;
              const mins = v.registeredTime ? Math.max(0, Math.floor((Date.now() - v.registeredTime) / 60000)) : null;
              const long = mins !== null && mins >= 20;
              const words = pname.split(/\s+/).filter(Boolean);
              const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.[0] ?? '').toUpperCase();
              return (
                <li key={v.id} className={`flex items-center gap-3 px-5 py-3 border-b border-line-subtle ${long ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}`}>
                  <span className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink truncate">{pname}</span>
                    <span className="block text-xs text-muted truncate">Awaiting triage</span>
                  </span>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-bold tabular-nums ${long ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-strong text-accent'}`}>
                    {mins !== null ? formatWait(mins) : 'Just in'}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <button type="button" onClick={() => setActiveSubTab('queue')} className="mt-auto min-h-12 border-t border-line text-sm font-semibold text-accent hover:bg-surface-accent transition-colors cursor-pointer">
          Open waiting room monitor
        </button>
      </aside>
  );

  const REGISTRATION_STEPS = ['Identify patient', 'Demographics', 'Billing and alerts'];
  /** The three-step stepper. `current` is 1 to 3; earlier steps show a tick. */
  const registrationStepper = (current: number) => (
    <ol className="flex flex-wrap border-b border-line">
      {REGISTRATION_STEPS.map((label, i) => {
        const n = i + 1;
        const on = n === current;
        const done = n < current;
        return (
          <li key={label} aria-current={on ? 'step' : undefined} className={`flex-[1_1_11rem] flex items-center gap-3 px-6 py-4 ${i > 0 ? 'border-l border-line' : ''} ${on ? 'bg-surface-accent' : ''}`}>
            <span className={`shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold ${on || done ? 'bg-primary text-white' : 'bg-surface text-muted border border-line'}`} aria-hidden="true">
              {done ? <Check className="w-4 h-4" /> : n}
            </span>
            <span className={`text-sm ${on ? 'font-bold text-ink' : 'font-semibold text-muted'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );

  const today = new Date().toISOString().split('T')[0];
  const registeredToday = [...completedVisits, ...triageQueue].filter((v) => v.date === today).length;
  const waits = triageQueue.map((v) => (v.registeredTime ? Math.max(0, Math.floor((Date.now() - v.registeredTime) / 60000)) : 0));
  const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  const maxWait = waits.length ? Math.max(...waits) : 0;
  const overSla = waits.filter((m) => m >= 20).length;

  return (
    <div className="space-y-4 animate-fadeIn relative font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 bg-primary text-white px-6 py-4 rounded-none shadow-2xl flex items-center justify-center gap-3 z-50 animate-slideUp font-sans text-xs border border-line-subtle">
          <CheckCircle2 className="w-5 h-5 text-teal-300" />
          <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      <PageHeading eyebrow="Front Desk 01" title={activeLanguage === 'BM' ? 'Pendaftaran pesakit' : 'Patient registration'} />

      <StationTabs<'queue' | 'form' | 'registry'>
        label="Patient registration sections"
        active={activeSubTab}
        onChange={setActiveSubTab}
        tabs={[
          { id: 'queue', label: 'Waiting room', count: triageQueue.length, alert: true, title: 'Waiting Room Monitor: Live check-in queue, triage status, and doctor room assignments' },
          { id: 'form', label: 'Registration form', title: 'New Registration Form: MyKad biometric intake, patient demographics, and corporate panel selection' },
          { id: 'registry', label: 'Patient registry', count: totalPatientCount, title: 'Patient Master Registry: Search existing patient EHR records, contact details, and past visit logs' },
        ]}
      />

      <StatStrip
        label="Front desk figures"
        stats={[
          { label: 'Registered today', value: registeredToday, note: 'Walk-ins and bookings' },
          { label: 'Waiting for triage', value: triageQueue.length, note: 'Registered, vitals not taken' },
          { label: 'Wait time (avg / max)', value: `${formatWait(avgWait)} / ${formatWait(maxWait)}`, note: overSla > 0 ? `${overSla} over the 20 min target` : 'Within target' },
          { label: 'Patients on file', value: totalPatientCount, note: 'In the patient registry' },
        ]}
      />

      {/* WAITING ROOM MONITOR */}
      {activeSubTab === 'queue' && (
        <WaitingRoomMonitor triageQueue={triageQueue} setActiveSubTab={setActiveSubTab} patientsMap={patientsMap} showPII={showPII} showToast={showToast} updateVisitInDb={updateVisitInDb} doctors={doctors} assignDoctor={assignDoctor} />
      )}

      {/* REGISTRATION FORM */}
      {activeSubTab === 'form' && (
        <div className="animate-fadeIn font-sans">
          {registrationStep === 'id_check' ? (
            <section className="flex flex-wrap bg-surface border border-line font-sans">
              <article className="flex-[999_1_30rem] min-w-0 flex flex-col" aria-labelledby="reg-idcheck-title">
                {registrationStepper(1)}
                <div className="p-5 sm:p-7 flex flex-col gap-6">
                  <div>
                    <h2 id="reg-idcheck-title" className="text-2xl font-bold tracking-tight leading-tight text-ink">Identify the patient</h2>
                    <p className="mt-1 text-sm text-muted">Enter an NRIC or passport number, or scan the MyKad. Returning patients are filled in for you.</p>
                  </div>

                  <form onSubmit={handleIdCheckSubmit} noValidate className="max-w-md flex flex-col gap-3">
                    <FormField id="reg-idcheck" plain label="NRIC / passport number" required error={idCheckError} hint="Dashes are added for you. For a passport, enter the number as printed.">
                      {(f) => (
                        <input
                          {...f}
                          type="text"
                          value={idCheckValue}
                          onChange={(e) => { setIdCheckValue(formatNric(e.target.value)); if (idCheckError) setIdCheckError(''); }}
                          placeholder="e.g. 900101-14-5555"
                          autoComplete="off"
                          inputMode="text"
                          className={`${inputBase} min-h-12 text-base font-semibold tabular-nums ${fieldBorder(idCheckError)}`}
                        />
                      )}
                    </FormField>
                    <button type="submit" className="btn-primary min-h-12 px-6 text-sm self-start">
                      Check registry <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </form>

                  <div className="flex items-center gap-4 max-w-md" aria-hidden="true">
                    <span className="flex-1 h-px bg-line" />
                    <span className="text-xs font-semibold text-muted">or</span>
                    <span className="flex-1 h-px bg-line" />
                  </div>

                  <div className="max-w-md flex items-center gap-4 p-4 bg-surface-muted border border-line">
                    <div className="shrink-0 w-11 h-11 bg-surface-strong text-accent flex items-center justify-center" aria-hidden="true">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">Scan MyKad</p>
                      <p className="text-xs text-muted">Reads the card with the camera and fills in the form.</p>
                    </div>
                    <button type="button" onClick={() => setIsMyKadOpen(true)} className="btn-secondary shrink-0 min-h-11 px-4 text-sm">
                      Open scanner
                    </button>
                  </div>
                </div>
              </article>
              {waitingRoomAside}
            </section>
          ) : (
            <section className="flex flex-wrap bg-surface border border-line font-sans">
              <article className="flex-[999_1_36rem] min-w-0 flex flex-col" aria-label="Registration form">
                {registrationStepper(formStep + 1)}

                <div className="p-5 sm:p-7 flex flex-col gap-6 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold tracking-tight leading-tight text-ink">{existingPatientId ? 'Returning patient' : 'New patient'}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {existingPatientId ? 'Found in the registry. Check the details are still current.' : `No match found for ${idCheckValue || 'this ID'}.`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {existingPatientId && (
                        <span className="chip-ok px-3 py-1.5 text-xs font-bold">
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Existing record, auto-filled
                        </span>
                      )}
                      <button type="button" onClick={handleClearForm} className="btn-secondary min-h-11 px-4 text-xs">
                        <RotateCcw className="w-3.5 h-3.5 text-accent" aria-hidden="true" /> Restart
                      </button>
                    </div>
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
                  <div className="mt-auto pt-5 border-t border-line flex flex-wrap items-center justify-between gap-3">
                    {formStep > 1 ? (
                      <button type="button" onClick={() => setFormStep(1)} className="btn-secondary min-h-12 px-5 text-sm">
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                      </button>
                    ) : (
                      <span className="text-xs text-muted"><span className="text-rose-600">*</span> Required to continue</span>
                    )}

                    {formStep < 2 ? (
                      <button type="button" onClick={proceedToNextStep} className="btn-primary min-h-12 px-6 text-sm">
                        Next step <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="button" onClick={handleRegisterSubmit} className="btn-primary min-h-12 px-6 text-sm">
                        <UserCheck className="w-4 h-4" aria-hidden="true" /> Route to triage queue
                      </button>
                    )}
                  </div>
                </div>
              </article>

              {waitingRoomAside}
            </section>
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
