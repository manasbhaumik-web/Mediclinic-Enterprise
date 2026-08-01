
import { ICD10Code, Patient, Visit } from './types';

// Malaysian-English Translation Dictionary
export const TRANSLATIONS = {
  EN: {
    dashboard: 'Dashboard',
    patientRegistration: 'Patient Registration',
    consultation: 'Doctor Suite (SOAP)',
    dispensary: 'Pharmacy & Dispensary',
    billing: 'Billing & Panel Claims',
    reports: 'MOH & Clinic Analytics',
    networkStatus: 'Network Status',
    bmToggle: 'BM',
    enToggle: 'EN',
    clinicName: 'Klinik Malaysia Enterprise (PWA)',
    online: 'ONLINE',
    offline: 'OFFLINE',
    scanMyKad: 'Scan MyKad',
    registerNew: 'Register New Patient',
    fullName: 'Full Name (as in IC)',
    icNumber: 'MyKad IC Number',
    gender: 'Gender',
    dob: 'Date of Birth',
    address: 'Residential Address',
    phone: 'Malaysian Phone Number',
    panelEmployer: 'Panel Employer / Coverage',
    drugAllergies: 'Known Drug Allergies',
    saveRegistration: 'Submit & Queue Patient',
    male: 'Male',
    female: 'Female',
    activeAllergies: 'Active Medical Alerts',
    searchPatient: 'Search by Name / IC Number',
    queueNo: 'Queue No.',
    patientQueue: 'Clinic Flow Queue',
    longitudinalHistory: "Longitudinal Clinical History",
    pastVisits: 'Past Visits',
    consultationRoom: 'Digital SOAP Record Suite',
    subjective: 'Subjective (S)',
    objective: 'Objective (O)',
    assessment: 'Assessment (A)',
    plan: 'Plan & Rxs (P)',
    vitalsSign: 'Patient Vital Signs',
    systolic: 'Systolic BP (mmHg)',
    diastolic: 'Diastolic BP (mmHg)',
    pulse: 'Heart Rate (bpm)',
    temp: 'Temperature (°C)',
    respRate: 'Respiratory Rate (bpm)',
    icd10Search: 'Search ICD-10 Diagnostic Catalog',
    symptomsNotes: 'Clinical Symptoms & Active Complaints',
    generateMc: 'Generate Medical Certificate (MC)',
    mcDays: 'MC Duration (Days)',
    drugSearch: 'Prescribe Medication (Search)',
    interactionAlert: 'Drug-Allergy interaction detected!',
    dispensaryQueue: 'Dispensary & Pharmacy Stack',
    prescribedMeds: 'Prescribed Medications',
    visualVerify: 'Capsule Shape & Safety Reference',
    dosageInstruction: 'Dosage Advisory',
    expiryWarnings: 'Batch & Expiry Status',
    printLabel: 'Print 4x2 Label Layout',
    totalBilling: 'Billing & Invoice Ledger',
    selfPay: 'Self-Pay (Cash/Card/eWallet)',
    panelClaims: 'Panel TPA Sponsorship',
    tpaSelect: 'Active Third-Party Administrator (TPA)',
    glRef: 'Guarantee Letter (GL) Ref Number',
    proceedPayment: 'Process Clinic Transaction',
    paymentDone: 'Invoice Settled Successfully',
    complianceText: 'MOH Regulatory Note: This system complies with Malaysian PDPA 2010 (Act 709) regarding handling personal health identifiers.',
    nationalReporting: 'MOH HIC & Infectious Disease Upload (NIDCS)',
    revenueToday: 'Total Revenue Today',
    patientsToday: 'Registered Patient Flow Today',
    pendingClaims: 'Unsettled Panel TPAs',
    lowStock: 'Low Medication Stocks',
    patientByHour: 'Patient Volume Hourly Distribution',
    icdDistribution: 'Primary Diagnoses (ICD-10 Categorization)'
  },
  BM: {
    dashboard: 'Papan Pemuka',
    patientRegistration: 'Pendaftaran Pesakit',
    consultation: 'Bilik Rundingan (SOAP)',
    dispensary: 'Farmasi & Dispenser',
    billing: 'Bil & Tuntutan Panel',
    reports: 'Analitik KKM & Klinik',
    networkStatus: 'Status Rangkaian',
    bmToggle: 'BM',
    enToggle: 'EN',
    clinicName: 'Klinik Malaysia Enterprise (PWA)',
    online: 'DALAM TALIAN',
    offline: 'LUAR TALIAN',
    scanMyKad: 'Imbas MyKad',
    registerNew: 'Daftar Pesakit Baru',
    fullName: 'Nama Penuh (seperti dalam KP)',
    icNumber: 'No. Kad Pengenalan MyKad',
    gender: 'Jantina',
    dob: 'Tarikh Lahir',
    address: 'Alamat Rumah',
    phone: 'Nombor Telefon Malaysia',
    panelEmployer: 'Majikan Panel / Perlindungan',
    drugAllergies: 'Alergi Dadah Diketahui',
    saveRegistration: 'Hantar & Bariskan Pesakit',
    male: 'Lelaki',
    female: 'Perempuan',
    activeAllergies: 'Amaran Perubatan Aktif',
    searchPatient: 'Cari Nama / No. IC',
    queueNo: 'No. Giliran',
    patientQueue: 'Aliran Giliran Klinik',
    longitudinalHistory: "Sejarah Klinikal Membujur",
    pastVisits: 'Lawatan Lampau',
    consultationRoom: 'Sut Rekod Digital SOAP',
    subjective: 'Subjektif (S)',
    objective: 'Objektif (O)',
    assessment: 'Penilaian (A)',
    plan: 'Pelan & Ubat (P)',
    vitalsSign: 'Tanda Vitals Pesakit',
    systolic: 'BP Sistolik (mmHg)',
    diastolic: 'BP Diastolik (mmHg)',
    pulse: 'Denyutan Jantung (bpm)',
    temp: 'Suhu (°C)',
    respRate: 'Kadar Pernafasan (bpm)',
    icd10Search: 'Cari Katalog Diagnostik ICD-10',
    symptomsNotes: 'Gejala Klinikal & Aduan Aktif',
    generateMc: 'Jana Sijil Cuti Sakit (MC)',
    mcDays: 'Tempoh MC (Hari)',
    drugSearch: 'Preskripsi Ubat (Cari)',
    interactionAlert: 'Tindak balas dadah-alergi dikesan!',
    dispensaryQueue: 'Timbunan Dispenser & Farmasi',
    prescribedMeds: 'Ubat yang Dipreskripsi',
    visualVerify: 'Bentuk Kapsul & Rujukan Keselamatan',
    dosageInstruction: 'Panduan Dos',
    expiryWarnings: 'Batch & Status Tarikh Luput',
    printLabel: 'Cetak Label Pelekat 4x2',
    totalBilling: 'Sistem Pengebilan & Invois',
    selfPay: 'Persendirian (Tunai/Kad/eDompet)',
    panelClaims: 'Tuntutan Panel Majikan (TPA)',
    tpaSelect: 'Pentadbir Pihak Ketiga (TPA) Aktif',
    glRef: 'No. Rujukan Surat Jaminan (GL)',
    proceedPayment: 'Proses Transaksi Klinik',
    paymentDone: 'Invois Telah Diselesaikan',
    complianceText: 'Nota Kepatuhan KKM: Sistem ini mematuhi Akta Perlindungan Data Peribadi (PDPA) 2010 (Akta 709) di Malaysia bagi pengendalian data pesakit.',
    nationalReporting: 'Kemasukan Data HIC KKM & Penyakit Berjangkit (NIDCS)',
    revenueToday: 'Jumlah Hasil Hari Ini',
    patientsToday: 'Aliran Pesakit Hari Ini',
    pendingClaims: 'Tuntutan TPA Tertunggak',
    lowStock: 'Stok Ubat Rendah',
    patientByHour: 'Taburan Pesakit Mengikut Jam',
    icdDistribution: 'Diagnosis Utama (Kategori ICD-10)'
  }
};

