import React, { useState } from 'react';
import { 
  Trash2, AlertTriangle, ShieldCheck, CheckCircle2, 
  Printer, Plus, FileText, Truck, X, Lock 
} from 'lucide-react';
import { 
  sealSharpsBin, 
  createClinicalWasteConsignment, 
  exportClinicalWasteManifestText, 
  SharpsBinRecord, 
  ClinicalWasteConsignmentRecord,
  APPROVED_CONCESSIONAIRES 
} from '../../domain/clinicalWaste';

export const ClinicalWasteModule: React.FC = () => {
  const [sharpsBins, setSharpsBins] = useState<SharpsBinRecord[]>([
    {
      id: 'SB-01',
      binSerialNo: 'SHARPS-2026-081',
      capacityLitres: 5,
      location: 'Injection Bay',
      deployedDate: '2026-10-20',
      deployedByNurse: 'Staff Nurse Siti',
      status: 'In-Use'
    },
    {
      id: 'SB-02',
      binSerialNo: 'SHARPS-2026-079',
      capacityLitres: 10,
      location: 'Treatment Cubicle 1',
      deployedDate: '2026-10-15',
      deployedByNurse: 'Staff Nurse Siti',
      sealedDate: '2026-10-29',
      sealedByNurse: 'Staff Nurse Nurul',
      status: 'Sealed (3/4 Full)'
    },
    {
      id: 'SB-03',
      binSerialNo: 'SHARPS-2026-085',
      capacityLitres: 5,
      location: 'Phlebotomy Room',
      deployedDate: '2026-10-24',
      deployedByNurse: 'Staff Nurse Nurul',
      status: 'In-Use'
    }
  ]);

  const [consignments, setConsignments] = useState<ClinicalWasteConsignmentRecord[]>([
    {
      id: 'CWM-101',
      consignmentNoteNo: 'CN-MEDIVEST-9901',
      concessionaireName: 'Medivest Sdn Bhd',
      collectionDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      yellowBagsCount: 5,
      sharpsBinsCount: 2,
      totalWeightKg: 21.4,
      driverName: 'Mohd Faiz',
      vehiclePlateNo: 'WVY 8412',
      clinicStaffName: 'Staff Nurse Siti',
      eSwisRegistered: true
    }
  ]);

  // Modal / Form States
  const [isLogPickupOpen, setIsLogPickupOpen] = useState(false);
  const [concessionaire, setConcessionaire] = useState<'Medivest Sdn Bhd' | 'Radicare (M) Sdn Bhd' | 'Pantai Medivest' | 'Alam Flora Environmental Solutions'>('Medivest Sdn Bhd');
  const [consignmentNote, setConsignmentNote] = useState('CN-2026-X889');
  const [yellowBags, setYellowBags] = useState(4);
  const [sharpsCount, setSharpsCount] = useState(2);
  const [weightKg, setWeightKg] = useState(16.5);
  const [driver, setDriver] = useState('Kamal bin Aris');
  const [plateNo, setPlateNo] = useState('BNE 7721');
  const [nurseHandover, setNurseHandover] = useState('Staff Nurse Siti');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSealBin = (binId: string) => {
    setSharpsBins(prev => prev.map(bin => {
      if (bin.id === binId) {
        return sealSharpsBin(bin, 'Staff Nurse Siti (SRN-4921)');
      }
      return bin;
    }));
    setToastMessage('✓ Sharps container locked and sealed at 3/4 fill line.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRecordConsignment = () => {
    const record = createClinicalWasteConsignment({
      consignmentNoteNo: consignmentNote,
      concessionaireName: concessionaire,
      yellowBagsCount: yellowBags,
      sharpsBinsCount: sharpsCount,
      totalWeightKg: weightKg,
      driverName: driver,
      vehiclePlateNo: plateNo,
      clinicStaffName: nurseHandover
    });

    setConsignments(prev => [record, ...prev]);
    setIsLogPickupOpen(false);
    setToastMessage(`✓ Consignment #${consignmentNote} recorded with ${concessionaire}. Net: ${weightKg}kg`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrintManifest = (manifest: ClinicalWasteConsignmentRecord) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Waste Consignment - ${manifest.consignmentNoteNo}</title>
            <style>
              body { font-family: monospace; padding: 24px; white-space: pre-wrap; line-height: 1.4; }
            </style>
          </head>
          <body>${exportClinicalWasteManifestText(manifest)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white p-3 text-xs font-bold rounded-none flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-white hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="border border-line bg-surface p-4 rounded-none flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-none">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">
              Scheduled Biohazardous Clinical Waste &amp; Sharps Tracking (SW 404)
            </h3>
            <p className="text-2xs text-ink-muted">
              Environmental Quality (Scheduled Wastes) Regulations 2005 • KKM / DOE e-SWIS Standard
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLogPickupOpen(true)}
          className="py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Truck className="w-4 h-4" />
          <span>Log Concessionaire Waste Pickup</span>
        </button>
      </div>

      {/* Sharps Container Fleet Tracker */}
      <div className="border border-line bg-surface p-4 rounded-none space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Active Sharps Containers &amp; Fill-Level Surveillance</span>
          </h4>
          <span className="text-2xs text-ink-muted font-mono">
            Mandatory: Seal rigidly when 3/4 full line is reached. Never compress sharps.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sharpsBins.map(bin => {
            const isSealed = bin.status === 'Sealed (3/4 Full)';

            return (
              <div 
                key={bin.id}
                className={`p-3.5 border rounded-none space-y-2 flex flex-col justify-between ${
                  isSealed 
                    ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20' 
                    : 'border-line bg-surface'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">{bin.binSerialNo}</span>
                    <span className={`text-2xs font-mono font-bold px-1.5 py-0.5 ${
                      isSealed ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink font-semibold mt-1">Location: {bin.location}</p>
                  <p className="text-2xs text-ink-muted">
                    Capacity: {bin.capacityLitres}L • Deployed on {bin.deployedDate} ({bin.deployedByNurse})
                  </p>
                </div>

                <div className="pt-2 border-t border-line/50">
                  {isSealed ? (
                    <div className="text-2xs font-mono text-amber-800 dark:text-amber-300">
                      ✓ Sealed on {bin.sealedDate} ({bin.sealedByNurse}). Awaiting transport.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSealBin(bin.id)}
                      className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-none flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Seal Container (3/4 Full Reached)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Waste Consignments Table */}
      <div className="border border-line bg-surface p-4 rounded-none space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            <span>Concessionaire Consignment Notes &amp; Manifest Registry</span>
          </h4>
          <span className="text-2xs text-ink-muted font-mono">{consignments.length} Pickups Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-line bg-surface-muted/40 text-2xs uppercase text-ink-muted font-mono">
                <th className="p-2">Consignment Note</th>
                <th className="p-2">Transporter</th>
                <th className="p-2">Date</th>
                <th className="p-2">Yellow Bags</th>
                <th className="p-2">Sharps Bins</th>
                <th className="p-2">Weight (KG)</th>
                <th className="p-2">Vehicle / Driver</th>
                <th className="p-2 text-right">Manifest</th>
              </tr>
            </thead>
            <tbody>
              {consignments.map(con => (
                <tr key={con.id} className="border-b border-line/60 hover:bg-surface-accent">
                  <td className="p-2 font-mono font-bold text-primary">{con.consignmentNoteNo}</td>
                  <td className="p-2 font-medium text-ink">{con.concessionaireName}</td>
                  <td className="p-2 text-ink-muted font-mono">{new Date(con.collectionDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-2 font-mono">{con.yellowBagsCount} Bags</td>
                  <td className="p-2 font-mono">{con.sharpsBinsCount} Bins</td>
                  <td className="p-2 font-mono font-bold text-ink">{con.totalWeightKg.toFixed(2)} kg</td>
                  <td className="p-2 text-2xs text-ink-muted">{con.vehiclePlateNo} ({con.driverName})</td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => handlePrintManifest(con)}
                      className="p-1 text-primary hover:text-primary-hover cursor-pointer"
                      title="Print Official Manifest"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Waste Pickup Modal */}
      {isLogPickupOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface border border-line w-full max-w-lg rounded-none shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Log Concessionaire Clinical Waste Consignment
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsLogPickupOpen(false)}
                className="text-ink-muted hover:text-ink text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                  Licensed Waste Concessionaire
                </label>
                <select
                  value={concessionaire}
                  onChange={(e) => setConcessionaire(e.target.value as any)}
                  className="w-full p-2 border border-line bg-surface text-ink font-medium"
                >
                  {APPROVED_CONCESSIONAIRES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Consignment Note Serial Number
                  </label>
                  <input
                    type="text"
                    value={consignmentNote}
                    onChange={(e) => setConsignmentNote(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Total Net Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Yellow Biohazard Bags Count
                  </label>
                  <input
                    type="number"
                    value={yellowBags}
                    onChange={(e) => setYellowBags(Number(e.target.value))}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Rigid Sharps Bins Count
                  </label>
                  <input
                    type="number"
                    value={sharpsCount}
                    onChange={(e) => setSharpsCount(Number(e.target.value))}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Driver Full Name
                  </label>
                  <input
                    type="text"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Transport Vehicle Plate No
                  </label>
                  <input
                    type="text"
                    value={plateNo}
                    onChange={(e) => setPlateNo(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                  Clinic Handover Officer (Staff Nurse)
                </label>
                <input
                  type="text"
                  value={nurseHandover}
                  onChange={(e) => setNurseHandover(e.target.value)}
                  className="w-full p-2 border border-line bg-surface text-ink font-medium"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogPickupOpen(false)}
                className="px-3 py-1.5 border border-line text-xs font-bold text-ink hover:bg-surface-accent rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordConsignment}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Consignment Record</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
