import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Clock, 
  FileText,
  User,
  MapPin,
  Check
} from 'lucide-react';
import { 
  ClinicalIncident, 
  createClinicalIncident, 
  closeClinicalIncident,
  IncidentCategory,
  IncidentSeverity
} from '../../domain/clinicalIncidents';

interface ClinicalIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaffName?: string;
  currentStaffRole?: string;
}

const INITIAL_INCIDENTS: ClinicalIncident[] = [
  {
    id: 'inc-sample-01',
    incidentNumber: 'INC-2026-001',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    location: 'PharmacyDispensary',
    category: 'MedicationError',
    severity: 'NearMiss',
    patientName: 'Khor Wei Loon',
    reporterStaffId: 'staff-02',
    reporterStaffName: 'Nurse Fadhilah',
    reporterRole: 'Dispensary Nurse',
    description: 'Prescription written for Metformin 500mg BD was almost dispensed as Metformin 850mg. Intercepted during final barcode scanning.',
    immediateActionTaken: 'Replaced with 500mg blister strip. Dispensing alert noted in pharmacy log.',
    requiresOshaNotification: false,
    status: 'Closed',
    rootCauseAnalysis: 'Look-alike sound-alike packaging placed adjacent on shelf B3.',
    correctivePreventiveAction: 'Separated 500mg and 850mg strengths into distinct labeled divider bins with Tall Man lettering.',
    investigatedBy: 'Dr. Kumar (Operations Manager)',
    investigatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    closedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 'inc-sample-02',
    incidentNumber: 'INC-2026-002',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    location: 'ProcedureRoom',
    category: 'NeedleStickExposure',
    severity: 'MinorHarm',
    reporterStaffId: 'staff-04',
    reporterStaffName: 'Staff Nurse Mei Ling',
    reporterRole: 'Clinic Nurse',
    description: 'Accidental superficial finger puncture while disposing of a 21G blood collection needle into an over-filled sharps bin.',
    immediateActionTaken: 'Washed puncture site under running water and soap for 5 minutes. Applied 10% povidone iodine. Baseline blood drawn for HIV, Hep B, and Hep C.',
    requiresOshaNotification: true,
    status: 'UnderInvestigation'
  }
];