// Drug Database for clinic pharmacy dispensary
export const DRUG_DATABASE = [
  {
    id: 'D001',
    name: 'Amoxicillin 500mg Capsule',
    category: 'Antibiotic Penicillin',
    allergyGroup: 'Penicillin',
    dosageEN: 'Take 1 capsule three times a day after meals, complete the course.',
    dosageBM: 'Ambil 1 kapsul tiga kali sehari selepas makan, habiskan antibiotik ini.',
    frequency: 'TDS (Thrice Daily)',
    pricePerUnit: 1.50,
    currentStock: 600,
    expiryMonths: 18,
    pillColor: '#a78bfa', // Light violet
    capsuleStyle: 'split'
  },
  {
    id: 'D002',
    name: 'Augmentin (Amoxicillin/Clavulanate) 625mg',
    category: 'Antibiotic Penicillin',
    allergyGroup: 'Penicillin',
    dosageEN: 'Take 1 tablet twice a day after meals, finish the course.',
    dosageBM: 'Ambil 1 biji dua kali sehari selepas makan, habiskan antibiotik ini.',
    frequency: 'BD (Twice Daily)',
    pricePerUnit: 2.20,
    currentStock: 450,
    expiryMonths: 12,
    pillColor: '#fca5a5', // Light red split
    capsuleStyle: 'split'
  },
  {
    id: 'D003',
    name: 'Aspirin 75mg Microshield',
    category: 'NSAID / Antiplatelet',
    allergyGroup: 'NSAID',
    dosageEN: 'Take 1 tablet once a day with or after food.',
    dosageBM: 'Ambil 1 biji sekali sehari dengan atau selepas makan.',
    frequency: 'OD (Once Daily)',
    pricePerUnit: 0.40,
    currentStock: 3000,
    expiryMonths: 24,
    pillColor: '#ffffff', // White
    capsuleStyle: 'round'
  },
  {
    id: 'D004',
    name: 'Ibuprofen 400mg Tablet',
    category: 'Non-steroidal Anti-inflammatory (NSAID)',
    allergyGroup: 'NSAID',
    dosageEN: 'Take 1 tablet three times a day as needed for severe pain, with food.',
    dosageBM: 'Ambil 1 biji tiga kali sehari mengikut keperluan sakit, makan bersama makanan.',
    frequency: 'PRN (As Needed)',
    pricePerUnit: 0.60,
    currentStock: 120, // Low stock!
    expiryMonths: 2.5, // Expiry warning! (< 3 months)
    pillColor: '#f97316', // Orange
    capsuleStyle: 'solid'
  },
  {
    id: 'D005',
    name: 'Paracetamol (Panadol) 500mg',
    category: 'Analgesic & Antipyretic',
    allergyGroup: 'Paracetamol',
    dosageEN: 'Take 2 tablets four times a day as needed for pain or fever. Max 8 tablets daily.',
    dosageBM: 'Ambil 2 biji empat kali sehari mengikut keperluan sakit atau demam. Maksimum 8 biji sehari.',
    frequency: 'PRN (As Needed)',
    pricePerUnit: 0.15,
    currentStock: 8000,
    expiryMonths: 36,
    pillColor: '#3b82f6', // Light Blue
    capsuleStyle: 'round'
  },
  {
    id: 'D006',
    name: 'Bactrim (Co-trimoxazole) 400/80mg',
    category: 'Sulfa Antibiotic',
    allergyGroup: 'Sulfa',
    dosageEN: 'Take 1 tablet twice a day for 5 days.',
    dosageBM: 'Ambil 1 biji dua kali sehari selama 5 hari.',
    frequency: 'BD (Twice Daily)',
    pricePerUnit: 1.10,
    currentStock: 800,
    expiryMonths: 14,
    pillColor: '#eab308', // Yellow
    capsuleStyle: 'split'
  },
  {
    id: 'D007',
    name: 'Metformin HCl 500mg',
    category: 'Oral Antidiabetic',
    allergyGroup: 'None',
    dosageEN: 'Take 1 tablet twice daily with lunch and dinner.',
    dosageBM: 'Ambil 1 biji dua kali sehari selepas makan tengahari dan malam.',
    frequency: 'BD (Twice Daily)',
    pricePerUnit: 0.35,
    currentStock: 4000,
    expiryMonths: 20,
    pillColor: '#10b981', // Emerald
    capsuleStyle: 'solid'
  },
  {
    id: 'D008',
    name: 'Amlodipine Besylate 10mg',
    category: 'Antihypertensive',
    allergyGroup: 'None',
    dosageEN: 'Take 1 tablet once a day in the morning.',
    dosageBM: 'Ambil 1 biji sekali sehari pada waktu pagi.',
    frequency: 'OD (Once Daily)',
    pricePerUnit: 0.50,
    currentStock: 190, // Low stock limit!
    expiryMonths: 1.5, // Expiry warning! (< 3 months)
    pillColor: '#a855f7', // Purple
    capsuleStyle: 'round'
  }
];

