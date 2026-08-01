import React, { useState } from 'react';
import { Patient, Visit, Language } from '../types';
import ConsultationRoom from './ConsultationRoom';
import { Stethoscope, FileText, Calendar, Users, DollarSign, Activity, BrainCircuit, CalendarClock, Clock, ChevronRight } from 'lucide-react';

interface DoctorDashboardModuleProps {
  doctorQueue: Visit[];
  completedVisits: Visit[];
  patientsMap: Record<string, Patient>;
  activeLanguage: Language;
  activeConsultationVisitId: string | null;
  setActiveConsultationVisitId: (id: string | null) => void;
  onConsultationComplete: (soapData: any, issueMc: boolean, mcDuration: number) => void;
  doctorName?: string;
  doctorTab?: 'queue' | 'consultation' | 'reports';
  onTabChange?: (tab: 'queue' | 'consultation' | 'reports') => void;
}

export default function DoctorDashboardModule({
  doctorQueue,
  completedVisits,
  patientsMap,
  activeLanguage,
  activeConsultationVisitId,
  setActiveConsultationVisitId,
  onConsultationComplete,
  doctorName = "Dr. Sarah Jenkins",
  doctorTab = "queue",
  onTabChange
}: DoctorDashboardModuleProps) {
  const [internalTab, setInternalTab] = useState<'queue' | 'consultation' | 'reports'>(doctorTab);
  const [calledVisitId, setCalledVisitId] = useState<string | null>(null);
  const [callAnnouncementToast, setCallAnnouncementToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (doctorTab) {
      setInternalTab(doctorTab);
    }
  }, [doctorTab]);

  const handleTabChange = (tab: 'queue' | 'consultation' | 'reports') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Compute metrics for reports
  const totalPatientsSeen = completedVisits.length;
  const totalFeesGenerated = completedVisits.reduce((acc, visit) => acc + visit.totalBill, 0);

  // Step 1: Call patient for consultation
  const handleCallPatient = (visitId: string, patientName: string) => {
    setCalledVisitId(visitId);
    setActiveConsultationVisitId(visitId);
    setCallAnnouncementToast(`📢 Calling Patient: ${patientName} to Consultation Room 1...`);
    setTimeout(() => setCallAnnouncementToast(null), 4000);
  };

  // Step 2: Start consultation when patient is attended
  const handleStartConsultation = (visitId: string) => {
    setActiveConsultationVisitId(visitId);
    handleTabChange('consultation');
  };

  // Step 3: Complete consultation and return back to Queue
  const handleDoctorSoapComplete = (soapData: any, issueMc: boolean, mcDuration: number) => {
    onConsultationComplete(soapData, issueMc, mcDuration);
    setActiveConsultationVisitId(null);
    setCalledVisitId(null);
    handleTabChange('queue'); // Auto-return back to Queue!
  };

  return (
    <div className="space-y-4 animate-fadeIn relative">
      
      {/* Step 1 Call Announcement Toast */}
      {callAnnouncementToast && (
        <div className="fixed top-20 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-teal-500/40 flex items-center gap-3 animate-bounce-slow">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
            📢
          </div>
          <div>
            <h4 className="text-xs font-bold text-teal-300">Public PA Call System</h4>
            <p className="text-xs text-slate-200 font-medium">{callAnnouncementToast}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SEPARATE PAGE: DEDICATED PATIENT WAITING QUEUE PAGE                   */}
      {/* ========================================================================= */}
      {internalTab === 'queue' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="enterprise-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-slate-800 font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0D9488]" />
                  Active Outpatient Waiting Queue
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Follow 3-Step Chronology: 1. Call for Consultation → 2. Start SOAP Consultation → 3. Auto-Return to Queue.</p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-3 py-1 border rounded-lg font-bold">
                Queue Volume: {doctorQueue.length} Patients Waiting
              </span>
            </div>

            {/* SORTED QUEUE PREPARATION */}
            {(() => {
              const sortedQueue = [...doctorQueue].sort((a, b) => {
                const ptA = patientsMap[a.patientId];
                const ptB = patientsMap[b.patientId];
                if (!ptA || !ptB) return 0;
                if (ptA.drugAllergies.length > ptB.drugAllergies.length) return -1;
                if (ptB.drugAllergies.length > ptA.drugAllergies.length) return 1;
                return 0;
              });

              if (doctorQueue.length === 0) {
                return (
                  <div className="bg-white rounded-lg p-12 border border-slate-200 text-center text-slate-400">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <span className="text-xs font-semibold block text-slate-600">Your patient queue is currently empty.</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Waiting for triage clinic assistants to register and dispatch new outpatients.</span>
                  </div>
                );
              }

              const nextVisit = sortedQueue[0];
              const nextPatient = patientsMap[nextVisit.patientId];
              const remainingQueue = sortedQueue.slice(1);
              const isNextCalled = calledVisitId === nextVisit.id;

              return (
                <div className="space-y-4">
                  {/* HERO BANNER: CALL NEXT PATIENT (#1 ONLY) */}
                  {nextPatient && (
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-xl border border-slate-700 shadow-xl mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                      <div className="space-y-1.5 z-10">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#0D9488] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                            NEXT IN LINE (#1)
                          </span>
                          {isNextCalled && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider animate-pulse">
                              📢 PATIENT CALLED
                            </span>
                          )}
                          {nextPatient.drugAllergies.length > 0 && (
                            <span className="bg-red-500/20 text-red-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-red-500/30">
                              ⚠️ Allergy Alert
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                          <span>{nextPatient.fullName}</span>
                          <span className="text-xs font-mono text-slate-400 font-normal">({nextPatient.gender}, {nextPatient.dob})</span>
                        </h3>
                        <p className="text-xs text-slate-300">
                          Reason for Visit: <strong className="text-emerald-400">{nextVisit.soap?.subjective || 'General Medical Consultation'}</strong> | Panel: <strong className="text-cyan-300">{nextPatient.panelEmployer}</strong>
                        </p>
                      </div>

                      {/* CHRONOLOGY ACTIONS */}
                      <div className="flex items-center gap-2 z-10 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCallPatient(nextVisit.id, nextPatient.fullName)}
                          className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📢 Call Patient</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartConsultation(nextVisit.id)}
                          className="bg-[#0D9488] hover:bg-teal-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Stethoscope className="w-4 h-4" />
                          <span>Start Consultation</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REMAINING PATIENTS LIST (#2 ONWARDS - NO DUPLICATION) */}
                  {remainingQueue.length > 0 ? (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Subsequent Queue Items ({remainingQueue.length} Waiting)
                      </h4>
                      <div className="flex flex-col gap-3">
                        {remainingQueue.map((visit, index) => {
                          const pt = patientsMap[visit.patientId];
                          if (!pt) return null;
                          const isConsulting = activeConsultationVisitId === visit.id;
                          const isCalled = calledVisitId === visit.id;
                          const queuePosition = index + 2; // Position #2, #3...

                          let triageLevel = 'MED';
                          if (pt.drugAllergies.length > 0) triageLevel = 'HIGH';

                          const waitTimeMinutes = visit.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
                          const waitTimeColor = waitTimeMinutes >= 30 ? 'bg-red-50 text-red-700 border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.2)]' :
                            waitTimeMinutes >= 15 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200';

                          return (
                            <div
                              key={visit.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isConsulting
                                ? 'border-[#0D9488] bg-teal-50/50 shadow-md ring-1 ring-[#0D9488]/30'
                                : 'border-slate-200 bg-white hover:shadow-md hover:border-teal-300'
                                }`}
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg w-12 h-12 border border-slate-200 shrink-0 font-mono">
                                  <span className="text-[10px] font-bold text-slate-400">#</span>
                                  <span className="text-sm font-black text-slate-800">{queuePosition}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight truncate">
                                      {pt.fullName}
                                    </h4>
                                    {isCalled && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-emerald-300 animate-pulse">
                                        📢 Called
                                      </span>
                                    )}
                                    {pt.drugAllergies.length > 0 && (
                                      <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-200">
                                        Allergy Alert
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ID: {pt.id}</span>
                                    <span>Panel: <strong className="text-[#0D9488]">{pt.panelEmployer}</strong></span>
                                    <span>Reason: <strong className="text-slate-700">{visit.soap?.subjective || 'General Checkup'}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-wrap sm:justify-end">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border transition-colors ${waitTimeColor}`}>
                                  <Clock className="w-3.5 h-3.5" /> Wait: {waitTimeMinutes}m
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${triageLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                                  triageLevel === 'MED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                  <BrainCircuit className="w-3.5 h-3.5" /> Triage: {triageLevel}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => handleCallPatient(visit.id, pt.fullName)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                >
                                  📢 Call
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartConsultation(visit.id)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0D9488] hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Start Consultation</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
                      No additional outpatients waiting in queue after Patient #1.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEPARATE PAGE: DEDICATED CONSULTATION SUITE PAGE                       */}
      {/* ========================================================================= */}
      {internalTab === 'consultation' && (
        <div className="space-y-4 animate-fadeIn">
          {activeConsultationVisitId ? (
            <div className="animate-fade-in-up">
              <ConsultationRoom
                currentPatient={patientsMap[doctorQueue.find(v => v.id === activeConsultationVisitId)?.patientId || ''] || null}
                activeVisit={doctorQueue.find(v => v.id === activeConsultationVisitId) || null}
                activeLanguage={activeLanguage}
                onConsultationComplete={handleDoctorSoapComplete}
                onCancel={() => {
                  setActiveConsultationVisitId(null);
                  setCalledVisitId(null);
                  setInternalTab('queue');
                }}
              />
            </div>
          ) : (
            <div className="enterprise-card border-dashed p-16 text-center text-slate-400 mt-2 flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-teal-100">
                <Stethoscope className="w-10 h-10 text-[#0D9488]" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-lg">No Active Patient Selected</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                Please choose an outpatient from your active patient queue to start SOAP clinical diagnosis, vitals examination, and prescription writing.
              </p>
              <button
                type="button"
                onClick={() => setInternalTab('queue')}
                className="mt-5 px-5 py-2 rounded-lg text-xs font-bold bg-[#0D9488] hover:bg-teal-700 text-white shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Go to Patient Waiting Queue</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MONTHLY REPORTS VIEW */}
      {internalTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Metrics */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">Total Patients Seen</span>
                <span className="text-2xl font-black text-slate-800">{totalPatientsSeen}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">Fees Generated (RM)</span>
                <span className="text-2xl font-black text-slate-800">{totalFeesGenerated.toFixed(2)}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Monthly Patient List & Fees History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">ICD-10 Code</th>
                    <th className="px-4 py-3">Payment Route</th>
                    <th className="px-4 py-3 text-right">Total Fee (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedVisits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-slate-400 italic">
                        No completed consultations on record for this month.
                      </td>
                    </tr>
                  ) : (
                    completedVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-slate-500">{visit.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {patientsMap[visit.patientId]?.fullName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">
                            {visit.soap.assessment.icdCode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${visit.paymentMethod === 'Panel'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                            }`}>
                            {visit.paymentMethod || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                          {visit.totalBill.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
