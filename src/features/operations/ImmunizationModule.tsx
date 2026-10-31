import React, { useState } from 'react';
import { 
  Syringe, ShieldCheck, AlertTriangle, Thermometer, 
  CheckCircle2, Clock, Calendar, RefreshCw, UserCheck, 
  ChevronRight, Sparkles 
} from 'lucide-react';
import { 
  evaluateImmunizationStatus, 
  evaluateColdChainTemp, 
  PatientVaccineStatus, 
  ColdChainLogEntry 
} from '../../domain/immunization';
import { Patient } from '../../types';

interface ImmunizationModuleProps {
  patient?: Patient | null;
  onAdministerVaccine?: (record: {
    vaccineCode: string;
    vaccineName: string;
    batchNo: string;
    expiryDate: string;
    site: string;
    coldChainTempVerified: number;
    nurseSignature: string;
  }) => void;
}

export const ImmunizationModule: React.FC<ImmunizationModuleProps> = ({
  patient,
  onAdministerVaccine
}) => {
  // Cold Chain Live State
  const [currentFridgeTemp, setCurrentFridgeTemp] = useState<number>(4.2);
  const [minFridgeTemp, setMinFridgeTemp] = useState<number>(3.1);
  const [maxFridgeTemp, setMaxFridgeTemp] = useState<number>(5.6);
  const [nurseSign, setNurseSign] = useState<string>('Staff Nurse Siti (SRN-4921)');
  const [coldLogs, setColdLogs] = useState<ColdChainLogEntry[]>([
    {
      id: 'CCL-001',
      fridgeId: 'FRIDGE-VACCINE-01',
      loggedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      shift: 'Morning (08:00)',
      currentTempC: 4.1,
      minTempC: 3.2,
      maxTempC: 5.1,
      isCompliant: true,
      loggedByNurse: 'Staff Nurse Siti (SRN-4921)'
    }
  ]);

  // Administration Modal State
  const [selectedVaccine, setSelectedVaccine] = useState<PatientVaccineStatus | null>(null);
  const [adminBatchNo, setAdminBatchNo] = useState<string>('HEXA-2026-B89');
  const [adminExpiry, setAdminExpiry] = useState<string>('2027-08-31');
  const [adminSite, setAdminSite] = useState<string>('Left Anterolateral Thigh (IM)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock past administered vaccines for this patient
  const [localAdministered, setLocalAdministered] = useState<
    { code: string; administeredDate: string; batchNo?: string }[]
  >([
    { code: 'BCG', administeredDate: '2026-01-05', batchNo: 'BCG-2026-A1' },
    { code: 'HepB-1', administeredDate: '2026-01-05', batchNo: 'HEP-2026-01' },
    { code: 'HepB-2', administeredDate: '2026-02-06', batchNo: 'HEP-2026-02' }
  ]);

  const patientDob = patient?.dob || '2026-01-05';
  const vaccineRoster = evaluateImmunizationStatus(patientDob, localAdministered);
  const tempEvaluation = evaluateColdChainTemp(currentFridgeTemp);

  const handleLogColdChain = () => {
    const entry: ColdChainLogEntry = {
      id: `CCL-${Date.now()}`,
      fridgeId: 'FRIDGE-VACCINE-01',
      loggedAt: new Date().toISOString(),
      shift: 'Ad-Hoc / Pre-Administration',
      currentTempC: currentFridgeTemp,
      minTempC: minFridgeTemp,
      maxTempC: maxFridgeTemp,
      isCompliant: tempEvaluation.isCompliant,
      excursionType: tempEvaluation.excursionType,
      loggedByNurse: nurseSign
    };
    setColdLogs(prev => [entry, ...prev]);
    setToastMessage(`✓ Cold-chain reading recorded: ${currentFridgeTemp}°C (${tempEvaluation.isCompliant ? 'Compliant' : 'Excursion'})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmAdministration = () => {
    if (!selectedVaccine) return;

    const newRecord = {
      code: selectedVaccine.vaccineCode,
      administeredDate: new Date().toISOString().split('T')[0],
      batchNo: adminBatchNo
    };

    setLocalAdministered(prev => [...prev, newRecord]);

    if (onAdministerVaccine) {
      onAdministerVaccine({
        vaccineCode: selectedVaccine.vaccineCode,
        vaccineName: selectedVaccine.vaccineName,
        batchNo: adminBatchNo,
        expiryDate: adminExpiry,
        site: adminSite,
        coldChainTempVerified: currentFridgeTemp,
        nurseSignature: nurseSign
      });
    }

    setToastMessage(`✓ ${selectedVaccine.vaccineName} administered and recorded with Batch #${adminBatchNo}`);
    setTimeout(() => setToastMessage(null), 4000);
    setSelectedVaccine(null);
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-700 text-white p-3 text-xs font-bold rounded-none flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-white hover:text-emerald-200 text-xs font-mono">✕</button>
        </div>
      )}

      {/* Top Banner: Cold Chain Storage Unit & KKM Telemetry */}
      <div className="border border-line bg-surface p-4 rounded-none space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-none text-white ${tempEvaluation.isCompliant ? 'bg-primary' : 'bg-rose-600 animate-pulse'}`}>
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <span>Vaccine Refrigerator Cold-Chain Telemetry</span>
                <span className={`text-2xs px-2 py-0.5 font-mono uppercase font-bold text-white ${
                  tempEvaluation.isCompliant ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {tempEvaluation.isCompliant ? '✓ In Safe Range (+2°C to +8°C)' : '⚠ TEMPERATURE EXCURSION'}
                </span>
              </h3>
              <p className="text-2xs text-ink-muted">
                Unit: MED-FRIDGE-01 • KKM Pharmaceutical Quality Compliance Guideline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-muted/50 p-2 border border-line">
              <span className="text-2xs text-ink-muted font-mono uppercase">Current:</span>
              <span className={`font-mono text-base font-bold ${
                tempEvaluation.isCompliant ? 'text-primary' : 'text-rose-600 font-extrabold'
              }`}>
                {currentFridgeTemp.toFixed(1)}°C
              </span>
              <span className="text-2xs text-ink-muted font-mono">
                (Min: {minFridgeTemp}°C / Max: {maxFridgeTemp}°C)
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogColdChain}
              className="py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Log Temperature Check</span>
            </button>
          </div>
        </div>

        {/* Cold-Chain Warning if Excursion */}
        {!tempEvaluation.isCompliant && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 p-3 rounded-none flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>{tempEvaluation.warningMessage}</strong>
              <p className="text-2xs text-rose-700 dark:text-rose-300 mt-0.5">
                Do not administer vaccines until cold chain integrity is verified. Report immediately to Clinical Director.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Patient Immunization Schedule Roster */}
      <div className="border border-line bg-surface p-4 rounded-none space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div>
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Syringe className="w-4 h-4 text-primary" />
              <span>National Childhood Immunization Schedule (Jadual Imunisasi Kebangsaan)</span>
            </h4>
            <p className="text-2xs text-ink-muted mt-0.5">
              Patient: <strong className="text-ink">{patient?.fullName || 'Child Patient'}</strong> • DOB: {patientDob} (Calculated Age: {Math.max(0, Math.floor((Date.now() - new Date(patientDob).getTime()) / (1000 * 60 * 60 * 24 * 30.43)))} mos)
            </p>
          </div>
          <div className="flex items-center gap-2 text-2xs font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-none inline-block" /> Administered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-none inline-block" /> Due</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-none inline-block" /> Overdue</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-400 rounded-none inline-block" /> Upcoming</span>
          </div>
        </div>

        {/* Schedule Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vaccineRoster.map((vac) => {
            const isDone = vac.status === 'Administered';
            const isDue = vac.status === 'Due';
            const isOverdue = vac.status === 'Overdue';

            return (
              <div 
                key={vac.vaccineCode}
                className={`border p-3.5 rounded-none flex flex-col justify-between space-y-3 transition-all ${
                  isDone 
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10' 
                    : isOverdue 
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20' 
                    : isDue 
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20' 
                    : 'border-line bg-surface-muted/20 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono font-bold uppercase tracking-wider text-ink-muted">
                      {vac.recommendedAgeLabel}
                    </span>
                    <span className={`text-2xs font-mono font-bold px-1.5 py-0.5 rounded-none ${
                      isDone 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' 
                        : isOverdue 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' 
                        : isDue 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' 
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {vac.status}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-ink dark:text-white mt-1.5">
                    {vac.vaccineName}
                  </h5>
                  <p className="text-2xs font-mono text-primary font-bold">
                    Code: {vac.vaccineCode}
                  </p>
                </div>

                <div className="border-t border-line/60 pt-2 text-2xs space-y-1">
                  {isDone ? (
                    <div className="text-emerald-800 dark:text-emerald-300 font-mono">
                      ✓ Given on {vac.administeredDate} {vac.batchNo ? `(Lot #${vac.batchNo})` : ''}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!tempEvaluation.isCompliant}
                      onClick={() => setSelectedVaccine(vac)}
                      className="w-full py-1.5 px-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-none flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Syringe className="w-3.5 h-3.5" />
                      <span>Administer & Record Lot</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vaccine Administration Modal */}
      {selectedVaccine && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface border border-line w-full max-w-lg rounded-none shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Administer Vaccine: {selectedVaccine.vaccineName}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedVaccine(null)}
                className="text-ink-muted hover:text-ink text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface-muted/30 border border-line p-2.5 space-y-1 text-2xs">
                <div><strong>Patient:</strong> {patient?.fullName || 'Child Patient'} ({patientDob})</div>
                <div><strong>Recommended Milestone:</strong> {selectedVaccine.recommendedAgeLabel}</div>
                <div><strong>Verified Refrigerator Temp:</strong> {currentFridgeTemp}°C (✓ Safe Range)</div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                  Vaccine Vial Batch / Lot Number (Mandatory KKM Tracking)
                </label>
                <input
                  type="text"
                  value={adminBatchNo}
                  onChange={(e) => setAdminBatchNo(e.target.value)}
                  placeholder="e.g. HEXA-2026-X49"
                  className="w-full p-2 border border-line bg-surface text-ink font-mono rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Vial Expiry Date
                  </label>
                  <input
                    type="date"
                    value={adminExpiry}
                    onChange={(e) => setAdminExpiry(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Administration Site
                  </label>
                  <select
                    value={adminSite}
                    onChange={(e) => setAdminSite(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink rounded-none"
                  >
                    <option value="Left Anterolateral Thigh (IM)">Left Anterolateral Thigh (IM)</option>
                    <option value="Right Anterolateral Thigh (IM)">Right Anterolateral Thigh (IM)</option>
                    <option value="Left Deltoid (IM / ID)">Left Deltoid (IM / ID)</option>
                    <option value="Right Deltoid (IM)">Right Deltoid (IM)</option>
                    <option value="Oral Drop">Oral Drop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                  Administering Staff Nurse Signature / ID
                </label>
                <input
                  type="text"
                  value={nurseSign}
                  onChange={(e) => setNurseSign(e.target.value)}
                  className="w-full p-2 border border-line bg-surface text-ink rounded-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedVaccine(null)}
                className="px-3 py-1.5 border border-line text-xs font-bold text-ink hover:bg-surface-accent rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!adminBatchNo.trim()}
                onClick={handleConfirmAdministration}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Administration</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