export const ICD10_CATALOG: ICD10Code[] = [
  { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified (Common Cold / URTI)', category: 'Infectious / Respiratory' },
  { code: 'I10', desc: 'Essential (primary) hypertension', category: 'Cardiovascular' },
  { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications', category: 'Endocrine / Metabolic' },
  { code: 'K30', desc: 'Dyspepsia / Gastritis', category: 'Gastrointestinal' },
  { code: 'A09.9', desc: 'Gastroenteritis and colitis of infectious origin (Diarrhea)', category: 'Infectious' },
  { code: 'M79.1', desc: 'Myalgia (General muscle pain)', category: 'Musculoskeletal' },
  { code: 'L20.9', desc: 'Atopic dermatitis, unspecified (Eczema / Skin Allergy)', category: 'Dermatological' },
  { code: 'Z02.7', desc: 'Issue of medical certificate (General Health Screening & MC)', category: 'Administrative' }
];

// Initial Patients base for clinic sandbox
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'P001',
    fullName: 'Mohd Hafiz bin Razali',
    icNumber: '881105-14-5391',
    gender: 'Male',
    dob: '1988-11-05',
    address: 'No 24, Jalan Keramat Indah 5, Kampung Datuk Keramat, 54000 Kuala Lumpur',
    phone: '012-3456789',
    panelEmployer: 'Petronas Panel',
    drugAllergies: ['Penicillin'],
    registeredDate: '2026-06-05'
  },
  {
    id: 'P002',
    fullName: 'Siti Aminah binti Yusof',
    icNumber: '920412-10-5884',
    gender: 'Female',
    dob: '1992-04-12',
    address: 'Apartment Dahlia B-3-12, Jalan Pandan Indah 24, 55100 Ampang, Selangor',
    phone: '019-8765432',
    panelEmployer: 'Medkad Sdn Bhd',
    drugAllergies: ['NSAID', 'Aspirin'],
    registeredDate: '2026-06-05'
  },
  {
    id: 'P003',
    fullName: 'Tan Wei Seng',
    icNumber: '750821-08-6213',
    gender: 'Male',
    dob: '1975-08-21',
    address: '77, Lorong Bukit Rimau 14, Kota Kemuning, 40460 Shah Alam, Selangor',
    phone: '017-4455881',
    panelEmployer: 'None (Self-Pay)',
    drugAllergies: [],
    registeredDate: '2026-06-05'
  }
];

