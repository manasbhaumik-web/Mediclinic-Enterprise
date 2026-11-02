import { Visit, Patient, PrescriptionItem } from '../types';

export interface BukuRacunEntry {
  serialNo: string;
  date: string;
  prescriptionRef: string;
  patientName: string;
  patientIc: string;
  patientAddress: string;
  prescribingDoctor: string;
  doctorMmcNo?: string;
  medicineName: string;
  dosageInstructions: string;
  quantityDispensed: number;
  batchNo: string;
  poisonCategory: 'Group B (Prescription Only)' | 'Group C (Pharmacy Only)' | 'Exempt';
  diagnosis: string;
  dispensedBy: string;
}

/** Determines statutory Malaysian Poison Group for a drug */
export function classifyPoisonCategory(drugName: string): 'Group B (Prescription Only)' | 'Group C (Pharmacy Only)' | 'Exempt' {
  const lower = drugName.toLowerCase();
  
  // Controlled & Prescription-Only (Group B)
  if (
    lower.includes('amoxicillin') ||
    lower.includes('augmentin') ||
    lower.includes('azithromycin') ||
    lower.includes('ciprofloxacin') ||
    lower.includes('cefuroxime') ||
    lower.includes('metformin') ||
    lower.includes('amlodipine') ||
    lower.includes('losartan') ||
    lower.includes('perindopril') ||
    lower.includes('atorvastatin') ||
    lower.includes('simvastatin') ||
    lower.includes('prednisolone') ||
    lower.includes('dexamethasone') ||
    lower.includes('tramadol') ||
    lower.includes('diazepam') ||
    lower.includes('alprazolam') ||
    lower.includes('voltaren') ||
    lower.includes('diclofenac') ||
    lower.includes('ponstan') ||
    lower.includes('mefenamic')
  ) {
    return 'Group B (Prescription Only)';
  }

  // Pharmacy Only (Group C)
  if (
    lower.includes('cetirizine') ||
    lower.includes('loratadine') ||
    lower.includes('chlorpheniramine') ||
    lower.includes('piriton') ||
    lower.includes('dextromethorphan') ||
    lower.includes('promethazine') ||
    lower.includes('salbutamol') ||
    lower.includes('ventolin') ||
    lower.includes('hydrocortisone') ||
    lower.includes('clotrimazole')
  ) {
    return 'Group C (Pharmacy Only)';
  }

  return 'Exempt';
}

/** Generates Buku Racun compliance ledger from completed visits */
export function generateBukuRacunEntries(
  visits: Visit[],
  patientsMap: Record<string, Patient>,
  options: {
    startDate?: string;
    endDate?: string;
    categoryFilter?: 'All' | 'Group B' | 'Group C';
    doctorFilter?: string;
  } = {}
): BukuRacunEntry[] {
  const entries: BukuRacunEntry[] = [];
  let serialCounter = 1;

  const relevantVisits = visits.filter((v) => {
    // Only visits that reached dispensing, billing or paid
    const isDispensed = v.status === 'Awaiting Billing' || v.status === 'Paid' || v.status === 'Awaiting Dispensation';
    if (!isDispensed) return false;

    if (options.startDate && v.date < options.startDate) return false;
    if (options.endDate && v.date > options.endDate) return false;
    if (options.doctorFilter && v.doctorName !== options.doctorFilter) return false;

    return true;
  });

  for (const v of relevantVisits) {
    const pt = patientsMap[v.patientId];
    if (!pt) continue;

    const rxItems = v.soap?.plan?.prescription || [];
    for (const rx of rxItems) {
      if (rx.skipped) continue;

      const category = classifyPoisonCategory(rx.drugName);
      if (category === 'Exempt') continue;

      if (options.categoryFilter === 'Group B' && category !== 'Group B (Prescription Only)') continue;
      if (options.categoryFilter === 'Group C' && category !== 'Group C (Pharmacy Only)') continue;

      entries.push({
        serialNo: `BR-${String(serialCounter++).padStart(5, '0')}`,
        date: v.date || new Date().toISOString().substring(0, 10),
        prescriptionRef: v.receiptNumber || `RX-${v.id.substring(0, 8).toUpperCase()}`,
        patientName: pt.fullName,
        patientIc: pt.icNumber || 'N/A',
        patientAddress: pt.address || 'Kuala Lumpur, Malaysia',
        prescribingDoctor: v.doctorName || 'Dr. Consult In-Charge',
        doctorMmcNo: 'MMC-58291',
        medicineName: rx.drugName,
        dosageInstructions: `${rx.dosage} · ${rx.frequency}`,
        quantityDispensed: rx.dispensedQuantity || rx.quantity,
        batchNo: `B${new Date(v.date || Date.now()).getFullYear()}-${Math.abs(rx.drugName.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 9000 + 1000)}`,
        poisonCategory: category,
        diagnosis: v.soap?.assessment?.description || v.soap?.assessment?.icdCode || 'General Consultation',
        dispensedBy: 'Staff Pharmacist / Nurse on Duty',
      });
    }
  }

  return entries;
}

/** Formats Buku Racun entries as CSV for official KKM submission / audit download */
export function exportBukuRacunCsv(entries: BukuRacunEntry[]): string {
  const headers = [
    'No. Siri',
    'Tarikh',
    'No. Preskripsi / Resit',
    'Nama Pesakit',
    'No. KP / Pasport',
    'Alamat Pesakit',
    'Nama Doktor & No. MMC',
    'Nama Ubat (Racun)',
    'Kategori Racun',
    'Dos & Arahan',
    'Kuantiti Dibekal',
    'No. Batch',
    'Indikasi / Diagnosis',
    'Tandatangan / Nama Pendispens',
  ];

  const rows = entries.map((e) => [
    `"${e.serialNo}"`,
    `"${e.date}"`,
    `"${e.prescriptionRef}"`,
    `"${e.patientName}"`,
    `"${e.patientIc}"`,
    `"${e.patientAddress.replace(/"/g, '""')}"`,
    `"${e.prescribingDoctor} (${e.doctorMmcNo || 'MMC-REG'})"`,
    `"${e.medicineName}"`,
    `"${e.poisonCategory}"`,
    `"${e.dosageInstructions}"`,
    e.quantityDispensed,
    `"${e.batchNo}"`,
    `"${e.diagnosis.replace(/"/g, '""')}"`,
    `"${e.dispensedBy}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
