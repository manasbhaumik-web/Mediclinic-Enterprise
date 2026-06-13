import React, { useState } from 'react';
import { Patient, Visit, Language } from '../types';
import ConsultationRoom from './ConsultationRoom';
import { Stethoscope, FileText, Calendar, Users, DollarSign, Activity, BrainCircuit, CalendarClock } from 'lucide-react';

interface DoctorDashboardModuleProps {
  doctorQueue: Visit[];
  completedVisits: Visit[];
  patientsMap: Record<string, Patient>;
  activeLanguage: Language;
  activeConsultationVisitId: string | null;
  setActiveConsultationVisitId: (id: string | null) => void;
  onConsultationComplete: (soapData: any, issueMc: boolean, mcDuration: number) => void;
  doctorName?: string;
}

export default function DoctorDashboardModule({
  doctorQueue,
  completedVisits,
  patientsMap,
  activeLanguage,
  activeConsultationVisitId,
  setActiveConsultationVisitId,
  onConsultationComplete,
  doctorName = "Dr. Sarah Jenkins"
}: DoctorDashboardModuleProps) {
  const [internalTab, setInternalTab] = useState<'queue_consultation' | 'reports'>('queue_consultation');

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

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header & Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            {getGreeting()}, {doctorName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage your patient queue, consultations, and track your clinical metrics.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInternalTab('queue_consultation')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
              internalTab === 'queue_consultation' 
                ? 'bg-[#07B2B2] text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Queue & Consultation
          </button>
          <button
            type="button"
            onClick={() => setInternalTab('reports')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
              internalTab === 'reports' 
                ? 'bg-[#07B2B2] text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Monthly Reports
          </button>
        </div>
      </div>

      {/* QUEUE & CONSULTATION VIEW */}
      {internalTab === 'queue_consultation' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Your Assigned Patient Queue
                </h3>
                <p className="text-[10px] text-slate-400">Select an outpatient to begin clinical diagnosis and prescription.</p>
              </div>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 border rounded block">
                Queue Volume: {doctorQueue.length} Patients
              </span>
            </div>

            {/* Queue display cards */}
            {doctorQueue.length === 0 ? (
              <div className="bg-white rounded-lg p-8 border text-center text-slate-400">
                <span className="text-xs font-semibold block">Your queue is currently empty.</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Please wait for clerks to assign new outpatients.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
                {doctorQueue.map((visit, index) => {
                  const pt = patientsMap[visit.patientId];
                  if (!pt) return null;
                  const isConsulting = activeConsultationVisitId === visit.id;

                  return (
                    <div
                      key={visit.id}
                      onClick={() => setActiveConsultationVisitId(visit.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${isConsulting
                          ? 'border-[#07B2B2] bg-cyan-50/10 ring-2 ring-[#07B2B2]/10'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="bg-[#07B2B2]/10 text-[#07B2B2] text-[9px] font-bold font-mono px-2 py-0.5 rounded-full">
                          WAITING {index + 1}
                        </span>
                        <span className="text-slate-400 font-mono">ID: {pt.id}</span>
                      </div>
                      
                      {/* AI Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {index === 0 ? (
                          <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3" /> Triage: HIGH
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3" /> Triage: MED
                          </span>
                        )}
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                           <CalendarClock className="w-3 h-3" /> No-Show: {index === 1 ? '45%' : '12%'}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-[#0a2540] uppercase mt-2.5 truncate">
                        {pt.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Panel: <strong>{pt.panelEmployer}</strong>
                      </p>
                      {pt.drugAllergies.length > 0 && (
                        <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 rounded inline-block uppercase mt-1">
                          Allergic Alert ({pt.drugAllergies.length})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Consultation Room Editor */}
          {activeConsultationVisitId ? (
            <ConsultationRoom
              currentPatient={patientsMap[doctorQueue.find(v => v.id === activeConsultationVisitId)?.patientId || ''] || null}
              activeLanguage={activeLanguage}
              onConsultationComplete={onConsultationComplete}
              onCancel={() => setActiveConsultationVisitId(null)}
            />
          ) : (
            <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
              <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-2 animate-bounce-slow" />
              <h4 className="font-bold text-slate-700 text-sm">Select Active Patient</h4>
              <p className="text-xs text-slate-400 mt-1">
                Select a patient from the queue above to access their medical history and the prescription writing board.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MONTHLY REPORTS VIEW */}
      {internalTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Metrics */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">Total Patients Seen</span>
                <span className="text-2xl font-black text-slate-800">{totalPatientsSeen}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">Fees Generated (RM)</span>
                <span className="text-2xl font-black text-slate-800">{totalFeesGenerated.toFixed(2)}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            visit.paymentMethod === 'Panel' 
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
