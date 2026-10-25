/**
 * Thin route adapters: each reads the shared shell context and renders one feature module.
 * Feature modules stay prop-driven; routing and data wiring stay here.
 */
import React from 'react';
import { useNavigate } from 'react-router';
import { useClinicShell } from './ClinicShell';

import LandingDashboard from '../features/dashboard/LandingDashboard';
const DoctorDashboardModule = React.lazy(() => import('../features/doctor/DoctorDashboardModule'));
const PatientRegistrationModule = React.lazy(() => import('../features/registration/PatientRegistrationModule'));
const TriageModule = React.lazy(() => import('../features/triage/TriageModule'));
const AppointmentCalendarModule = React.lazy(() => import('../features/appointments/AppointmentCalendarModule'));
const DispensaryDashboard = React.lazy(() => import('../features/pharmacy/DispensaryDashboard'));
const BillingDesk = React.lazy(() => import('../features/billing/BillingDesk'));
const MyLeave = React.lazy(() => import('../features/leave/MyLeave'));

export function MyLeavePage() {
  return <MyLeave />;
}

const InventoryPageLazy = React.lazy(() => import('../features/inventory/InventoryPage'));

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
      userId={s.userId}
      onCallPatient={s.onCallPatient}
      onReleasePatient={s.onReleasePatient}
    />
  );
}

export function DashboardPage() {
  const s = useClinicShell();
  const navigate = useNavigate();
  return (
    <LandingDashboard
      userRole={s.role}
      roles={s.roles}
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
      patientsList={s.patientsList}
      triageQueue={s.queues.triage}
      patientsMap={s.patientsMap}
      addPatientToDb={s.addPatientToDb}
      addVisitToDb={s.addVisitToDb}
      updateVisitInDb={s.updateVisitInDb}
      assignDoctor={s.assignDoctor}
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
      checkInAppointment={s.checkInAppointment}
      userRole={s.role}
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
