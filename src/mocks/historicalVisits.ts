import { Visit } from '../types';
import { PREVIOUS_VISITS } from './clinicMocks';

/**
 * Longitudinal Clinical & Encounter Records for Patients.
 * Used for admin patient history review, clinical audit, and monthly/yearly reporting.
 */
export const EXTENDED_HISTORICAL_VISITS: Visit[] = [
  ...PREVIOUS_VISITS,
  {
    id: 'V-HIST-04',
    patientId: 'P002',
    date: '2026-02-11',
    doctorName: 'Dr. Ahmad Danial',
    doctorId: 'doc-02',
    roomId: 'Room 2',
    soap: {
      subjective: 'Dysuria and urinary frequency for 3 days. Denies fever or flank tenderness.',
      objective: { bpSystolic: 118, bpDiastolic: 76, heartRate: 78, temperature: 37.1, respiratoryRate: 16 },
      assessment: { icdCode: 'N39.0', description: 'Urinary tract infection, site not specified', clinicalNotes: 'Encourage generous hydration (2.5L/day) and complete antibiotic course.' },
      plan: {
        prescription: [
          { id: 'P02_2', drugName: 'Ciprofloxacin 500mg', dosage: 'Take 1 tablet twice daily for 5 days.', dosageBM: 'Ambil 1 biji dua kali sehari selama 5 hari.', frequency: 'BD', quantity: 10, pricePerUnit: 1.80, expiryDate: '2027-10-15', pillColor: '#ffffff', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 1,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 75.00,
    panelClaimed: 75.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'MKAD-GL-81203',
    receiptNumber: 'REC-2026-0211'
  },
  {
    id: 'V-HIST-05',
    patientId: 'P003',
    date: '2026-06-02',
    doctorName: 'Dr. Ahmad Danial',
    doctorId: 'doc-02',
    roomId: 'Room 2',
    soap: {
      subjective: 'Routine 3-month Type 2 Diabetes surveillance. Fasting blood sugar 7.2 mmol/L. Compliant with lifestyle changes.',
      objective: { bpSystolic: 126, bpDiastolic: 80, heartRate: 72, temperature: 36.6, respiratoryRate: 16 },
      assessment: { icdCode: 'E11.9', description: 'Type 2 diabetes mellitus without complications', clinicalNotes: 'Glycemic control stable. Retinal and foot exam normal.' },
      plan: {
        prescription: [
          { id: 'P03_1', drugName: 'Metformin HCl 500mg', dosage: 'Take 1 tablet twice a day with meals.', dosageBM: 'Ambil 1 biji dua kali sehari bersama makanan.', frequency: 'BD', quantity: 60, pricePerUnit: 0.35, expiryDate: '2028-04-10', pillColor: '#f8fafc', capsuleStyle: 'round' },
          { id: 'P03_2', drugName: 'Glimepiride 2mg', dosage: 'Take 1 tablet daily before breakfast.', dosageBM: 'Ambil 1 biji sekali sehari sebelum sarapan.', frequency: 'OD', quantity: 30, pricePerUnit: 0.60, expiryDate: '2027-11-20', pillColor: '#38bdf8', capsuleStyle: 'round' }
        ],
        followUpWeeks: 12,
        mcDays: 0,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 110.00,
    panelClaimed: 0,
    paidAmount: 110.00,
    paymentMethod: 'Credit Card',
    receiptNumber: 'REC-2026-0602'
  },
  {
    id: 'V-HIST-06',
    patientId: 'P003',
    date: '2026-03-14',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'Occipital tension headache on exertion. Routine blood pressure check.',
      objective: { bpSystolic: 142, bpDiastolic: 88, heartRate: 76, temperature: 36.8, respiratoryRate: 16 },
      assessment: { icdCode: 'I10', description: 'Essential (primary) hypertension', clinicalNotes: 'Commenced on ARB monotherapy. Low sodium dietary counseling.' },
      plan: {
        prescription: [
          { id: 'P03_3', drugName: 'Telmisartan 40mg', dosage: 'Take 1 tablet daily in the morning.', dosageBM: 'Ambil 1 biji sekali sehari pada waktu pagi.', frequency: 'OD', quantity: 30, pricePerUnit: 1.20, expiryDate: '2027-09-30', pillColor: '#fb7185', capsuleStyle: 'round' }
        ],
        followUpWeeks: 4,
        mcDays: 0,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 85.00,
    panelClaimed: 0,
    paidAmount: 85.00,
    paymentMethod: 'Cash',
    receiptNumber: 'REC-2026-0314'
  },
  {
    id: 'V-HIST-07',
    patientId: 'P010',
    date: '2026-07-15',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'Painful swallowing and mild fever for 2 days. Sputum clear.',
      objective: { bpSystolic: 122, bpDiastolic: 80, heartRate: 82, temperature: 38.1, respiratoryRate: 18 },
      assessment: { icdCode: 'J02.9', description: 'Acute pharyngitis, unspecified', clinicalNotes: 'Erythematous posterior pharynx. Tonsils grade 1 without exudate.' },
      plan: {
        prescription: [
          { id: 'P10_1', drugName: 'Erythromycin 400mg', dosage: 'Take 1 tablet four times daily after meals.', dosageBM: 'Ambil 1 biji empat kali sehari selepas makan.', frequency: 'QID', quantity: 20, pricePerUnit: 0.90, expiryDate: '2027-06-20', pillColor: '#f43f5e', capsuleStyle: 'solid' },
          { id: 'P10_2', drugName: 'Difflam Anti-inflammatory Lozenges', dosage: 'Suck 1 lozenge slowly every 2 to 3 hours as needed.', dosageBM: 'Hisap 1 biji perlahan-lahan setiap 2 hingga 3 jam mengikut keperluan.', frequency: 'PRN', quantity: 16, pricePerUnit: 0.75, expiryDate: '2028-02-15', pillColor: '#34d399', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 2,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 85.00,
    panelClaimed: 85.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'PET-GL-88210',
    receiptNumber: 'REC-2026-0715'
  },
  {
    id: 'V-HIST-08',
    patientId: 'P011',
    date: '2026-08-18',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'Erythematous pruriginous rash along bilateral antecubital fossae.',
      objective: { bpSystolic: 116, bpDiastolic: 74, heartRate: 70, temperature: 36.6, respiratoryRate: 16 },
      assessment: { icdCode: 'L20.9', description: 'Atopic dermatitis, unspecified', clinicalNotes: 'Apply topical emollient liberally; short course topical corticosteroid.' },
      plan: {
        prescription: [
          { id: 'P11_1', drugName: 'Betamethasone 0.05% Cream 15g', dosage: 'Apply thinly over affected area twice daily.', dosageBM: 'Sapu nipis pada kawasan terlibat dua kali sehari.', frequency: 'BD', quantity: 1, pricePerUnit: 14.50, expiryDate: '2027-12-01', pillColor: '#ffffff', capsuleStyle: 'round' },
          { id: 'P11_2', drugName: 'Cetirizine 10mg', dosage: 'Take 1 tablet at night for itching.', dosageBM: 'Ambil 1 biji pada waktu malam untuk gatal.', frequency: 'ON', quantity: 14, pricePerUnit: 0.40, expiryDate: '2028-05-18', pillColor: '#60a5fa', capsuleStyle: 'round' }
        ],
        followUpWeeks: 2,
        mcDays: 1,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 90.00,
    panelClaimed: 90.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'MBB-GL-19042',
    receiptNumber: 'REC-2026-0818'
  },
  {
    id: 'V-HIST-09',
    patientId: 'P012',
    date: '2026-06-25',
    doctorName: 'Dr. Ahmad Danial',
    doctorId: 'doc-02',
    roomId: 'Room 2',
    soap: {
      subjective: 'Inversion injury of left ankle during basketball yesterday. Swelling and mild antalgic gait.',
      objective: { bpSystolic: 128, bpDiastolic: 82, heartRate: 80, temperature: 36.7, respiratoryRate: 16 },
      assessment: { icdCode: 'S93.4', description: 'Sprain and strain of ankle ligament', clinicalNotes: 'Ottawa ankle rules negative for fracture. Ankle supportive compression.' },
      plan: {
        prescription: [
          { id: 'P12_1', drugName: 'Ibuprofen 400mg', dosage: 'Take 1 tablet three times daily after food.', dosageBM: 'Ambil 1 biji tiga kali sehari selepas makan.', frequency: 'TDS', quantity: 15, pricePerUnit: 0.50, expiryDate: '2027-11-15', pillColor: '#f97316', capsuleStyle: 'round' },
          { id: 'P12_2', drugName: 'Elastic Crepe Bandage 7.5cm', dosage: 'Apply figure-of-8 ankle support during ambulation.', dosageBM: 'Balut sokongan pergelangan kaki semasa berjalan.', frequency: 'OD', quantity: 1, pricePerUnit: 12.00, expiryDate: '2029-01-01', pillColor: '#fed7aa', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 2,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 120.00,
    panelClaimed: 120.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'AIA-GL-66219',
    receiptNumber: 'REC-2026-0625'
  },
  {
    id: 'V-HIST-10',
    patientId: 'P013',
    date: '2026-07-22',
    doctorName: 'Dr. Ahmad Danial',
    doctorId: 'doc-02',
    roomId: 'Room 2',
    soap: {
      subjective: 'Productive cough with yellow sputum and chest discomfort for 4 days.',
      objective: { bpSystolic: 124, bpDiastolic: 78, heartRate: 84, temperature: 37.8, respiratoryRate: 18 },
      assessment: { icdCode: 'J20.9', description: 'Acute bronchitis, unspecified', clinicalNotes: 'Bilateral expiratory rhonchi. Advised to stay hydrated and avoid cold air.' },
      plan: {
        prescription: [
          { id: 'P13_1', drugName: 'Salbutamol Inhaler 100mcg', dosage: 'Inhale 2 puffs as needed for shortness of breath.', dosageBM: 'Sedut 2 semburan mengikut keperluan jika sesak nafas.', frequency: 'PRN', quantity: 1, pricePerUnit: 25.00, expiryDate: '2027-10-30', pillColor: '#38bdf8', capsuleStyle: 'round' },
          { id: 'P13_2', drugName: 'Bromhexine HCl 8mg', dosage: 'Take 1 tablet three times daily after food.', dosageBM: 'Ambil 1 biji tiga kali sehari selepas makan.', frequency: 'TDS', quantity: 20, pricePerUnit: 0.30, expiryDate: '2028-04-12', pillColor: '#ffffff', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 2,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 75.00,
    panelClaimed: 75.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'PMC-GL-55190',
    receiptNumber: 'REC-2026-0722'
  },
  {
    id: 'V-HIST-11',
    patientId: 'P014',
    date: '2026-08-04',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'General malaise, low-grade fever and mild dry cough for 24 hours.',
      objective: { bpSystolic: 120, bpDiastolic: 78, heartRate: 76, temperature: 37.6, respiratoryRate: 16 },
      assessment: { icdCode: 'B34.9', description: 'Viral infection, unspecified', clinicalNotes: 'Hydration and symptomatic home rest.' },
      plan: {
        prescription: [
          { id: 'P14_1', drugName: 'Paracetamol 500mg', dosage: 'Take 2 tablets four times daily as needed.', dosageBM: 'Ambil 2 biji empat kali sehari mengikut keperluan.', frequency: 'PRN', quantity: 20, pricePerUnit: 0.15, expiryDate: '2028-06-30', pillColor: '#3b82f6', capsuleStyle: 'round' },
          { id: 'P14_2', drugName: 'Oral Rehydration Salts (ORS) Sachets', dosage: 'Dissolve 1 sachet in 250ml water and drink as needed.', dosageBM: 'Larutkan 1 peket dalam 250ml air dan minum mengikut keperluan.', frequency: 'PRN', quantity: 5, pricePerUnit: 1.20, expiryDate: '2028-08-10', pillColor: '#e2e8f0', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 1,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 55.00,
    panelClaimed: 0,
    paidAmount: 55.00,
    paymentMethod: 'e-Wallet',
    receiptNumber: 'REC-2026-0804'
  },
  {
    id: 'V-HIST-12',
    patientId: 'P015',
    date: '2026-06-18',
    doctorName: 'Dr. Ahmad Danial',
    doctorId: 'doc-02',
    roomId: 'Room 2',
    soap: {
      subjective: 'Left eye redness, gritty feeling, and morning discharge for 2 days.',
      objective: { bpSystolic: 122, bpDiastolic: 78, heartRate: 74, temperature: 36.8, respiratoryRate: 16 },
      assessment: { icdCode: 'H10.9', description: 'Unspecified conjunctivitis', clinicalNotes: 'Left conjunctival injection. Visual acuity preserved 6/6.' },
      plan: {
        prescription: [
          { id: 'P15_1', drugName: 'Chloramphenicol 0.5% Eye Drops', dosage: 'Instill 1 drop to left eye four times daily for 5 days.', dosageBM: 'Titis 1 titik pada mata kiri empat kali sehari selama 5 hari.', frequency: 'QID', quantity: 1, pricePerUnit: 12.00, expiryDate: '2027-09-15', pillColor: '#facc15', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 1,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 50.00,
    panelClaimed: 50.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'AIA-GL-77102',
    receiptNumber: 'REC-2026-0618'
  },
  {
    id: 'V-HIST-13',
    patientId: 'P016',
    date: '2026-09-02',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'Chronic review for diabetes and blood pressure refill. No polyuria, no visual blurring.',
      objective: { bpSystolic: 136, bpDiastolic: 84, heartRate: 74, temperature: 36.5, respiratoryRate: 16 },
      assessment: { icdCode: 'E11.9', description: 'Type 2 diabetes mellitus without complications', clinicalNotes: 'Renal profile and HbA1c surveillance ordered for next quarter.' },
      plan: {
        prescription: [
          { id: 'P16_1', drugName: 'Metformin HCl 500mg', dosage: 'Take 1 tablet twice daily with food.', dosageBM: 'Ambil 1 biji dua kali sehari bersama makanan.', frequency: 'BD', quantity: 60, pricePerUnit: 0.35, expiryDate: '2028-03-25', pillColor: '#f8fafc', capsuleStyle: 'round' },
          { id: 'P16_2', drugName: 'Amlodipine Besylate 5mg', dosage: 'Take 1 tablet daily in the morning.', dosageBM: 'Ambil 1 biji sekali sehari pada waktu pagi.', frequency: 'OD', quantity: 30, pricePerUnit: 0.45, expiryDate: '2027-10-18', pillColor: '#a855f7', capsuleStyle: 'round' }
        ],
        followUpWeeks: 8,
        mcDays: 0,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 95.00,
    panelClaimed: 0,
    paidAmount: 95.00,
    paymentMethod: 'Credit Card',
    receiptNumber: 'REC-2026-0902'
  },
  {
    id: 'V-HIST-14',
    patientId: 'P017',
    date: '2026-07-29',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'Dysuria and urethral burning sensation for 2 days. Sensation of incomplete emptying.',
      objective: { bpSystolic: 120, bpDiastolic: 78, heartRate: 80, temperature: 37.5, respiratoryRate: 16 },
      assessment: { icdCode: 'N39.0', description: 'Urinary tract infection, site not specified', clinicalNotes: 'Urine Dipstick: Leucocytes ++, Nitrite +. Antibiotic therapy initiated.' },
      plan: {
        prescription: [
          { id: 'P17_1', drugName: 'Ciprofloxacin 500mg', dosage: 'Take 1 tablet twice daily after meals for 5 days.', dosageBM: 'Ambil 1 biji dua kali sehari selepas makan selama 5 hari.', frequency: 'BD', quantity: 10, pricePerUnit: 1.80, expiryDate: '2027-10-15', pillColor: '#ffffff', capsuleStyle: 'round' },
          { id: 'P17_2', drugName: 'Ural Urinary Alkalinizer 4g', dosage: 'Dissolve 1 sachet in cold water 3 times a day.', dosageBM: 'Larutkan 1 peket dalam air sejuk 3 kali sehari.', frequency: 'TDS', quantity: 10, pricePerUnit: 1.50, expiryDate: '2028-09-01', pillColor: '#fed7aa', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 1,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 95.00,
    panelClaimed: 95.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'PET-GL-90412',
    receiptNumber: 'REC-2026-0729'
  },
  {
    id: 'V-HIST-15',
    patientId: 'P018',
    date: '2026-08-20',
    doctorName: 'Dr. Ahmad Danial',
    doctorId: 'doc-02',
    roomId: 'Room 2',
    soap: {
      subjective: 'Annual executive wellness screening and blood panel consultation.',
      objective: { bpSystolic: 115, bpDiastolic: 75, heartRate: 68, temperature: 36.6, respiratoryRate: 15 },
      assessment: { icdCode: 'Z00.0', description: 'General medical examination', clinicalNotes: 'Cardiovascular risk low. Full blood count and renal function normal.' },
      plan: {
        prescription: [
          { id: 'P18_1', drugName: 'Multivitamins with Minerals (30s)', dosage: 'Take 1 capsule daily after breakfast.', dosageBM: 'Ambil 1 kapsul sekali sehari selepas sarapan.', frequency: 'OD', quantity: 30, pricePerUnit: 0.80, expiryDate: '2028-11-15', pillColor: '#eab308', capsuleStyle: 'solid' }
        ],
        followUpWeeks: 52,
        mcDays: 0,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 150.00,
    panelClaimed: 0,
    paidAmount: 150.00,
    paymentMethod: 'Credit Card',
    receiptNumber: 'REC-2026-0820'
  },
  {
    id: 'V-HIST-16',
    patientId: 'P019',
    date: '2026-09-15',
    doctorName: 'Dr. Siti Sarah',
    doctorId: 'doc-01',
    roomId: 'Room 1',
    soap: {
      subjective: 'Pediatric runny nose, mild nighttime cough, active and playful during day.',
      objective: { bpSystolic: 104, bpDiastolic: 68, heartRate: 98, temperature: 37.2, respiratoryRate: 20 },
      assessment: { icdCode: 'J00', description: 'Acute nasopharyngitis [head cold]', clinicalNotes: 'Chest clear bilaterally, tympanic membranes normal.' },
      plan: {
        prescription: [
          { id: 'P19_1', drugName: 'Paracetamol Suspension 120mg/5ml (60ml)', dosage: 'Give 7.5ml three times a day as needed for fever.', dosageBM: 'Beri 7.5ml tiga kali sehari jika demam mengikut keperluan.', frequency: 'PRN', quantity: 1, pricePerUnit: 12.00, expiryDate: '2027-08-30', pillColor: '#ec4899', capsuleStyle: 'round' },
          { id: 'P19_2', drugName: 'Cetirizine Syrup 5mg/5ml (60ml)', dosage: 'Give 2.5ml once daily at bedtime.', dosageBM: 'Beri 2.5ml sekali sehari sebelum tidur.', frequency: 'ON', quantity: 1, pricePerUnit: 15.00, expiryDate: '2027-11-12', pillColor: '#a855f7', capsuleStyle: 'round' }
        ],
        followUpWeeks: 1,
        mcDays: 0,
        requiresReferral: false
      }
    },
    status: 'Paid',
    totalBill: 65.00,
    panelClaimed: 65.00,
    paidAmount: 0,
    paymentMethod: 'Panel',
    glNumber: 'AIA-GL-88231',
    receiptNumber: 'REC-2026-0915'
  }
];
