import React, { useState, useRef } from 'react';
import { 
  FileCheck, ShieldAlert, X, Printer, CheckCircle2, 
  AlertTriangle, Stethoscope, UserCheck, Edit3 
} from 'lucide-react';
import { 
  getProceduralConsentTemplate, 
  createSignedConsentRecord, 
  exportConsentText,
  SignedConsentRecord 
} from '../../domain/proceduralConsent';

interface ProceduralConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedureName: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  doctorName?: string;
  doctorMmcNo?: string;
  onConsentSigned: (record: SignedConsentRecord) => void;
}

export const ProceduralConsentModal: React.FC<ProceduralConsentModalProps> = ({
  isOpen,
  onClose,
  procedureName,
  patientId,
  patientName,
  patientIc,
  doctorName = 'Dr. Consult In-Charge',
  doctorMmcNo = 'MMC-58291',
  onConsentSigned,
}) => {
  const template = getProceduralConsentTemplate(procedureName);

  const [signerType, setSignerType] = useState<'Patient' | 'Parent / Legal Guardian'>('Patient');
  const [signerName, setSignerName] = useState(patientName);
  const [signerIc, setSignerIc] = useState(patientIc);
  const [checkedRisks, setCheckedRisks] = useState<Record<number, boolean>>({});
  const [acknowledgedVerbal, setAcknowledgedVerbal] = useState(false);
  const [signedRecord, setSignedRecord] = useState<SignedConsentRecord | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  
  // HTML5 Canvas for stylus/touchpad signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  if (!isOpen) return null;

  const toggleRisk = (idx: number) => {
    setCheckedRisks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const allRisksAcknowledged = template.inherentRisks.every((_, idx) => checkedRisks[idx]);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureUrl('');
  };

  const handleConfirmSign = () => {
    const record = createSignedConsentRecord({
      procedureName,
      patientId,
      patientName,
      patientIc,
      signerType,
      signerName: signerType === 'Patient' ? patientName : signerName,
      signerIc: signerType === 'Patient' ? patientIc : signerIc,
      doctorName,
      doctorMmcNo,
      signatureDataUrl: signatureUrl || undefined,
      digitalConfirmationMethod: hasDrawn 
        ? 'Touchscreen Stylus Signature' 
        : 'Patient Biometric / Digital Acknowledgment',
    });

    setSignedRecord(record);
    onConsentSigned(record);
  };

  const handlePrint = () => {
    if (!signedRecord) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Statutory Consent - ${procedureName}</title>
            <style>
              body { font-family: monospace; padding: 24px; white-space: pre-wrap; line-height: 1.4; }
            </style>
          </head>
          <body>${exportConsentText(signedRecord)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface border border-line w-full max-w-3xl max-h-[92vh] flex flex-col rounded-none font-sans">
        
        {/* Header */}
        <div className="bg-surface-accent border-b border-line px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-accent/15 text-accent rounded-none">
              <ShieldAlert className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white ">
                Statutory Informed Procedural Consent (PHFSA 1998)
              </h3>
              <p className="text-2xs text-ink-muted">
                Private Healthcare Facilities & Services Act 1998 Medico-Legal Safeguard
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
          {signedRecord ? (
            /* Signed Success View */
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 p-4 rounded-none flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-150">
                    Consent Form Validated & Medico-Legally Executed
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Consent ID: <span className="tabular-nums font-bold">{signedRecord.id}</span> • Signed on {new Date(signedRecord.signedAt).toLocaleString('en-GB')}
                  </p>
                  <p className="text-2xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                    Attending Physician: {signedRecord.doctorName} ({signedRecord.doctorMmcNo}) • Signer: {signedRecord.signerName} ({signedRecord.signerType})
                  </p>
                </div>
              </div>

              {/* Legal Text Preview */}
              <div className="border border-line bg-surface-muted/30 p-3 rounded-none">
                <p className="text-2xs font-bold text-ink-muted mb-1">
                  Statutory Record Snapshot
                </p>
                <pre className="text-2xs tabular-nums text-ink whitespace-pre-wrap max-h-48 overflow-y-auto bg-surface p-2.5 border border-line">
                  {exportConsentText(signedRecord)}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2 px-3 bg-surface-accent border border-line text-xs font-bold text-ink hover:bg-surface flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  Print / Download PHFSA Form
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Close & Proceed with Procedure
                </button>
              </div>
            </div>
          ) : (
            /* Active Signing Form */
            <div className="space-y-4">
              
              {/* Procedure Details Card */}
              <div className="border border-primary/20 bg-primary/5 p-3.5 rounded-none">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold text-primary px-2 py-0.5 bg-primary/10">
                    {template.category}
                  </span>
                  <span className="text-2xs text-ink-muted tabular-nums">
                    Patient: {patientName} ({patientIc})
                  </span>
                </div>
                <h4 className="text-base font-bold text-ink dark:text-white mt-1">
                  {template.procedureName}
                </h4>
                <p className="text-xs text-ink mt-1">
                  <strong className="text-ink-muted">Indication:</strong> {template.indicationDescription}
                </p>
                <p className="text-xs text-ink mt-1">
                  <strong className="text-ink-muted">Description:</strong> {template.proceduralExplanation}
                </p>
                <div className="mt-2 text-2xs grid grid-cols-1 md:grid-cols-2 gap-2 text-ink-muted border-t border-line/60 pt-2">
                  <div><strong>Benefits:</strong> {template.clinicalBenefits}</div>
                  <div><strong>Alternatives:</strong> {template.alternativesDiscussed}</div>
                </div>
              </div>

              {/* Inherent Risks Checklist */}
              <div className="border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200 ">
                    Mandatory Statutory Risk Disclosures (Check Each to Acknowledge)
                  </h5>
                </div>
                <div className="space-y-2">
                  {template.inherentRisks.map((risk, idx) => (
                    <label 
                      key={idx}
                      className="flex items-start gap-2.5 p-2 bg-surface border border-line hover:border-primary/40 cursor-pointer text-xs"
                    >
                      <input 
                        type="checkbox"
                        checked={!!checkedRisks[idx]}
                        onChange={() => toggleRisk(idx)}
                        className="mt-0.5 h-4 w-4 rounded-none border-line text-primary focus:ring-0 cursor-pointer"
                      />
                      <span className="text-ink leading-tight">{risk}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Signer Identity Selection */}
              <div className="border border-line p-3.5 bg-surface rounded-none space-y-3">
                <h5 className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Signer Identity & Capacity
                </h5>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="signerType"
                      checked={signerType === 'Patient'}
                      onChange={() => {
                        setSignerType('Patient');
                        setSignerName(patientName);
                        setSignerIc(patientIc);
                      }}
                      className="text-primary focus:ring-0"
                    />
                    <span>Patient (Competent Adult)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="signerType"
                      checked={signerType === 'Parent / Legal Guardian'}
                      onChange={() => {
                        setSignerType('Parent / Legal Guardian');
                        setSignerName('');
                        setSignerIc('');
                      }}
                      className="text-primary focus:ring-0"
                    />
                    <span>Parent / Legal Guardian (Pediatric / Dependent)</span>
                  </label>
                </div>

                {signerType === 'Parent / Legal Guardian' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-2xs font-bold text-ink-muted mb-1">Guardian Full Name</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="e.g. Ahmad bin Abdullah"
                        className="w-full text-xs p-2 border border-line bg-surface rounded-none focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold text-ink-muted mb-1">Guardian NRIC / Passport</label>
                      <input
                        type="text"
                        value={signerIc}
                        onChange={(e) => setSignerIc(e.target.value)}
                        placeholder="e.g. 780512-10-5541"
                        className="w-full text-xs p-2 border border-line bg-surface rounded-none focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Canvas */}
              <div className="border border-line p-3.5 bg-surface rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-ink ">
                      Patient / Guardian Signature (Touchpad / Stylus)
                    </span>
                  </div>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-2xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Signature
                    </button>
                  )}
                </div>
                <div className="border border-dashed border-line bg-surface-muted/20 relative">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={100}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleStopDraw}
                    onMouseLeave={handleStopDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleStopDraw}
                    className="w-full h-24 touch-none cursor-crosshair bg-white dark:bg-night-900"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-2xs text-ink-muted">
                      Sign here using finger, stylus, or mouse
                    </div>
                  )}
                </div>
              </div>

              {/* Final Statutory Confirmation */}
              <label className="flex items-start gap-2.5 p-3 bg-surface-muted/40 border border-line text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedVerbal}
                  onChange={(e) => setAcknowledgedVerbal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-none border-line text-primary focus:ring-0 cursor-pointer"
                />
                <span className="text-ink leading-tight">
                  I confirm that Dr. {doctorName} ({doctorMmcNo}) has explained the procedure, risks, 
                  benefits, and alternatives in a language I clearly comprehend. I voluntarily consent 
                  under PHFSA 1998 regulations.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-line text-xs font-bold text-ink hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!allRisksAcknowledged || !acknowledgedVerbal || (!hasDrawn && !acknowledgedVerbal)}
                  onClick={handleConfirmSign}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-none cursor-pointer transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  Sign & Medico-Legally Execute Consent
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
