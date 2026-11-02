/**
 * Scheduled Clinical Waste Management (SW 404) & Sharps Manifest Domain
 * Regulatory Standard: Environmental Quality (Scheduled Wastes) Regulations 2005
 */

export interface SharpsBinRecord {
  id: string;
  binSerialNo: string;
  capacityLitres: 5 | 10 | 20;
  location: 'Injection Bay' | 'Treatment Cubicle 1' | 'Phlebotomy Room' | 'Dispensary';
  deployedDate: string;
  deployedByNurse: string;
  sealedDate?: string;
  sealedByNurse?: string;
  status: 'In-Use' | 'Sealed (3/4 Full)' | 'Collected by Concessionaire';
}

export interface ClinicalWasteConsignmentRecord {
  id: string;
  consignmentNoteNo: string;
  concessionaireName: 'Medivest Sdn Bhd' | 'Radicare (M) Sdn Bhd' | 'Pantai Medivest' | 'Alam Flora Environmental Solutions';
  collectionDate: string;
  yellowBagsCount: number;
  sharpsBinsCount: number;
  totalWeightKg: number;
  driverName: string;
  vehiclePlateNo: string;
  clinicStaffName: string;
  eSwisRegistered: boolean;
}

export const APPROVED_CONCESSIONAIRES = [
  'Medivest Sdn Bhd',
  'Radicare (M) Sdn Bhd',
  'Pantai Medivest',
  'Alam Flora Environmental Solutions'
];

export function sealSharpsBin(bin: SharpsBinRecord, nurseName: string, date = new Date().toISOString()): SharpsBinRecord {
  return {
    ...bin,
    status: 'Sealed (3/4 Full)',
    sealedDate: date,
    sealedByNurse: nurseName
  };
}

export function createClinicalWasteConsignment(params: {
  consignmentNoteNo: string;
  concessionaireName: 'Medivest Sdn Bhd' | 'Radicare (M) Sdn Bhd' | 'Pantai Medivest' | 'Alam Flora Environmental Solutions';
  yellowBagsCount: number;
  sharpsBinsCount: number;
  totalWeightKg: number;
  driverName: string;
  vehiclePlateNo: string;
  clinicStaffName: string;
  collectionDate?: string;
}): ClinicalWasteConsignmentRecord {
  return {
    id: `CWM-${Date.now()}`,
    consignmentNoteNo: params.consignmentNoteNo,
    concessionaireName: params.concessionaireName,
    collectionDate: params.collectionDate || new Date().toISOString(),
    yellowBagsCount: params.yellowBagsCount,
    sharpsBinsCount: params.sharpsBinsCount,
    totalWeightKg: params.totalWeightKg,
    driverName: params.driverName,
    vehiclePlateNo: params.vehiclePlateNo.toUpperCase(),
    clinicStaffName: params.clinicStaffName,
    eSwisRegistered: true
  };
}

export function exportClinicalWasteManifestText(c: ClinicalWasteConsignmentRecord): string {
  return [
    '========================================================================',
    '       JABATAN ALAM SEKITAR (JAS) / KEMENTERIAN KESIHATAN MALAYSIA',
    '    SCHEDULED CLINICAL WASTE CONSIGNMENT NOTE (SW 404 - BIOHAZARD)',
    '========================================================================',
    `Manifest ID:        ${c.id}`,
    `Consignment Note:   ${c.consignmentNoteNo}`,
    `Collection Date:    ${new Date(c.collectionDate).toLocaleString('en-GB')}`,
    `Waste Code:         SW 404 (Pathological, Clinical & Sharps Waste)`,
    '------------------------------------------------------------------------',
    'CONCESSIONAIRE & LOGISTICS DETAILS:',
    `Licensed Transporter: ${c.concessionaireName}`,
    `Driver Name:        ${c.driverName}`,
    `Vehicle Registration: ${c.vehiclePlateNo}`,
    '------------------------------------------------------------------------',
    'WASTE QUANTITY & CONTAINER INVENTORY:',
    `Yellow Biohazard Bags: ${c.yellowBagsCount} Bags`,
    `Rigid Sharps Bins:     ${c.sharpsBinsCount} Bins`,
    `Total Net Weight:      ${c.totalWeightKg.toFixed(2)} KG`,
    '------------------------------------------------------------------------',
    'HANDOVER CERTIFICATION & STATUTORY COMPLIANCE:',
    'I certify that clinical waste has been properly segregated, packaged in',
    'accordance with Environmental Quality (Scheduled Wastes) Regulations 2005.',
    `Clinic Officer:     ${c.clinicStaffName}`,
    `DOE e-SWIS Status:  Registered & Synced`,
    '========================================================================',
  ].join('\n');
}
