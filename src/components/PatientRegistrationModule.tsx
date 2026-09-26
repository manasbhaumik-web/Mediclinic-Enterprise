import React, { useState, useEffect } from 'react';
import { Users, Globe, UserCheck, FolderCheck, Plus, RotateCcw, Activity, ShieldAlert, ArrowRight, ArrowLeft, Search, Loader2, ShieldCheck, CheckCircle2, Clock, Check, Filter } from 'lucide-react';
import { Patient, Visit, Language } from '../types';
import MyKadScanner from './MyKadScanner';
import { useAuth } from '../context/AuthContext';
import { maskICNumber } from '../utils/piiMasker';

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
    if (!idCheckValue.trim()) return;
    setManualForm(prev => ({ ...prev, icNumber: idCheckValue }));
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
        showToast(`TPA API: ${manualForm.panelEmployer} Active. Limit Verified.`);
      } else {
        setCoverageStatus('failed');
        alert(`TPA API Error: ${manualForm.panelEmployer} coverage limit exceeded or inactive. Collect cash or update sponsor.`);
      }
    }, 1500);
  };

  const proceedToNextStep = () => {
    if (formStep === 1) {
      if (!manualForm.fullName.trim() || !manualForm.icNumber.trim() || !manualForm.phone.trim()) {
        alert("Please complete Full Name, IC, and Phone Number.");
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      if (manualForm.panelEmployer !== 'None (Self-Pay)' && coverageStatus !== 'verified') {
        alert("Please verify Panel eligibility before proceeding.");
        return;
      }
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
    setActiveSubTab('queue');
  };

  return (
    <div className="space-y-6 animate-fadeIn relative font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 bg-[#0d9488] text-white px-6 py-4 rounded-none shadow-2xl flex items-center gap-3 z-50 animate-slideUp font-sans text-xs border border-[#ccfbf1]">
          <CheckCircle2 className="w-5 h-5 text-[#5eead4]" />
          <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Sub-Navigation Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#f0fdfa] dark:bg-[#082830] p-2 rounded-none border border-[#ccfbf1] dark:border-teal-800/40 shadow-xs" role="tablist" aria-label="Patient Registration Sub Navigation">
        <button
          role="tab"
          aria-selected={activeSubTab === 'queue'}
          id="subtab-queue"
          aria-controls="subtab-panel-queue"
          onClick={() => setActiveSubTab('queue')}
          className={`px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none border ${
            activeSubTab === 'queue' 
              ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
              : 'bg-[#f7fdfd] dark:bg-[#07252d] text-[#0f3c4c] dark:text-slate-200 border-[#ccfbf1] dark:border-teal-800/30 hover:bg-[#e0f5f2] dark:hover:bg-[#0d3b47]'
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
              ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
              : 'bg-[#f7fdfd] dark:bg-[#07252d] text-[#0f3c4c] dark:text-slate-200 border-[#ccfbf1] dark:border-teal-800/30 hover:bg-[#e0f5f2] dark:hover:bg-[#0d3b47]'
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
              ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs' 
              : 'bg-[#f7fdfd] dark:bg-[#07252d] text-[#0f3c4c] dark:text-slate-200 border-[#ccfbf1] dark:border-teal-800/30 hover:bg-[#e0f5f2] dark:hover:bg-[#0d3b47]'
          }`}
        >
          Patient Registry
        </button>
      </div>

      {/* WAITING ROOM MONITOR */}
      {activeSubTab === 'queue' && (
        <div className="bg-[#f0fdfa] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 rounded-none shadow-xs font-sans">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-[#ccfbf1] dark:border-teal-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#0d9488]/10 dark:bg-teal-900/40 border border-[#0d9488]/20 flex items-center justify-center rounded-none">
                  <Clock className="w-5 h-5 text-[#0d9488] dark:text-[#5eead4]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight text-[#0f3c4c] dark:text-[#5eead4] font-sans">
                    Live Waiting Room Monitor
                  </h3>
                  <p className="text-xs text-[#0f766e] dark:text-teal-300 font-sans font-medium">Real-time triage queue and patient waiting statuses</p>
                </div>
              </div>
              
              <span className="bg-[#0d9488]/10 text-[#0d9488] dark:bg-teal-900/40 dark:text-teal-200 border border-[#0d9488]/20 font-bold px-3 py-1 rounded-none text-xs font-mono">
                {triageQueue.length} Patient(s) Waiting
              </span>
            </div>
            
            {triageQueue.length === 0 ? (
              <div className="text-center py-16 text-[#0f766e] dark:text-teal-400 font-sans">
                <Users className="w-14 h-14 mx-auto opacity-40 mb-3" />
                <p className="font-extrabold text-base text-[#0f3c4c] dark:text-[#5eead4]">Waiting Room is Empty</p>
                <p className="text-xs mt-1 font-sans">All registered patients have been triaged or cleared.</p>
                <button 
                  onClick={() => setActiveSubTab('form')}
                  className="mt-6 mx-auto bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs px-4 py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center gap-2 shadow-xs"
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
                    <div key={visit.id} className="p-4 rounded-none border border-[#ccfbf1] dark:border-teal-800/40 bg-[#f7fdfd] dark:bg-[#07252d] hover:bg-[#e0f5f2]/40 dark:hover:bg-[#0d3b47]/40 shadow-2xs flex flex-col transition-colors relative border-l-4 border-l-[#0d9488]">
                      
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold bg-[#0d9488]/10 dark:bg-teal-900/40 text-[#0d9488] dark:text-teal-200 px-2 py-0.5 rounded-none border border-[#0d9488]/20 tracking-wider">
                          # {visit.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border ${
                          waitStatusColor === 'rose' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                          waitStatusColor === 'amber' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}>
                          <Clock className="w-3 h-3" /> {waitMins} min wait
                        </span>
                      </div>
                      
                      <div className="mt-3 font-sans">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase text-sm truncate">{pt?.fullName}</h4>
                          <span className="font-mono text-xs text-[#0f766e] dark:text-teal-300">IC: {maskICNumber(pt?.icNumber, showPII)}</span>
                        </div>
                        
                        <div className="text-xs text-slate-500 mt-2 space-y-2">
                          {pt?.panelEmployer !== 'None (Self-Pay)' && (
                            <span className="inline-block text-[#0d9488] dark:text-teal-200 font-sans font-bold bg-[#0d9488]/10 dark:bg-teal-900/40 px-2 py-0.5 rounded-none text-[10px] uppercase tracking-wide border border-[#0d9488]/20">
                              Panel: {pt?.panelEmployer}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-[#0f3c4c] dark:text-slate-200 bg-[#f0fdfa] dark:bg-[#082830] p-2 rounded-none border border-[#ccfbf1] dark:border-teal-800/40 font-mono text-[11px]">
                            <Activity className="w-4 h-4 text-[#0d9488] dark:text-[#5eead4]" />
                            <span>Triage: {visit.soap?.objective?.temperature}°C • HR {visit.soap?.objective?.heartRate} • BP {visit.soap?.objective?.bpSystolic}/{visit.soap?.objective?.bpDiastolic}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#ccfbf1] dark:border-teal-800/30 flex gap-2 font-sans">
                        <button 
                          onClick={() => showToast(`${pt?.fullName} flagged as Priority for Doctor`)} 
                          className="flex-1 py-1.5 text-xs font-sans font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-none shadow-xs uppercase tracking-wider flex items-center justify-center gap-1"
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
            <div className="max-w-md mx-auto mt-8 bg-[#f0fdfa] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 rounded-none shadow-xs p-8 font-sans">
              <div className="text-center space-y-6">
                <div className="mx-auto w-14 h-14 bg-[#0d9488]/10 dark:bg-teal-900/40 rounded-none flex items-center justify-center border border-[#0d9488]/20">
                  <Search className="w-7 h-7 text-[#0d9488] dark:text-[#5eead4]" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-[#0f3c4c] dark:text-[#5eead4] font-sans">Identify Patient</h3>
                  <p className="text-xs text-[#0f766e] dark:text-teal-300 font-sans mt-1">Enter NRIC/Passport or scan MyKad to begin.</p>
                </div>
                
                <form onSubmit={handleIdCheckSubmit} className="space-y-4 text-left font-sans">
                  <div>
                    <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">
                      NRIC / Passport Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={idCheckValue}
                      onChange={(e) => setIdCheckValue(e.target.value)}
                      placeholder="e.g. 900101-14-5555"
                      required
                      className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3.5 py-2 text-xs font-mono text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
                  >
                    Check Database <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#ccfbf1] dark:border-teal-800/40"></div>
                  <span className="flex-shrink-0 mx-4 text-[#0f766e] dark:text-teal-300 text-xs uppercase font-sans font-bold">Or</span>
                  <div className="flex-grow border-t border-[#ccfbf1] dark:border-teal-800/40"></div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setIsMyKadOpen(true)}
                  className="w-full bg-[#f7fdfd] dark:bg-[#07252d] hover:bg-[#e0f5f2] dark:hover:bg-[#0d3b47] text-[#0f766e] dark:text-[#5eead4] border border-[#ccfbf1] dark:border-teal-800/50 font-bold text-xs py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4 text-[#0d9488] dark:text-[#5eead4]" /> Scan PWA MyKad
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto font-sans">
              
              {/* Wizard Stepper */}
              <div className="mb-6 flex items-center justify-between relative bg-[#f0fdfa] dark:bg-[#082830] p-4 border border-[#ccfbf1] dark:border-teal-800/40 rounded-none font-sans">
                {[1, 2].map(stepNum => (
                  <div key={stepNum} className={`flex items-center gap-3 ${formStep >= stepNum ? '' : 'opacity-50'}`}>
                    <div className={`w-7 h-7 rounded-none flex items-center justify-center font-bold text-xs font-sans transition-colors ${
                      formStep === stepNum 
                        ? 'bg-[#0d9488] text-white' 
                        : formStep > stepNum 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#f7fdfd] dark:bg-[#07252d] text-[#0f766e] border border-[#ccfbf1]'
                    }`}>
                      {formStep > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className="text-xs font-bold font-sans uppercase tracking-wider text-[#0f3c4c] dark:text-[#5eead4]">
                      {stepNum === 1 ? '1. Patient Demographics' : '2. Billing & Medical Alerts'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#f0fdfa] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 rounded-none shadow-xs p-6 sm:p-8 relative font-sans">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    type="button" 
                    onClick={handleClearForm} 
                    className="text-xs font-sans font-bold text-[#0f766e] dark:text-teal-400 hover:text-[#0d9488] flex items-center gap-1 bg-[#f7fdfd] dark:bg-[#07252d] px-3 py-1.5 border border-[#ccfbf1] dark:border-teal-800/40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restart
                  </button>
                </div>

                {/* Step 1: Demographics */}
                {formStep === 1 && (
                  <div className="space-y-6 font-sans">
                    <div>
                      <h3 className="text-base font-black uppercase text-[#0f3c4c] dark:text-[#5eead4] font-sans">
                        Patient Demographics
                      </h3>
                      {existingPatientId && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-none text-xs font-sans font-bold border border-emerald-300 dark:border-emerald-800">
                          <UserCheck className="w-4 h-4" /> Existing Record Found - Auto-populated
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">Full Name *</label>
                        <input 
                          type="text"
                          required
                          value={manualForm.fullName}
                          onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                          placeholder="e.g. MOHD HAFIZ BIN RAZALI"
                          className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs text-[#0f3c4c] dark:text-slate-100 font-bold focus:border-[#0d9488] outline-none font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">IC / Passport Number *</label>
                        <input 
                          type="text"
                          required
                          value={manualForm.icNumber}
                          onChange={(e) => setManualForm({ ...manualForm, icNumber: e.target.value })}
                          placeholder="YYMMDD-XX-XXXX"
                          className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs font-mono text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">Gender</label>
                        <select 
                          value={manualForm.gender} 
                          onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}
                          className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs font-sans text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
                        >
                          <option value="Male">Male / Lelaki</option>
                          <option value="Female">Female / Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">Date of Birth</label>
                        <input 
                          type="date"
                          value={manualForm.dob}
                          onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                          className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs font-mono text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">Phone Number *</label>
                        <input 
                          type="text"
                          required
                          value={manualForm.phone}
                          onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                          placeholder="e.g. 012-3456789"
                          className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs font-mono text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider mb-1 font-sans">Residential Address</label>
                      <input 
                        type="text"
                        value={manualForm.address}
                        onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                        placeholder="Enter full residential address..."
                        className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none font-sans"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Billing & Medical Alerts */}
                {formStep === 2 && (
                  <div className="space-y-6 font-sans">
                    <div>
                      <h3 className="text-base font-black uppercase text-[#0f3c4c] dark:text-[#5eead4] font-sans">
                        Billing Sponsor & Medical Alerts
                      </h3>
                      <p className="text-xs text-[#0f766e] dark:text-teal-300 font-sans mt-0.5">Configure insurance panels and drug allergies</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider font-sans">Panel / Corporate Sponsor</label>
                        <div className="flex gap-2">
                          <select
                            value={manualForm.panelEmployer}
                            onChange={(e) => {
                              setManualForm({ ...manualForm, panelEmployer: e.target.value });
                              setCoverageStatus(e.target.value === 'None (Self-Pay)' ? 'verified' : 'unverified');
                            }}
                            className="flex-1 bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs font-sans text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
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
                                  : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
                              }`}
                            >
                              {isVerifyingCoverage ? <Loader2 className="w-4 h-4 animate-spin" /> : coverageStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                              {coverageStatus === 'verified' ? 'Verified' : 'Verify'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-[#0f766e] dark:text-[#5eead4] uppercase tracking-wider font-sans">Drug Allergies</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={allergyInput}
                            onChange={(e) => setAllergyInput(e.target.value)}
                            placeholder="e.g. Penicillin, Aspirin..."
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergyTag())}
                            className="flex-1 bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none px-3 py-2 text-xs font-sans text-[#0f3c4c] dark:text-slate-100 focus:border-[#0d9488] outline-none"
                          />
                          <button 
                            type="button" 
                            onClick={handleAddAllergyTag}
                            className="bg-[#f7fdfd] dark:bg-[#07252d] hover:bg-[#e0f5f2] dark:hover:bg-[#0d3b47] text-[#0f766e] dark:text-[#5eead4] border border-[#ccfbf1] dark:border-teal-800/50 font-bold text-xs px-3 py-2 rounded-none font-sans uppercase"
                          >
                            + Add
                          </button>
                        </div>
                        {allergiesList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {allergiesList.map((tag, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-sans font-bold px-2.5 py-1 border border-rose-200 dark:border-rose-800/60 rounded-none">
                                {tag}
                                <button type="button" onClick={() => handleRemoveAllergyTag(idx)} className="text-rose-400 hover:text-rose-700 cursor-pointer text-xs">&times;</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="mt-8 pt-4 border-t border-[#ccfbf1] dark:border-teal-800/40 flex items-center justify-between font-sans">
                  {formStep > 1 ? (
                    <button 
                      type="button" 
                      onClick={() => setFormStep(1)}
                      className="bg-[#f7fdfd] dark:bg-[#07252d] hover:bg-[#e0f5f2] text-[#0f766e] dark:text-teal-300 border border-[#ccfbf1] font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  ) : <div></div>}

                  {formStep < 2 ? (
                    <button 
                      type="button" 
                      onClick={proceedToNextStep}
                      className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center gap-1.5 shadow-xs"
                    >
                      Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleRegisterSubmit} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs px-4 py-2 rounded-none uppercase flex items-center gap-1.5 shadow-xs"
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
        <div className="bg-[#f0fdfa] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 rounded-none shadow-xs font-sans">
          <div className="p-6 space-y-6">
            
            {/* Header section with total count badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ccfbf1] dark:border-teal-800/40 pb-4 font-sans">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#0d9488]/10 dark:bg-teal-900/40 border border-[#0d9488]/20 flex items-center justify-center rounded-none">
                  <FolderCheck className="w-5 h-5 text-[#0d9488] dark:text-[#5eead4]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight text-[#0f3c4c] dark:text-[#5eead4] font-sans">
                    Registered Patient Registry
                  </h3>
                  <p className="text-xs text-[#0f766e] dark:text-teal-300 font-sans font-medium">Comprehensive index of all registered patients in the clinic database</p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-sans">
                <span className="bg-[#0d9488]/10 text-[#0d9488] dark:bg-teal-900/40 dark:text-teal-200 border border-[#0d9488]/20 font-bold px-3 py-1 rounded-none text-xs font-sans">
                  {totalPatientCount} total patients
                </span>
              </div>
            </div>
            
            {/* Integrated Search Input */}
            <div className="flex items-center gap-3 max-w-md font-sans">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#0d9488] dark:text-[#5eead4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.searchPatient || "Search by Name / IC Number..."}
                  value={patientRegistrySearch}
                  onChange={(e) => setPatientRegistrySearch(e.target.value)}
                  className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/60 rounded-none pl-9 pr-3 py-2 text-xs font-sans text-[#0f3c4c] dark:text-slate-100 placeholder-[#0f766e]/50 dark:placeholder-teal-400/50 focus:border-[#0d9488] outline-none font-medium"
                />
              </div>
            </div>
            
            {/* Flat Table */}
            <div className="overflow-x-auto border border-[#ccfbf1] dark:border-teal-800/40 rounded-none font-sans">
              <table className="w-full text-xs text-left font-sans">
                <thead className="bg-[#e0f5f2]/80 dark:bg-[#07252d] border-b border-[#ccfbf1] dark:border-teal-800/40 font-sans">
                  <tr className="text-[#0f766e] dark:text-[#5eead4] font-sans text-[11px] uppercase tracking-wider font-black">
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Full Name</th>
                    <th className="px-4 py-3.5">IC Number</th>
                    <th className="px-4 py-3.5">Panel</th>
                    <th className="px-4 py-3.5">Allergies</th>
                    <th className="px-4 py-3.5 text-right">Registered</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ccfbf1]/50 dark:divide-teal-800/30 bg-[#f7fdfd] dark:bg-[#07252d] font-sans">
                  {registryResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#0f766e] dark:text-teal-400 font-sans font-medium">
                        No patient records found matching your search.
                      </td>
                    </tr>
                  ) : (
                    registryResults.map(p => (
                      <tr key={p.id} className="hover:bg-[#e0f5f2]/40 dark:hover:bg-[#0d3b47]/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-[#0f766e] dark:text-teal-300 text-xs font-bold">
                          {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-xs uppercase text-[#0f3c4c] dark:text-[#5eead4] block font-sans">
                            {p.fullName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-[#0f766e] dark:text-teal-300">
                          {maskICNumber(p.icNumber, showPII)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-none text-[10px] font-sans font-bold uppercase tracking-wide border ${
                            p.panelEmployer === 'None (Self-Pay)' 
                              ? 'bg-slate-100 dark:bg-[#082830] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-teal-900' 
                              : 'bg-[#0d9488]/10 text-[#0d9488] dark:bg-teal-900/40 dark:text-teal-200 border-[#0d9488]/20 dark:border-teal-700/50'
                          }`}>
                            {p.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : p.panelEmployer}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.drugAllergies.length === 0
                            ? <span className="text-slate-400 dark:text-slate-500 text-xs italic font-sans">None</span>
                            : <div className="flex flex-wrap gap-1">
                                {p.drugAllergies.map((a, i) => (
                                  <span key={i} className="inline-block bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[10px] font-sans font-bold px-2 py-0.5 rounded-none">
                                    {a}
                                  </span>
                                ))}
                              </div>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-[#0f766e] dark:text-teal-300 font-mono text-xs text-right">
                          {p.registeredDate}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleCreateTicket(p)}
                            className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs px-3.5 py-1.5 rounded-none font-sans transition-colors shadow-xs uppercase tracking-wider inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> New Visit
                          </button>
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
