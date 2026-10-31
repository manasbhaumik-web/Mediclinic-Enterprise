/**
 * Prevention and Control of Infectious Diseases Act 1988 (Act 342)
 * Ministry of Health Malaysia (KKM) Statutory Disease Notification Engine
 */

export interface NotifiableDiseaseRule {
  icd10Prefix: string;
  diseaseName: string;
  urgency: 'Immediate (Within 24 Hours)' | 'Weekly (Within 7 Days)';
  statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)';
  sampleRequirements: string;
}

export const ACT_342_NOTIFIABLE_DISEASES: NotifiableDiseaseRule[] = [
  {
    icd10Prefix: 'A90',
    diseaseName: 'Dengue Fever',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Serum for Dengue NS1 Ag / IgM & IgG Rapid Test'
  },
  {
    icd10Prefix: 'A91',
    diseaseName: 'Dengue Haemorrhagic Fever',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Serum Dengue Serology + FBC (Thrombocytopenia & Hct hemoconcentration)'
  },
  {
    icd10Prefix: 'B08.4',
    diseaseName: 'Hand, Foot and Mouth Disease (HFMD)',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Clinical diagnosis / Throat swab or vesicle fluid for EV71/Coxsackie PCR'
  },
  {
    icd10Prefix: 'U07.1',
    diseaseName: 'COVID-19 (Virus Identified)',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'RTK-Ag or RT-PCR Nasopharyngeal/Saliva Swab'
  },
  {
    icd10Prefix: 'B05',
    diseaseName: 'Measles',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Serum for Measles IgM / Throat swab for PCR'
  },
  {
    icd10Prefix: 'A37',
    diseaseName: 'Pertussis (Whooping Cough)',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Nasopharyngeal swab / aspirate for Bordetella pertussis PCR'
  },
  {
    icd10Prefix: 'A01',
    diseaseName: 'Typhoid and Paratyphoid Fevers',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Blood culture / Stool culture / Typhidot Rapid IgM'
  },
  {
    icd10Prefix: 'A27',
    diseaseName: 'Leptospirosis',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Serum for Leptospira IgM / MAT (Microscopic Agglutination Test)'
  },
  {
    icd10Prefix: 'A82',
    diseaseName: 'Rabies',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Direct fluorescent antibody test / Saliva PCR'
  },
  {
    icd10Prefix: 'B54',
    diseaseName: 'Malaria, Unspecified',
    urgency: 'Immediate (Within 24 Hours)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Blood film for malaria parasite (BFMP) thick & thin'
  },
  {
    icd10Prefix: 'A15',
    diseaseName: 'Respiratory Tuberculosis',
    urgency: 'Weekly (Within 7 Days)',
    statutoryForm: 'Borang Notifikasi Penyakit Berjangkit (Rev 2020)',
    sampleRequirements: 'Sputum AFB smear x 3 / GeneXpert MTB/RIF / CXR'
  }
];

export interface Act342NotificationRecord {
  id: string;
  diseaseName: string;
  icd10Code: string;
  urgency: 'Immediate (Within 24 Hours)' | 'Weekly (Within 7 Days)';
  notifiedAt: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  patientPhone: string;
  patientAddress: string;
  subDistrictMukim: string;
  districtPKD: string;
  symptomOnsetDate: string;
  clinicalDiagnosis: string;
  labConfirmationDetails: string;
  doctorName: string;
  doctorMmcNo: string;
  clinicName: string;
  notificationStatus: 'Drafted' | 'Dispatched to PKD' | 'Acknowledged by KKM';
}

export function matchAct342Disease(icd10Code: string): NotifiableDiseaseRule | undefined {
  if (!icd10Code) return undefined;
  const clean = icd10Code.trim().toUpperCase();
  return ACT_342_NOTIFIABLE_DISEASES.find(d => clean.startsWith(d.icd10Prefix));
}

export function createAct342Notification(params: {
  icd10Code: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  patientPhone: string;
  patientAddress: string;
  subDistrictMukim?: string;
  districtPKD?: string;
  symptomOnsetDate?: string;
  labConfirmationDetails?: string;
  doctorName?: string;
  doctorMmcNo?: string;
  clinicName?: string;
}): Act342NotificationRecord {
  const matched = matchAct342Disease(params.icd10Code);
  const now = new Date().toISOString();

  return {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    diseaseName: matched ? matched.diseaseName : 'Act 342 Notifiable Disease',
    icd10Code: params.icd10Code,
    urgency: matched ? matched.urgency : 'Immediate (Within 24 Hours)',
    notifiedAt: now,
    patientId: params.patientId,
    patientName: params.patientName,
    patientIc: params.patientIc,
    patientPhone: params.patientPhone || '012-3456789',
    patientAddress: params.patientAddress || 'Kuala Lumpur, Malaysia',
    subDistrictMukim: params.subDistrictMukim || 'Mukim Petaling',
    districtPKD: params.districtPKD || 'PKD Petaling',
    symptomOnsetDate: params.symptomOnsetDate || now.split('T')[0],
    clinicalDiagnosis: `${matched?.diseaseName || params.icd10Code} diagnosed in outpatient clinic`,
    labConfirmationDetails: params.labConfirmationDetails || 'Rapid diagnostic test / Clinical evaluation confirmed',
    doctorName: params.doctorName || 'Dr. Consult In-Charge',
    doctorMmcNo: params.doctorMmcNo || 'MMC-58291',
    clinicName: params.clinicName || 'Mediclinic Enterprise Healthcare',
    notificationStatus: 'Drafted'
  };
}

export function exportAct342FormText(n: Act342NotificationRecord): string {
  return [
    '========================================================================',
    '       KEMENTERIAN KESIHATAN MALAYSIA (KKM)',
    '    NOTIFIKASI PENYAKIT BERJANGKIT DI BAWAH AKTA 342 (REV 2020)',
    '========================================================================',
    `Notification ID:   ${n.id}`,
    `Notified On:       ${new Date(n.notifiedAt).toLocaleString('en-GB')}`,
    `Urgency Window:    ${n.urgency}`,
    `Reporting Facility: ${n.clinicName}`,
    '------------------------------------------------------------------------',
    '1. PENYAKIT BERJANGKIT YANG DINOTIFIKASIKAN:',
    `Penyakit:          ${n.diseaseName} (ICD-10: ${n.icd10Code})`,
    `Tarikh Mula Gejala:${n.symptomOnsetDate}`,
    `Pengesahan Makmal: ${n.labConfirmationDetails}`,
    '------------------------------------------------------------------------',
    '2. MAKLUMAT PESAKIT (PATIENT PARTICULARS):',
    `Nama Penuh:        ${n.patientName}`,
    `No. K/P / Pasport: ${n.patientIc}`,
    `No. Telefon:       ${n.patientPhone}`,
    `Alamat Tempat Tinggal: ${n.patientAddress}`,
    `Mukim / Lokaliti:  ${n.subDistrictMukim}`,
    `Daerah Kesihatan:  ${n.districtPKD}`,
    '------------------------------------------------------------------------',
    '3. PERAKUAN PENGAMAL PERUBATAN (MEDICAL PRACTITIONER DECLARATION):',
    'Saya dengan ini memperakui bahawa pesakit di atas telah diperiksa oleh',
    'saya dan didapati menghidap penyakit berjangkit yang dinyatakan.',
    `Nama Pengamal:     ${n.doctorName}`,
    `No. Pendaftaran MMC: ${n.doctorMmcNo}`,
    `Status Penghantaran:${n.notificationStatus}`,
    '========================================================================',
  ].join('\n');
}
