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
        <div className="fixed bottom-6 right-6 bg-[#0d9488] text-white px-6 py-4 rounded-none shadow-2xl flex items-center gap-3 z-50 animate-slideUp border border-teal-400">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Queue */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col h-[calc(100vh-140px)] rounded-none border-[#ccfbf1] dark:border-teal-800/40">
            <CardHeader className="bg-[#f0fdfa] dark:bg-[#082830] flex justify-between items-center py-4 border-b border-[#ccfbf1] dark:border-teal-800/40">
              <h3 className="font-bold text-[#0f3c4c] dark:text-[#5eead4] text-sm flex items-center gap-2 uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#0d9488]" />
                Awaiting Triage
              </h3>
              <span className="bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0d9488] dark:text-[#2dd4bf] border border-[#b2f5ea] dark:border-teal-800/40 text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-none">
                {triageQueue.length}
              </span>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#f7fdfd] dark:bg-[#07252d]">
              {triageQueue.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto text-[#0d9488] opacity-40 mb-2" />
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
                      className={`w-full text-left p-3.5 rounded-none border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:outline-none ${
                        isActive 
                          ? 'border-[#0d9488] bg-[#e0f5f2] dark:bg-[#0c3844] shadow-xs' 
                          : 'border-[#ccfbf1] dark:border-teal-800/40 bg-white dark:bg-[#0c3844] hover:bg-[#f0fdfa] dark:hover:bg-[#0e4857]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-extrabold text-sm text-[#0f3c4c] dark:text-white truncate pr-2 uppercase">{pt?.fullName}</span>
                        <span className="text-[10px] font-mono font-bold text-[#0d9488] dark:text-[#2dd4bf] bg-[#e0f5f2] dark:bg-[#082830] px-2 py-0.5 border border-[#b2f5ea] dark:border-teal-800/40 flex items-center gap-1 shrink-0 rounded-none">
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
            <Card className="h-[calc(100vh-140px)] flex flex-col rounded-none border-[#ccfbf1] dark:border-teal-800/40">
              <CardHeader className="bg-[#f0fdfa] dark:bg-[#082830] flex items-center justify-between py-5 border-b border-[#ccfbf1] dark:border-teal-800/40">
                <div>
                  <h2 className="text-lg font-black text-[#0f3c4c] dark:text-white uppercase">{activePatient.fullName}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">Age: {new Date().getFullYear() - new Date(activePatient.dob).getFullYear()} • IC: {activePatient.icNumber}</p>
                </div>
                <div className="bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0d9488] dark:text-[#2dd4bf] border border-[#b2f5ea] dark:border-teal-800/40 text-xs font-mono font-extrabold px-3 py-1 rounded-none flex items-center gap-1.5 uppercase">
                  <Activity className="w-3.5 h-3.5 text-[#0d9488]" /> Triaging Active
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-6 bg-[#f7fdfd] dark:bg-[#07252d]">
                <form id="triage-form" onSubmit={handleSubmitTriage} className="space-y-6 max-w-2xl">
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-[#0f3c4c] dark:text-[#5eead4] border-b border-[#ccfbf1] dark:border-teal-800/40 pb-2 flex items-center gap-2 uppercase tracking-wider">
                      <Stethoscope className="w-4 h-4 text-[#0d9488]" /> Vitals Examination
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
                    <h4 className="text-xs font-extrabold text-[#0f3c4c] dark:text-[#5eead4] border-b border-[#ccfbf1] dark:border-teal-800/40 pb-2 flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-[#0d9488]" /> Chief Complaint
                    </h4>
                    <textarea
                      required rows={4}
                      className="w-full bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 rounded-none px-4 py-3 text-xs transition-all focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 focus:bg-white dark:focus:bg-[#0c3844] outline-none resize-none text-slate-900 dark:text-white"
                      value={vitalsForm.chiefComplaint} onChange={e => setVitalsForm({...vitalsForm, chiefComplaint: e.target.value})}
                      placeholder="Patient's primary complaint..."
                    />
                  </div>

                </form>
              </div>

              <CardFooter className="justify-end bg-[#f0fdfa] dark:bg-[#082830] border-t border-[#ccfbf1] dark:border-teal-800/40 p-4">
                <Button type="submit" form="triage-form" className="rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs">
                  Send to Doctor Suite <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400 bg-[#f7fdfd] dark:bg-[#07252d] rounded-none border border-dashed border-[#ccfbf1] dark:border-teal-800/40">
              <Activity className="w-16 h-16 text-[#0d9488] opacity-30 mb-4" />
              <p className="font-bold text-sm text-[#0f3c4c] dark:text-[#5eead4]">Select a patient from the queue to begin triage.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
