import React, { useState } from 'react';
import { Patient, Visit, Language, UserRole } from './types';
import { TRANSLATIONS, INITIAL_PATIENTS } from './data';
import { useFinancials } from './context/FinancialContext';

// Import modules
import MyKadScanner from './components/MyKadScanner';
import DispensaryDashboard from './components/DispensaryDashboard';
import BillingDesk from './components/BillingDesk';
import LandingModule from './components/LandingModule';
import LoginModule from './components/LoginModule';
import AdminModule from './components/AdminModule';
import DoctorDashboardModule from './components/DoctorDashboardModule';

// Import icons
import {
  Building, Users, FolderCheck, Stethoscope, Pill, CreditCard,
  Settings, Menu, LayoutDashboard, Globe, AlertCircle, Wifi, WifiOff,
  CheckCircle2, ChevronRight, Activity, X, UserCheck, MapPin, 
  LogOut, ShieldAlert, FileText, Smartphone, MessageCircle, Network, BarChart3, Mic
} from 'lucide-react';

export default function App() {
  const { recordTransaction } = useFinancials();
  const [appView, setAppView] = useState<'landing' | 'login' | 'suite' | 'admin'>('landing');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // Navigation Menu Active Page
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registration' | 'consultation' | 'dispensary' | 'billing'>('dashboard');

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === 'admin' || role === 'hr') {
      setAppView('admin');
    } else {
      setAppView('suite');
      // Set default tab based on role
      if (role === 'pharmacist') setActiveTab('dashboard');
      else if (role === 'doctor') setActiveTab('dashboard');
      else if (role === 'clerk') setActiveTab('dashboard');
    }
  };

  // Multi-language active language (EN or BM)
  const [activeLanguage, setActiveLanguage] = useState<Language>('EN');
  const t = TRANSLATIONS[activeLanguage];

  // PWA Network Emulator State
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Clinic State Databases
  const [patientsList, setPatientsList] = useState<Patient[]>(INITIAL_PATIENTS);

  // Working Active Visits queue
  const [visitsQueue, setVisitsQueue] = useState<Visit[]>([
    // Prepulate queue to demonstrate multi-step flow at launch
    {
      id: 'V-MOCK-201',
      patientId: 'P001', // Mohd Hafiz bin Razali
      date: '2026-06-05',
      soap: {
        subjective: 'High fever for 2 days, chestiness with productive cough.',
        objective: {
          bpSystolic: 125,
          bpDiastolic: 80,
          heartRate: 85,
          temperature: 38.6,
          respiratoryRate: 18
        },
        assessment: {
          icdCode: 'J06.9',
          description: 'Acute upper respiratory infection, unspecified (Common Cold / URTI)',
          clinicalNotes: 'Avoid cold beverages, warm fluids intake advised.'
        },
        plan: {
          prescription: [
            {
              id: 'rx-201_a',
              drugName: 'Paracetamol (Panadol) 500mg',
              dosage: 'Take 2 tablets four times a day as needed for fever.',
              dosageBM: 'Ambil 2 biji empat kali sehari mengikut keperluan demam.',
              frequency: 'PRN',
              quantity: 20,
              pricePerUnit: 0.15,
              expiryDate: '2028-11-05',
              pillColor: '#3b82f6',
              capsuleStyle: 'round'
            },
            {
              id: 'rx-201_b',
              drugName: 'Ibuprofen 400mg Tablet',
              dosage: 'Take 1 tablet three times daily post foodstuffs.',
              dosageBM: 'Ambil 1 biji tiga kali sehari selepas makanan.',
              frequency: 'TDS',
              quantity: 15,
              pricePerUnit: 0.60,
              expiryDate: '2026-09-02',
              pillColor: '#f97316',
              capsuleStyle: 'solid'
            }
          ],
          followUpWeeks: 1,
          mcDays: 2,
          requiresReferral: false
        }
      },
      status: 'Awaiting Dispensation', // Ready in pharmacy
      totalBill: 50.00,
      panelClaimed: 0,
      paidAmount: 0
    },
    {
      id: 'V-MOCK-202',
      patientId: 'P002', // Siti Aminah
      date: '2026-06-05',
      soap: {
        subjective: 'Follow up hypertension medication checkout.',
        objective: {
          bpSystolic: 135,
          bpDiastolic: 85,
          heartRate: 74,
          temperature: 36.5,
          respiratoryRate: 16
        },
        assessment: {
          icdCode: 'I10',
          description: 'Essential (primary) hypertension',
          clinicalNotes: 'Surveillance continues. Dosage checks safe.'
        },
        plan: {
          prescription: [
            {
              id: 'rx-202_a',
              drugName: 'Amlodipine Besylate 10mg',
              dosage: 'Take 1 tablet once daily morning.',
              dosageBM: 'Ambil 1 biji sekali sehari pada waktu pagi.',
              frequency: 'OD',
              quantity: 30,
              pricePerUnit: 0.50,
              expiryDate: '2027-04-12',
              pillColor: '#a855f7',
              capsuleStyle: 'round'
            }
          ],
          followUpWeeks: 8,
          mcDays: 0,
          requiresReferral: false
        }
      },
      status: 'Awaiting Dispensation',
      totalBill: 45.00,
      panelClaimed: 0,
      paidAmount: 0
    },
    {
      id: 'V-MOCK-203',
      patientId: 'P003', // Tan Wei Seng
      date: '2026-06-05',
      soap: {
        subjective: 'Symptomatic review',
        objective: { bpSystolic: 120, bpDiastolic: 78, heartRate: 72, temperature: 36.6, respiratoryRate: 14 },
        assessment: { icdCode: 'Z02.7', description: 'Issue of medical certificate', clinicalNotes: 'Routine consultation' },
        plan: { prescription: [], followUpWeeks: 0, mcDays: 1, requiresReferral: false }
      },
      status: 'Awaiting Consult', // Still waiting for doctor consult
      totalBill: 0,
      panelClaimed: 0,
      paidAmount: 0
    }
  ]);

  // Archives of completed (Paid) visits to render billing totals
  const [completedVisits, setCompletedVisits] = useState<Visit[]>([]);

  // Registration Form state
  const [isMyKadOpen, setIsMyKadOpen] = useState(false);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    icNumber: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    phone: '',
    address: '',
    panelEmployer: 'None (Self-Pay)',
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [allergiesList, setAllergiesList] = useState<string[]>([]);

  // Selected patient actively being consulted by doctor
  const [activeConsultationVisitId, setActiveConsultationVisitId] = useState<string | null>(null);

  // Patient Search bar state
  const [patientRegistrySearch, setPatientRegistrySearch] = useState('');

  // Auto-translate genders helper
  const translateGender = (g: string) => {
    if (activeLanguage === 'BM') {
      return g === 'Male' ? 'Lelaki' : 'Perempuan';
    }
    return g;
  };

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Trigger MyKad OCR simulated fill
  const handleMyKadComplete = (scannedDetails: any) => {
    setManualForm({
      fullName: scannedDetails.fullName,
      icNumber: scannedDetails.icNumber,
      gender: scannedDetails.gender,
      dob: scannedDetails.dob,
      phone: '01' + Math.floor(10000000 + Math.random() * 90000000), // realistic phone
      address: scannedDetails.address,
      panelEmployer: scannedDetails.fullName.includes('Hafiz') ? 'Petronas Panel' : scannedDetails.fullName.includes('Siti') ? 'Medkad Sdn Bhd' : 'None (Self-Pay)'
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

  // Add Custom Allergy tags manually in registration form
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

  // Handle clinical manual validation for phone numbers and MyKad
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

    // Register active Patient
    const newPatient: Patient = {
      id: `P${String(patientsList.length + 1).padStart(3, '0')}`,
      fullName: manualForm.fullName,
      icNumber: manualForm.icNumber,
      gender: manualForm.gender,
      dob: manualForm.dob || '1990-01-01',
      address: manualForm.address || 'No Address, Malaysia',
      phone: manualForm.phone,
      panelEmployer: manualForm.panelEmployer,
      drugAllergies: allergiesList,
      registeredDate: new Date().toISOString().split('T')[0]
    };

    setPatientsList([...patientsList, newPatient]);

    // Dispatch a new Visit record immediately into Doctor's Consulting queue
    const targetVisitId = `V-${Date.now().toString().slice(-6)}`;
    const newVisit: Visit = {
      id: targetVisitId,
      patientId: newPatient.id,
      date: new Date().toISOString().split('T')[0],
      soap: {
        subjective: '',
        objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 72, temperature: 36.6, respiratoryRate: 16 },
        assessment: { icdCode: '', description: '', clinicalNotes: '' },
        plan: { prescription: [], followUpWeeks: 1, mcDays: 0, requiresReferral: false }
      },
      status: 'Awaiting Consult',
      totalBill: 0,
      panelClaimed: 0,
      paidAmount: 0
    };

    setVisitsQueue([newVisit, ...visitsQueue]);

    // Clear registration fields
    setManualForm({
      fullName: '',
      icNumber: '',
      gender: 'Male',
      dob: '',
      phone: '',
      address: '',
      panelEmployer: 'None (Self-Pay)',
    });
    setAllergiesList([]);

    // Redirect to consultation tab immediately which feels slick
    setActiveTab('consultation');
  };

  // Doctor Complete Case Soap Callback
  const handleDoctorSoapSubmit = (soapData: any, issueMc: boolean, mcDuration: number) => {
    if (!activeConsultationVisitId) return;

    setVisitsQueue(visitsQueue.map(v => {
      if (v.id === activeConsultationVisitId) {
        return {
          ...v,
          soap: soapData,
          status: 'Awaiting Dispensation', // Sent to Pharmacy!
          mcIssued: issueMc,
        };
      }
      return v;
    }));

    setActiveConsultationVisitId(null);
    setActiveTab('dispensary'); // Auto route to dispensary queue
  };

  // Dispensary Pharmaceutic Complete callback
  const handleDispenseVerified = (visitId: string) => {
    setVisitsQueue(visitsQueue.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: 'Awaiting Billing' // Route to Cashier invoice table
        };
      }
      return v;
    }));

    setActiveTab('billing'); // Auto route to billing receipt tab
  };

  // Cashier Desk settled payment receipt callback
  const handleBillingSettled = (visitId: string, payInfo: any) => {
    // Audit log
    const indexVisit = visitsQueue.find(v => v.id === visitId);
    if (!indexVisit) return;

    const completedVisit: Visit = {
      ...indexVisit,
      status: 'Paid',
      paymentMethod: payInfo.paymentMethod,
      paidAmount: payInfo.paidAmount,
      panelClaimed: payInfo.panelClaimed,
      glNumber: payInfo.glNumber
    };

    recordTransaction({
      patientId: indexVisit.patientId,
      visitId: visitId,
      paymentMethod: payInfo.paymentMethod,
      paidAmount: payInfo.paidAmount,
      panelClaimed: payInfo.panelClaimed,
      glNumber: payInfo.glNumber
    });

    setCompletedVisits([completedVisit, ...completedVisits]);
    // Delete from working clinic queue
    setVisitsQueue(visitsQueue.filter(v => v.id !== visitId));
    setActiveTab('reports');
  };

  // Derived maps
  const patientsMap = patientsList.reduce<Record<string, Patient>>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

  // Categorize flow lists
  const doctorQueue = visitsQueue.filter(v => v.status === 'Awaiting Consult' || v.status === 'Consulting');
  const pharmacyQueue = visitsQueue.filter(v => v.status === 'Awaiting Dispensation');
  const cashierQueue = visitsQueue.filter(v => v.status === 'Awaiting Billing');

  const renderView = () => {
    if (appView === 'landing') return <LandingModule onNavigate={setAppView} />;
    if (appView === 'login') return <LoginModule onLogin={handleLogin} onNavigate={setAppView} />;
    if (appView === 'admin') return <AdminModule 
      onNavigate={setAppView} 
      userRole={userRole as 'admin' | 'hr'} 
      completedVisits={completedVisits}
      totalRegisteredCount={patientsList.length}
      activeLanguage={activeLanguage}
    />;
    return null;
  };

  const currentView = renderView();
  if (currentView) {
    return currentView;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Global Toast for WhatsApp */}
        {whatsappToast && (
          <div className="fixed top-20 right-8 z-[100] bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">WhatsApp Sent</p>
              <p className="text-xs text-emerald-100">{whatsappToast}</p>
            </div>
            <button onClick={() => setWhatsappToast(null)} className="ml-4 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      {/* GLOBAL HEADER BAR */}
      <header className="bg-[#07B2B2] text-white px-5 py-3 flex items-center justify-between border-b border-cyan-800 shrink-0 shadow-md">

        {/* Clinician clinic logo titles */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg border border-cyan-500/20 shadow-inner">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans">
              {t.clinicName}
            </h1>
            <span className="text-[10px] text-cyan-200 font-mono tracking-wider">Enterprise Clinical Suite v1.1.2</span>
          </div>
        </div>

        {/* Global actions: network status PWA toggle, BM/EN translations control */}
        <div className="flex items-center gap-4">

          {/* PWA Network Simulator toggle */}
          <button
            type="button"
            id="pwa-network-toggle"
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-800/80 rounded border border-cyan-700 hover:bg-cyan-900 transition-colors cursor-pointer text-[10px] uppercase font-bold font-mono"
            title="Simulate offline cache network mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-white" />
                <span className="text-white">{t.online}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="text-red-300">{t.offline}</span>
              </>
            )}
          </button>

          {/* Lang Selector BM/EN switcher */}
          <div className="bg-cyan-800/80 rounded border border-cyan-700 p-0.5 flex">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setActiveLanguage('EN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeLanguage === 'EN' ? 'bg-[#07B2B2] text-white shadow-xs' : 'text-cyan-300 hover:text-white'
                }`}
            >
              {t.enToggle}
            </button>
            <button
              type="button"
              id="lang-toggle-bm"
              onClick={() => setActiveLanguage('BM')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeLanguage === 'BM' ? 'bg-[#07B2B2] text-white shadow-xs' : 'text-cyan-300 hover:text-white'
                }`}
            >
              {t.bmToggle}
            </button>
          </div>

                    <span className="text-slate-100 hidden sm:inline text-xs font-mono font-medium">
            {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Suite` : 'Suite'}
          </span>
          <button type="button" onClick={() => { setAppView('landing'); setUserRole(null); }} className="text-xs bg-cyan-900/50 hover:bg-red-500/80 text-white px-2 py-1 rounded transition-colors cursor-pointer">Logout</button>
        </div>

      </header>

      {/* CORE FRAME LAYOUT */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* TOP NAVIGATION (Clinician tools bar) */}
        <nav className="w-full bg-[#069494] text-white flex items-center justify-between border-b border-[#058A8A] shrink-0 px-4 overflow-x-auto custom-scrollbar">

          <div className="flex items-center space-x-1 py-2" id="sidebar-navigation-links">

            {/* Generic Dashboard Icon */}
            <button
              type="button"
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'dashboard'
                ? 'bg-[#07B2B2]/90 text-white shadow font-semibold'
                : 'text-cyan-50 hover:bg-[#058A8A] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span>{t.dashboard}</span>
              </div>
            </button>

            {/* Patient Registration Icon */}
            {userRole === 'clerk' && (
              <button
                type="button"
                id="sidebar-link-registration"
                onClick={() => setActiveTab('registration')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'registration'
                    ? 'bg-[#07B2B2]/90 text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#058A8A] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <span>{t.patientRegistration}</span>
                </div>
              </button>
            )}

            {/* Consultation CRM Icon */}
            {userRole === 'doctor' && (
              <button
                type="button"
                id="sidebar-link-consultation"
                onClick={() => setActiveTab('consultation')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'consultation'
                    ? 'bg-[#07B2B2]/90 text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#058A8A] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-white" />
                  <span>Consultation</span>
                </div>
                {doctorQueue.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                    {doctorQueue.length}
                  </span>
                )}
              </button>
            )}

            {/* Pharmacy / Dispensary Icon */}
            {userRole === 'pharmacist' && (
              <button
                type="button"
                id="sidebar-link-dispensary"
                onClick={() => setActiveTab('dispensary')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'dispensary'
                    ? 'bg-[#07B2B2]/90 text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#058A8A] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-white" />
                  <span>{t.dispensary}</span>
                </div>
                {pharmacyQueue.length > 0 && (
                  <span className="bg-orange-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                    {pharmacyQueue.length}
                  </span>
                )}
              </button>
            )}

            {/* Billing claims receipt ledger icon */}
            {userRole === 'clerk' && (
              <button
                type="button"
                id="sidebar-link-billing"
                onClick={() => setActiveTab('billing')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'billing'
                    ? 'bg-[#07B2B2]/90 text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#058A8A] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white" />
                  <span>{t.billing}</span>
                </div>
                {cashierQueue.length > 0 && (
                  <span className="bg-blue-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                    {cashierQueue.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Navigation bottom clinic status metadata indicator */}
          <div className="hidden lg:flex items-center space-x-4 text-[10px] text-slate-500 font-mono pl-4 border-l border-slate-800 ml-4">
            <div className="flex items-center gap-1">
              <span>Sync:</span>
              <span className="text-[#07B2B2] font-bold uppercase">KKM-ONLINE</span>
            </div>
            <div>
              <span>ID: <strong>MY-APC-KLG-20</strong></span>
            </div>
          </div>

        </nav>

        {/* INNER PAGE STAGE WINDOW CONTAINER */}
        <main className="flex-1 p-5 overflow-y-auto max-h-full">

          {/* TAB 1: THE CLINIC OPERATIONS FLOW INDEX / DASHBOARD */}
          {activeTab === 'consultation' && userRole === 'doctor' && (
            <DoctorDashboardModule
              doctorQueue={doctorQueue}
              completedVisits={completedVisits}
              patientsMap={patientsMap}
              activeLanguage={activeLanguage}
              activeConsultationVisitId={activeConsultationVisitId}
              setActiveConsultationVisitId={setActiveConsultationVisitId}
              onConsultationComplete={handleDoctorSoapSubmit}
            />
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-5 animate-fadeIn">

              {/* Promo Banner */}
              <div className="bg-gradient-to-r from-[#07B2B2] to-emerald-800 text-white p-5 rounded-2xl relative shadow-md">
                <div className="max-w-xl space-y-2 relative z-10">
                  <span className="bg-emerald-300 text-[#07B2B2] text-[9px] font-extrabold uppercase px-2.5 py-0.7 rounded font-sans tracking-wider inline-block">
                    Malaysian Clinic Operator Suite
                  </span>
                  <h2 className="text-lg md:text-xl font-bold tracking-tight leading-none uppercase">
                    Welcome to MediClinic Enterprise PWA
                  </h2>
                  <p className="text-xs text-emerald-100 leading-relaxed font-sans font-medium">
                    Fully featured Malaysian clinical operations workspace featuring biometric simulated registries (MyKad OCR), SOAP chronic records timeline managers, prescription allergy cross-check, panel splits calculations, and MOH infectious analytics report portals.
                  </p>
                </div>
                {/* Background visual asset overlay */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white opacity-20 hidden md:block">
                  <Stethoscope className="w-24 h-24 stroke-1" />
                </div>
              </div>

              {/* Clinic Live Status Monitors and Telemetries */}
              <div id="live-queue-monitors" className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* 1. Medical Room Status Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[#07B2B2] font-bold text-[10px] uppercase tracking-wide">
                      Doctor Consulting Lounge
                    </span>
                    <strong className="text-xl font-extrabold text-slate-800 font-mono tracking-tight block">
                      {doctorQueue.length} PATIENTS
                    </strong>
                    <span className="text-slate-400 text-[10px] block">Awaiting medical consultation checkups</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    {userRole === 'doctor' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('dashboard')}
                        className="text-[#07B2B2] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Route to suite</span>
                        <ChevronRight className="w-4.5 h-4.5 text-emerald-600" />
                      </button>
                    ) : (
                      <span className="text-slate-400">Doctor Access Only</span>
                    )}
                  </div>
                </div>

                {/* 2. Pharmacy Desk Status Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-orange-700 font-bold text-[10px] uppercase tracking-wide">
                      Compounding Dispensary
                    </span>
                    <strong className="text-xl font-extrabold text-[#d97706] font-mono tracking-tight block">
                      {pharmacyQueue.length} TICKETS
                    </strong>
                    <span className="text-slate-400 text-[10px] block">Awaiting drug labels printing & checkouts</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-700">
                    {userRole === 'pharmacist' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('dispensary')}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Route to Dispensary</span>
                        <ChevronRight className="w-4.5 h-4.5 text-orange-500" />
                      </button>
                    ) : (
                      <span className="text-slate-400">Pharmacist Access Only</span>
                    )}
                  </div>
                </div>

                {/* 3. Cashier desk balance ledger */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-blue-700 font-bold text-[10px] uppercase tracking-wide">
                      Cashier Billing desk
                    </span>
                    <strong className="text-xl font-extrabold text-blue-800 font-mono tracking-tight block">
                      {cashierQueue.length} ISSUED
                    </strong>
                    <span className="text-slate-400 text-[10px] block">SST and panel claim calculations pending</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-800">
                    {userRole === 'clerk' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('billing')}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Route to Billing Desk</span>
                        <ChevronRight className="w-4.5 h-4.5 text-blue-400" />
                      </button>
                    ) : (
                      <span className="text-slate-400">Clerk Access Only</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Dynamic instruction wizard workflow */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h4 className="text-slate-700 font-bold text-xs uppercase tracking-wider mb-4 border-b pb-2">
                  Integrated End-to-End Clinic Simulation Flow
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">

                  <div className="p-3 bg-cyan-50/50 rounded-lg border border-cyan-600/10 hover:shadow-2xs transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-[#07B2B2] text-white flex items-center justify-center font-bold mb-2 font-mono">
                      1
                    </div>
                    <strong className="block text-[#07B2B2] mb-1">Biometric Registration</strong>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Go to **Patient Registration**, click **&apos;Scan MyKad&apos;** to simulate Malaysian biometric chip capture, verify inputs, and dispatch patient immediately inside doctors queue.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/20 rounded-lg border border-rose-500/10 hover:shadow-2xs transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold mb-2 font-mono">
                      2
                    </div>
                    <strong className="block text-rose-800 mb-1">Clinical SOAP Consultation</strong>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      The outpatient appears in **Doctor Suite**. Examine vitals, search ICD-10 diagnostic library, prescribe drugs, view longitudinal patient history timelines, and print approved MCs.
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50/20 rounded-lg border border-orange-500/10 hover:shadow-2xs transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold mb-2 font-mono">
                      3
                    </div>
                    <strong className="block text-amber-800 mb-1">Pharmacy Dispensing</strong>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Approved Rxs flow to **Pharmacy**. Check drug labels, translate dosage into dual BM-EN dialects, verify visual pill capsule images, and write thermal sticky labels.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50/20 rounded-lg border border-blue-500/10 hover:shadow-2xs transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-1.5 font-mono">
                      4
                    </div>
                    <strong className="block text-blue-800 mb-1">Billing &amp; Panel Claims</strong>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Bill maps to **Billing**. Settle as client Self-pay (Cash/Debit/Touch &apos;n Go) or trigger TPA panel calculations with automated co-pay splits, rendering receipts instantly.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PATIENT REGISTRATION MODULE */}
          {activeTab === 'registration' && (
            <div className="space-y-5 animate-fadeIn">

              <div className="bg-white rounded-xl border border-slate-200 p-5">

                {/* Header elements */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                      <Users className="w-4 h-4 text-[#07B2B2]" />
                      {t.registerNew}
                    </h3>
                    <p className="text-[10px] text-slate-400">Malaysian demographic database validations integrated.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMyKadOpen(true);
                    }}
                    className="bg-[#07B2B2] hover:bg-[#058A8A] text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Globe className="w-4 h-4 text-white" />
                    {t.scanMyKad}
                  </button>
                </div>

                {/* Patient registration formulation sheet */}
                <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-sans">

                  {/* Row 1: Full name and IC num */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.fullName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="reg-patient-fullname"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        value={manualForm.fullName}
                        onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                        placeholder="MOHD HAFIZ BIN RAZALI"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.icNumber} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="reg-patient-ic"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        value={manualForm.icNumber}
                        onChange={(e) => setManualForm({ ...manualForm, icNumber: e.target.value })}
                        placeholder="YYMMDD-XX-XXXX"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Gender, DoB, and Phone number */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.gender}
                      </label>
                      <select
                        id="reg-patient-gender"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        value={manualForm.gender}
                        onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}
                      >
                        <option value="Male">Male / Lelaki</option>
                        <option value="Female">Female / Perempuan</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.dob}
                      </label>
                      <input
                        type="date"
                        id="reg-patient-dob"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        value={manualForm.dob}
                        onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.phone} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="reg-patient-phone"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                        value={manualForm.phone}
                        onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                        placeholder="012-3456789"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Residential address */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600 uppercase tracking-tight">
                      {t.address}
                    </label>
                    <input
                      type="text"
                      id="reg-patient-address"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                      value={manualForm.address}
                      onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                      placeholder="Enter patient full residential address in Malaysia..."
                    />
                  </div>

                  {/* Row 4: Panel employer and allergies multi-tag triggers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Panel Search Dropdown (emulates AntD select) */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.panelEmployer}
                      </label>
                      <select
                        id="reg-patient-panel"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-cyan-600 focus:outline-none"
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
                    </div>

                    {/* Drug allergies builder tags */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600 uppercase tracking-tight">
                        {t.drugAllergies}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="manual-allergy-input"
                          className="flex-1 border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-cyan-600 focus:outline-none text-xs"
                          value={allergyInput}
                          onChange={(e) => setAllergyInput(e.target.value)}
                          placeholder="e.g. Penicillin, Aspirin, Sulfa, NSAID"
                        />
                        <button
                          type="button"
                          id="add-allergy-btn"
                          onClick={handleAddAllergyTag}
                          className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                        >
                          Add Alert
                        </button>
                      </div>

                      {/* Displaying tags in red */}
                      {allergiesList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {allergiesList.map((allergy, i) => (
                            <span
                              key={i}
                              className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-1.5"
                            >
                              <span>{allergy}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAllergyTag(i)}
                                className="text-red-500 hover:text-red-800 font-extrabold cursor-pointer"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Actions bar submission */}
                  <div className="border-t border-slate-100 pt-4 mt-5 text-right">
                    <button
                      type="submit"
                      id="save-registration-btn"
                      className="bg-[#07B2B2] hover:bg-[#058A8A] text-white font-bold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-2 cursor-pointer shadow-sm focus:ring-2 focus:ring-cyan-600"
                    >
                      <UserCheck className="w-4 h-4 text-white" />
                      {t.saveRegistration}
                    </button>
                  </div>

                </form>

              </div>

            </div>
          )}

          {/* TAB 4: PHARMACY DISPENSARY DASHBOARD */}
          {activeTab === 'dispensary' && (
            <div className="space-y-4 animate-fadeIn">
              <DispensaryDashboard
                queue={pharmacyQueue}
                patientsMap={patientsMap}
                activeLanguage={activeLanguage}
                onDispenseSubmit={handleDispenseVerified}
              />
            </div>
          )}

          {/* TAB 5: BILLING DESK CLAIM LEDGER */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-fadeIn">
              <BillingDesk
                queue={cashierQueue}
                patientsMap={patientsMap}
                activeLanguage={activeLanguage}
                onPaymentComplete={handleBillingSettled}
              />
            </div>
          )}

        </main>

      </div>

      {/* GLOBAL SIMULATED MYKAD MODAL SCREEN POPUP */}
      {isMyKadOpen && (
        <MyKadScanner
          onScanComplete={handleMyKadComplete}
          onClose={() => setIsMyKadOpen(false)}
        />
      )}

      {/* GLOBAL VOICE AI / NLP ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="bg-[#07B2B2] hover:bg-[#058A8A] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 relative group cursor-pointer border-4 border-white"
          title="Voice AI Command"
        >
          <div className="absolute inset-0 bg-[#07B2B2] rounded-full animate-ping opacity-20"></div>
          <Mic className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
