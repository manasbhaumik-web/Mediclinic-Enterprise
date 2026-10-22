import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import { Appointment, Language, Patient, SOAPNotes, UserRole, VitalSigns, Visit } from '../types';
import { useAuth } from '../context/AuthContext';
import { useFinancials } from '../context/FinancialContext';
import { useLanguage } from '../context/LanguageContext';
import { useClinicData, useClinicRealtime } from '../hooks/useClinicData';
import {
  PaymentInfo, completeConsultation, completeDispensing, completeTriage, settlePayment, splitQueues,
} from '../domain/visitWorkflow';
import EnterpriseLayoutTemplate from '../components/EnterpriseLayoutTemplate';
import GlobalSpinner from '../components/ui/GlobalSpinner';
import { enqueueIntegration } from '../lib/integrationQueue';
import { recordEInvoice } from '../lib/einvoiceQueue';
import { tabPath } from './permissions';

type ClinicData = ReturnType<typeof useClinicData>;

/** Everything a page under /app needs; provided to child routes through <Outlet context>. */
export interface ClinicShellContext {
  role: UserRole;
  userName: string;
  activeLanguage: Language;
  t: ReturnType<typeof useLanguage>['t'];
  patientsList: Patient[];
  patientsMap: Record<string, Patient>;
  completedVisits: Visit[];
  queues: ReturnType<typeof splitQueues>;
  appointments: Appointment[];
  activeConsultationVisitId: string | null;
  setActiveConsultationVisitId: (id: string | null) => void;
  navigateTab: (tab: string) => void;
  searchPatients: ClinicData['searchPatients'];
  addPatientToDb: ClinicData['addPatientToDb'];
  addVisitToDb: ClinicData['addVisitToDb'];
  updateVisitInDb: ClinicData['updateVisitInDb'];
  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onTriageComplete: (visitId: string, vitals: Partial<VitalSigns>, chiefComplaint: string) => void;
  onConsultationComplete: (soap: SOAPNotes, issueMc: boolean, mcDuration: number) => void;
  onDispenseVerified: (visitId: string) => void;
  onBillingSettled: (visitId: string, payInfo: PaymentInfo) => void;
}

export const useClinicShell = () => useOutletContext<ClinicShellContext>();

export default function ClinicShell() {
  const { user, role, fullName, showPII, setShowPII, signOut } = useAuth();
  const { recordTransaction } = useFinancials();
  const { activeLanguage, setActiveLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useClinicRealtime();
  const data = useClinicData();
  const { visitsQueue, patientsList, appointments, completedVisits, updateVisitInDb } = data;

  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  // Follow the browser's real connection.
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);
  const [activeConsultationVisitId, setActiveConsultationVisitId] = useState<string | null>(null);

  const activeTab = location.pathname.split('/')[2] ?? 'dashboard';
  const navigateTab = useCallback((tab: string) => navigate(tabPath(tab)), [navigate]);

  const queues = useMemo(() => splitQueues(visitsQueue), [visitsQueue]);
  const patientsMap = useMemo(
    () => patientsList.reduce<Record<string, Patient>>((acc, p) => { acc[p.id] = p; return acc; }, {}),
    [patientsList],
  );

  const findVisit = (id: string) => visitsQueue.find((v) => v.id === id);

  const userName = (() => {
    if (fullName) return fullName;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name as string;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  })();

  const handleSignOut = async () => {
    await signOut();
    // Drop cached patient data so the next user on this browser cannot see it.
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const ctx: ClinicShellContext = {
    role: role as UserRole,
    userName,
    activeLanguage,
    t,
    patientsList,
    patientsMap,
    completedVisits,
    queues,
    appointments,
    activeConsultationVisitId,
    setActiveConsultationVisitId,
    navigateTab,
    searchPatients: data.searchPatients,
    addPatientToDb: data.addPatientToDb,
    addVisitToDb: data.addVisitToDb,
    updateVisitInDb,
    addAppointment: async (app) => {
      await data.addAppointmentToDb({ ...app, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    },
    updateAppointment: async (id, updates) => {
      const existing = appointments.find((a) => a.id === id);
      if (existing) await data.updateAppointmentInDb({ ...existing, ...updates });
    },
    onTriageComplete: (visitId, vitals, chiefComplaint) => {
      const visit = findVisit(visitId);
      if (visit) updateVisitInDb(completeTriage(visit, vitals, chiefComplaint));
    },
    onConsultationComplete: (soap, issueMc) => {
      const visit = activeConsultationVisitId ? findVisit(activeConsultationVisitId) : undefined;
      if (visit) {
        // Queue the external hand-off only once the note is saved; the worker reads it from the database.
        void updateVisitInDb(completeConsultation(visit, soap, issueMc)).then((saved) => {
          if (saved) void enqueueIntegration('fhir', 'consultation.completed', 'visit', visit.id);
        });
      }
      setActiveConsultationVisitId(null);
      navigateTab('dashboard');
    },
    onDispenseVerified: (visitId) => {
      const visit = findVisit(visitId);
      if (visit) updateVisitInDb(completeDispensing(visit));
      navigateTab('dashboard');
    },
    onBillingSettled: (visitId, payInfo) => {
      const visit = findVisit(visitId);
      if (!visit) return;
      recordTransaction({
        patientId: visit.patientId,
        visitId,
        paymentMethod: payInfo.paymentMethod,
        paidAmount: payInfo.paidAmount,
        panelClaimed: payInfo.panelClaimed,
        glNumber: payInfo.glNumber,
      });
      void updateVisitInDb(settlePayment(visit, payInfo)).then((saved) => {
        // Raise the e-invoice only once the payment is saved; an admin controls submission to LHDN.
        if (saved && payInfo.invoice) void recordEInvoice(visitId, payInfo.invoice, payInfo.eInvoiceBuyer ?? { type: 'general_public' });
      });
      navigateTab('dashboard');
    },
  };

  return (
    <>
      {whatsappToast && (
        <div className="fixed top-20 right-8 z-[100] bg-emerald-500 text-white px-4 py-3 rounded-none shadow-xl flex items-center justify-center gap-3">
          <MessageCircle className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">WhatsApp Sent</p>
            <p className="text-xs text-emerald-100">{whatsappToast}</p>
          </div>
          <button onClick={() => setWhatsappToast(null)} className="ml-4 hover:text-emerald-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <EnterpriseLayoutTemplate
        activeTab={activeTab}
        setActiveTab={navigateTab}
        userName={userName}
        userRole={role ?? 'doctor'}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        showPII={showPII}
        setShowPII={setShowPII}
        activeLanguage={activeLanguage}
        setActiveLanguage={(lang) => setActiveLanguage(lang as Language)}
        onSignOut={handleSignOut}
        onOpenAdmin={() => navigate('/admin')}
        t={t}
        triageQueueLength={queues.triage.length}
        doctorQueueLength={queues.doctor.length}
        pharmacyQueueLength={queues.pharmacy.length}
        cashierQueueLength={queues.cashier.length}
      >
        <Suspense fallback={<GlobalSpinner />}>
          <Outlet context={ctx} />
        </Suspense>
      </EnterpriseLayoutTemplate>
    </>
  );
}
