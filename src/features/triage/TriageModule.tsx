import React, { useState } from 'react';
import { Patient, Visit, VitalSigns } from '../../types';
import { Users, Clock, Activity, CheckCircle2, Stethoscope, FileText, ArrowRight } from 'lucide-react';
import { maskICNumber } from '../../utils/piiMasker';
import { calculatePatientAge } from '../../domain/patientAge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { useLanguage } from '../../context/LanguageContext';

interface TriageModuleProps {
  triageQueue: Visit[];
  patientsMap: Record<string, Patient>;
  onTriageComplete: (visitId: string, vitals: Partial<VitalSigns>, chiefComplaint: string) => void;
}

export default function TriageModule({ triageQueue, patientsMap, onTriageComplete }: TriageModuleProps) {
  const { activeLanguage, t } = useLanguage();
  const isBM = activeLanguage === 'BM';
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
    
    showToast(isBM ? `${activePatient?.fullName} telah ditriaj dan dihantar ke Giliran Doktor.` : `${activePatient?.fullName} triaged and sent to Doctor Queue.`);
    setActiveVisitId(null);
  };

  return (
    <div className="space-y-3.5 animate-fadeIn relative font-sans text-strong">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-white px-6 py-4 rounded-none shadow-2xl flex items-center justify-center gap-3 z-50 animate-slideUp border border-line">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* LEFT PANEL: Queue */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col h-[calc(100vh-170px)] min-h-[480px] rounded-none border-line">
            <CardHeader className="bg-surface-muted flex justify-between items-center px-3.5 py-2.5 border-b border-line">
              <h3 className="type-heading-caps text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                {isBM ? 'Menunggu Triaj' : 'Awaiting Triage'}
              </h3>
              <span className="bg-surface-accent text-accent border border-line text-xs font-mono font-bold px-2.5 py-0.5 rounded-none">
                {triageQueue.length}
              </span>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-surface">
              {triageQueue.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto text-accent opacity-40 mb-2" />
                  <p className="text-sm font-bold text-muted dark:text-slate-400">{isBM ? 'Giliran Triaj Kosong' : 'Triage Queue Empty'}</p>
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
                      title={`Select ${pt?.fullName} to record triage vital signs`}
                      className={`w-full text-left p-2.5 rounded-none border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                        isActive 
                          ? 'border-brand bg-surface-accent shadow-xs' 
                          : 'border-line bg-surface hover:bg-surface-muted dark:hover:bg-night-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-sm text-ink dark:text-white truncate pr-2 uppercase">{pt?.fullName}</span>
                        <span className="text-2xs font-mono font-bold text-accent bg-surface-muted px-2 py-0.5 border border-line flex items-center justify-center gap-1 shrink-0 rounded-none">
                          <Clock className="w-3 h-3" /> {waitMins}m
                        </span>
                      </div>
                      <div className="text-xs text-subtle font-mono">IC: {maskICNumber(pt?.icNumber, true)}</div>
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
            <Card className="h-[calc(100vh-170px)] min-h-[480px] flex flex-col rounded-none border-line">
              <CardHeader className="bg-surface-muted flex items-center justify-between px-3.5 py-2.5 border-b border-line">
                <div>
                  <h2 className="type-heading-caps text-ink dark:text-white">{activePatient.fullName}</h2>
                  <p className="text-xs text-muted dark:text-slate-300 font-mono mt-0.5">{isBM ? 'Umur' : 'Age'}: {calculatePatientAge(activePatient.dob).displayAge} • IC: {activePatient.icNumber}</p>
                </div>
                <div className="bg-surface-accent text-accent border border-line text-xs font-mono font-bold px-3 py-1 rounded-none flex items-center justify-center gap-1.5 uppercase">
                  <Activity className="w-3.5 h-3.5 text-accent" /> {isBM ? 'Triaj Aktif' : 'Triaging Active'}
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-3.5 bg-surface">
                <form id="triage-form" onSubmit={handleSubmitTriage} className="space-y-3.5 max-w-2xl">
                  
                  <div className="space-y-3">
                    <h4 className="type-label text-ink border-b border-line pb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-accent" /> {t.vitalsSign || 'Vitals Examination'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                      <Input
                        label={isBM ? 'Suhu (°C)' : 'Temp (°C)'}
                        type="number" step="0.1" required
                        value={vitalsForm.temperature} onChange={e => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                        placeholder="36.6"
                      />
                      <Input
                        label={isBM ? 'BP Sistolik' : 'BP Sys'}
                        type="number" required
                        value={vitalsForm.bpSystolic} onChange={e => setVitalsForm({...vitalsForm, bpSystolic: e.target.value})}
                        placeholder="120"
                      />
                      <Input
                        label={isBM ? 'BP Diastolik' : 'BP Dia'}
                        type="number" required
                        value={vitalsForm.bpDiastolic} onChange={e => setVitalsForm({...vitalsForm, bpDiastolic: e.target.value})}
                        placeholder="80"
                      />
                      <Input
                        label={isBM ? 'Nadi (bpm)' : 'Heart Rate'}
                        type="number" required
                        value={vitalsForm.heartRate} onChange={e => setVitalsForm({...vitalsForm, heartRate: e.target.value})}
                        placeholder="72"
                      />
                      <Input
                        label={isBM ? 'Pernafasan' : 'Resp. Rate'}
                        type="number" required
                        value={vitalsForm.respiratoryRate} onChange={e => setVitalsForm({...vitalsForm, respiratoryRate: e.target.value})}
                        placeholder="16"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="type-label text-ink border-b border-line pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" /> {isBM ? 'Aduan Utama' : 'Chief Complaint'}
                    </h4>
                    <textarea
                      required rows={3}
                      className="w-full bg-surface border border-line rounded-none px-3 py-2 text-xs transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-surface-accent dark:focus:bg-night-800 outline-none resize-none text-strong dark:text-white"
                      value={vitalsForm.chiefComplaint} onChange={e => setVitalsForm({...vitalsForm, chiefComplaint: e.target.value})}
                      placeholder={isBM ? 'Aduan utama pesakit...' : "Patient's primary complaint..."}
                    />
                  </div>

                </form>
              </div>

              <CardFooter className="justify-end bg-surface-muted border-t border-line px-3.5 py-2">
                <Button type="submit" form="triage-form" title="Save vital signs and route patient to active doctor consultation queue" className="rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs">
                  {isBM ? 'Hantar ke Sut Doktor' : 'Send to Doctor Suite'} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-[calc(100vh-170px)] min-h-[480px] flex flex-col items-center justify-center text-slate-400 bg-surface rounded-none border border-dashed border-line">
              <Activity className="w-16 h-16 text-accent opacity-30 mb-4" />
              <p className="font-bold text-sm text-ink">{isBM ? 'Pilih pesakit daripada giliran untuk memulakan triaj.' : 'Select a patient from the queue to begin triage.'}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
