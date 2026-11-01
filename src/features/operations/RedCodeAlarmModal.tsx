import React, { useState, useEffect, useMemo } from 'react';
import {
  X, AlertOctagon, CheckCircle2, Siren, Zap, Clock, ShieldAlert,
  PhoneCall, HeartPulse, Stethoscope, Check, AlertTriangle, FileText, ArrowRight
} from 'lucide-react';
import {
  RedCodeIncident,
  RedCodeSeverity,
  DEFAULT_RED_CODE_INCIDENTS,
  getEmergencyImmediateActionProtocol,
} from '../../domain/redCodeAlarm';

interface RedCodeAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlarmTriggered?: (incident: RedCodeIncident) => void;
}

const STORAGE_KEY_RED_CODE = 'mediclinic_red_code_incidents_v1';

export default function RedCodeAlarmModal({
  isOpen,
  onClose,
  onAlarmTriggered,
}: RedCodeAlarmModalProps) {
  const [activeTab, setActiveTab] = useState<'alarm_command' | 'protocols' | 'history'>('alarm_command');

  // Incidents State
  const [incidents, setIncidents] = useState<RedCodeIncident[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RED_CODE);
    return saved ? JSON.parse(saved) : DEFAULT_RED_CODE_INCIDENTS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger form state
  const [selectedCondition, setSelectedCondition] = useState<RedCodeSeverity>('cardiac_arrest');
  const [patientName, setPatientName] = useState('Unknown Emergency Walk-in');
  const [patientAge, setPatientAge] = useState('50');
  const [locationTriggered, setLocationTriggered] = useState<'Triage / Entrance' | 'Consultation Room' | 'Waiting Hall'>('Triage / Entrance');
  const [staffTriggering, setStaffTriggering] = useState('Triage Staff Nurse');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RED_CODE, JSON.stringify(incidents));
  }, [incidents]);

  // Find currently active alarm (if any)
  const activeIncident = useMemo(() => incidents.find((i) => i.status === 'active_alarm'), [incidents]);

  // Protocol for currently selected or active condition
  const activeProtocol = useMemo(() => {
    const condition = activeIncident ? activeIncident.condition : selectedCondition;
    return getEmergencyImmediateActionProtocol(condition);
  }, [activeIncident, selectedCondition]);

  // Trigger Code Red
  const handleTriggerAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const newIncident: RedCodeIncident = {
      id: `RED-${Date.now()}`,
      patientName: patientName.trim() || 'Unknown Patient',
      estimatedAge: parseInt(patientAge, 10) || 45,
      condition: selectedCondition,
      triggeredAt: new Date().toISOString(),
      triggeredByStaff: staffTriggering.trim(),
      locationTriggered,
      assignedBay: 'Treatment Bay 1 (Resuscitation Bed)',
      crashCartDeployed: true,
      oxygenFlowLpm: 15,
      mecc999Called: false,
      status: 'active_alarm',
    };

    setIncidents([newIncident, ...incidents]);
    if (onAlarmTriggered) onAlarmTriggered(newIncident);

    setToastMessage(`🚨 CODE RED ALARM BROADCAST: ${newIncident.condition.toUpperCase()} (Resus Bay 1 Prepared)`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Resolve / Transfer Code Red
  const handleResolveAlarm = (newStatus: 'stabilized' | 'transferred_ed') => {
    if (!activeIncident) return;

    const updated = incidents.map((inc) => {
      if (inc.id === activeIncident.id) {
        return {
          ...inc,
          status: newStatus,
          resolvedAt: new Date().toISOString(),
          sbarRefId: newStatus === 'transferred_ed' ? `SBAR-${Date.now()}` : undefined,
          clinicalNotes: newStatus === 'transferred_ed' ? 'Transferred via MECC 999 ALS ambulance.' : 'Patient stabilized in Resus Bay.',
        };
      }
      return inc;
    });

    setIncidents(updated);
    setToastMessage(`✓ Code Red Alarm resolved: ${newStatus === 'transferred_ed' ? 'Transferred to Hospital ED' : 'Patient Stabilized'}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-canvas border-2 border-rose-600 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col rounded-none overflow-hidden text-ink">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-950/20 border-b border-rose-300 dark:border-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white animate-pulse">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-rose-900 dark:text-rose-100 uppercase">
                  Code Red Resuscitation Bay Alarm
                </h2>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-rose-600 text-white border border-rose-700">
                  Critical Clinical Bypass
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Immediate Treatment Room alert &bull; Part V Crash Cart activation &bull; MECC 999 SBAR linkage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-subtle border border-transparent hover:border-line transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="bg-rose-700 text-white px-6 py-2.5 text-xs font-bold flex items-center gap-2 border-b border-rose-900 animate-in slide-in-from-top-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-canvas px-6 gap-2">
          <button
            onClick={() => setActiveTab('alarm_command')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'alarm_command'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400 font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Emergency Command Center</span>
            {activeIncident && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold animate-pulse">ACTIVE ALARM</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'protocols'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400 font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Resuscitation Bundles &amp; Drugs</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400 font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Code Red Audit Log ({incidents.length})</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ALARM COMMAND CENTER */}
          {activeTab === 'alarm_command' && (
            <div className="space-y-6">
              {/* If Alarm is Currently Active */}
              {activeIncident ? (
                <div className="border-2 border-rose-600 bg-rose-50 dark:bg-rose-950/40 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-700 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                          CRITICAL CODE RED BROADCAST ACTIVE
                        </span>
                        <span className="font-mono text-xs font-bold text-rose-900 dark:text-rose-200">
                          {activeIncident.id}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 mt-1">
                        {activeIncident.patientName} ({activeIncident.estimatedAge}y)
                      </h3>
                      <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                        Location: {activeIncident.locationTriggered} &bull; Destination: {activeIncident.assignedBay}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-rose-700 dark:text-rose-300 uppercase block font-mono font-bold">Alarm Elapsed</span>
                      <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400">
                        {Math.floor((Date.now() - new Date(activeIncident.triggeredAt).getTime()) / 60000)}m
                      </span>
                    </div>
                  </div>

                  {/* Immediate Clinical Action Checklist */}
                  <div className="p-4 bg-white dark:bg-night-900 border border-rose-300 dark:border-rose-800 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200 block border-b border-rose-200 pb-1.5">
                      Immediate Clinical Action Protocol: {activeProtocol.title}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-rose-800 dark:text-rose-300 block">Primary Maneuver:</span>
                        <p className="text-ink-muted mt-0.5 leading-relaxed">{activeProtocol.primaryAction}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-800 dark:text-rose-300 block">Emergency Medication:</span>
                        <p className="text-ink-muted mt-0.5 leading-relaxed">{activeProtocol.medication}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-800 dark:text-rose-300 block">Airway &amp; Oxygen:</span>
                        <p className="text-ink-muted mt-0.5 leading-relaxed">{activeProtocol.airwayBreathing}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-800 dark:text-rose-300 block">Ambulance Dispatch:</span>
                        <p className="text-ink-muted mt-0.5 leading-relaxed">{activeProtocol.ambulanceAction}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">Crash Cart:</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                        ✓ Deployed &amp; O2 @ 15 L/min
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveAlarm('stabilized')}
                        className="px-4 py-2 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Patient Stabilized in Resus Bay</span>
                      </button>
                      <button
                        onClick={() => handleResolveAlarm('transferred_ed')}
                        className="px-4 py-2 text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 transition-colors flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Transfer to Hospital ED (MECC 999 SBAR)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Alarm Active: Quick 1-Click Trigger Form */
                <form onSubmit={handleTriggerAlarm} className="border-2 border-rose-300 bg-canvas p-5 space-y-5">
                  <div className="border-b border-line pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-rose-800 flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-rose-600" />
                      <span>Broadcast Immediate Code Red Resuscitation Alarm</span>
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Directly alerts all Treatment Room staff and doctors, clears queue priority, and activates the Crash Cart.
                    </p>
                  </div>

                  {/* Condition Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                      Select Emergency Clinical Condition:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {[
                        { id: 'cardiac_arrest', label: 'Cardiac Arrest / Unresponsive', desc: 'Immediate CPR & Defibrillator' },
                        { id: 'anaphylaxis', label: 'Acute Severe Anaphylaxis', desc: 'IM Adrenaline Thigh Injection' },
                        { id: 'severe_respiratory', label: 'Severe Asthma / Stridor', desc: 'O2 15L & Continuous Nebulizer' },
                        { id: 'unresponsive_seizure', label: 'Status Epilepticus / Seizure', desc: 'Recovery Position & IV Midazolam' },
                        { id: 'massive_hemorrhage', label: 'Massive Bleeding / Severe Trauma', desc: 'Direct Pressure & Large-Bore IV' },
                      ].map((cond) => {
                        const isSelected = selectedCondition === cond.id;
                        return (
                          <button
                            type="button"
                            key={cond.id}
                            onClick={() => setSelectedCondition(cond.id as any)}
                            className={`p-3 text-left border transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-600 ring-1 ring-rose-600'
                                : 'bg-canvas-subtle border-line hover:border-rose-300'
                            }`}
                          >
                            <span className="block text-xs font-bold text-ink">{cond.label}</span>
                            <span className="text-[11px] text-ink-muted block mt-0.5">{cond.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Patient Name (or Description)</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full text-xs p-2 border border-line bg-canvas text-ink font-bold rounded-none focus:outline-none focus:border-rose-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Estimated Age</label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-rose-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Triggering Location</label>
                      <select
                        value={locationTriggered}
                        onChange={(e) => setLocationTriggered(e.target.value as any)}
                        className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-rose-600"
                      >
                        <option value="Triage / Entrance">Triage / Front Entrance</option>
                        <option value="Waiting Hall">Waiting Hall</option>
                        <option value="Consultation Room">Consultation Room</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white uppercase tracking-wider flex items-center gap-2 shadow-md transition-colors"
                    >
                      <Siren className="w-4 h-4 text-white animate-pulse" />
                      <span>🚨 SOUND CODE RED ALARM</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PROTOCOLS */}
          {activeTab === 'protocols' && (
            <div className="space-y-4">
              <div className="border border-line bg-canvas-subtle p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Resuscitation Council of Asia / KKM Emergency Protocols
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Standard Operating Procedures for ambulatory resuscitation and primary care emergency management.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'cardiac_arrest',
                  'anaphylaxis',
                  'severe_respiratory',
                  'unresponsive_seizure',
                  'massive_hemorrhage',
                ].map((cond) => {
                  const prot = getEmergencyImmediateActionProtocol(cond as any);
                  return (
                    <div key={cond} className="border border-line bg-canvas p-4 space-y-2">
                      <span className="text-xs font-extrabold text-rose-800 uppercase block border-b border-line pb-1">
                        {prot.title}
                      </span>
                      <div className="text-[11px] text-ink-muted space-y-1.5 pt-1">
                        <div>
                          <span className="font-bold text-ink">First Maneuver: </span>
                          <span>{prot.primaryAction}</span>
                        </div>
                        <div>
                          <span className="font-bold text-ink">Medication: </span>
                          <span>{prot.medication}</span>
                        </div>
                        <div>
                          <span className="font-bold text-ink">Airway/O2: </span>
                          <span>{prot.airwayBreathing}</span>
                        </div>
                        <div>
                          <span className="font-bold text-ink">Ambulance: </span>
                          <span>{prot.ambulanceAction}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Code Red Resuscitation Event Log
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Documented clinical audits required for CKAPS private clinic accreditation.
                  </p>
                </div>
              </div>

              <div className="border border-line overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                      <th className="p-2.5">Incident ID</th>
                      <th className="p-2.5">Date &amp; Time</th>
                      <th className="p-2.5">Patient Details</th>
                      <th className="p-2.5">Condition</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono text-[11px]">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-canvas-subtle/50">
                        <td className="p-2.5 font-bold text-ink">{inc.id}</td>
                        <td className="p-2.5 font-sans text-ink-muted">{new Date(inc.triggeredAt).toLocaleString()}</td>
                        <td className="p-2.5 font-sans font-medium text-ink">
                          {inc.patientName} ({inc.estimatedAge}y)
                        </td>
                        <td className="p-2.5 font-sans text-rose-800 font-bold uppercase">
                          {inc.condition.replace(/_/g, ' ')}
                        </td>
                        <td className="p-2.5 font-sans text-ink-muted">{inc.locationTriggered}</td>
                        <td className="p-2.5 font-sans">
                          <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                            inc.status === 'active_alarm'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                          }`}>
                            {inc.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-canvas-subtle border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>PHFSA 1998 Part V Emergency Resuscitation Regulations &bull; MECC 999 ALS Link</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border border-line bg-canvas hover:bg-canvas-subtle text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
