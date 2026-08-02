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
    <div className="space-y-6 animate-fadeIn relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slideUp">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Queue */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col h-[calc(100vh-140px)]">
            <CardHeader className="bg-slate-50 flex justify-between items-center py-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Awaiting Triage
              </h3>
              <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {triageQueue.length}
              </span>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {triageQueue.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                  <p className="text-sm font-medium">Triage Queue Empty</p>
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
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                        isActive 
                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/30 shadow-sm' 
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-sm text-slate-800 truncate pr-2">{pt?.fullName}</span>
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> {waitMins}m
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">IC: {maskICNumber(pt?.icNumber, true)}</div>
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
            <Card className="h-[calc(100vh-140px)] flex flex-col">
              <CardHeader className="bg-slate-50 flex items-center justify-between py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{activePatient.fullName}</h2>
                  <p className="text-sm text-slate-500">Age: {new Date().getFullYear() - new Date(activePatient.dob).getFullYear()} • IC: {activePatient.icNumber}</p>
                </div>
                <div className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Triaging
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="triage-form" onSubmit={handleSubmitTriage} className="space-y-6 max-w-2xl">
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-600" /> Vitals
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
                    <h4 className="text-sm font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" /> Chief Complaint
                    </h4>
                    <textarea
                      required rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none resize-none"
                      value={vitalsForm.chiefComplaint} onChange={e => setVitalsForm({...vitalsForm, chiefComplaint: e.target.value})}
                      placeholder="Patient's primary complaint..."
                    />
                  </div>

                </form>
              </div>

              <CardFooter className="justify-end">
                <Button type="submit" form="triage-form">
                  Send to Doctor <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Activity className="w-16 h-16 text-slate-200 mb-4" />
              <p className="font-medium text-slate-500">Select a patient from the queue to begin triage.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
