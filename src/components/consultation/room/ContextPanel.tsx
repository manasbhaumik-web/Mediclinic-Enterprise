import { Activity, Brain, History, Clock } from 'lucide-react';
import { buttonProps, focusRing } from '../../../lib/a11y';
import { ICD10Code, Visit } from '../../../types';

interface ContextPanelProps {
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number; };
  aiDraftDismissed: boolean;
  setSelectedICD: React.Dispatch<React.SetStateAction<ICD10Code>>;
  setAiDraftAccepted: React.Dispatch<React.SetStateAction<boolean>>;
  aiDraftAccepted: boolean;
  setAiDraftDismissed: React.Dispatch<React.SetStateAction<boolean>>;
  t: { dashboard: string; patientRegistration: string; consultation: string; dispensary: string; billing: string; reports: string; networkStatus: string; bmToggle: string; enToggle: string; clinicName: string; online: string; offline: string; scanMyKad: string; registerNew: string; fullName: string; icNumber: string; gender: string; dob: string; address: string; phone: string; panelEmployer: string; drugAllergies: string; saveRegistration: string; male: string; female: string; activeAllergies: string; searchPatient: string; queueNo: string; patientQueue: string; longitudinalHistory: string; pastVisits: string; consultationRoom: string; subjective: string; objective: string; assessment: string; plan: string; vitalsSign: string; systolic: string; diastolic: string; pulse: string; temp: string; respRate: string; icd10Search: string; symptomsNotes: string; generateMc: string; mcDays: string; drugSearch: string; interactionAlert: string; dispensaryQueue: string; prescribedMeds: string; visualVerify: string; dosageInstruction: string; expiryWarnings: string; printLabel: string; totalBilling: string; selfPay: string; panelClaims: string; tpaSelect: string; glRef: string; proceedPayment: string; paymentDone: string; complianceText: string; nationalReporting: string; revenueToday: string; patientsToday: string; pendingClaims: string; lowStock: string; patientByHour: string; icdDistribution: string; } | { dashboard: string; patientRegistration: string; consultation: string; dispensary: string; billing: string; reports: string; networkStatus: string; bmToggle: string; enToggle: string; clinicName: string; online: string; offline: string; scanMyKad: string; registerNew: string; fullName: string; icNumber: string; gender: string; dob: string; address: string; phone: string; panelEmployer: string; drugAllergies: string; saveRegistration: string; male: string; female: string; activeAllergies: string; searchPatient: string; queueNo: string; patientQueue: string; longitudinalHistory: string; pastVisits: string; consultationRoom: string; subjective: string; objective: string; assessment: string; plan: string; vitalsSign: string; systolic: string; diastolic: string; pulse: string; temp: string; respRate: string; icd10Search: string; symptomsNotes: string; generateMc: string; mcDays: string; drugSearch: string; interactionAlert: string; dispensaryQueue: string; prescribedMeds: string; visualVerify: string; dosageInstruction: string; expiryWarnings: string; printLabel: string; totalBilling: string; selfPay: string; panelClaims: string; tpaSelect: string; glRef: string; proceedPayment: string; paymentDone: string; complianceText: string; nationalReporting: string; revenueToday: string; patientsToday: string; pendingClaims: string; lowStock: string; patientByHour: string; icdDistribution: string; };
  patientPastVisits: Visit[];
  selectedPastVisit: Visit;
  setSelectedPastVisit: React.Dispatch<React.SetStateAction<Visit>>;
}

