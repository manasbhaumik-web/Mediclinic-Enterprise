import React from 'react';
import { Activity, History, Clock } from 'lucide-react';
import { buttonProps, focusRing } from '../../../lib/a11y';
import { Visit } from '../../../types';

interface ContextPanelProps {
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number; };
  t: { dashboard: string; patientRegistration: string; consultation: string; dispensary: string; billing: string; reports: string; networkStatus: string; bmToggle: string; enToggle: string; clinicName: string; online: string; offline: string; scanMyKad: string; registerNew: string; fullName: string; icNumber: string; gender: string; dob: string; address: string; phone: string; panelEmployer: string; drugAllergies: string; saveRegistration: string; male: string; female: string; activeAllergies: string; searchPatient: string; queueNo: string; patientQueue: string; longitudinalHistory: string; pastVisits: string; consultationRoom: string; subjective: string; objective: string; assessment: string; plan: string; vitalsSign: string; systolic: string; diastolic: string; pulse: string; temp: string; respRate: string; icd10Search: string; symptomsNotes: string; generateMc: string; mcDays: string; drugSearch: string; interactionAlert: string; dispensaryQueue: string; prescribedMeds: string; visualVerify: string; dosageInstruction: string; expiryWarnings: string; printLabel: string; totalBilling: string; selfPay: string; panelClaims: string; tpaSelect: string; glRef: string; proceedPayment: string; paymentDone: string; complianceText: string; nationalReporting: string; revenueToday: string; patientsToday: string; pendingClaims: string; lowStock: string; patientByHour: string; icdDistribution: string; } | { dashboard: string; patientRegistration: string; consultation: string; dispensary: string; billing: string; reports: string; networkStatus: string; bmToggle: string; enToggle: string; clinicName: string; online: string; offline: string; scanMyKad: string; registerNew: string; fullName: string; icNumber: string; gender: string; dob: string; address: string; phone: string; panelEmployer: string; drugAllergies: string; saveRegistration: string; male: string; female: string; activeAllergies: string; searchPatient: string; queueNo: string; patientQueue: string; longitudinalHistory: string; pastVisits: string; consultationRoom: string; subjective: string; objective: string; assessment: string; plan: string; vitalsSign: string; systolic: string; diastolic: string; pulse: string; temp: string; respRate: string; icd10Search: string; symptomsNotes: string; generateMc: string; mcDays: string; drugSearch: string; interactionAlert: string; dispensaryQueue: string; prescribedMeds: string; visualVerify: string; dosageInstruction: string; expiryWarnings: string; printLabel: string; totalBilling: string; selfPay: string; panelClaims: string; tpaSelect: string; glRef: string; proceedPayment: string; paymentDone: string; complianceText: string; nationalReporting: string; revenueToday: string; patientsToday: string; pendingClaims: string; lowStock: string; patientByHour: string; icdDistribution: string; };
  patientPastVisits: Visit[];
  selectedPastVisit: Visit | null;
  setSelectedPastVisit: React.Dispatch<React.SetStateAction<Visit | null>>;
  stationHud?: React.ReactNode;
}

export default function ContextPanel({ vitals, t, patientPastVisits, selectedPastVisit, setSelectedPastVisit, stationHud }: ContextPanelProps) {
  return (
    <div className="w-full space-y-4">
      
      {/* Contextual Recent Vitals Card */}
      <div className="bg-surface p-4 rounded-none border border-line space-y-2.5">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h3 className="type-label text-ink flex items-center gap-1.5 font-bold">
            <Activity className="w-4 h-4 text-accent" />
            Vitals for this visit
          </h3>
          <span className="text-2xs text-subtle font-mono">Blank = unrecorded</span>
        </div>
    
        <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
          <div className="bg-surface-muted p-2 border border-line">
            <span className="text-2xs text-subtle block font-sans">BP</span>
            <strong className="text-ink dark:text-white">{vitals.bpSystolic > 0 ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : 'Not recorded'}</strong>
          </div>
          <div className="bg-surface-muted p-2 border border-line">
            <span className="text-2xs text-subtle block font-sans">Heart Rate</span>
            <strong className="text-ink dark:text-white">{vitals.heartRate > 0 ? `${vitals.heartRate} bpm` : 'Not recorded'}</strong>
          </div>
          <div className="bg-surface-muted p-2 border border-line">
            <span className="text-2xs text-subtle block font-sans">Temperature</span>
            <strong className="text-ink dark:text-white">{vitals.temperature > 0 ? `${vitals.temperature}°C` : 'Not recorded'}</strong>
          </div>
          <div className="bg-surface-muted p-2 border border-line">
            <span className="text-2xs text-subtle block font-sans">Resp. Rate</span>
            <strong className="text-ink dark:text-white">{vitals.respiratoryRate > 0 ? `${vitals.respiratoryRate} /min` : 'Not recorded'}</strong>
          </div>
        </div>
      </div>
    
      {/* Longitudinal Clinical History Timeline */}
      <div className="bg-surface p-4 rounded-none border border-line space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h3 className="type-label text-ink flex items-center gap-1.5 font-bold">
            <History className="w-4 h-4 text-accent" />
            {t.longitudinalHistory}
          </h3>
          <span className="bg-surface-accent text-accent border border-line px-2 py-0.5 rounded-none text-2xs font-mono tabular-nums font-bold">
            {patientPastVisits.length} Visits
          </span>
        </div>
    
        {patientPastVisits.length === 0 ? (
          <div className="p-6 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-accent opacity-50 mb-2" />
            <span className="text-xs text-ink dark:text-slate-300 font-bold">First Outpatient Encounter</span>
            <span className="text-2xs text-subtle mt-0.5">This session initiates the master clinical EHR timeline.</span>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
            {patientPastVisits.map((visit) => {
              const isSelected = selectedPastVisit?.id === visit.id;
              return (
                <div
                  key={visit.id}
                  {...buttonProps(() => setSelectedPastVisit(isSelected ? null : visit), isSelected)}
                  className={`p-3 rounded-none border transition-all text-left cursor-pointer ${focusRing} hover:bg-surface-muted dark:hover:bg-night-800 bg-surface-muted ${
                    isSelected 
                      ? 'border-brand dark:border-teal-400 bg-surface-accent' 
                      : 'border-line hover:border-l-primary'
                  }`}
                >
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-mono tabular-nums font-bold text-muted dark:text-slate-300">{visit.date}</span>
                    <span className="text-accent bg-surface-accent dark:bg-teal-950 border border-line font-bold font-mono text-2xs px-1.5 py-0.5 rounded-none">
                      {visit.soap.assessment.icdCode}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-ink truncate mt-1">
                    {visit.soap.assessment.description}
                  </p>
                  <p className="text-2xs text-subtle dark:text-slate-400 line-clamp-2 mt-0.5">
                    S: {visit.soap.subjective}
                  </p>
    
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-line text-2xs space-y-1.5 text-muted dark:text-slate-300 animate-fadeIn">
                      <div className="font-mono tabular-nums"><strong>Objective:</strong> BP {visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} mmHg.</div>
                      <div><strong>Notes:</strong> {visit.soap.assessment.clinicalNotes}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consultation Station & Queue Telemetry Widget (Under Longitudinal History) */}
      {stationHud && (
        <div className="bg-surface p-4 rounded-none border border-line shadow-none">
          {stationHud}
        </div>
      )}
    
    </div>
  );
}
