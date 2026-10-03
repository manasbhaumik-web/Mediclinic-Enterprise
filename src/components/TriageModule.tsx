import React, { useState } from 'react';
import { Patient, Visit } from '../types';
import { Users, Clock, Activity, CheckCircle2, Stethoscope, FileText, ArrowRight } from 'lucide-react';
import { maskICNumber } from '../utils/piiMasker';
import Button from './ui/Button';
import Input from './ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';

interface TriageModuleProps {
  triageQueue: Visit[];
  patientsMap: Record<string, Patient>;
  onTriageComplete: (visitId: string, vitals: any, chiefComplaint: string) => void;
}

export default function TriageModule({ triageQueue, patientsMap, onTriageComplete }: TriageModuleProps) {
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    chiefComplaint: ''
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeVisit = activeVisitId ? triageQueue.find(v => v.id === activeVisitId) : null;
  const activePatient = activeVisit ? patientsMap[activeVisit.patientId] : null;

  const handleSelectPatient = (visit: Visit) => {
    setActiveVisitId(visit.id);
    setVitalsForm({
      temperature: visit.soap?.objective?.temperature?.toString() || '',
      bpSystolic: visit.soap?.objective?.bpSystolic?.toString() || '',
      bpDiastolic: visit.soap?.objective?.bpDiastolic?.toString() || '',
      heartRate: visit.soap?.objective?.heartRate?.toString() || '',
      respiratoryRate: visit.soap?.objective?.respiratoryRate?.toString() || '',
      chiefComplaint: visit.soap?.subjective === 'Pending Triage' ? '' : (visit.soap?.subjective || '')
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisitId) return;

    const parsedVitals = {
      temperature: parseFloat(vitalsForm.temperature) || 36.6,
      bpSystolic: parseInt(vitalsForm.bpSystolic) || 120,
      bpDiastolic: parseInt(vitalsForm.bpDiastolic) || 80,
      heartRate: parseInt(vitalsForm.heartRate) || 72,
      respiratoryRate: parseInt(vitalsForm.respiratoryRate) || 16,
    };

    onTriageComplete(activeVisitId, parsedVitals, vitalsForm.chiefComplaint);
    
    showToast(`${activePatient?.fullName} triaged and sent to Doctor Queue.`);
    setActiveVisitId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn relative font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-white px-6 py-4 rounded-none shadow-2xl flex items-center justify-center gap-3 z-50 animate-slideUp border border-teal-400">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Queue */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col h-[calc(100vh-140px)] rounded-none border-line-subtle dark:border-teal-800/40">
            <CardHeader className="bg-surface-muted dark:bg-night-850 flex justify-between items-center py-4 border-b border-line-subtle dark:border-teal-800/40">
              <h3 className="type-heading-caps text-ink dark:text-teal-300 flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Awaiting Triage
              </h3>
              <span className="bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-400 border border-line dark:border-teal-800/40 text-xs font-mono font-bold px-2.5 py-0.5 rounded-none">
                {triageQueue.length}
              </span>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-surface dark:bg-night-900">
              {triageQueue.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto text-accent opacity-40 mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Triage Queue Empty</p>
                </div>
              ) : (
                triageQueue.map(visit => {
                  const pt = patientsMap[visit.patientId];
                  const isActive = activeVisitId === visit.id;
                  const waitTimeMs = Date.now() - (visit.registeredTime || Date.now());
                  const waitMins = Math.max(1, Math.floor(waitTimeMs / 60000));

                  return (
                    <button
                      key={visit.id}
                      onClick={() => handleSelectPatient(visit)}
                      className={`w-full text-left p-3.5 rounded-none border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                        isActive 
                          ? 'border-brand bg-surface-accent dark:bg-night-800 shadow-xs' 
                          : 'border-line-subtle dark:border-teal-800/40 bg-white dark:bg-night-800 hover:bg-surface-muted dark:hover:bg-night-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-sm text-ink dark:text-white truncate pr-2 uppercase">{pt?.fullName}</span>
                        <span className="text-2xs font-mono font-bold text-accent dark:text-teal-400 bg-surface-accent dark:bg-night-850 px-2 py-0.5 border border-line dark:border-teal-800/40 flex items-center justify-center gap-1 shrink-0 rounded-none">
                          <Clock className="w-3 h-3" /> {waitMins}m
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">IC: {maskICNumber(pt?.icNumber, true)}</div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL: Vitals Form */}
        <div className="lg:col-span-2">
          {activeVisit && activePatient ? (
            <Card className="h-[calc(100vh-140px)] flex flex-col rounded-none border-line-subtle dark:border-teal-800/40">
              <CardHeader className="bg-surface-muted dark:bg-night-850 flex items-center justify-between py-5 border-b border-line-subtle dark:border-teal-800/40">
                <div>
                  <h2 className="type-heading-caps text-ink dark:text-white">{activePatient.fullName}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">Age: {new Date().getFullYear() - new Date(activePatient.dob).getFullYear()} • IC: {activePatient.icNumber}</p>
                </div>
                <div className="bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-400 border border-line dark:border-teal-800/40 text-xs font-mono font-bold px-3 py-1 rounded-none flex items-center justify-center gap-1.5 uppercase">
                  <Activity className="w-3.5 h-3.5 text-accent" /> Triaging Active
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-6 bg-surface dark:bg-night-900">
                <form id="triage-form" onSubmit={handleSubmitTriage} className="space-y-6 max-w-2xl">
                  
                  <div className="space-y-3">
                    <h4 className="type-label text-ink dark:text-teal-300 border-b border-line-subtle dark:border-teal-800/40 pb-2 flex items-center justify-center gap-2">
                      <Stethoscope className="w-4 h-4 text-accent" /> Vitals Examination
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input
                        label="Temp (°C)"
                        type="number" step="0.1" required
                        value={vitalsForm.temperature} onChange={e => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                        placeholder="36.6"
                      />
                      <Input
                        label="BP Sys"
                        type="number" required
                        value={vitalsForm.bpSystolic} onChange={e => setVitalsForm({...vitalsForm, bpSystolic: e.target.value})}
                        placeholder="120"
                      />
                      <Input
                        label="BP Dia"
                        type="number" required
                        value={vitalsForm.bpDiastolic} onChange={e => setVitalsForm({...vitalsForm, bpDiastolic: e.target.value})}
                        placeholder="80"
                      />
                      <Input
                        label="Heart Rate"
                        type="number" required
                        value={vitalsForm.heartRate} onChange={e => setVitalsForm({...vitalsForm, heartRate: e.target.value})}
                        placeholder="72"
                      />
                      <Input
                        label="Resp. Rate"
                        type="number" required
                        value={vitalsForm.respiratoryRate} onChange={e => setVitalsForm({...vitalsForm, respiratoryRate: e.target.value})}
                        placeholder="16"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="type-label text-ink dark:text-teal-300 border-b border-line-subtle dark:border-teal-800/40 pb-2 flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4 text-accent" /> Chief Complaint
                    </h4>
                    <textarea
                      required rows={4}
                      className="w-full bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 rounded-none px-4 py-3 text-xs transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white dark:focus:bg-night-800 outline-none resize-none text-slate-900 dark:text-white"
                      value={vitalsForm.chiefComplaint} onChange={e => setVitalsForm({...vitalsForm, chiefComplaint: e.target.value})}
                      placeholder="Patient's primary complaint..."
                    />
                  </div>

                </form>
              </div>

              <CardFooter className="justify-end bg-surface-muted dark:bg-night-850 border-t border-line-subtle dark:border-teal-800/40 p-4">
                <Button type="submit" form="triage-form" className="rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs">
                  Send to Doctor Suite <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400 bg-surface dark:bg-night-900 rounded-none border border-dashed border-line-subtle dark:border-teal-800/40">
              <Activity className="w-16 h-16 text-accent opacity-30 mb-4" />
              <p className="font-bold text-sm text-ink dark:text-teal-300">Select a patient from the queue to begin triage.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
