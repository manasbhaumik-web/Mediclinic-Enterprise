/**
 * Demo/sandbox seed data. Only used when VITE_USE_MOCK_DATA=true (see mocks/seed.ts);
 * production builds never read these arrays.
 */
import { Patient, Visit } from '../types';

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
  },
  {
    id: 'P010',
    fullName: 'Ahmad Zikrullah bin Mustaffa',
    icNumber: '940315-10-5123',
    gender: 'Male',
    dob: '1994-03-15',
    address: 'No 42, Jalan Subang Permai 3, Subang Jaya, 47500 Selangor',
    phone: '012-9841234',
    panelEmployer: 'Petronas Panel',
    drugAllergies: ['Penicillin'],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P011',
    fullName: 'Nur Farhana binti Kamaruddin',
    icNumber: '891120-14-6092',
    gender: 'Female',
    dob: '1989-11-20',
    address: 'Unit 12-A, Residency V, Jalan Klang Lama, 58200 Kuala Lumpur',
    phone: '017-3312984',
    panelEmployer: 'Maybank Panel',
    drugAllergies: ['NSAID', 'Aspirin'],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P012',
    fullName: 'Chong Kah Seng',
    icNumber: '780614-08-5541',
    gender: 'Male',
    dob: '1978-06-14',
    address: '88, Lorong Bayu 4, Taman Connaught, 56000 Cheras, KL',
    phone: '016-4428901',
    panelEmployer: 'AIA TPA',
    drugAllergies: [],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P013',
    fullName: 'Kavitha a/p Subramaniam',
    icNumber: '910802-05-5238',
    gender: 'Female',
    dob: '1991-08-02',
    address: 'No 15, Jalan Bukit Mewah 7, 43000 Kajang, Selangor',
    phone: '013-7721094',
    panelEmployer: 'PMCare',
    drugAllergies: ['Sulfa'],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P014',
    fullName: 'Muhammad Hariz bin Azman',
    icNumber: '010425-10-6119',
    gender: 'Male',
    dob: '2001-04-25',
    address: 'B-08-04, Apartment Sri Meranti, Bandar Sri Damansara, 52200 KL',
    phone: '018-9123847',
    panelEmployer: 'Self-Pay (Cash/Card)',
    drugAllergies: [],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P015',
    fullName: 'Tan Mei Ling',
    icNumber: '850912-07-5310',
    gender: 'Female',
    dob: '1985-09-12',
    address: '33, Jalan Green Lane, 11600 Georgetown, Pulau Pinang',
    phone: '012-4491023',
    panelEmployer: 'Medkad',
    drugAllergies: ['Paracetamol'],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P016',
    fullName: 'Venkatesh a/l Ramasamy',
    icNumber: '671205-10-5827',
    gender: 'Male',
    dob: '1967-12-05',
    address: '102, Jalan Tebrau Heights 2, 80250 Johor Bahru, Johor',
    phone: '019-7123984',
    panelEmployer: 'HealthConnect TPA',
    drugAllergies: [],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P017',
    fullName: 'Nursyazwani binti Zainal',
    icNumber: '970130-14-5812',
    gender: 'Female',
    dob: '1997-01-30',
    address: 'No 7, Jalan Setiawangsa 11, Taman Setiawangsa, 54200 KL',
    phone: '011-28391024',
    panelEmployer: 'Petronas Panel',
    drugAllergies: ['Penicillin'],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P018',
    fullName: 'Lee Chee Keong',
    icNumber: '820518-10-6435',
    gender: 'Male',
    dob: '1982-05-18',
    address: '55, Jalan USJ 11/3D, UEP Subang Jaya, 47620 Selangor',
    phone: '016-2281930',
    panelEmployer: 'Self-Pay (Cash/Card)',
    drugAllergies: [],
    registeredDate: '2026-09-25'
  },
  {
    id: 'P019',
    fullName: 'Aisyah Humaira binti Razak',
    icNumber: '181010-10-8842',
    gender: 'Female',
    dob: '2018-10-10',
    address: 'No 18, Jalan Putra Heights 4/1, 47650 Subang Jaya, Selangor',
    phone: '019-3382910',
    panelEmployer: 'AIA TPA',
    drugAllergies: [],
    registeredDate: '2026-09-25'
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
  },
  {
    id: 'V-TRIAGE-010',
    patientId: 'P010',
    date: '2026-09-25',
    soap: {
      subjective: 'Fever, chills, and sore throat for 2 days. Generalized body aches.',
      objective: { bpSystolic: 138, bpDiastolic: 88, heartRate: 84, temperature: 38.2, respiratoryRate: 18 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 35
  },
  {
    id: 'V-TRIAGE-011',
    patientId: 'P011',
    date: '2026-09-25',
    soap: {
      subjective: 'Severe epigastric burning pain and acid reflux post meal.',
      objective: { bpSystolic: 118, bpDiastolic: 76, heartRate: 76, temperature: 36.7, respiratoryRate: 16 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 30
  },
  {
    id: 'V-TRIAGE-012',
    patientId: 'P012',
    date: '2026-09-25',
    soap: {
      subjective: 'Occipital throbbing headache, blood pressure review request.',
      objective: { bpSystolic: 145, bpDiastolic: 92, heartRate: 92, temperature: 37.0, respiratoryRate: 18 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 25
  },
  {
    id: 'V-TRIAGE-013',
    patientId: 'P013',
    date: '2026-09-25',
    soap: {
      subjective: 'Productive cough with clear phlegm and chest tightness.',
      objective: { bpSystolic: 110, bpDiastolic: 72, heartRate: 74, temperature: 36.6, respiratoryRate: 15 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 22
  },
  {
    id: 'V-TRIAGE-014',
    patientId: 'P014',
    date: '2026-09-25',
    soap: {
      subjective: 'Right ankle strain after futsal match, localized swelling.',
      objective: { bpSystolic: 124, bpDiastolic: 80, heartRate: 78, temperature: 37.4, respiratoryRate: 17 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 18
  },
  {
    id: 'V-TRIAGE-015',
    patientId: 'P015',
    date: '2026-09-25',
    soap: {
      subjective: 'Allergic skin rash and intense itching on arms and neck.',
      objective: { bpSystolic: 122, bpDiastolic: 78, heartRate: 72, temperature: 36.8, respiratoryRate: 16 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 15
  },
  {
    id: 'V-TRIAGE-016',
    patientId: 'P016',
    date: '2026-09-25',
    soap: {
      subjective: 'Routine 3-month Type 2 Diabetes and Hypertension prescription refill.',
      objective: { bpSystolic: 152, bpDiastolic: 96, heartRate: 88, temperature: 36.9, respiratoryRate: 19 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 12
  },
  {
    id: 'V-TRIAGE-017',
    patientId: 'P017',
    date: '2026-09-25',
    soap: {
      subjective: 'Dysuria and burning sensation during urination for 2 days.',
      objective: { bpSystolic: 114, bpDiastolic: 74, heartRate: 80, temperature: 37.8, respiratoryRate: 16 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 8
  },
  {
    id: 'V-TRIAGE-018',
    patientId: 'P018',
    date: '2026-09-25',
    soap: {
      subjective: 'Pre-employment health check-up and blood screening request.',
      objective: { bpSystolic: 126, bpDiastolic: 82, heartRate: 76, temperature: 36.5, respiratoryRate: 16 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 5
  },
  {
    id: 'V-TRIAGE-019',
    patientId: 'P019',
    date: '2026-09-25',
    soap: {
      subjective: 'Pediatric high fever 38.6°C, runny nose, and loss of appetite for 24h.',
      objective: { bpSystolic: 102, bpDiastolic: 68, heartRate: 105, temperature: 38.6, respiratoryRate: 22 },
      assessment: { icdCode: '', description: '', clinicalNotes: '' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false }
    },
    status: 'Awaiting Consult',
    totalBill: 0,
    panelClaimed: 0,
    paidAmount: 0,
    registeredTime: Date.now() - 1000 * 60 * 2
  }
];

