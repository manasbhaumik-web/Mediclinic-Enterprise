/**
 * Red-Code Resuscitation Bay Alarm & Emergency Clinical Bypass Engine
 * Standards: PHFSA 1998 Part V Emergency Facilities, Resuscitation Council of Asia / KKM Guidelines.
 */

export type RedCodeSeverity =
  | 'cardiac_arrest'
  | 'anaphylaxis'
  | 'severe_respiratory'
  | 'unresponsive_seizure'
  | 'massive_hemorrhage';

export interface RedCodeIncident {
  id: string; // e.g. "RED-20261101-01"
  patientName: string;
  patientIc?: string;
  estimatedAge: number;
  condition: RedCodeSeverity;
  triggeredAt: string; // ISO
  triggeredByStaff: string;
  locationTriggered: 'Triage / Entrance' | 'Consultation Room' | 'Waiting Hall';
  assignedBay: string;
  crashCartDeployed: boolean;
  oxygenFlowLpm: number;
  mecc999Called: boolean;
  sbarRefId?: string;
  status: 'active_alarm' | 'stabilized' | 'transferred_ed' | 'resolved';
  resolvedAt?: string;
  clinicalNotes?: string;
}

export interface ImmediateActionProtocol {
  title: string;
  primaryAction: string;
  medication: string;
  airwayBreathing: string;
  ambulanceAction: string;
}

/**
 * Returns evidence-based immediate resuscitation action protocol based on acuity condition.
 */
export function getEmergencyImmediateActionProtocol(condition: RedCodeSeverity): ImmediateActionProtocol {
  switch (condition) {
    case 'cardiac_arrest':
      return {
        title: 'CARDIOPULMONARY ARREST (ACLS)',
        primaryAction: 'Immediate high-quality chest compressions (100-120 bpm, depth 5-6 cm). Attach Defibrillator / AED pads immediately.',
        medication: 'Adrenaline 1 mg IV/IO every 3-5 mins post 2nd shock (if VF/pVT) or immediately (if Asystole/PEA). Flush with 20mL saline.',
        airwayBreathing: 'Bag-Valve-Mask (BVM) with 100% O2 @ 15 L/min. Ratio 30:2 or continuous compressions with supraglottic airway (i-gel).',
        ambulanceAction: 'IMMEDIATE MECC 999 RED ALERT for Advanced Life Support (ALS) Ambulance Dispatch.',
      };
    case 'anaphylaxis':
      return {
        title: 'ACUTE SEVERE ANAPHYLAXIS',
        primaryAction: 'Immediate IM Adrenaline (1:1000) 0.01 mg/kg (max 0.5 mg) into anterolateral mid-thigh. Do NOT delay.',
        medication: 'Adrenaline 1:1000 IM thigh. IV Hydrocortisone 100-200 mg + IV Chlorpheniramine 10 mg. Normal Saline 20 mL/kg bolus.',
        airwayBreathing: 'High-flow O2 via non-rebreather mask (10-15 L/min). Prepare for difficult intubation / surgical airway if stridor progresses.',
        ambulanceAction: 'Activate MECC 999 emergency transfer. Monitor SpO2, continuous BP every 3 mins.',
      };
    case 'severe_respiratory':
      return {
        title: 'ACUTE SEVERE ASTHMA / RESPIRATORY ARREST',
        primaryAction: 'High-flow O2 (10-15 L/min). Immediate continuous nebulized Salbutamol 5mg + Ipratropium Bromide 0.5mg via oxygen-driven mask.',
        medication: 'IV Hydrocortisone 200 mg. Consider IV Magnesium Sulfate 2g over 20 mins if life-threatening.',
        airwayBreathing: 'Maintain SpO2 94-98%. Assist ventilation with BVM if silent chest or impending respiratory muscle exhaustion.',
        ambulanceAction: 'Activate MECC 999 transfer. Handover with blood gas & serial peak flow records.',
      };
    case 'unresponsive_seizure':
      return {
        title: 'STATUS EPILEPTICUS / COMA',
        primaryAction: 'Protect airway, lay in left lateral recovery position. Check capillary blood glucose (Dextrostix) immediately.',
        medication: 'IV Midazolam 5-10 mg slow bolus or PR Diazepam 10 mg. If hypoglycemia (<3.0 mmol/L), IV 50% Dextrose 50 mL.',
        airwayBreathing: 'High-flow O2 (10 L/min). Suction oral secretions. Do NOT insert hard objects into mouth.',
        ambulanceAction: 'Activate MECC 999 if seizure duration >5 minutes or recurrent without recovery.',
      };
    case 'massive_hemorrhage':
      return {
        title: 'MASSIVE EXSANGUINATING HEMORRHAGE / TRAUMA',
        primaryAction: 'Direct firm wound pressure with sterile gauze. Apply arterial tourniquet 5-7 cm proximal to injury if limb bleeding is uncontrollable.',
        medication: 'Rapid IV access with two large-bore 14G/16G cannulas. Warm Normal Saline / Hartmanns bolus.',
        airwayBreathing: 'High-flow O2 via non-rebreather mask. Maintain c-spine stabilization if trauma suspected.',
        ambulanceAction: 'Activate Priority 1 MECC 999 transfer to nearest Tertiary Trauma Hospital.',
      };
  }
}

export const DEFAULT_RED_CODE_INCIDENTS: RedCodeIncident[] = [
  {
    id: 'RED-20261025-01',
    patientName: 'Khoo Teck Seng',
    patientIc: '680512-10-5511',
    estimatedAge: 58,
    condition: 'cardiac_arrest',
    triggeredAt: '2026-10-25T11:15:00.000Z',
    triggeredByStaff: 'Staff Nurse Aisyah',
    locationTriggered: 'Triage / Entrance',
    assignedBay: 'Treatment Bay 1 (Resus Bed)',
    crashCartDeployed: true,
    oxygenFlowLpm: 15,
    mecc999Called: true,
    sbarRefId: 'SBAR-20261025-01',
    status: 'transferred_ed',
    resolvedAt: '2026-10-25T11:42:00.000Z',
    clinicalNotes: 'Sudden collapse at clinic reception. CPR initiated within 10s. Defibrillator attached, 1 shock delivered (ROSC achieved). Transferred via ALS ambulance to Hospital Selayang ED.',
  },
];