// Prepopulated Longitudinal History for the default patients
export const PREVIOUS_VISITS: Visit[] = [
  {
    id: 'V-HIST-01',
    patientId: 'P001',
    date: '2026-04-10',
    soap: {
      subjective: 'Patient presented with high fever for 2 days, dry cough and sore throat. No chest pain, no shortness of breath.',
      objective: {
        bpSystolic: 120,
        bpDiastolic: 78,
        heartRate: 88,
        temperature: 38.5,
        respiratoryRate: 18
      },
      assessment: {
        icdCode: 'J06.9',
        description: 'Acute upper respiratory infection, unspecified (Common Cold / URTI)',
        clinicalNotes: 'Prescribed symptomatic relieve pills. Rest at home.'
      },
      plan: {
        prescription: [
          {
            id: 'P01_1',
            drugName: 'Paracetamol (Panadol) 500mg',
            dosage: 'Take 2 tablets four times a day as needed for pain or fever.',
            dosageBM: 'Ambil 2 biji empat kali sehari mengikut keperluan sakit atau demam.',
            frequency: 'PRN',
            quantity: 20,
            pricePerUnit: 0.15,
            expiryDate: '2028-12-10',
            pillColor: '#3b82f6',
            capsuleStyle: 'round'
          }
        ],
        followUpWeeks: 1,
        mcDays: 2,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 50.00,
    panelClaimed: 50.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'PET-GL-99321'
  },
  {
    id: 'V-HIST-02',
    patientId: 'P001',
    date: '2026-01-15',
    soap: {
      subjective: 'Routine chronic medical surveillance. Patient mentions feeling good. Complies with medications.',
      objective: {
        bpSystolic: 128,
        bpDiastolic: 82,
        heartRate: 72,
        temperature: 36.6,
        respiratoryRate: 16
      },
      assessment: {
        icdCode: 'I10',
        description: 'Essential (primary) hypertension',
        clinicalNotes: 'Blood pressure remains reasonably controlled under Amlodipine regimen.'
      },
      plan: {
        prescription: [
          {
            id: 'P01_2',
            drugName: 'Amlodipine Besylate 10mg',
            dosage: 'Take 1 tablet once a day in the morning.',
            dosageBM: 'Ambil 1 biji sekali sehari pada waktu pagi.',
            frequency: 'OD',
            quantity: 30,
            pricePerUnit: 0.50,
            expiryDate: '2027-08-11',
            pillColor: '#a855f7',
            capsuleStyle: 'round'
          }
        ],
        followUpWeeks: 12,
        mcDays: 0,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 65.00,
    panelClaimed: 65.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'PET-GL-82410'
  },
  {
    id: 'V-HIST-03',
    patientId: 'P002',
    date: '2026-05-20',
    soap: {
      subjective: 'Severe gastric pain localized in epigastrum. Described as burning sensation. Worse after skipping meals.',
      objective: {
        bpSystolic: 115,
        bpDiastolic: 75,
        heartRate: 80,
        temperature: 36.8,
        respiratoryRate: 16
      },
      assessment: {
        icdCode: 'K30',
        description: 'Dyspepsia / Gastritis',
        clinicalNotes: 'Patient advised to adhere to timely regular meals and avoid spicy food triggers.'
      },
      plan: {
        prescription: [
          {
            id: 'P02_1',
            drugName: 'Paracetamol (Panadol) 500mg',
            dosage: 'Take 2 tablets four times a day as needed.',
            dosageBM: 'Ambil 2 biji empat kali sehari mengikut keperluan.',
            frequency: 'PRN',
            quantity: 10,
            pricePerUnit: 0.15,
            expiryDate: '2028-11-20',
            pillColor: '#3b82f6',
            capsuleStyle: 'round'
          }
        ],
        followUpWeeks: 2,
        mcDays: 1,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 45.00,
    panelClaimed: 45.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'MKAD-GL-84941'
  }
];

export const MOCK_VISITS_QUEUE: Visit[] = [
  {
    id: 'V-MOCK-201',
    patientId: 'P001',
    date: '2026-06-05',
    soap: {
      subjective: 'High fever for 2 days, chestiness with productive cough.',
      objective: { bpSystolic: 125, bpDiastolic: 80, heartRate: 85, temperature: 38.6, respiratoryRate: 18 },
      assessment: { icdCode: 'J06.9', description: 'Acute upper respiratory infection', clinicalNotes: 'Avoid cold beverages.' },
      plan: { prescription: [], followUpWeeks: 1, mcDays: 2, requiresReferral: false }
    },
    status: 'Awaiting Dispensation',
    totalBill: 50.00,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'V-MOCK-202',
    patientId: 'P002',
    date: '2026-06-05',
    soap: {
      subjective: 'Follow up hypertension medication checkout.',
      objective: { bpSystolic: 135, bpDiastolic: 85, heartRate: 74, temperature: 36.5, respiratoryRate: 16 },
      assessment: { icdCode: 'I10', description: 'Essential (primary) hypertension', clinicalNotes: 'Surveillance continues.' },
      plan: { prescription: [], followUpWeeks: 8, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Dispensation',
    totalBill: 45.00,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 20
  },
  {
    id: 'V-MOCK-203',
    patientId: 'P003',
    date: '2026-06-05',
    soap: {
      subjective: 'Symptomatic review',
      objective: { bpSystolic: 120, bpDiastolic: 78, heartRate: 72, temperature: 36.6, respiratoryRate: 14 },
      assessment: { icdCode: 'Z02.7', description: 'Issue of medical certificate', clinicalNotes: 'Routine consultation' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 1, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 5
  }
];

