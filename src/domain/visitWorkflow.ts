/**
 * Visit lifecycle: Awaiting Triage -> Awaiting Consult -> Consulting -> Awaiting Dispensation
 * -> Awaiting Billing -> Paid. Pure functions so each transition can be tested in isolation.
 */
import { SOAPNotes, VitalSigns, Visit } from '../types';

export interface VisitQueues {
  triage: Visit[];
  doctor: Visit[];
  pharmacy: Visit[];
  cashier: Visit[];
}

export function splitQueues(visits: Visit[]): VisitQueues {
  return {
    triage: visits.filter((v) => v.status === 'Awaiting Triage'),
    doctor: visits.filter((v) => v.status === 'Awaiting Consult' || v.status === 'Consulting'),
    pharmacy: visits.filter((v) => v.status === 'Awaiting Dispensation'),
    cashier: visits.filter((v) => v.status === 'Awaiting Billing'),
  };
}

export function completeTriage(visit: Visit, vitals: Partial<VitalSigns>, chiefComplaint: string): Visit {
  return {
    ...visit,
    soap: {
      ...visit.soap,
      subjective: chiefComplaint,
      objective: { ...visit.soap?.objective, ...vitals },
    } as Visit['soap'],
    status: 'Awaiting Consult',
  };
}

/** Doctor finishes the SOAP note; the visit goes to the pharmacy. */
export function completeConsultation(visit: Visit, soap: SOAPNotes, mcIssued: boolean): Visit {
  return { ...visit, soap, status: 'Awaiting Dispensation', mcIssued };
}

/** Pharmacist verifies dispensing; the visit goes to the cashier. */
export function completeDispensing(visit: Visit): Visit {
  return { ...visit, status: 'Awaiting Billing' };
}

import type { InvoiceSnapshot } from './billing';
import type { EInvoiceBuyer } from '../lib/einvoiceQueue';

export interface PaymentInfo {
  paymentMethod: NonNullable<Visit['paymentMethod']>;
  paidAmount: number;
  panelClaimed: number;
  glNumber?: string;
  /** Card payment intent id, or the e-wallet / bank reference. */
  reference?: string;
  /** The bill as charged, for e-invoicing. */
  invoice?: InvoiceSnapshot;
  eInvoiceBuyer?: EInvoiceBuyer;
}

export function settlePayment(visit: Visit, pay: PaymentInfo): Visit {
  return {
    ...visit,
    status: 'Paid',
    paymentMethod: pay.paymentMethod,
    paidAmount: pay.paidAmount,
    panelClaimed: pay.panelClaimed,
    glNumber: pay.glNumber,
  };
}