export default function ContextPanel({ vitals, aiDraftDismissed, setSelectedICD, setAiDraftAccepted, aiDraftAccepted, setAiDraftDismissed, t, patientPastVisits, selectedPastVisit, setSelectedPastVisit }: ContextPanelProps) {
  return (
    <div className="lg:col-span-4 space-y-4">
      
      {/* Contextual Recent Vitals Card */}
      <div className="bg-surface dark:bg-night-900 p-4 rounded-none border border-line-subtle dark:border-teal-800/40 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-line-subtle dark:border-teal-800/40 pb-2">
          <h3 className="type-label text-ink dark:text-teal-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-accent" />
            Recent Outpatient Vitals
          </h3>
          <span className="text-2xs text-slate-500 font-mono">Triage Recorded</span>
        </div>
    
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-surface-muted dark:bg-night-850 p-2 border border-line dark:border-teal-800/40">
            <span className="text-2xs text-slate-500 block font-sans">BP</span>
            <strong className="text-ink dark:text-white">{vitals.bpSystolic}/{vitals.bpDiastolic} mmHg</strong>
          </div>
          <div className="bg-surface-muted dark:bg-night-850 p-2 border border-line dark:border-teal-800/40">
            <span className="text-2xs text-slate-500 block font-sans">Heart Rate</span>
            <strong className="text-ink dark:text-white">{vitals.heartRate} bpm</strong>
          </div>
          <div className="bg-surface-muted dark:bg-night-850 p-2 border border-line dark:border-teal-800/40">
            <span className="text-2xs text-slate-500 block font-sans">Temperature</span>
            <strong className="text-ink dark:text-white">{vitals.temperature}°C</strong>
          </div>
          <div className="bg-surface-muted dark:bg-night-850 p-2 border border-line dark:border-teal-800/40">
            <span className="text-2xs text-slate-500 block font-sans">Resp. Rate</span>
            <strong className="text-ink dark:text-white">{vitals.respiratoryRate} bpm</strong>
          </div>
        </div>
      </div>
    
      {/* Contextual AI Decision Support Draft Card */}
      <div className="bg-surface dark:bg-night-900 p-4 rounded-none border border-line-subtle dark:border-teal-800/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-line-subtle dark:border-teal-800/40 pb-2">
          <h3 className="type-label text-ink dark:text-teal-300 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-accent" />
            AI Decision Support
          </h3>
          <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-none text-2xs font-bold font-mono">
            Draft — Not a Diagnosis
          </span>
        </div>
    
        {!aiDraftDismissed ? (
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <p className="leading-relaxed">
              Based on symptoms and prior gastritis history, AI suggests considering <strong className="text-accent dark:text-teal-300">ICD-10 K29.7 (Gastritis, unspecified)</strong> or <strong className="text-accent dark:text-teal-300">K21.9 (GERD)</strong>.
            </p>
    
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedICD({ code: 'K29.7', desc: 'Gastritis, unspecified', category: 'Digestive' });
                  setAiDraftAccepted(true);
                }}
                className="flex-1 bg-primary text-white py-1 rounded-none text-2xs font-bold hover:bg-primary-hover cursor-pointer"
              >
                {aiDraftAccepted ? '✓ Accepted' : 'Accept K29.7'}
              </button>
    
              <button
                type="button"
                onClick={() => setAiDraftDismissed(true)}
                className="px-2.5 bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border border-line dark:border-teal-800/40 py-1 rounded-none text-2xs font-bold hover:bg-surface-strong cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="text-2xs text-slate-400 italic">
            AI draft suggestion dismissed by clinician.
          </div>
        )}
      </div>
    
      {/* Longitudinal Clinical History Timeline */}
      <div className="bg-surface dark:bg-night-900 p-4 rounded-none border border-line-subtle dark:border-teal-800/40 shadow-xs space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-line-subtle dark:border-teal-800/40 pb-2">
          <h3 className="type-label text-ink dark:text-teal-300 flex items-center gap-1.5">
            <History className="w-4 h-4 text-accent" />
            {t.longitudinalHistory}
          </h3>
          <span className="bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none text-2xs font-mono font-bold">
            {patientPastVisits.length} Visits
          </span>
        </div>
    
        {patientPastVisits.length === 0 ? (
          <div className="p-6 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-accent opacity-50 mb-2" />
            <span className="text-xs text-ink dark:text-slate-300 font-bold">First Outpatient Encounter</span>
            <span className="text-2xs text-slate-500 mt-0.5">This session initiates the master clinical EHR timeline.</span>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
            {patientPastVisits.map((visit) => {
              const isSelected = selectedPastVisit?.id === visit.id;
              return (
                <div
                  key={visit.id}
                  {...buttonProps(() => setSelectedPastVisit(isSelected ? null : visit), isSelected)}
                  className={`p-3 rounded-none border transition-all text-left cursor-pointer ${focusRing} hover:bg-surface-muted dark:hover:bg-night-800 bg-surface-muted dark:bg-night-850 ${
                    isSelected 
                      ? 'border-brand dark:border-teal-400 bg-surface-accent dark:bg-night-800 shadow-xs' 
                      : 'border-line-subtle dark:border-teal-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{visit.date}</span>
                    <span className="text-accent dark:text-teal-300 bg-surface-accent dark:bg-teal-950 border border-line dark:border-teal-800/50 font-bold text-2xs px-1.5 py-0.5 rounded-none">
                      {visit.soap.assessment.icdCode}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-ink dark:text-teal-300 truncate mt-1">
                    {visit.soap.assessment.description}
                  </p>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    S: {visit.soap.subjective}
                  </p>
    
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-teal-800/40 text-2xs space-y-1.5 text-slate-700 dark:text-slate-300 animate-fadeIn">
                      <div><strong>Objective:</strong> BP {visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} mmHg.</div>
                      <div><strong>Notes:</strong> {visit.soap.assessment.clinicalNotes}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    
    </div>
  );
}
