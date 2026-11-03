import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, FileText, Printer, CheckCircle2, 
  X, Send, MapPin, Building, Calendar, UserCheck 
} from 'lucide-react';
import { 
  matchAct342Disease, 
  createAct342Notification, 
  exportAct342FormText, 
  Act342NotificationRecord 
} from '../../../domain/act342Notification';
import { Patient } from '../../../types';

interface Act342NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  icd10Code: string;
  patient: Patient;
  doctorName?: string;
  doctorMmcNo?: string;
  onNotificationDispatched?: (record: Act342NotificationRecord) => void;
}

export const Act342NotificationModal: React.FC<Act342NotificationModalProps> = ({
  isOpen,
  onClose,
  icd10Code,
  patient,
  doctorName = 'Dr. Consult In-Charge',
  doctorMmcNo = 'MMC-58291',
  onNotificationDispatched
}) => {
  const rule = matchAct342Disease(icd10Code);

  const [onsetDate, setOnsetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [labDetails, setLabDetails] = useState<string>('Rapid Diagnostic Test (RDT) Positive / Clinical Confirmation');
  const [mukim, setMukim] = useState<string>('Mukim Petaling');
  const [pkd, setPkd] = useState<string>('PKD Petaling');
  const [dispatchedRecord, setDispatchedRecord] = useState<Act342NotificationRecord | null>(null);

  if (!isOpen || !rule) return null;

  const handleDispatchNotification = () => {
    const record = createAct342Notification({
      icd10Code,
      patientId: patient.id,
      patientName: patient.fullName,
      patientIc: patient.icNumber,
      patientPhone: patient.phone,
      patientAddress: patient.address,
      subDistrictMukim: mukim,
      districtPKD: pkd,
      symptomOnsetDate: onsetDate,
      labConfirmationDetails: labDetails,
      doctorName,
      doctorMmcNo,
    });

    record.notificationStatus = 'Dispatched to PKD';
    setDispatchedRecord(record);

    if (onNotificationDispatched) {
      onNotificationDispatched(record);
    }
  };

  const handlePrint = () => {
    if (!dispatchedRecord) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Act 342 Notification - ${dispatchedRecord.diseaseName}</title>
            <style>
              body { font-family: monospace; padding: 24px; white-space: pre-wrap; line-height: 1.4; }
            </style>
          </head>
          <body>${exportAct342FormText(dispatchedRecord)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface border border-rose-300 dark:border-rose-800 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-none font-sans">
        
        {/* Header */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/60 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-600 text-white rounded-none">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100 ">
                Statutory Outbreak Notification (Act 342)
              </h3>
              <p className="text-2xs text-rose-700 dark:text-rose-300">
                Prevention and Control of Infectious Diseases Act 1988 (KKM Borang Rev 2020)
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 hover:bg-rose-100 text-rose-600 dark:text-rose-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Urgent Compliance Warning */}
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 p-3 rounded-none flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="">
                Mandatory Notification Window: {rule.urgency}
              </strong>
              <p className="text-2xs text-rose-800 dark:text-rose-300 mt-0.5">
                Private clinics are legally required to report all suspected or confirmed cases of {rule.diseaseName} to the District Health Office (PKD). Failure to notify constitutes a compoundable offense under Section 10(2) of Act 342.
              </p>
            </div>
          </div>

          {dispatchedRecord ? (
            /* Dispatched Confirmation State */
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 p-4 rounded-none flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-150">
                    Statutory Notification Logged &amp; Dispatched to {dispatchedRecord.districtPKD}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Reference ID: <span className="tabular-nums font-bold">{dispatchedRecord.id}</span> • Status: {dispatchedRecord.notificationStatus}
                  </p>
                  <p className="text-2xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                    Attending Officer: {dispatchedRecord.doctorName} ({dispatchedRecord.doctorMmcNo})
                  </p>
                </div>
              </div>

              {/* Form Snapshot */}
              <div className="border border-line bg-surface-muted/30 p-3 rounded-none">
                <span className="text-2xs font-bold text-ink-muted">
                  Borang Notifikasi e-Notifikasi Preview
                </span>
                <pre className="text-2xs tabular-nums text-ink whitespace-pre-wrap max-h-48 overflow-y-auto bg-surface p-2.5 border border-line mt-1">
                  {exportAct342FormText(dispatchedRecord)}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2 px-3 bg-surface-accent border border-line text-xs font-bold text-ink hover:bg-surface flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  Print KKM Notification Slip
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Close &amp; Return to Consultation
                </button>
              </div>
            </div>
          ) : (
            /* Active Form Inputs */
            <div className="space-y-3.5 text-xs">
              
              {/* Disease Summary Card */}
              <div className="border border-line bg-surface-muted/30 p-3 rounded-none flex items-center justify-between">
                <div>
                  <span className="text-2xs font-bold text-rose-600 tabular-nums">
                    ICD-10: {icd10Code}
                  </span>
                  <h4 className="text-sm font-bold text-ink">{rule.diseaseName}</h4>
                  <p className="text-2xs text-ink-muted mt-0.5">
                    Recommended Specimen: {rule.sampleRequirements}
                  </p>
                </div>
                <span className="bg-rose-100 text-rose-800 text-2xs font-bold tabular-nums px-2 py-1 border border-rose-300">
                  {rule.urgency}
                </span>
              </div>

              {/* Patient Particulars */}
              <div className="border border-line p-3 bg-surface rounded-none space-y-2">
                <h5 className="text-2xs font-bold text-ink-muted flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Patient Demographic Verification</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 text-2xs">
                  <div><strong>Name:</strong> {patient.fullName}</div>
                  <div><strong>NRIC / Passport:</strong> {patient.icNumber}</div>
                  <div><strong>Phone:</strong> {patient.phone}</div>
                  <div><strong>Address:</strong> {patient.address}</div>
                </div>
              </div>

              {/* Epidemiological Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Date of Symptom Onset</span>
                  </label>
                  <input
                    type="date"
                    value={onsetDate}
                    onChange={(e) => setOnsetDate(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink tabular-nums rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>Assigned District Health Office (PKD)</span>
                  </label>
                  <select
                    value={pkd}
                    onChange={(e) => setPkd(e.target.value)}
                    className="w-full p-2 border border-line bg-surface text-ink rounded-none"
                  >
                    <option value="PKD Petaling">PKD Petaling</option>
                    <option value="PKD Klang">PKD Klang</option>
                    <option value="PKD Hulu Langat">PKD Hulu Langat</option>
                    <option value="PKD Gombak">PKD Gombak</option>
                    <option value="PKD Kuala Lumpur">PKD Kuala Lumpur</option>
                    <option value="PKD Johor Bahru">PKD Johor Bahru</option>
                    <option value="PKD Kinta">PKD Kinta</option>
                    <option value="PKD Timur Laut (Penang)">PKD Timur Laut (Penang)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Locality / Sub-District (Mukim)</span>
                  </label>
                  <input
                    type="text"
                    value={mukim}
                    onChange={(e) => setMukim(e.target.value)}
                    placeholder="e.g. Mukim Damansara / SS2"
                    className="w-full p-2 border border-line bg-surface text-ink rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                    Laboratory / Point-of-Care Diagnostic Basis
                  </label>
                  <input
                    type="text"
                    value={labDetails}
                    onChange={(e) => setLabDetails(e.target.value)}
                    placeholder="e.g. Dengue Duo NS1 Positive"
                    className="w-full p-2 border border-line bg-surface text-ink rounded-none"
                  />
                </div>
              </div>

              {/* Attending Declaration */}
              <div className="p-2.5 bg-surface-muted/40 border border-line text-2xs text-ink-muted">
                Statutory Reporting Officer: <strong className="text-ink">{doctorName}</strong> (MMC Reg: <span className="tabular-nums">{doctorMmcNo}</span>)
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-line text-xs font-bold text-ink hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Dismiss for Now
                </button>
                <button
                  type="button"
                  onClick={handleDispatchNotification}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 rounded-none cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Statutory e-Notifikasi Dispatch</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