export default function ClinicalIncidentModal({
  isOpen,
  onClose,
  currentStaffName = 'Sister Noraini',
  currentStaffRole = 'Nurse Supervisor'
}: ClinicalIncidentModalProps) {
  const [incidents, setIncidents] = useState<ClinicalIncident[]>(INITIAL_INCIDENTS);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'investigate'>('list');
  const [selectedIncident, setSelectedIncident] = useState<ClinicalIncident | null>(null);

  // Create Form State
  const [category, setCategory] = useState<IncidentCategory>('MedicationError');
  const [severity, setSeverity] = useState<IncidentSeverity>('NearMiss');
  const [location, setLocation] = useState<ClinicalIncident['location']>('ProcedureRoom');
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');

  // Investigation Form State
  const [rca, setRca] = useState('');
  const [capa, setCapa] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !immediateAction.trim()) return;

    const newInc = createClinicalIncident({
      category,
      severity,
      location,
      reporterStaffId: 'current-staff',
      reporterStaffName: currentStaffName,
      reporterRole: currentStaffRole,
      description,
      immediateActionTaken: immediateAction,
      patientName: patientName.trim() || undefined,
      existingCount: incidents.length
    });

    setIncidents([newInc, ...incidents]);
    setDescription('');
    setImmediateAction('');
    setPatientName('');
    setViewMode('list');
  };

  const handleCloseIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !rca.trim() || !capa.trim()) return;

    const updated = closeClinicalIncident(
      selectedIncident,
      `${currentStaffName} (${currentStaffRole})`,
      rca,
      capa
    );

    setIncidents(incidents.map(inc => inc.id === updated.id ? updated : inc));
    setSelectedIncident(null);
    setRca('');
    setCapa('');
    setViewMode('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface border border-line w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-none">
        
        {/* MODAL HEADER */}
        <div className="bg-surface-accent border-b border-line p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 rounded-none">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="type-section-title text-ink flex items-center gap-2">
                Clinical Incident & Near-Miss Register
                <span className="text-2xs font-mono font-bold px-2 py-0.5 chip-neutral">CKAPS & OSHA 1994</span>
              </h3>
              <p className="text-2xs text-subtle">
                Statutory clinical risk governance, medication errors, sentinel events and occupational exposures.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-subtle hover:text-ink p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBNAV / ACTIONS */}
        <div className="px-5 py-3 border-b border-line bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none border cursor-pointer ${
                viewMode === 'list' ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              All Logged Incidents ({incidents.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('create')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none border cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'create' ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Log New Incident / Near-Miss
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono font-bold text-subtle">Active Open: {incidents.filter(i => i.status !== 'Closed').length}</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* VIEW: LIST */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="border border-line bg-surface p-4 rounded-none space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-ink">{inc.incidentNumber}</span>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-none border ${
                          inc.severity === 'NearMiss' ? 'chip-ok' :
                          inc.severity === 'NoHarm' ? 'chip-info' :
                          inc.severity === 'MinorHarm' ? 'chip-warn' : 'chip-danger'
                        }`}>
                          {inc.severity.toUpperCase()}
                        </span>
                        <span className="text-2xs font-bold px-2 py-0.5 chip-neutral">
                          {inc.category}
                        </span>
                        {inc.requiresOshaNotification && (
                          <span className="text-2xs font-bold px-2 py-0.5 bg-rose-600 text-white rounded-none animate-pulse">
                            OSHA NADOPOD REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-2xs text-subtle pt-1 font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(inc.timestamp).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {inc.location}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Rep: {inc.reporterStaffName} ({inc.reporterRole})</span>
                        {inc.patientName && <span className="font-bold text-ink">Pt: {inc.patientName}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-2xs font-bold px-2 py-1 rounded-none border ${
                        inc.status === 'Closed' ? 'chip-ok' : 'chip-warn'
                      }`}>
                        {inc.status}
                      </span>
                      {inc.status !== 'Closed' && (
                        <button
                          type="button"
                          onClick={() => { setSelectedIncident(inc); setViewMode('investigate'); }}
                          className="px-2.5 py-1 text-2xs font-bold bg-primary hover:bg-primary-hover text-white rounded-none cursor-pointer"
                        >
                          Investigate & Close (RCA)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-ink space-y-1 bg-surface-accent p-2.5 border border-line-subtle rounded-none">
                    <p><strong>Description:</strong> {inc.description}</p>
                    <p className="text-muted"><strong>Immediate Action Taken:</strong> {inc.immediateActionTaken}</p>
                  </div>

                  {inc.rootCauseAnalysis && (
                    <div className="text-2xs space-y-1 bg-teal-50/50 p-2.5 border border-line rounded-none">
                      <p className="font-bold text-accent">Root Cause Analysis (RCA): {inc.rootCauseAnalysis}</p>
                      <p className="text-muted">Corrective & Preventive Action (CAPA): {inc.correctivePreventiveAction}</p>
                      <p className="text-subtle pt-1 font-mono">Investigated & signed off by: {inc.investigatedBy} on {new Date(inc.closedAt!).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* VIEW: CREATE */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-none">
                <strong>Just Culture Policy:</strong> Non-punitive incident reporting for continuous patient safety and MOH quality improvement.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Incident Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as IncidentCategory)}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                  >
                    <option value="MedicationError">Medication Error (Wrong drug/dose/patient)</option>
                    <option value="NeedleStickExposure">Needle-Stick / Sharps Exposure (OSHA)</option>
                    <option value="PatientFall">Patient Slip, Trip or Fall</option>
                    <option value="AdverseDrugReaction">Adverse Drug Reaction / Anaphylaxis</option>
                    <option value="ProceduralComplication">Procedural Complication</option>
                    <option value="EquipmentMalfunction">Medical Equipment Malfunction</option>
                    <option value="DiagnosticDelay">Diagnostic / Lab Result Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Severity Rating *</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                  >
                    <option value="NearMiss">Near Miss (Intercepted before reaching patient)</option>
                    <option value="NoHarm">No Harm (Reached patient, no adverse effect)</option>
                    <option value="MinorHarm">Minor Harm (First aid / symptomatic treatment)</option>
                    <option value="MajorHarm">Major Harm (Hospital transfer / high consequence)</option>
                    <option value="Sentinel">Sentinel Event (Life-threatening / severe disability)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Location of Occurrence *</label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value as ClinicalIncident['location'])}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                  >
                    <option value="ConsultationRoom">Consultation Room</option>
                    <option value="TriageStation">Triage Station</option>
                    <option value="ProcedureRoom">Procedure Room</option>
                    <option value="PharmacyDispensary">Pharmacy / Dispensary</option>
                    <option value="WaitingArea">Patient Waiting Area</option>
                    <option value="Washroom">Washroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Patient Name (If patient involved)</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. Tan Ah Hock (Leave blank if staff exposure)"
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-subtle uppercase mb-1">Detailed Incident Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Objectively describe what occurred, equipment involved, and circumstances..."
                  className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-subtle uppercase mb-1">Immediate Corrective Action Taken *</label>
                <textarea
                  rows={2}
                  required
                  value={immediateAction}
                  onChange={e => setImmediateAction(e.target.value)}
                  placeholder="First aid given, medication stopped, doctor notified, wash with water, etc..."
                  className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-xs font-bold bg-surface border border-line text-ink hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-none cursor-pointer shadow-xs"
                >
                  Submit Incident Record
                </button>
              </div>
            </form>
          )}

          {/* VIEW: INVESTIGATE & CLOSE */}
          {viewMode === 'investigate' && selectedIncident && (
            <form onSubmit={handleCloseIncident} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-3 bg-surface-accent border border-line rounded-none text-xs space-y-1">
                <p className="font-bold text-ink">Investigating: {selectedIncident.incidentNumber} - {selectedIncident.category}</p>
                <p className="text-muted">{selectedIncident.description}</p>
              </div>

              <div>
                <label className="block text-2xs font-bold text-subtle uppercase mb-1">Root Cause Analysis (RCA) *</label>
                <textarea
                  rows={3}
                  required
                  value={rca}
                  onChange={e => setRca(e.target.value)}
                  placeholder="Identify contributing factors: environmental, packaging, staffing ratio, fatigue, lack of double-checking..."
                  className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-subtle uppercase mb-1">Corrective & Preventive Action (CAPA) *</label>
                <textarea
                  rows={3}
                  required
                  value={capa}
                  onChange={e => setCapa(e.target.value)}
                  placeholder="Systemic changes made: workflow modification, retraining, shelf rearrangement, new equipment..."
                  className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-xs font-bold bg-surface border border-line text-ink hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-none cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Sign Off & Close Incident
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
