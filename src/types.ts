export type Language = 'EN' | 'BM';
export type UserRole = 'doctor' | 'pharmacist' | 'receptionist' | 'clinic-assistant' | 'cashier' | 'admin' | 'hr';

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
  /** The stock item this line is dispensed from (set when the doctor picks a drug that is in stock). */
  inventoryId?: string | null;
  /** Set by the dispensing function. A dispensed or skipped line can no longer change. */
  dispensedAt?: string | null;
  dispensedQuantity?: number | null;
  skipped?: boolean;
  skipReason?: string | null;
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
    mcReason?: string;
    labOrders?: string[];
    labReason?: string;
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
  /** Set when a doctor has called the patient (status Consulting): which room, who, and when. */
  /** Queue ticket, restarting each clinic day (see domain/ticket). */
  ticketNo?: number;
  consultRoom?: string;
  calledBy?: string;
  calledByName?: string;
  calledAt?: number;
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
  /** Where the booking came from: front-desk staff or the public website. */
  source?: 'staff' | 'online';
  bookingRef?: string;
  patientIc?: string;
  /** The visit started when the patient was checked in. */
  visitId?: string;
  checkedInAt?: string;
}
