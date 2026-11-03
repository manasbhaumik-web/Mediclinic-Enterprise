import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, X, Printer, 
  Activity, Wind, Zap, Pill, Lock, FileCheck 
} from 'lucide-react';
import { 
  evaluateCrashCartReadiness, 
  createCrashCartInspectionRecord, 
  exportCrashCartLogText, 
  CrashCartInspectionRecord, 
  MANDATORY_CRASH_CART_DRUGS 
} from '../../domain/crashCart';

interface CrashCartInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectionSaved?: (record: CrashCartInspectionRecord) => void;
}

export const CrashCartInspectionModal: React.FC<CrashCartInspectionModalProps> = ({
  isOpen,
  onClose,
  onInspectionSaved
}) => {
  const [shift, setShift] = useState<'Morning (08:00)' | 'Evening (16:00)' | 'Post-Resuscitation Restock'>('Morning (08:00)');
  const [nurseName, setNurseName] = useState('Staff Nurse Siti (SRN-4921)');
  const [tamperSeal, setTamperSeal] = useState('SEAL-2026-9901');
  const [isSealIntact, setIsSealIntact] = useState(true);

  // Equipment Checklist
  const [oxygenPsi, setOxygenPsi] = useState<number>(1800);
  const [ambuAdult, setAmbuAdult] = useState(true);
  const [ambuPeds, setAmbuPeds] = useState(true);
  const [suctionTested, setSuctionTested] = useState(true);

  // Defibrillation
  const [aedPower, setAedPower] = useState(true);
  const [aedBattery, setAedBattery] = useState(true);
  const [aedAdultPadExp, setAedAdultPadExp] = useState('2027-10-31');
  const [aedPedsPadExp, setAedPedsPadExp] = useState('2027-10-31');

  // Drug Quantities & Expiries
  const [drugState, setDrugState] = useState([
    { name: 'Adrenaline (Epinephrine) 1:1000 (1mg/ml)', availableQty: 5, expiryDate: '2027-12-31' },
    { name: 'Atropine Sulphate 0.5mg/ml', availableQty: 5, expiryDate: '2027-12-31' },
    { name: 'Hydrocortisone Sodium Succinate 100mg', availableQty: 2, expiryDate: '2027-12-31' },
    { name: 'Dextrose 50% 50ml Vial', availableQty: 2, expiryDate: '2027-12-31' },
    { name: 'Salbutamol 5mg/2.5ml Respirator Solution', availableQty: 5, expiryDate: '2027-12-31' },
    { name: 'Normal Saline 0.9% 500ml Infusion Bottle', availableQty: 2, expiryDate: '2027-12-31' }
  ]);

  const [savedRecord, setSavedRecord] = useState<CrashCartInspectionRecord | null>(null);

  if (!isOpen) return null;

  const currentEval = evaluateCrashCartReadiness({
    oxygenPsi,
    isSealIntact,
    ambuBagAdultTested: ambuAdult,
    ambuBagPediatricTested: ambuPeds,
    suctionMachineVacuumTested: suctionTested,
    aedPowerOnTested: aedPower,
    aedBatteryOk: aedBattery,
    aedAdultPadsExpiry: aedAdultPadExp,
    aedPediatricPadsExpiry: aedPedsPadExp,
    drugs: drugState
  });

  const handleSaveInspection = () => {
    const record = createCrashCartInspectionRecord({
      shift,
      inspectorNurse: nurseName,
      tamperSealNumber: tamperSeal,
      isSealIntact,
      oxygenPsi,
      ambuBagAdultTested: ambuAdult,
      ambuBagPediatricTested: ambuPeds,
      suctionMachineVacuumTested: suctionTested,
      aedPowerOnTested: aedPower,
      aedBatteryOk: aedBattery,
      aedAdultPadsExpiry: aedAdultPadExp,
      aedPediatricPadsExpiry: aedPedsPadExp,
      drugs: drugState
    });

    setSavedRecord(record);
    if (onInspectionSaved) {
      onInspectionSaved(record);
    }
  };

  const handlePrint = () => {
    if (!savedRecord) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Emergency Crash Cart Audit - ${savedRecord.shift}</title>
            <style>
              body { font-family: monospace; padding: 24px; white-space: pre-wrap; line-height: 1.4; }
            </style>
          </head>
          <body>${exportCrashCartLogText(savedRecord)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-surface border border-line w-full max-w-3xl max-h-[92vh] flex flex-col rounded-none ">
        
        {/* Header */}
        <div className="bg-surface-accent border-b border-line px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary text-white rounded-none">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white ">
                Daily Emergency Crash Cart &amp; Resuscitation Readiness (PHFSA 1998)
              </h3>
              <p className="text-2xs text-ink-muted">
                Private Healthcare Facilities &amp; Services Act 1998 Part V Resuscitation Standard
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 hover:bg-surface text-ink-muted hover:text-ink cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {savedRecord ? (
            /* Saved Record View */
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 p-4 rounded-none flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-150">
                    Crash Cart Inspection Verified &amp; Signed Off
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Audit Log ID: <span className="tabular-nums font-bold">{savedRecord.id}</span> • Shift: {savedRecord.shift}
                  </p>
                  <p className="text-2xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                    Inspector: {savedRecord.inspectorNurse} • Seal: {savedRecord.tamperSealNumber} • O2: {savedRecord.oxygenPsi} PSI
                  </p>
                </div>
              </div>

              {/* Log Snapshot */}
              <div className="border border-line bg-surface-muted/30 p-3 rounded-none">
                <span className="text-2xs font-bold text-ink-muted">
                  Official PHFSA 1998 Audit Log Snapshot
                </span>
                <pre className="text-2xs tabular-nums text-ink whitespace-pre-wrap max-h-56 overflow-y-auto bg-surface p-2.5 border border-line mt-1">
                  {exportCrashCartLogText(savedRecord)}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2 px-3 bg-surface-accent border border-line text-xs font-bold text-ink hover:bg-surface flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  Print Crash Cart Log
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Active Form View */
            <div className="space-y-4 text-xs">
              
              {/* Readiness Status Header Banner */}
              <div className={`p-3 rounded-none border flex items-center justify-between ${
                currentEval.isFullyReady 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {currentEval.isFullyReady ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                  <div>
                    <h4 className="font-bold ">
                      {currentEval.isFullyReady ? '✓ Resuscitation Trolley 100% Operational & Audit Ready' : '⚠ Resuscitation Readiness Compromised'}
                    </h4>
                    <p className="text-2xs opacity-90">
                      {currentEval.isFullyReady 
                        ? 'All gases, defibrillation pads, suction draws and drug ampoules within validity.' 
                        : `${currentEval.criticalDefects.length} defect(s) detected requiring immediate correction.`}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-2xs tabular-nums font-bold uppercase rounded-none border ${
                  currentEval.isFullyReady ? 'chip-ok' : 'chip-danger'
                }`}>
                  {currentEval.isFullyReady ? 'PASSED' : 'DEFECTS'}
                </span>
              </div>

              {/* Shift & Seal Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-line p-3 bg-surface rounded-none">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full p-2 border border-line bg-surface text-ink font-medium"
                  >
                    <option value="Morning (08:00)">Morning (08:00)</option>
                    <option value="Evening (16:00)">Evening (16:00)</option>
                    <option value="Post-Resuscitation Restock">Post-Resuscitation Restock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">Inspector Staff Nurse</label>
                  <input
                    type="text"
                    value={nurseName}
                    onChange={(e) => setNurseName(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">Tamper Break-Away Seal #</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tamperSeal}
                      onChange={(e) => setTamperSeal(e.target.value)}
                      className="w-full p-2 border border-line bg-surface text-ink tabular-nums"
                    />
                    <label className="flex items-center gap-1 text-2xs cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isSealIntact}
                        onChange={(e) => setIsSealIntact(e.target.checked)}
                        className="text-primary focus:ring-0"
                      />
                      <span>Intact</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Airway & Medical Gas */}
              <div className="border border-line p-3.5 bg-surface rounded-none space-y-2.5">
                <h5 className="text-2xs font-bold text-ink-muted flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-primary" />
                  <span>Airway &amp; Medical Gas Delivery</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-2 border border-line bg-surface-muted/20">
                    <label className="block text-2xs font-bold text-ink-muted mb-1">
                      O2 Pressure (PSI)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={oxygenPsi}
                        onChange={(e) => setOxygenPsi(Number(e.target.value))}
                        className={`w-full p-1.5 border tabular-nums font-bold text-xs ${
                          oxygenPsi >= 1000 ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900'
                        }`}
                      />
                      <span className="text-2xs tabular-nums text-ink-muted">PSI</span>
                    </div>
                    <span className="text-3xs text-ink-muted mt-0.5 block">Min 1000 PSI</span>
                  </div>

                  <label className="flex items-center gap-2 p-2 border border-line bg-surface-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ambuAdult}
                      onChange={(e) => setAmbuAdult(e.target.checked)}
                      className="text-primary focus:ring-0"
                    />
                    <span className="text-2xs font-medium">Adult Ambu Bag Valve Tested</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-line bg-surface-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ambuPeds}
                      onChange={(e) => setAmbuPeds(e.target.checked)}
                      className="text-primary focus:ring-0"
                    />
                    <span className="text-2xs font-medium">Peds Ambu Bag Valve Tested</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-line bg-surface-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suctionTested}
                      onChange={(e) => setSuctionTested(e.target.checked)}
                      className="text-primary focus:ring-0"
                    />
                    <span className="text-2xs font-medium">Suction Machine Draw Tested</span>
                  </label>
                </div>
              </div>

              {/* Defibrillation & AED */}
              <div className="border border-line p-3.5 bg-surface rounded-none space-y-2.5">
                <h5 className="text-2xs font-bold text-ink-muted flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span>Automated External Defibrillator (AED)</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 p-2 border border-line bg-surface-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aedPower}
                      onChange={(e) => setAedPower(e.target.checked)}
                      className="text-primary focus:ring-0"
                    />
                    <span className="text-2xs font-medium">AED Self-Test OK</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 border border-line bg-surface-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aedBattery}
                      onChange={(e) => setAedBattery(e.target.checked)}
                      className="text-primary focus:ring-0"
                    />
                    <span className="text-2xs font-medium">Battery Status Green</span>
                  </label>

                  <div>
                    <label className="block text-2xs font-bold text-ink-muted mb-1">Adult Pads Expiry</label>
                    <input
                      type="date"
                      value={aedAdultPadExp}
                      onChange={(e) => setAedAdultPadExp(e.target.value)}
                      className="w-full p-1.5 border border-line text-2xs tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-ink-muted mb-1">Peds Pads Expiry</label>
                    <input
                      type="date"
                      value={aedPedsPadExp}
                      onChange={(e) => setAedPedsPadExp(e.target.value)}
                      className="w-full p-1.5 border border-line text-2xs tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Drug Tray Table */}
              <div className="border border-line p-3.5 bg-surface rounded-none space-y-2.5">
                <h5 className="text-2xs font-bold text-ink-muted flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-primary" />
                  <span>Mandatory Emergency Drug Tray (PHFSA 1998 Schedule)</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {drugState.map((drug, idx) => {
                    const req = MANDATORY_CRASH_CART_DRUGS.find(m => m.name === drug.name)?.requiredQty || 1;
                    const isQtyOk = drug.availableQty >= req;
                    const isExpOk = new Date(drug.expiryDate) > new Date();

                    return (
                      <div key={idx} className="flex items-center justify-between p-2 border border-line bg-surface-muted/10 gap-3 text-2xs">
                        <span className="font-bold text-ink flex-1">{drug.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">Qty:</span>
                          <input
                            type="number"
                            value={drug.availableQty}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDrugState(prev => prev.map((d, i) => i === idx ? { ...d, availableQty: val } : d));
                            }}
                            className={`w-14 p-1 border tabular-nums text-center font-bold ${
                              isQtyOk ? 'border-line' : 'border-rose-500 bg-rose-50 text-rose-800'
                            }`}
                          />
                          <span className="text-ink-muted tabular-nums">/{req}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">Exp:</span>
                          <input
                            type="date"
                            value={drug.expiryDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDrugState(prev => prev.map((d, i) => i === idx ? { ...d, expiryDate: val } : d));
                            }}
                            className={`p-1 border tabular-nums text-2xs ${
                              isExpOk ? 'border-line' : 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-line text-xs font-bold text-ink hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInspection}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Sign &amp; Record Daily Audit</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
