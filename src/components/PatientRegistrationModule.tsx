import React, { useState, useEffect } from 'react';
import { Users, Globe, UserCheck, FolderCheck, Plus, RotateCcw, Activity, ShieldAlert, ArrowRight, ArrowLeft, Search, Loader2, ShieldCheck, CheckCircle2, Clock, Check } from 'lucide-react';
import { Patient, Visit, Language } from '../types';
import MyKadScanner from './MyKadScanner';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
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
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'form' | 'registry'>('queue');
  const [registrationStep, setRegistrationStep] = useState<'id_check' | 'details'>('id_check');
  const [idCheckValue, setIdCheckValue] = useState('');
  
  // NEW: Wizard Step State
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  
  // NEW: Toast Notification State
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
      phone: '01' + Math.floor(10000000 + Math.random() * 90000000), // realistic phone
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
    // Simulate API delay and 80/20 success rate
    setTimeout(() => {
      setIsVerifyingCoverage(false);
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setCoverageStatus('verified');
        showToast(`TPA API: ${manualForm.panelEmployer} Active. Limit Verified.`);
      } else {
        setCoverageStatus('failed');
        // Toast doesn't support error style currently, but the UI shows warning
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
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* Toast Notification (Absolute positioned overlay) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slideUp">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`pb-3 font-semibold text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeSubTab === 'queue' ? 'text-teal-600 border-teal-600' : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Waiting Room Monitor
        </button>
        <button
          onClick={() => setActiveSubTab('form')}
          className={`pb-3 font-semibold text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeSubTab === 'form' ? 'text-teal-600 border-teal-600' : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Registration Form
        </button>
        <button
          onClick={() => setActiveSubTab('registry')}
          className={`pb-3 font-semibold text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeSubTab === 'registry' ? 'text-teal-600 border-teal-600' : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Patient Registry
        </button>
      </div>

      {activeSubTab === 'queue' && (
        <Card className="animate-fadeIn shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" /> 
                Live Waiting Room
              </h3>
              <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">
                {triageQueue.length} Patient(s) Waiting
              </span>
            </div>
            
            {triageQueue.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <p className="font-semibold text-lg text-slate-500">Waiting Room is Empty</p>
                <p className="text-sm mt-1">All registered patients have been triaged or cleared.</p>
                <Button variant="primary" className="mt-6 mx-auto" onClick={() => setActiveSubTab('form')}>
                  <Plus className="w-4 h-4 mr-2" /> Register New Patient
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-live="polite">
                {triageQueue.map(visit => {
                  const pt = patientsMap[visit.patientId];
                  const waitTimeMs = Date.now() - (visit.registeredTime || Date.now());
                  let waitMins = Math.floor(waitTimeMs / 60000);
                  // Ensure visible testing data
                  if (waitMins < 1) waitMins = Math.floor(Math.random() * 45) + 1;
                  
                  let waitStatusColor = 'emerald';
                  if (waitMins >= 15 && waitMins <= 30) waitStatusColor = 'amber';
                  if (waitMins > 30) waitStatusColor = 'red';

                  return (
                    <div key={visit.id} className={`p-5 rounded-2xl border border-${waitStatusColor}-200 bg-${waitStatusColor}-50/30 hover:border-${waitStatusColor}-400 shadow-sm hover:shadow-md flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 animate-fadeInUp relative overflow-hidden group`}>
                      <div className={`absolute top-0 left-0 w-1 h-full bg-${waitStatusColor}-500 transition-all duration-300 group-hover:w-1.5`}></div>
                      
                      <div className="flex justify-between items-start pl-2">
                        <span className="text-[10px] font-mono font-bold bg-white text-slate-600 px-2 py-1 rounded shadow-sm tracking-wider">
                          # {visit.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-${waitStatusColor}-100 text-${waitStatusColor}-700 border border-${waitStatusColor}-200 shadow-sm`}>
                          <Clock className="w-3 h-3" /> {waitMins} min wait
                        </span>
                      </div>
                      
                      <div className="mt-4 pl-2">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 uppercase text-sm truncate">{pt?.fullName}</h4>
                          <span className="font-mono text-slate-400">IC: {maskICNumber(pt?.icNumber, showPII)}</span>
                        </div>
                        
                        <div className="text-xs text-slate-500 mt-2 space-y-2">
                          <div className="flex justify-between items-center">
                            {pt?.panelEmployer !== 'None (Self-Pay)' && (
                              <span className="inline-block text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-indigo-100">
                                Panel: {pt?.panelEmployer}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                            <Activity className="w-4 h-4 text-teal-500" />
                            <span>Triage: {visit.soap?.objective?.temperature}°C • HR {visit.soap?.objective?.heartRate} • BP {visit.soap?.objective?.bpSystolic}/{visit.soap?.objective?.bpDiastolic}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pl-2 flex gap-3">
                        <Button variant="primary" className="flex-1 py-2 text-xs" onClick={() => showToast(`${pt?.fullName} flagged as Priority for Doctor`)} aria-label={`Mark ${pt?.fullName} as priority`}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark as Priority
                        </Button>
                        <Button variant="outline" className="flex-1 py-2 text-xs border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => {
                          updateVisitInDb({ ...visit, status: 'Cancelled' });
                          showToast(`${pt?.fullName} visit cancelled`);
                        }} aria-label={`Cancel visit for ${pt?.fullName}`}>
                          Cancel Visit
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === 'form' && (
        <div className="animate-fadeIn">
          {registrationStep === 'id_check' ? (
            <Card className="max-w-md mx-auto mt-12 shadow-sm border-slate-200">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100">
                    <Search className="w-8 h-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Identify Patient</h3>
                    <p className="text-sm text-slate-500 mt-2">Enter NRIC/Passport or scan MyKad to begin.</p>
                  </div>
                  
                  <form onSubmit={handleIdCheckSubmit} className="space-y-4 text-left">
                    <Input
                      label="NRIC / Passport Number"
                      value={idCheckValue}
                      onChange={(e) => setIdCheckValue(e.target.value)}
                      placeholder="e.g. 900101-14-5555"
                      required
                    />
                    <Button type="submit" variant="primary" className="w-full justify-center text-sm shadow-sm">
                      Check Database <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                  
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                  
                  <Button type="button" variant="outline" className="w-full justify-center text-sm" onClick={() => setIsMyKadOpen(true)}>
                    <Globe className="w-4 h-4 mr-2" /> Scan PWA MyKad
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto">
              
              {/* WIZARD STEPPER HEADER */}
              <div className="mb-8 flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-teal-600 -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: formStep === 1 ? '0%' : formStep === 2 ? '50%' : '100%' }}></div>
                
                {[1, 2, 3].map(stepNum => (
                  <div key={stepNum} className={`flex flex-col items-center gap-2 bg-slate-50 p-1 ${formStep >= stepNum ? '' : 'opacity-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${formStep === stepNum ? 'bg-teal-600 text-white ring-4 ring-teal-100' : formStep > stepNum ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {formStep > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 hidden sm:block">
                      {stepNum === 1 ? 'Demographics' : stepNum === 2 ? 'Billing' : 'Triage'}
                    </span>
                  </div>
                ))}
              </div>

              <Card className="shadow-sm border-slate-200 relative overflow-hidden min-h-[400px]">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button type="button" variant="ghost" onClick={handleClearForm} className="text-slate-400 hover:text-slate-600">
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Restart
                  </Button>
                </div>

                <CardContent className="p-6 sm:p-10">
                  
                  {/* WIZARD STEP 1: DEMOGRAPHICS */}
                  {formStep === 1 && (
                    <div className="animate-fadeIn">
                      <div className="mb-6">
                        <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                          Patient Demographics
                        </h3>
                        {existingPatientId && (
                          <div className="mt-3 inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
                            <UserCheck className="w-4 h-4" /> Existing Record Found - Auto-populated
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Input label={t.fullName + " *"} value={manualForm.fullName} onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })} placeholder="e.g. MOHD HAFIZ BIN RAZALI" required />
                        <Input label={t.icNumber + " *"} value={manualForm.icNumber} onChange={(e) => setManualForm({ ...manualForm, icNumber: e.target.value })} placeholder="YYMMDD-XX-XXXX" required className="font-mono bg-slate-50" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-1.5">
                          <label className="block font-bold text-slate-700 text-xs">{t.gender}</label>
                          <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white outline-none transition-all" value={manualForm.gender} onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}>
                            <option value="Male">Male / Lelaki</option>
                            <option value="Female">Female / Perempuan</option>
                          </select>
                        </div>
                        <Input label={t.dob} type="date" value={manualForm.dob} onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })} className="font-mono" />
                        <Input label={t.phone + " *"} value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} placeholder="e.g. 012-3456789" required className="font-mono" />
                      </div>
                      <Input label={t.address} value={manualForm.address} onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })} placeholder="Enter patient full residential address in Malaysia..." />
                    </div>
                  )}

                  {/* WIZARD STEP 2: BILLING & ALERTS */}
                  {formStep === 2 && (
                    <div className="animate-fadeIn">
                      <div className="mb-6">
                        <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                          Billing & Medical Alerts
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Configure payment sponsor and check for drug allergies.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div className="space-y-3">
                          <label className="block font-bold text-slate-700 text-xs uppercase tracking-wide">{t.panelEmployer}</label>
                          <div className="flex gap-2 items-stretch">
                            <select
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white outline-none transition-all"
                              value={manualForm.panelEmployer}
                              onChange={(e) => {
                                setManualForm({ ...manualForm, panelEmployer: e.target.value });
                                setCoverageStatus(e.target.value === 'None (Self-Pay)' ? 'verified' : 'unverified');
                              }}
                            >
                              <option value="None (Self-Pay)">Self-Pay (No sponsor claim co-pays)</option>
                              <option value="Petronas Panel">Petronas Panel (Cover RM500 limit)</option>
                              <option value="Medkad Sdn Bhd">Medkad Sdn Bhd (Cover RM200 limit)</option>
                              <option value="MiCare TPA">MiCare TPA (Cover RM150, co-pay 10%)</option>
                              <option value="HealthMetrics Malaysia">HealthMetrics Malaysia (Cover RM300, co-pay 15%)</option>
                              <option value="PMCare Corporate">PMCare Corporate (Cover RM250 limit)</option>
                            </select>
                            {manualForm.panelEmployer !== 'None (Self-Pay)' && (
                              <Button 
                                type="button" 
                                variant={coverageStatus === 'verified' ? 'outline' : 'primary'} 
                                onClick={handleVerifyCoverage} 
                                disabled={isVerifyingCoverage || coverageStatus === 'verified'}
                                className={`shrink-0 transition-all ${coverageStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default' : ''}`}
                              >
                                {isVerifyingCoverage ? <Loader2 className="w-4 h-4 animate-spin" /> : coverageStatus === 'verified' ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
                                {coverageStatus === 'verified' ? 'Verified' : 'Verify'}
                              </Button>
                            )}
                          </div>
                          {coverageStatus === 'unverified' && manualForm.panelEmployer !== 'None (Self-Pay)' && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4" /> Eligibility check required.
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="block font-bold text-slate-700 text-xs uppercase tracking-wide">{t.drugAllergies}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white bg-slate-50 outline-none text-sm transition-all shadow-sm"
                              value={allergyInput}
                              onChange={(e) => setAllergyInput(e.target.value)}
                              placeholder="e.g. Penicillin, Aspirin..."
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergyTag())}
                            />
                            <Button type="button" variant="outline" onClick={handleAddAllergyTag}>
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                          {allergiesList.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                              {allergiesList.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                  {tag}
                                  <button type="button" onClick={() => handleRemoveAllergyTag(idx)} className="text-rose-400 hover:text-rose-700 cursor-pointer leading-none w-4 h-4 flex items-center justify-center">&times;</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WIZARD STEP 3 REMOVED FOR TRIAGE MODULE */}

                </CardContent>
                
                {/* Wizard Footer Controls */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 sm:px-10 py-4 flex items-center justify-between">
                  {formStep > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setFormStep(prev => (prev - 1) as any)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  ) : <div></div>}

                  {formStep < 2 ? (
                    <Button type="button" variant="primary" onClick={proceedToNextStep}>
                      Next Step <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="button" variant="primary" onClick={handleRegisterSubmit} className="shadow-md bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                      <UserCheck className="w-4 h-4 mr-2" /> Route to Triage Queue
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'registry' && (
        <Card className="animate-fadeIn shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                <FolderCheck className="w-5 h-5 text-teal-600" />
                Registered Patient Registry
              </h3>
              <div className="flex items-center gap-4">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  {totalPatientCount} total patients
                </span>
              </div>
            </div>
            
            <div className="mb-5 max-w-md">
              <Input
                placeholder={t.searchPatient}
                value={patientRegistrySearch}
                onChange={(e) => setPatientRegistrySearch(e.target.value)}
                className="bg-white"
              />
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Full Name</th>
                    <th className="px-5 py-4">IC Number</th>
                    <th className="px-5 py-4">Panel</th>
                    <th className="px-5 py-4">Allergies</th>
                    <th className="px-5 py-4 text-right">Registered</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {registryResults
                    .map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">
                          {p.id.includes('-') ? p.id.slice(0, 8).toUpperCase() : p.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs">
                            <span className="font-bold uppercase block">{p.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">
                          {maskICNumber(p.icNumber, showPII)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${p.panelEmployer === 'None (Self-Pay)' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                            {p.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : p.panelEmployer}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.drugAllergies.length === 0
                            ? <span className="text-slate-300 text-xs italic">None</span>
                            : <div className="flex flex-wrap gap-1.5">
                                {p.drugAllergies.map((a, i) => (
                                  <span key={i} className="inline-block bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{a}</span>
                                ))}
                              </div>
                          }
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs text-right">{p.registeredDate}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Button
                            variant="primary"
                            onClick={() => handleCreateTicket(p)}
                            className="px-3 py-1.5 text-xs mx-auto shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> New Visit
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
