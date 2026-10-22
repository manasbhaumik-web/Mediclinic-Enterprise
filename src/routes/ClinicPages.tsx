/**
 * Thin route adapters: each reads the shared shell context and renders one feature module.
 * Feature modules stay prop-driven; routing and data wiring stay here.
 */
import React from 'react';
import { useNavigate } from 'react-router';
import { useClinicShell } from './ClinicShell';

const DoctorDashboardModule = React.lazy(() => import('../components/DoctorDashboardModule'));
const LandingDashboard = React.lazy(() => import('../components/LandingDashboard'));
const PatientRegistrationModule = React.lazy(() => import('../components/PatientRegistrationModule'));
const TriageModule = React.lazy(() => import('../components/TriageModule'));
const AppointmentCalendarModule = React.lazy(() => import('../components/AppointmentCalendarModule'));
const DispensaryDashboard = React.lazy(() => import('../components/DispensaryDashboard'));
const BillingDesk = React.lazy(() => import('../components/BillingDesk'));
const MyLeave = React.lazy(() => import('../components/leave/MyLeave'));

export function MyLeavePage() {
  return <MyLeave />;
}

const InventoryPageLazy = React.lazy(() => import('../components/inventory/InventoryPage'));

/** Pharmacists manage stock here; administrators reach the same screen from the admin console. */
export function InventoryRoutePage() {
  return <InventoryPageLazy role="pharmacist" />;
}

type DoctorTab = 'queue' | 'consultation' | 'reports';

export function DoctorPage({ tab }: { tab: DoctorTab }) {
  const s = useClinicShell();
  return (
    <DoctorDashboardModule
      doctorTab={tab}
      onTabChange={(t) => s.navigateTab(t)}
      doctorQueue={s.queues.doctor}
      patientsMap={s.patientsMap}
      activeLanguage={s.activeLanguage}
      activeConsultationVisitId={s.activeConsultationVisitId}
      setActiveConsultationVisitId={s.setActiveConsultationVisitId}
      onConsultationComplete={s.onConsultationComplete}
      doctorName={s.userName}
    />
  );
}

export function DashboardPage() {
  const s = useClinicShell();
  const navigate = useNavigate();
  return (
    <LandingDashboard
      userRole={s.role}
      userName={s.userName}
      triageQueue={s.queues.triage}
      doctorQueue={s.queues.doctor}
      pharmacyQueue={s.queues.pharmacy}
      cashierQueue={s.queues.cashier}
      completedVisits={s.completedVisits}
      patientsList={s.patientsList}
      activeLanguage={s.activeLanguage}
      onNavigateTab={s.navigateTab}
      onOpenLogin={() => navigate('/login')}
      onOpenAdmin={() => navigate('/admin')}
    />
  );
}

export function RegistrationPage() {
  const s = useClinicShell();
  return (
    <PatientRegistrationModule
      t={s.t}
      activeLanguage={s.activeLanguage}
      searchPatients={s.searchPatients}
      totalPatientCount={s.patientsList.length}
      triageQueue={s.queues.triage}
      patientsMap={s.patientsMap}
      addPatientToDb={s.addPatientToDb}
      addVisitToDb={s.addVisitToDb}
      updateVisitInDb={s.updateVisitInDb}
      onNavigateTab={s.navigateTab}
    />
  );
}

export function TriagePage() {
  const s = useClinicShell();
  return (
    <TriageModule
      triageQueue={s.queues.triage}
      patientsMap={s.patientsMap}
      onTriageComplete={s.onTriageComplete}
    />
  );
}

export function AppointmentsPage() {
  const s = useClinicShell();
  return (
    <AppointmentCalendarModule
      appointments={s.appointments}
      patientsList={s.patientsList}
      addAppointment={s.addAppointment}
      updateAppointment={s.updateAppointment}
    />
  );
}

export function DispensaryPage() {
  const s = useClinicShell();
  return (
    <DispensaryDashboard
      queue={s.queues.pharmacy}
      patientsMap={s.patientsMap}
      activeLanguage={s.activeLanguage}
      onDispenseSubmit={s.onDispenseVerified}
      pharmacistName={s.userName}
    />
  );
}

export function BillingPage() {
  const s = useClinicShell();
  return (
    <BillingDesk
      queue={s.queues.cashier}
      patientsMap={s.patientsMap}
      activeLanguage={s.activeLanguage}
      onPaymentComplete={s.onBillingSettled}
    />
  );
}
