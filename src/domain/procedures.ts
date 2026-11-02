import { ClinicalProcedureItem, Visit, SOAPNotes } from '../types';

export const COMMON_CLINIC_PROCEDURES: Omit<ClinicalProcedureItem, 'id' | 'orderedAt' | 'status'>[] = [
  {
    name: 'IM Injection: Voltaren (Diclofenac) 75mg',
    category: 'Injection',
    dosageOrDetails: '75mg / 3ml deep intramuscular (IM)',
    price: 35.00,
  },
  {
    name: 'IM Injection: Tramadol 50mg',
    category: 'Injection',
    dosageOrDetails: '50mg / 1ml deep intramuscular (IM)',
    price: 40.00,
  },
  {
    name: 'IM Injection: Maxolon (Metoclopramide) 10mg',
    category: 'Injection',
    dosageOrDetails: '10mg / 2ml IM',
    price: 30.00,
  },
  {
    name: 'Nebulizer Therapy: Combivent UDV',
    category: 'Nebulizer',
    dosageOrDetails: 'Ipratropium 0.5mg + Salbutamol 2.5mg via oxygen mask (15 mins)',
    price: 45.00,
  },
  {
    name: 'Nebulizer Therapy: Salbutamol 2.5mg',
    category: 'Nebulizer',
    dosageOrDetails: '2.5mg / 2.5ml unit dose via air compressor (15 mins)',
    price: 35.00,
  },
  {
    name: 'IV Drip Infusion: Normal Saline 500ml',
    category: 'Injection',
    dosageOrDetails: '0.9% NaCl 500ml over 1-2 hours',
    price: 65.00,
  },
  {
    name: 'Wound Care: Sterile Simple Dressing',
    category: 'Wound Care',
    dosageOrDetails: 'Antiseptic lavage, povidone iodine, sterile gauze bandage',
    price: 25.00,
  },
  {
    name: 'Wound Care: Suture Removal (Toilet & Suture)',
    category: 'Minor Surgery',
    dosageOrDetails: 'Suture removal with sterile stitch cutter, chlorhexidine wash',
    price: 30.00,
  },
  {
    name: 'Diagnostic: 12-Lead Electrocardiogram (ECG)',
    category: 'Diagnostic',
    dosageOrDetails: 'Resting 12-lead rhythm strip with computerized reading',
    price: 50.00,
  },
  {
    name: 'Diagnostic: Urine FEME & Dipstick',
    category: 'Diagnostic',
    dosageOrDetails: 'Mid-stream urine 10-parameter automated dipstick evaluation',
    price: 20.00,
  },
  {
    name: 'Diagnostic: Rapid Dengue NS1 & IgG/IgM Combo',
    category: 'Diagnostic',
    dosageOrDetails: 'Finger-prick whole blood rapid immunochromatographic cassette (15 mins)',
    price: 45.00,
  },
  {
    name: 'Diagnostic: Capillary Blood Glucose (Dextrostix)',
    category: 'Diagnostic',
    dosageOrDetails: 'Finger-prick glucometer test (immediate)',
    price: 15.00,
  },
];

/** Creates a new ordered procedure item */
export function createProcedureOrder(
  preset: Omit<ClinicalProcedureItem, 'id' | 'orderedAt' | 'status'>,
  doctorId: string,
  clinicalNotes: string = ''
): ClinicalProcedureItem {
  return {
    ...preset,
    id: `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderedByDoctorId: doctorId,
    orderedAt: new Date().toISOString(),
    status: 'Pending',
    clinicalNotes,
  };
}

/** Nurse completes administration of a treatment room procedure */
export function completeProcedure(
  procedure: ClinicalProcedureItem,
  nurseId: string,
  details: { adminSite?: string; batchNo?: string; result?: string; clinicalNotes?: string }
): ClinicalProcedureItem {
  return {
    ...procedure,
    ...details,
    administeredByNurseId: nurseId,
    administeredAt: new Date().toISOString(),
    status: 'Completed',
  };
}

/** Nurse completes administration for a visit, updates billing, and transitions status if all complete */
export function completeVisitProcedure(
  visit: Visit,
  procedureId: string,
  nurseId: string,
  details: { adminSite?: string; batchNo?: string; result?: string; clinicalNotes?: string }
): Visit {
  const existingProcs = visit.soap?.plan?.procedures || [];
  const updatedProcs = existingProcs.map((p) =>
    p.id === procedureId ? completeProcedure(p, nurseId, details) : p
  );

  const completedItem = updatedProcs.find((p) => p.id === procedureId);
  const addPrice = completedItem?.price || 0;

  const allCompleted = updatedProcs.every((p) => p.status === 'Completed' || p.status === 'Cancelled');

  let newStatus = visit.status;
  if (visit.status === 'Awaiting Procedure' && allCompleted) {
    newStatus = 'Awaiting Dispensation';
  } else if (visit.status === 'Holding for Results' && allCompleted) {
    newStatus = 'Awaiting Consult';
  }

  return {
    ...visit,
    totalBill: (visit.totalBill || 0) + addPrice,
    status: newStatus,
    soap: {
      ...visit.soap,
      plan: {
        ...visit.soap?.plan,
        procedures: updatedProcs,
      },
    } as SOAPNotes,
  };
}

/** Calculates total billing additions for all completed procedures */
export function calculateProcedureTotal(procedures: ClinicalProcedureItem[] = []): number {
  return procedures
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + (p.price || 0), 0);
}

/** Determines if visit should transition to Treatment Room or Pharmacy */
export function determineNextWorkflowStep(soap: SOAPNotes): 'Awaiting Procedure' | 'Awaiting Dispensation' {
  const procs = soap.plan.procedures || [];
  const hasPending = procs.some((p) => p.status === 'Pending' || p.status === 'In Progress');
  return hasPending ? 'Awaiting Procedure' : 'Awaiting Dispensation';
}
