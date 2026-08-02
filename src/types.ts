export type Language = 'EN' | 'BM';
export type UserRole = 'doctor' | 'pharmacist' | 'clinic-assistant' | 'admin' | 'hr';

export interface Patient {
  id: string;
  fullName: string;
  icNumber: string; // Malaysian IC: YYMMDD-XX-XXXX
  gender: 'Male' | 'Female' | 'Lelaki' | 'Perempuan';
  dob: string;
  address: string;
  phone: string;
  panelEmployer: string; // Petronas, Maxis, Intel, Maybank, MiCare, None (Self-Pay)
  drugAllergies: string[];
  registeredDate: string;
}

export interface VitalSigns {
  bpSystolic: number; // mmHg
  bpDiastolic: number; // mmHg
  heartRate: number; // bpm
  temperature: number; // °C
  respiratoryRate: number; // bpm
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string; // English
  dosageBM: string; // Bahasa Malaysia
  frequency: string;
  quantity: number;
  pricePerUnit: number; // MYR
  expiryDate: string;
  pillColor: string; // CSS color string
  capsuleStyle: 'solid' | 'split' | 'round';
}

export interface SOAPNotes {
  subjective: string;
  objective: VitalSigns;
  assessment: {
    icdCode: string;
    description: string;
    clinicalNotes: string;
  };
  plan: {
    prescription: PrescriptionItem[];
    followUpWeeks: number;
    mcDays: number;
    requiresReferral: boolean;
    pharmacyMemo?: string;
    referralDetails?: {
      hospital: string;
      department: string;
      reason: string;
    };
  };
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  soap: SOAPNotes;
  status: 'Awaiting Triage' | 'Triaging' | 'Awaiting Consult' | 'Consulting' | 'Awaiting Dispensation' | 'Dispensing' | 'Awaiting Billing' | 'Paid' | 'Cancelled';
  totalBill: number;
  panelClaimed: number;
  paidAmount: number;
  paymentMethod?: 'Cash' | 'Credit Card' | 'e-Wallet' | 'Panel';
  glNumber?: string;
  mcIssued?: boolean;
  registeredTime?: number;
}

export interface ICD10Code {
  code: string;
  desc: string;
  category: string;
}

export interface TPAConfig {
  name: string;
  coverageLimit: number;
  coPayRequired: boolean;
  coPayPercentage?: number;
}

export interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  appointmentTime: string; // ISO string
  durationMinutes: number;
  purpose: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';
  doctorId?: string;
  notes?: string;
  createdAt: string;
}
