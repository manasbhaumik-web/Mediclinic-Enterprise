/**
 * Visit lifecycle: Awaiting Triage -> Awaiting Consult -> Consulting -> Awaiting Dispensation
 * -> Awaiting Billing -> Paid. Pure functions so each transition can be tested in isolation.
 */
import { Visit } from '../types';

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

export function completeTriage(visit: Visit, vitals: Partial<NonNullable<Visit['soap']>['objective']>, chiefComplaint: string): Visit {
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
export function completeConsultation(visit: Visit, soap: Visit['soap'], mcIssued: boolean): Visit {
  return { ...visit, soap, status: 'Awaiting Dispensation', mcIssued };
}

/** Pharmacist verifies dispensing; the visit goes to the cashier. */
export function completeDispensing(visit: Visit): Visit {
  return { ...visit, status: 'Awaiting Billing' };
}

export interface PaymentInfo {
  paymentMethod: Visit['paymentMethod'];
  paidAmount: number;
  panelClaimed: number;
  glNumber?: string;
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
